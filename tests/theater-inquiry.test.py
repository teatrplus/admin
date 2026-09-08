"""Integration checks against an isolated PocketBase database; no project data is touched."""
import json
import pathlib
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]

def run(incomplete=False):
    with tempfile.TemporaryDirectory(prefix="theater-inquiry-") as tmp:
        base = pathlib.Path(tmp)
        migrations = base / "pb_migrations"
        hooks = base / "pb_hooks"
        migrations.mkdir()
        hooks.mkdir()
        (migrations / "1_staff.js").write_text("""
migrate((app) => {
  const collection = new Collection({name: '_user_staff', type: 'auth'})
  const fields = [
    new SelectField({name: 'role', maxSelect: 1, values: ['admin','moderator','manager','viewer']}),
    new SelectField({name: 'scope', maxSelect: 2, values: ['theater','space']})
  ]
  for (const field of fields) collection.fields.add(field)
  app.save(collection)
}, () => {})
""")
        shutil.copy(ROOT / "pb_migrations/1788870000_theater_inquiries.js", migrations)
        if incomplete:
            (migrations / "1788870000_theater_inquiries.js").write_text("migrate((app) => app.save(new Collection({name: 't_inquiry', type: 'base'})), () => {})")
        shutil.copy(ROOT / "pb_migrations/1788870010_finalize_theater_inquiries.js", migrations)
        shutil.copy(ROOT / "pb_migrations/1788870100_inquiry_contact_requirements.js", migrations)
        shutil.copy(ROOT / "pb_hooks/theater_inquiry.pb.js", hooks)
        args = [str(ROOT / "pocketbase"), "--dir", str(base / "pb_data"), "--migrationsDir", str(migrations), "--hooksDir", str(hooks)]
        subprocess.run(args + ["migrate", "up"], check=True, capture_output=True)
        subprocess.run(args + ["superuser", "upsert", "test@example.com", "InquiryTestPassword123!"], check=True, capture_output=True)
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        origin = f"http://127.0.0.1:{port}"
        process = subprocess.Popen(args + ["serve", "--http", f"127.0.0.1:{port}"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        def request(method, path, body=None, token=None):
            headers = {"Content-Type": "application/json"}
            if token:
                headers["Authorization"] = token
            req = urllib.request.Request(origin + path, data=json.dumps(body).encode() if body is not None else None, headers=headers, method=method)
            try:
                with urllib.request.urlopen(req, timeout=5) as response:
                    return response.status, json.load(response)
            except urllib.error.HTTPError as error:
                return error.code, json.load(error)
        try:
            for _ in range(100):
                try:
                    if request("GET", "/api/health")[0] == 200:
                        break
                except OSError:
                    time.sleep(.05)
            _, auth = request("POST", "/api/collections/_superusers/auth-with-password", {"identity": "test@example.com", "password": "InquiryTestPassword123!"})
            root = auth["token"]
            tokens = {}
            for role, scope in [("admin", "space"), ("moderator", "theater"), ("manager", "theater"), ("viewer", "theater"), ("manager", "space")]:
                key = f"{role}-{scope}"
                code, user = request("POST", "/api/collections/_user_staff/records", {"email": f"{key}@example.com", "password": "InquiryTestPassword123!", "passwordConfirm": "InquiryTestPassword123!", "role": role, "scope": [scope]}, root)
                assert code == 200, user
                _, login = request("POST", "/api/collections/_user_staff/auth-with-password", {"identity": f"{key}@example.com", "password": "InquiryTestPassword123!"})
                assert login["record"].get("scope") == [scope], (key, login["record"].get("scope"))
                assert login["record"].get("role") == role
                tokens[key] = login["token"]
            path = "/api/collections/t_inquiry/records"
            valid = {"name": "Тестовый зритель", "email": "visitor@example.com", "phone": "+998 92 045-63-36", "message": "Вопрос о театре", "status": "to-do"}
            code, record = request("POST", path, valid)
            assert code == 200, (record, request("GET", "/api/collections/t_inquiry", token=root)[1])
            record_path = path + "/" + record["id"]
            for invalid in [{"status": "done"}, {"status": "inquiry"}, {"status": ""}, {"email": "invalid"}, {"name": "  "}, {"phone": "12"}, {"message": "я" * 181}, {"message": ""}, {"message": "   "}, {"email": "", "phone": ""}, {"email": "", "phone": "   "}]:
                assert request("POST", path, valid | invalid)[0] == 400, invalid
            assert request("POST", path, valid | {"phone": ""})[0] == 200
            assert request("POST", path, valid | {"email": ""})[0] == 200
            assert request("GET", path)[1]["totalItems"] == 0
            assert request("GET", record_path)[0] == 404
            assert request("PATCH", record_path, {"status": "done"})[0] == 404
            for key, token in tokens.items():
                allowed = key != "manager-space"
                code, listing = request("GET", path, token=token)
                assert code == 200 and (listing["totalItems"] > 0) == allowed, (key, listing, request("GET", "/api/collections/t_inquiry", token=root)[1]["listRule"])
                code, _ = request("PATCH", record_path, {"status": "done"}, token)
                assert code == (200 if allowed and key != "viewer-theater" else 404), (key, code)
            token = tokens["manager-theater"]
            assert request("PATCH", record_path, {"status": "to-do"}, token)[0] == 200
            assert request("PATCH", record_path, {"status": "invalid"}, token)[0] == 400
            assert request("PATCH", record_path, {"message": "changed"}, token)[0] == 404
            assert request("DELETE", record_path, token=token)[0] == 403
            print("PASS: migration, public submission, field validation, private access, role/scope rules, status transitions, immutable correspondence")
        finally:
            process.terminate()
            process.wait(timeout=10)

if __name__ == "__main__":
    run()
    run(incomplete=True)
