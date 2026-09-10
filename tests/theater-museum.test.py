"""Museum migration, media, and permissions against disposable PocketBase data.

Run normally for integration checks; --serve keeps the fixture on port 18091 for UI checks.
The fixture login is museum-admin@example.com / MuseumTestPassword123!.
"""
import hashlib
import json
import pathlib
import shutil
import sqlite3
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
        (migrations / "1000000000_staff.js").write_text("""
migrate((app) => {
  const staff = new Collection({name:'_user_staff',type:'auth'})
  staff.fields.add(new TextField({name:'slug'}))
  staff.fields.add(new SelectField({name:'role',maxSelect:1,values:['admin','moderator','manager','viewer']}))
  staff.fields.add(new SelectField({name:'scope',maxSelect:2,values:['theater','space']}))
  app.save(staff)
}, () => {})
""")
        for name in ["1788941595_created_t_mask.js", "1788941958_created_t_page_masks.js", "1788947164_created__copy_block.js", "1788947206_created__button.js", "1788951000_museum_content.js", "1788952000_named_mask_urls.js"]:
            shutil.copy(ROOT / "pb_migrations" / name, migrations)
        (hooks / "lib").mkdir()
        shutil.copy(ROOT / "pb_hooks/theater_slug.pb.js", hooks)
        shutil.copy(ROOT / "pb_hooks/lib/theater_slug.js", hooks / "lib")
        shutil.copy(ROOT / "pb_hooks/museum_page.pb.js", hooks)
        shutil.copy(ROOT / "pb_hooks/lib/museum_page.js", hooks / "lib")
        (migrations / "museum-assets").symlink_to(ROOT / "pb_migrations/museum-assets", target_is_directory=True)
        args = [str(ROOT / "pocketbase"), "--dir", str(base / "pb_data"), "--migrationsDir", str(migrations), "--hooksDir", str(hooks)]
        migration = subprocess.run(args + ["migrate", "up"], check=True, capture_output=True, text=True)
        assert "Applied 1788951000" in migration.stdout, migration.stdout + migration.stderr
        with sqlite3.connect(base / 'pb_data/data.db') as db:
            db.row_factory = sqlite3.Row
            original = dict(db.execute('select * from t_page_masks').fetchone())
        shutil.copy(ROOT / 'pb_migrations/1789030000_museum_page_relations.js', migrations)
        migrated = subprocess.run(args + ['migrate', 'up'], check=True, capture_output=True, text=True)
        assert 'Applied 1789030000' in migrated.stdout, migrated.stdout + migrated.stderr
        with sqlite3.connect(base / 'pb_data/data.db') as db:
            db.row_factory = sqlite3.Row
            page = dict(db.execute('select * from t_page_masks').fetchone())
            assert set(page) == {'id','created','updated','intro_block','visit_block','visit_button','excursion_block','excursion_button','excursion_photos'}
            assert page['excursion_photos'] == original['excursion_photos']
            for relation, fields in {'intro_block':{'title':'title','lede':'lede','description':'description'}, 'visit_block':{'title':'museum_title','description':'museum_description'}, 'excursion_block':{'title':'excursion_title','lede':'excursion_kicker','description':'excursion_description'}}.items():
                record = dict(db.execute('select * from _copy_block where id=?',(page[relation],)).fetchone())
                for field, old in fields.items():
                    for locale in ['en','ru','uz']: assert record[field+'_'+locale] == original[old+'_'+locale]
            for relation,prefix in [('visit_button','museum'),('excursion_button','excursion')]:
                record = dict(db.execute('select * from _button where id=?',(page[relation],)).fetchone())
                for locale in ['en','ru','uz']: assert record['label_'+locale] == original[prefix+'_button_label_'+locale]
                assert record['url'] == original[prefix+'_button_url'].replace('{locale}','ru')
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
                    if item in masks: assert item[f'description_{locale}']
                filenames = item.get("excursion_photos", [item.get("image")])
                for filename in filenames:
                    code, binary = request("GET", f'/api/files/{item["collectionId"]}/{item["id"]}/{filename}')
                    assert code == 200 and len(binary) > 10000
            for path, item, field in [(mask_path, masks[0], "name_en")]:
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
            assert request("POST", page_path, duplicate, tokens["admin"])[0] in [400,403]
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
            expand = 'intro_block,visit_block,visit_button,excursion_block,excursion_button'
            def load_page():
                return request('GET', page_path + '/' + page['id'] + '?expand=' + expand)[1]
            def draft_page(item):
                data = {}
                for relation, fields in {'intro_block':{'title':'title','lede':'lede','description':'description'}, 'visit_block':{'title':'museum_title','description':'museum_description'}, 'excursion_block':{'title':'excursion_title','lede':'excursion_kicker','description':'excursion_description'}}.items():
                    for source, target in fields.items():
                        for locale in ['en','ru','uz']: data[target+'_'+locale] = item['expand'][relation][source+'_'+locale]
                for relation,prefix in [('visit_button','museum'),('excursion_button','excursion')]:
                    for locale in ['en','ru','uz']: data[prefix+'_button_label_'+locale] = item['expand'][relation]['label_'+locale]
                    data[prefix+'_button_url'] = item['expand'][relation]['url']
                revision = '|'.join(sorted(record['id']+':'+record['updated'] for record in [item]+list(item['expand'].values())))
                return {'revision':revision,'draft':data,'photos':item['excursion_photos']}
            endpoint = '/api/theater/museum-page'
            current = load_page()
            edit = draft_page(current)
            edit['draft']['title_en'] = 'Edited museum introduction'
            edit['draft']['museum_button_label_en'] = 'Visit us'
            edit['photos'] = [0] + list(reversed(current['excursion_photos']))
            for token in [None, tokens['moderator'],tokens['manager'],tokens['viewer']]:
                assert request('POST',endpoint,{'content':json.dumps(edit)},token)[0] in [401,403]
            code, changed = request('POST',endpoint,token=tokens['admin'],media=[('content',json.dumps(edit)),('excursion_photos',image)])
            assert code == 200, changed
            assert changed['expand']['intro_block']['title_en'] == edit['draft']['title_en']
            assert changed['expand']['visit_button']['label_en'] == 'Visit us'
            assert changed['excursion_photos'][1:] == edit['photos'][1:]
            assert request('POST',endpoint,{'content':json.dumps(edit)},tokens['admin'])[0] == 409
            invalid = draft_page(changed)
            invalid['draft']['title_en'] = 'Should roll back'
            invalid['photos'] = ['foreign-file.jpg']
            assert request('POST',endpoint,{'content':json.dumps(invalid)},tokens['admin'])[0] == 400
            assert load_page() == changed
            restore = draft_page(current)
            restore['revision'] = draft_page(changed)['revision']
            code, restored = request('POST',endpoint,{'content':json.dumps(restore)},tokens['admin'])
            assert code == 200 and restored['excursion_photos'] == current['excursion_photos'], restored
            assert request('PATCH',page_path+'/'+page['id'],{'intro_block':''},tokens['admin'])[0] in [403,404]
            print('PASS: minimal relation schema; preserved 3-language copy/media; public expansions; admin-only transactional edits; stale conflicts; rollback; gallery add/reorder/remove; mask URLs and permissions.', flush=True)
            if "--serve" in sys.argv:
                print(f"UI fixture: {origin}; press Enter to stop.", flush=True)
                input()
        finally:
            process.terminate()
            process.wait(timeout=10)


if __name__ == "__main__":
    run()
