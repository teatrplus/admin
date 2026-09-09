"""Museum migration, media, and permissions against disposable PocketBase data.

Run normally for integration checks; --serve keeps the fixture on port 18091 for UI checks.
The fixture login is museum-admin@example.com / MuseumTestPassword123!.
"""
import hashlib
import json
import pathlib
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
PASSWORD = "MuseumTestPassword123!"


def run():
    with tempfile.TemporaryDirectory(prefix="theater-museum-") as tmp:
        base = pathlib.Path(tmp)
        migrations = base / "pb_migrations"
        hooks = base / "pb_hooks"
        migrations.mkdir()
        hooks.mkdir()
        (migrations / "1_staff.js").write_text("""
migrate((app) => {
  const staff = new Collection({name:'_user_staff',type:'auth'})
  staff.fields.add(new TextField({name:'slug'}))
  staff.fields.add(new SelectField({name:'role',maxSelect:1,values:['admin','moderator','manager','viewer']}))
  staff.fields.add(new SelectField({name:'scope',maxSelect:2,values:['theater','space']}))
  app.save(staff)
}, () => {})
""")
        for name in ["1788941595_created_t_mask.js", "1788941958_created_t_page_masks.js", "1788951000_museum_content.js", "1788952000_named_mask_urls.js"]:
            shutil.copy(ROOT / "pb_migrations" / name, migrations)
        (hooks / "lib").mkdir()
        shutil.copy(ROOT / "pb_hooks/theater_slug.pb.js", hooks)
        shutil.copy(ROOT / "pb_hooks/lib/theater_slug.js", hooks / "lib")
        (migrations / "museum-assets").symlink_to(ROOT / "pb_migrations/museum-assets", target_is_directory=True)
        args = [str(ROOT / "pocketbase"), "--dir", str(base / "pb_data"), "--migrationsDir", str(migrations), "--hooksDir", str(hooks)]
        migration = subprocess.run(args + ["migrate", "up"], check=True, capture_output=True, text=True)
        assert "Applied 1788951000" in migration.stdout, migration.stdout + migration.stderr
        subprocess.run(args + ["superuser", "upsert", "museum-root@example.com", PASSWORD], check=True, capture_output=True)
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = 18091 if "--serve" in sys.argv else sock.getsockname()[1]
        origin = f"http://127.0.0.1:{port}"
        process = subprocess.Popen(args + ["serve", "--http", f"127.0.0.1:{port}"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        def request(method, path, body=None, token=None, media=None):
            headers = {}
            if token:
                headers["Authorization"] = token
            if media is not None:
                boundary = "museum-test-boundary"
                chunks = []
                for key, value in media:
                    if isinstance(value, pathlib.Path):
                        chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"; filename="{value.name}"\r\nContent-Type: image/png\r\n\r\n'.encode() + value.read_bytes() + b"\r\n")
                    else:
                        chunks.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode())
                data = b"".join(chunks) + f"--{boundary}--\r\n".encode()
                headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
            else:
                headers["Content-Type"] = "application/json"
                data = json.dumps(body).encode() if body is not None else None
            req = urllib.request.Request(origin + path, data=data, headers=headers, method=method)
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    raw = response.read()
                    return response.status, json.loads(raw) if raw and "json" in response.headers.get("Content-Type", "") else raw
            except urllib.error.HTTPError as error:
                return error.code, json.load(error)

        try:
            for _ in range(100):
                try:
                    if request("GET", "/api/health")[0] == 200:
                        break
                except OSError:
                    time.sleep(.05)
            _, auth = request("POST", "/api/collections/_superusers/auth-with-password", {"identity": "museum-root@example.com", "password": PASSWORD})
            root = auth["token"]
            tokens = {}
            for role in ["admin", "moderator", "manager", "viewer"]:
                email = f"museum-{role}@example.com"
                code, result = request("POST", "/api/collections/_user_staff/records", {"email": email, "password": PASSWORD, "passwordConfirm": PASSWORD, "role": role, "scope": ["theater"]}, root)
                assert code == 200, result
                _, login = request("POST", "/api/collections/_user_staff/auth-with-password", {"identity": email, "password": PASSWORD})
                tokens[role] = login["token"]
            mask_path = "/api/collections/t_mask/records"
            page_path = "/api/collections/t_page_masks/records"
            code, result = request("GET", mask_path + "?sort=sort_order,slug")
            assert code == 200 and len(result["items"]) == 7, result
            masks = result["items"]
            assert [mask["legacy_slug"] for mask in masks] == ["004", "007", "011", "012", "013", "022", "023"]
            assert [mask["slug"] for mask in masks] == ["trick", "vesna", "crown-beast", "still", "bad-weather", "tease", "gracious-lady"]
            code, result = request("GET", page_path)
            assert code == 200 and len(result["items"]) == 1, result
            page = result["items"][0]
            assert len(page["excursion_photos"]) == 4
            for item in masks + [page]:
                for locale in ["ru", "en", "uz"]:
                    assert item[f'description_{locale}']
                filenames = item.get("excursion_photos", [item.get("image")])
                for filename in filenames:
                    code, binary = request("GET", f'/api/files/{item["collectionId"]}/{item["id"]}/{filename}')
                    assert code == 200 and len(binary) > 10000
            for path, item, field in [(mask_path, masks[0], "name_en"), (page_path, page, "title_en")]:
                record_path = path + "/" + item["id"]
                for token in [None, tokens["moderator"], tokens["manager"], tokens["viewer"]]:
                    assert request("PATCH", record_path, {field: "forbidden"}, token)[0] in [403, 404]
                    assert request("DELETE", record_path, token=token)[0] in [403, 404]
                    assert request("POST", path, {}, token)[0] in [400, 403]
                assert request("PATCH", record_path, {field: "Museum test edit"}, tokens["admin"])[0] == 200
                assert request("GET", record_path)[1][field] == "Museum test edit"
                assert request("PATCH", record_path, {field: item[field]}, tokens["admin"])[0] == 200
                assert request("DELETE", record_path, token=tokens["admin"])[0] == 403
            duplicate = {key: value for key, value in page.items() if key not in ["id", "collectionId", "collectionName", "created", "updated", "excursion_photos"]}
            assert request("POST", page_path, duplicate, tokens["admin"])[0] == 400
            path = mask_path + "/" + masks[0]["id"]
            code, unchanged = request("PATCH", path, {"slug": masks[1]["slug"]}, tokens["admin"])
            assert code == 200 and unchanged["slug"] == masks[0]["slug"]
            assert request("PATCH", path, {"image": ""}, tokens["admin"])[0] == 400
            image = ROOT / "pb_migrations/museum-assets/mask-004.png"
            new_mask = [("sort_order", "8"), ("image", image)] + [
                (f"{field}_{locale}", f"Test {field} {locale}")
                for field in ["name", "description"] for locale in ["ru", "en", "uz"]
            ]
            for token in [None, tokens["moderator"], tokens["manager"], tokens["viewer"]]:
                assert request("POST", mask_path, token=token, media=new_mask)[0] == 400
            code, created = request("POST", mask_path, token=tokens["admin"], media=new_mask)
            assert code == 200 and created["slug"] == "test-name-en", created
            code, duplicate = request("POST", mask_path, token=tokens["admin"], media=new_mask)
            assert code == 200 and duplicate["slug"].startswith("test-name-en-")
            assert request("DELETE", mask_path + "/" + duplicate["id"], token=root)[0] == 204
            assert request("DELETE", mask_path + "/" + created["id"], token=root)[0] == 204
            code, updated = request("PATCH", path, token=tokens["admin"], media=[("image", image)])
            assert code == 200, updated
            code, binary = request("GET", f'/api/files/{updated["collectionId"]}/{updated["id"]}/{updated["image"]}')
            assert code == 200 and hashlib.sha256(binary).digest() == hashlib.sha256(image.read_bytes()).digest()
            path = page_path + "/" + page["id"]
            reversed_photos = list(reversed(page["excursion_photos"]))
            code, changed = request("PATCH", path, token=tokens["admin"], media=[("excursion_photos", name) for name in reversed_photos] + [("excursion_photos", image)])
            assert code == 200 and changed["excursion_photos"][:4] == reversed_photos and len(changed["excursion_photos"]) == 5, changed
            code, restored = request("PATCH", path, token=tokens["admin"], media=[("excursion_photos", name) for name in page["excursion_photos"]])
            assert code == 200 and restored["excursion_photos"] == page["excursion_photos"], restored
            print("PASS: fresh migration; 7 masks/3 languages/4 photos; public reads; admin-only create/edit; singleton/slug uniqueness; image replacement; gallery add/reorder/remove.", flush=True)
            if "--serve" in sys.argv:
                print(f"UI fixture: {origin}; press Enter to stop.", flush=True)
                input()
        finally:
            process.terminate()
            process.wait(timeout=10)


if __name__ == "__main__":
    run()
