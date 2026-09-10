"""Publication integration checks with disposable PocketBase and local deploy hooks.

Run with --serve to retain the fixture for UI checks on port 18096.
Login: publisher@example.com / PublicationTest123!
"""
import concurrent.futures
import http.server
import json
import os
import pathlib
import shutil
import socket
import sqlite3
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
PASSWORD = 'PublicationTest123!'


def run():
    calls = []
    failures = set()
    block = threading.Event()
    release = threading.Event()
    reached = threading.Event()

    class DeployHook(http.server.BaseHTTPRequestHandler):
        def do_POST(self):
            site = self.path.lstrip('/')
            calls.append(site)
            if block.is_set():
                reached.set()
                release.wait(5)
            self.send_response(503 if site in failures else 200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': site not in failures}).encode())

        def log_message(self, *_args):
            pass

    deploy = http.server.ThreadingHTTPServer(('127.0.0.1', 0), DeployHook)
    threading.Thread(target=deploy.serve_forever, daemon=True).start()
    with tempfile.TemporaryDirectory(prefix='site-publication-') as tmp:
        base = pathlib.Path(tmp)
        hooks = base / 'pb_hooks'
        migrations = base / 'pb_migrations'
        (hooks / 'lib').mkdir(parents=True)
        migrations.mkdir()
        shutil.copy(ROOT / 'pb_hooks/site_publication.pb.js', hooks)
        for name in ['site_publication.js', 'env.js']:
            shutil.copy(ROOT / 'pb_hooks/lib' / name, hooks / 'lib')
        # Exercise custom transactional saves and rollback, just like the nested content editors.
        (hooks / 'fixture.pb.js').write_text('''
routerAdd('POST', '/api/theater/fixture', (e) => {
  e.app.runInTransaction((app) => {
    const record = new Record(app.findCollectionByNameOrId('t_page_home'), {title: 'Nested save'})
    app.save(record)
    if (e.requestInfo().body.fail) throw new BadRequestError('Rollback fixture')
  })
  return e.json(200, {ok: true})
}, $apis.requireAuth('_superusers'))
''')
        (migrations / '1000000000_fixture.js').write_text('''
migrate((app) => {
  const staff = new Collection({name: '_user_staff', type: 'auth'})
  staff.fields.add(new TextField({name: 'name'}))
  staff.fields.add(new TextField({name: 'phone_number'}))
  staff.fields.add(new TextField({name: 'telegram_username'}))
  staff.fields.add(new SelectField({name: 'role', values: ['admin', 'moderator', 'manager', 'viewer'], maxSelect: 1}))
  staff.fields.add(new SelectField({name: 'scope', values: ['theater', 'space'], maxSelect: 2}))
  app.save(staff)
  for (const name of ['s_landing', 's_gallery_item', 't_page_home', 't_mask', '_button', '_copy_block', 's_request', 't_inquiry', 't_instagram_post', 't_instagram_sync']) {
    const collection = new Collection({name, type: 'base'})
    collection.fields.add(new TextField({name: 'title'}))
    collection.fields.add(new AutodateField({name: 'updated', onCreate: true, onUpdate: true}))
    if (name === 's_landing') {
      for (const key of ['header_phone_manager', 'telegram_manager', 'footer_contact_managers'])
        collection.fields.add(new RelationField({name: key, collectionId: staff.id, maxSelect: key === 'footer_contact_managers' ? 10 : 1}))
    }
    app.save(collection)
    // New installs must be able to seed content before the publication table exists.
    app.save(new Record(collection, {title: 'Baseline'}))
  }
}, () => {})
''')
        shutil.copy(ROOT / 'pb_migrations/1789050000_site_publication.js', migrations)
        env = dict(os.environ)
        env['CLOUDFLARE_PAGES_DEPLOY_HOOK_URL'] = f'http://127.0.0.1:{deploy.server_port}/landing'
        env['WEBSITE_PAGES_DEPLOY_HOOK_URL'] = f'http://127.0.0.1:{deploy.server_port}/theater'
        args = [str(ROOT / 'pocketbase'), '--dir', str(base / 'pb_data'), '--hooksDir', str(hooks), '--migrationsDir', str(migrations)]
        subprocess.run(args + ['migrate', 'up'], check=True, capture_output=True, env=env)
        subprocess.run(args + ['superuser', 'upsert', 'publisher@example.com', PASSWORD], check=True, capture_output=True, env=env)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = 18096 if '--serve' in sys.argv else sock.getsockname()[1]
        origin = f'http://127.0.0.1:{port}'
        log = (base / 'server.log').open('w+')

        def start():
            process = subprocess.Popen(args + ['serve', '--http', f'127.0.0.1:{port}'], stdout=log, stderr=log, env=env)
            for _ in range(100):
                try:
                    urllib.request.urlopen(origin + '/api/health', timeout=1)
                    return process
                except (OSError, urllib.error.URLError):
                    time.sleep(0.05)
            raise AssertionError('PocketBase did not start')

        process = start()
        token = None

        def request(method, path, body=None, auth='default', expected=200):
            headers = {'Content-Type': 'application/json'}
            credential = token if auth == 'default' else auth
            if credential:
                headers['Authorization'] = credential
            req = urllib.request.Request(origin + path, method=method, headers=headers, data=None if body is None else json.dumps(body).encode())
            try:
                response = urllib.request.urlopen(req, timeout=15)
            except urllib.error.HTTPError as error:
                response = error
            raw = response.read()
            assert response.status == expected, (method, path, response.status, raw.decode())
            return json.loads(raw) if raw else None

        def save(collection, body=None, id=None):
            return request('PATCH' if id else 'POST', '/api/collections/' + collection + '/records' + ('/' + id if id else ''), body or {'title': 'Changed'})

        def pending(auth='default'):
            return [site['site'] for site in request('GET', '/api/publication', auth=auth)['sites'] if site['pending']]

        def publish():
            return request('POST', '/api/publication', {})

        def staff(role, scopes):
            email = role + '-'.join(scopes) + '@example.com'
            record = save('_user_staff', {'email': email, 'password': PASSWORD, 'passwordConfirm': PASSWORD, 'role': role, 'scope': scopes, 'name': role})
            auth = request('POST', '/api/collections/_user_staff/auth-with-password', {'identity': email, 'password': PASSWORD}, auth=None)['token']
            return record, auth

        try:
            token = request('POST', '/api/collections/_superusers/auth-with-password', {'identity': 'publisher@example.com', 'password': PASSWORD}, auth=None)['token']
            assert pending() == []
            request('GET', '/api/publication', auth=None, expected=401)
            landing = save('s_landing')
            assert pending() == ['landing'] and calls == []
            assert publish()['accepted'] == ['landing'] and calls == ['landing']
            assert pending() == []
            assert publish()['accepted'] == [] and calls == ['landing']
            save('s_landing', {'title': 'Changed'}, landing['id'])
            assert pending() == [], 'No-op saves must stay clean'
            for collection in ['s_request', 't_inquiry', 't_instagram_post', 't_instagram_sync']:
                row = save(collection)
                save(collection, {'title': 'Updated'}, row['id'])
                request('DELETE', f'/api/collections/{collection}/records/{row["id"]}', expected=204)
            assert pending() == []
            theater = save('t_page_home')
            assert pending() == ['theater']
            save('s_gallery_item')
            assert pending() == ['landing', 'theater']
            before = len(calls)
            failures.add('theater')
            result = publish()
            assert result['accepted'] == ['landing'] and result['failed'] == ['theater']
            assert calls[before:] == ['landing', 'theater'] and pending() == ['theater']
            failures.clear()
            assert publish()['accepted'] == ['theater'] and pending() == []
            for collection in ['_copy_block', '_button', 't_mask']:
                row = save(collection)
                assert pending() == ['theater']
                publish()
                request('DELETE', f'/api/collections/{collection}/records/{row["id"]}', expected=204)
                assert pending() == ['theater']
                publish()
            person, _ = staff('admin', [])
            assert pending() == []
            save('s_landing', {'header_phone_manager': person['id']}, landing['id'])
            publish()
            save('_user_staff', {'name': 'Private account name'}, person['id'])
            assert pending() == []
            save('_user_staff', {'phone_number': '+998123456789'}, person['id'])
            assert pending() == ['landing']
            publish()
            _, space_token = staff('moderator', ['space'])
            _, theater_token = staff('moderator', ['theater'])
            for role in ['manager', 'viewer']:
                _, auth = staff(role, ['space', 'theater'])
                assert request('GET', '/api/publication', auth=auth)['sites'] == []
                request('POST', '/api/publication', {}, auth=auth, expected=403)
            save('s_gallery_item')
            save('t_mask')
            assert pending(space_token) == ['landing'] and pending(theater_token) == ['theater']
            assert request('POST', '/api/publication', {}, auth=space_token)['accepted'] == ['landing']
            assert pending() == ['theater']
            publish()
            request('POST', '/api/theater/fixture', {'fail': True}, expected=400)
            assert pending() == [], 'Rolled back content must not become pending'
            request('POST', '/api/theater/fixture', {})
            assert pending() == ['theater']
            publish()

            # Other edits and Publish requests run while Cloudflare is blocked.
            updated = save('t_page_home', {'title': 'Before publish'}, theater['id'])
            assert pending() == ['theater'], ('An existing theater record update must be pending', updated)
            before = len(calls)
            block.set()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                running = executor.submit(publish)
                assert reached.wait(5), running.result() if running.done() else 'Deploy hook was not reached'
                save('t_page_home', {'title': 'Saved during publish'}, theater['id'])
                assert publish()['accepted'] == [], 'Concurrent clicks must not duplicate requests'
                release.set()
                assert running.result()['accepted'] == ['theater']
            block.clear()
            assert calls[before:] == ['theater'] and pending() == ['theater']

            # Pending revisions survive a process restart.
            process.terminate()
            process.wait(timeout=5)
            process = start()
            assert pending() == ['theater']
            with sqlite3.connect(base / 'pb_data/data.db') as db:
                db.execute("UPDATE _site_publication SET claim='abandoned', claim_until=1 WHERE site='theater'")
            publish()
            assert pending() == []

            # A site that first changes during another site's publish waits for the next click.
            save('s_gallery_item')
            reached.clear()
            release.clear()
            block.set()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                running = executor.submit(publish)
                assert reached.wait(5)
                save('t_mask')
                release.set()
                assert running.result()['accepted'] == ['landing']
            block.clear()
            assert pending() == ['theater']
            publish()

            # Missing configuration must preserve pending content and release the claim.
            save('s_gallery_item')
            process.terminate()
            process.wait(timeout=5)
            del env['CLOUDFLARE_PAGES_DEPLOY_HOOK_URL']
            process = start()
            assert publish()['failed'] == ['landing'] and pending() == ['landing']
            assert not any(site['publishing'] for site in request('GET', '/api/publication')['sites'])
            print('PASS: selective deploys, no-op saves, excluded records, shared content, contacts, permissions, rollback, partial failure, concurrency, restart, missing config', flush=True)
            if '--serve' in sys.argv:
                process.terminate()
                process.wait(timeout=5)
                env['CLOUDFLARE_PAGES_DEPLOY_HOOK_URL'] = f'http://127.0.0.1:{deploy.server_port}/landing'
                process = start()
                publish()
                save('t_page_home', {'title': 'UI preview'}, theater['id'])
                print('UI fixture: ' + origin, flush=True)
                while True:
                    time.sleep(1)
        except Exception:
            log.flush()
            print((base / 'server.log').read_text()[-8000:], file=sys.stderr)
            raise
        finally:
            release.set()
            process.terminate()
            process.wait(timeout=5)
            log.close()
            deploy.shutdown()
            deploy.server_close()


if __name__ == '__main__':
    run()
