"""Homepage editor permissions and transactional saves against disposable PocketBase.
Run with --serve to keep the tested fixture on port 18093 for browser verification.
"""
import json
import pathlib
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request
import urllib.error

ROOT = pathlib.Path(__file__).resolve().parents[1]
PASSWORD = 'HomepageFixturePassword123!'


def run():
    with tempfile.TemporaryDirectory(prefix='theater-home-') as tmp:
        base = pathlib.Path(tmp)
        migrations = base / 'pb_migrations'
        hooks = base / 'pb_hooks'
        migrations.mkdir()
        (hooks / 'lib').mkdir(parents=True)
        (migrations / '1000000000_fixture.js').write_text('''
migrate((app) => {
  const staff = new Collection({name:'_user_staff',type:'auth'})
  staff.fields.add(new SelectField({name:'role',maxSelect:1,values:['admin','moderator','manager','viewer']}))
  staff.fields.add(new SelectField({name:'scope',maxSelect:2,values:['theater','space']}))
  app.save(staff)
  for (const [id,name] of [['pbc_3555510918','t_play'],['pbc_4060796684','t_mask'],['pbc_829252413','_phone']]) {
    const collection = new Collection({id,name,type:'base',listRule:'',viewRule:''})
    for(const field of ['created','legacy_slug','slug','sort_order','title_ru','title_en','title_uz','name_ru','name_en','name_uz']) collection.fields.add(new TextField({name:field}))
    app.save(collection)
    if(name !== '_phone') app.save(new Record(collection,{id:name==='t_play'?'fixtureplay0001':'fixturemask0001',legacy_slug:'023',slug:'fixture',title_ru:'Спектакль',title_en:'Play',title_uz:'Spektakl',name_ru:'Маска',name_en:'Mask',name_uz:'Niqob'}))
  }
}, () => {})
''')
        for name in ['1788947164_created__copy_block.js', '1788947206_created__button.js', '1788947671_created_t_page_home.js', '1788948261_created_t_contact.js', '1788948507_updated_t_page_home.js', '1788953000_home_content.js']:
            shutil.copy(ROOT / 'pb_migrations' / name, migrations)
        (migrations / 'home-assets').symlink_to(ROOT / 'pb_migrations/home-assets', target_is_directory=True)
        shutil.copy(ROOT / 'pb_hooks/theater_home.pb.js', hooks)
        for name in ['theater_home.js', 'instagram_refresh.js', 'env.js']:
            shutil.copy(ROOT / 'pb_hooks/lib' / name, hooks / 'lib')
        args = [str(ROOT / 'pocketbase'), '--dir', str(base / 'pb_data'), '--migrationsDir', str(migrations), '--hooksDir', str(hooks)]
        migration = subprocess.run(args + ['migrate', 'up'], check=True, capture_output=True, text=True)
        assert 'Applied 1788953000_home_content.js' in migration.stdout, migration.stdout + migration.stderr
        subprocess.run(args + ['superuser', 'upsert', 'home-root@example.com', PASSWORD], check=True, capture_output=True)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = 18093 if '--serve' in sys.argv else sock.getsockname()[1]
        origin = f'http://127.0.0.1:{port}'
        process = subprocess.Popen(args + ['serve', '--http', f'127.0.0.1:{port}'], stdout=(base / 'server.log').open('w'), stderr=subprocess.STDOUT)

        def request(method, path, body=None, token=None, image=None):
            headers = {'Content-Type': 'application/json'}
            if token:
                headers['Authorization'] = token
            payload = json.dumps(body).encode() if body is not None else None
            if image is not None:
                boundary = 'homepage-boundary'
                headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary
                payload = ('--' + boundary + '\r\nContent-Disposition: form-data; name="content"\r\n\r\n' + json.dumps(body) + '\r\n').encode()
                payload += ('--' + boundary + '\r\nContent-Disposition: form-data; name="instagram_avatar"; filename="logo.png"\r\nContent-Type: image/png\r\n\r\n').encode() + image + b'\r\n'
                payload += ('--' + boundary + '--\r\n').encode()
            req = urllib.request.Request(origin + path, data=payload, headers=headers, method=method)
            try:
                with urllib.request.urlopen(req, timeout=10) as response:
                    return response.status, json.load(response)
            except urllib.error.HTTPError as error:
                return error.code, json.load(error)

        def draft(content):
            content = json.loads(json.dumps(content))
            return {key: content[key] for key in ['revision', 'copies', 'buttons', 'stats']} | {
                'featured_plays': content['page']['featured_plays'], 'about_mask': content['page']['about_mask'],
                'instagram_url': content['contact']['instagram_url'], 'remove_images': [],
            }

        try:
            for _ in range(100):
                if process.poll() is not None:
                    raise RuntimeError((base / 'server.log').read_text())
                try:
                    if request('GET', '/api/health')[0] == 200:
                        break
                except OSError:
                    time.sleep(.05)
            _, auth = request('POST', '/api/collections/_superusers/auth-with-password', {'identity': 'home-root@example.com', 'password': PASSWORD})
            root = auth['token']
            tokens = {}
            for role, scope in [('admin','space'),('moderator','theater'),('moderator','space'),('manager','theater'),('viewer','theater')]:
                name = role + '-' + scope
                email = name + '@example.com'
                status, result = request('POST', '/api/collections/_user_staff/records', {'email':email,'password':PASSWORD,'passwordConfirm':PASSWORD,'role':role,'scope':[scope]}, root)
                assert status == 200, result
                _, login = request('POST', '/api/collections/_user_staff/auth-with-password', {'identity':email,'password':PASSWORD})
                tokens[name] = login['token']
            for name in ['admin-space','moderator-theater']:
                assert request('GET', '/api/theater/home', token=tokens[name])[0] == 200
            for token in [None, tokens['moderator-space'], tokens['manager-theater'], tokens['viewer-theater']]:
                for method in ['GET','POST']:
                    code, _ = request(method, '/api/theater/home', {'content':'{}'} if method == 'POST' else None, token)
                    assert code in [401,403], (method, code)
            moderator = tokens['moderator-theater']
            _, content = request('GET','/api/theater/home',token=moderator)
            original = json.loads(json.dumps(content))
            edit = draft(content)
            edit['copies']['about_block']['title_en'] = 'Edited homepage'
            edit['instagram_url'] = 'https://instagram.com/new.theater/?hl=en'
            edit['stats'].reverse()
            image = (ROOT / 'pb_migrations/home-assets/logo.png').read_bytes()
            status, saved = request('POST','/api/theater/home',edit,moderator,image)
            assert status == 200, (saved, (base / 'server.log').read_text()[-1500:])
            assert saved['copies']['about_block']['title_en'] == 'Edited homepage'
            assert saved['buttons']['instagram_button']['url'] == 'https://www.instagram.com/new.theater/'
            assert saved['page']['instagram_avatar'] != original['page']['instagram_avatar']
            assert [s['id'] for s in saved['stats']] == [s['id'] for s in edit['stats']]
            assert request('POST','/api/theater/home',{'content':json.dumps(edit)},moderator)[0] == 409
            invalid = draft(saved)
            invalid['copies']['about_block']['title_en'] = 'Must roll back'
            invalid['stats'] = [{'id':'someoneelsesrow'}]
            assert request('POST','/api/theater/home',{'content':json.dumps(invalid)},moderator)[0] == 400
            _, unchanged = request('GET','/api/theater/home',token=moderator)
            assert unchanged == saved, 'Failed request changed homepage content'
            remove = draft(unchanged)
            remove['remove_images'] = ['instagram_avatar']
            remove['stats'] = remove['stats'][:1]
            status, removed = request('POST','/api/theater/home',{'content':json.dumps(remove)},moderator)
            assert status == 200 and not removed['page']['instagram_avatar'], removed
            # Existing generic collection endpoints stay locked for moderator writes.
            code, _ = request('PATCH','/api/collections/t_contact/records/' + removed['contact']['id'], {'contact_email':'unauthorized@example.com'},moderator)
            assert code in [403,404], code
            # Restore the fixture's original editorial content for UI checks.
            restore = draft(original)
            restore['revision'] = removed['revision']
            restore['stats'] = [{key: value for key, value in stat.items() if key != 'id'} for stat in original['stats']]
            status, restored = request('POST','/api/theater/home',restore,moderator,image)
            assert status == 200, restored
            assert len(restored['stats']) == 3
            assert all(stat['id'] for stat in restored['stats'])
            print('PASS: scope/role access, multipart save, Instagram synchronization, order, stale-edit conflict, atomic rollback, image removal, locked direct writes', flush=True)
            if '--serve' in sys.argv:
                print('Fixture ready at ' + origin, flush=True)
                while True:
                    time.sleep(1)
        finally:
            process.terminate()
            process.wait(timeout=5)

if __name__ == '__main__':
    run()
