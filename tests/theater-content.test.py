"""Content API checks on a disposable copy of a seeded database.

The source database is opened read-only. --database can select a pre-migration backup.
--existing uses the task's disposable fixture on port 18095 instead of starting one.
"""
import argparse
import copy
import json
import pathlib
import shutil
import socket
import sqlite3
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
ORIGIN = 'http://127.0.0.1:18095'
PASSWORD = 'ContentFixturePassword123!'


def request(method, path, body=None, token=None, files=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = token
    payload = json.dumps(body).encode() if body is not None else None
    if files is not None:
        boundary = 'theater-content-fixture'
        headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary
        payload = ('--' + boundary + '\r\nContent-Disposition: form-data; name="content"\r\n\r\n' + json.dumps(body) + '\r\n').encode()
        for name, data in files:
            payload += ('--' + boundary + '\r\nContent-Disposition: form-data; name="files"; filename="' + name + '"\r\nContent-Type: image/png\r\n\r\n').encode() + data + b'\r\n'
        payload += ('--' + boundary + '--\r\n').encode()
    req = urllib.request.Request(ORIGIN + path, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = response.read()
            return response.status, json.loads(data) if data else None
    except urllib.error.HTTPError as error:
        return error.code, json.load(error)


def expect(code, result, expected=200):
    assert code == expected, (code, result)
    return result


def run():
    root = expect(*request('POST', '/api/collections/_superusers/auth-with-password', {'identity': 'content-fixture@example.com', 'password': PASSWORD}))['token']
    tokens = {}
    for role, scope in [('admin','space'),('moderator','theater'),('moderator','space'),('manager','theater'),('viewer','theater')]:
        email = 'content-' + role + '-' + scope + '@example.com'
        status, result = request('POST','/api/collections/_user_staff/records',dict(email=email,password=PASSWORD,passwordConfirm=PASSWORD,role=role,scope=[scope]),root)
        assert status in [200,400], result
        tokens[role+'-'+scope] = expect(*request('POST','/api/collections/_user_staff/auth-with-password',{'identity':email,'password':PASSWORD}))['token']
    moderator = tokens['moderator-theater']
    path = '/api/theater/content/t_page_about'
    for token in [None,tokens['moderator-space'],tokens['manager-theater'],tokens['viewer-theater']]:
        for method, url in [('GET',path),('POST',path+'/new'),('DELETE',path+'/anything')]:
            status,_=request(method,url,{'content':'{}'} if method=='POST' else None,token)
            assert status in [401,403], (method,status)
    for token in [root,tokens['admin-space'],moderator]:
        expect(*request('GET',path,token=token))
        expect(*request('GET','/api/theater/home',token=token))
    expect(*request('POST','/api/theater/museum-page',{'content':'{}'},moderator),expected=409)
    for name in json.loads((ROOT/'shared/theater-content.json').read_text()):
        expect(*request('GET','/api/theater/content/'+name,token=moderator))
    print('PASS: all editor collections and theater-scoped roles')

    sponsors_path = '/api/theater/content/t_page_sponsors'
    sponsors = expect(*request('GET', sponsors_path, token=moderator))['items'][0]
    original_sponsors = copy.deepcopy(sponsors['record'])
    faq = sponsors['record']['faq']
    assert all(item.get('button') is None for item in faq)
    faq[0]['button'] = dict(label_ru='Обсудить', label_en='Discuss', label_uz='Muhokama', url='https://theaterplus.uz/contact/')
    faq[1]['button'] = dict(label_ru='Позвонить', label_en='Call', label_uz='Qo‘ng‘iroq', url='tel:+998920456336')
    sponsors_url = sponsors_path + '/' + sponsors['record']['id']
    sponsors = expect(*request('POST', sponsors_url, {'content': json.dumps(sponsors)}, moderator))
    faq = sponsors['record']['faq']
    assert faq[0]['button']['id'] != faq[1]['button']['id']
    assert faq[0]['button']['label_en'] == 'Discuss'
    assert faq[1]['button']['url'] == 'tel:+998920456336'
    public = expect(*request('GET', '/api/collections/t_page_sponsors/records?expand=faq.button'))['items'][0]
    public_faq = {item['id']: item for item in public['expand']['faq']}
    assert public_faq[faq[0]['id']]['expand']['button']['label_uz'] == 'Muhokama'
    invalid = copy.deepcopy(sponsors)
    invalid['record']['faq'][0]['button']['url'] = 'javascript:alert(1)'
    expect(*request('POST', sponsors_url, {'content': json.dumps(invalid)}, moderator), expected=400)
    assert expect(*request('GET', sponsors_path, token=moderator))['items'][0] == sponsors
    invalid = copy.deepcopy(sponsors)
    invalid['record']['faq'][0]['button'] = copy.deepcopy(faq[1]['button'])
    expect(*request('POST', sponsors_url, {'content': json.dumps(invalid)}, moderator), expected=400)
    assert expect(*request('GET', sponsors_path, token=moderator))['items'][0] == sponsors
    stale = copy.deepcopy(sponsors)
    faq[0]['button'].update(label_ru='', label_en='', label_uz='', url='')
    faq[1]['button'] = None
    sponsors = expect(*request('POST', sponsors_url, {'content': json.dumps(sponsors)}, moderator))
    assert sponsors['record']['faq'][0]['button']['url'] == ''
    assert sponsors['record']['faq'][1]['button'] is None
    expect(*request('POST', sponsors_url, {'content': json.dumps(stale)}, moderator), expected=409)
    sponsors['record'] = original_sponsors
    expect(*request('POST', sponsors_url, {'content': json.dumps(sponsors)}, moderator))
    print('PASS: optional FAQ buttons create, translate, expand publicly, clear, enforce ownership, reject unsafe URLs and stale saves')

    masks=expect(*request('GET','/api/collections/t_mask/records?sort=sort_order',token=moderator))['items']
    mask=masks[0]
    assert 'legacy_slug' not in mask
    mask_path='/api/collections/t_mask/records/'+mask['id']
    origins = {'origin_ru': 'Япония', 'origin_en': 'Japan', 'origin_uz': 'Yaponiya'}
    updated = expect(*request('PATCH', mask_path, origins, moderator))
    assert all(updated[key] == value for key, value in origins.items())
    public_mask = expect(*request('GET', mask_path))
    assert all(public_mask[key] == value for key, value in origins.items())
    cleared = expect(*request('PATCH', mask_path, {key: '' for key in origins}, moderator))
    assert all(cleared[key] == '' for key in origins)
    print('PASS: localized mask origins persist, are public, and can be cleared')
    for token in [None,tokens['moderator-space'],tokens['manager-theater'],tokens['viewer-theater']]:
        assert request('PATCH',mask_path,{'slug':'forbidden-address'},token)[0] in [403,404]
    for token in [tokens['admin-space'],moderator]:
        updated=expect(*request('PATCH',mask_path,{'slug':'Editable mask address'},token))
        assert updated['slug']=='editable-mask-address'
        assert expect(*request('GET',mask_path))['slug']=='editable-mask-address'
        expect(*request('PATCH',mask_path,{'slug':masks[1]['slug']},token),expected=400)
        expect(*request('PATCH',mask_path,{'slug':''},token),expected=400)
        expect(*request('PATCH',mask_path,{'slug':mask['slug']},token))
    assert all('photo' not in item['record'] for item in expect(*request('GET','/api/theater/content/t_role',token=moderator))['items'])
    print('PASS: removed role photo and mask legacy fields; admin/moderator slug edits, validation and scope protection')

    original=expect(*request('GET',path,token=moderator))['items'][0]
    edit=copy.deepcopy(original)
    edit['record']['history_block']['title_en']='Edited history from the admin'
    edit['record']['links'].reverse()
    image=(ROOT/'pb_migrations/home-assets/logo.png').read_bytes()
    edit['record']['image']='@upload:0'
    saved=expect(*request('POST',path+'/'+original['record']['id'],edit,moderator,files=[('fixture.png',image)]))
    assert saved['record']['history_block']['title_en']==edit['record']['history_block']['title_en']
    assert [x['id'] for x in saved['record']['links']]==[x['id'] for x in edit['record']['links']]
    assert saved['record']['image']!=original['record']['image']
    expect(*request('POST',path+'/'+original['record']['id'],{'content':json.dumps(edit)},moderator),expected=409)
    invalid=copy.deepcopy(saved)
    invalid['record']['history_block']['title_en']='Must not persist'
    invalid['record']['links'][0]['id']=original['record']['history_block']['id']
    expect(*request('POST',path+'/'+original['record']['id'],{'content':json.dumps(invalid)},moderator),expected=400)
    unchanged=expect(*request('GET',path,token=moderator))['items'][0]
    assert unchanged==saved,'A failed nested save must roll back every relation and field'
    invalid=copy.deepcopy(saved)
    invalid['record']['repertoire_button']['url']='javascript:alert(1)'
    expect(*request('POST',path+'/'+original['record']['id'],{'content':json.dumps(invalid)},moderator),expected=400)
    assert expect(*request('GET',path,token=moderator))['items'][0]==saved
    expect(*request('DELETE',path+'/'+saved['record']['id'],{'revision':saved['revision']},moderator),expected=400)
    print('PASS: nested edits, file replacement, ordering, conflicts, ownership, URL validation and rollback')

    festivals=expect(*request('GET','/api/theater/content/t_festival',token=moderator))['items']
    assert len(festivals)>=2 and all(not item['record']['published'] for item in festivals)
    public=expect(*request('GET','/api/collections/t_festival/records'))
    assert public['totalItems']==0,'Draft festivals must not appear in the public archive'
    festival=copy.deepcopy(festivals[0])
    for node in [festival['record'],festival['record']['intro_block'],festival['record']['booking_button']]:
        node.pop('id',None)
    festival['record']['programme']=[]
    festival['record']['image']=''
    festival['record']['gallery']=['@upload:0','@upload:1']
    festival['record']['slug']='fixture-published-festival'
    festival['record']['published']=True
    festival['revision']=''
    created=expect(*request('POST','/api/theater/content/t_festival/new',festival,moderator,files=[('first.png',image),('second.png',image)]))
    assert expect(*request('GET','/api/collections/t_festival/records'))['totalItems']==1
    gallery=created['record']['gallery'][:]
    created['record']['gallery'].reverse()
    updated=expect(*request('POST','/api/theater/content/t_festival/'+created['record']['id'],{'content':json.dumps(created)},moderator))
    assert updated['record']['gallery']==gallery[::-1]
    updated['record']['gallery']=updated['record']['gallery'][:1]
    updated=expect(*request('POST','/api/theater/content/t_festival/'+updated['record']['id'],{'content':json.dumps(updated)},moderator))
    assert len(updated['record']['gallery'])==1
    expect(*request('DELETE','/api/theater/content/t_festival/'+updated['record']['id'],{'revision':updated['revision']},moderator),expected=204)
    assert expect(*request('GET','/api/collections/t_festival/records'))['totalItems']==0
    print('PASS: draft/public festivals, create/edit/delete, gallery upload/reorder/remove')

    contact=expect(*request('GET','/api/collections/t_contact/records?expand=box_office_phones,administration_phones'))['items'][0]
    assert 'cashier_phone' not in contact and 'administration_phone' not in contact
    assert all('email' not in phone and 'role' not in phone for group in contact['expand'].values() for phone in group)
    assert expect(*request('GET','/api/collections/t_contact_phone/records'))['totalItems']>=3
    print('PASS: public contact details contain no login-account records')

    posts=expect(*request('GET','/api/theater/content/t_blog_post',token=moderator))['items']
    post=copy.deepcopy(posts[0])
    post['record'].pop('id')
    post['record'].update(slug='fixture-cover-metadata',published=False,cover='@upload:0',gallery=[],cover_width=320,cover_height=320)
    post['revision']=''
    created=expect(*request('POST','/api/theater/content/t_blog_post/new',post,moderator,files=[('cover.png',image)]))
    assert created['record']['cover_width']==320 and created['record']['cover_height']==320
    invalid=copy.deepcopy(created)
    invalid['record']['cover']=''
    expect(*request('POST','/api/theater/content/t_blog_post/'+created['record']['id'],{'content':json.dumps(invalid)},moderator),expected=400)
    expect(*request('DELETE','/api/theater/content/t_blog_post/'+created['record']['id'],{'revision':created['revision']},moderator),expected=204)
    print('PASS: blog cover metadata is maintained without editable dimension fields')

    catalogue=json.loads((ROOT/'shared/theater-content.json').read_text())
    def specs(name): return [field for section in catalogue[name]['sections'] for field in section['fields']]
    def blank(fields):
        result={}
        for field in fields:
            name=field['name']
            if field['type']=='localized': result.update({name+'_'+lang:'' for lang in ['ru','en','uz']})
            else: result[name]=field.get('default', [] if field.get('many') else blank(field.get('fields') or specs(field['collection'])) if field['type']=='owned' else False if field['type']=='bool' else '')
        return result
    def translated(record, field, value): record.update({field+'_'+lang:value for lang in ['ru','en','uz']})
    def save(name, item, files=None): return expect(*request('POST','/api/theater/content/'+name+'/'+item['record'].get('id','new'),item,moderator,files=files or []))
    def listing(name): return expect(*request('GET','/api/theater/content/'+name,token=moderator))['items']
    def remove(name, item): expect(*request('DELETE','/api/theater/content/'+name+'/'+item['record']['id'],{'revision':item['revision']},moderator),expected=204)

    schemas={item['name']:item for item in expect(*request('GET','/api/collections?perPage=500',token=root))['items']}
    def check_multiplicity(collection, fields):
        schema={field['name']:field for field in schemas[collection]['fields']}
        for field in fields:
            if field['type'] in ['file','relation','owned','select']:
                expected=schema[field['name']].get('maxSelect',0)>1
                assert bool(field.get('many'))==expected, f"{collection}.{field['name']} editor multiplicity differs from PocketBase"
            if field.get('fields'):
                check_multiplicity(field['collection'],field['fields'])
    for name in catalogue:
        check_multiplicity(name,specs(name))
    print('PASS: editor file and relation multiplicities match the migrated database, including nested forms')

    partner=copy.deepcopy(listing('t_partner')[0])
    assert isinstance(partner['record']['logo'],str) and partner['record']['logo']
    original_logo=partner['record']['logo']
    translated(partner['record'],'name','Fixture sponsor')
    partner['record'].update(website_url='https://example.com/partner',is_sponsor=True,is_hidden=True)
    partner=save('t_partner',partner)
    assert partner['record']['logo']==original_logo
    assert partner['record']['is_sponsor'] and partner['record']['is_hidden']
    assert partner['record']['name_en']=='Fixture sponsor'
    partner['record'].update(logo='@upload:0',is_hidden=False)
    partner=save('t_partner',partner,[('partner.png',image)])
    assert isinstance(partner['record']['logo'],str) and partner['record']['logo']!=original_logo
    assert not partner['record']['is_hidden']
    partner['record']['logo']=''
    partner=save('t_partner',partner)
    assert partner['record']['logo']==''
    print('PASS: existing partner details, sponsor/visibility status, single-logo preservation, replacement and removal')

    partner_path = '/api/theater/content/t_partner'
    order_path = '/api/theater/content-order/t_partner'
    partners = expect(*request('GET', partner_path, token=moderator))
    ids = [item['record']['id'] for item in partners['items']]
    assert len(ids) > 1
    reversed_ids = list(reversed(ids))
    payload = {'ids': reversed_ids, 'revision': partners['revision']}
    for token in [None, tokens['moderator-space'], tokens['manager-theater'], tokens['viewer-theater']]:
        assert request('POST', order_path, payload, token)[0] in [401, 403]
    reordered = expect(*request('POST', order_path, payload, moderator))
    assert [item['record']['id'] for item in reordered['items']] == reversed_ids
    assert [item['record']['sort_order'] for item in reordered['items']] == list(range(len(ids)))
    assert [item['record']['id'] for item in listing('t_partner')] == reversed_ids
    expect(*request('POST', order_path, payload, moderator), expected=409)
    expect(*request('POST', order_path, {'ids': reversed_ids[:-1], 'revision': reordered['revision']}, moderator), expected=409)
    public = expect(*request('GET', '/api/collections/t_partner/records?sort=sort_order,created,id&perPage=500'))['items']
    visible_ids = [item['record']['id'] for item in reordered['items'] if not item['record']['is_hidden']]
    assert [item['id'] for item in public] == visible_ids
    new_partner = blank(specs('t_partner'))
    translated(new_partner, 'name', 'New last partner')
    added = save('t_partner', {'record': new_partner, 'revision': ''})
    assert [item['record']['id'] for item in listing('t_partner')] == reversed_ids + [added['record']['id']]
    remove('t_partner', added)
    print('PASS: partner reordering persists publicly, rejects stale/incomplete orders, enforces roles and appends new partners')

    staff=blank(specs('t_staff'))
    translated(staff,'name','Fixture team member')
    translated(staff,'description','A complete personal biography.')
    staff.update(role='actor',photo='@upload:0')
    person=save('t_staff',{'record':staff,'revision':''},[('portrait.png',image)])
    assert isinstance(person['record']['photo'],str) and person['record']['role']=='actor'
    assert person['record']['slug'].startswith('fixture-team-member')

    course=blank(specs('t_course'))
    translated(course,'title','Fixture full course')
    translated(course,'summary','An editable course from introduction to programme.')
    teacher_spec=next(field for field in specs('t_course') if field['name']=='teachers')
    teacher=blank(teacher_spec['fields']); teacher['staff']=person['record']['id']
    translated(teacher,'role','Course tutor'); translated(teacher,'bio','Teaching biography')
    course['teachers']=[teacher]
    section_spec=next(field for field in specs('t_course') if field['name']=='_sections')
    programme=blank(section_spec['fields']); programme['kind']='program'
    translated(programme,'title','First programme module'); translated(programme,'body','Module contents')
    faq=blank(section_spec['fields']); faq['kind']='faq'
    translated(faq,'title','Who can join?'); translated(faq,'body','Everyone is welcome.')
    gallery=blank(section_spec['fields']); gallery['kind']='gallery'
    translated(gallery,'title','Course photographs')
    photo_spec=next(field for field in section_spec['fields'] if field['name']=='gallery')
    photo=blank(photo_spec['fields']); photo['image']='@upload:0'; translated(photo,'alt','Workshop photograph')
    gallery['gallery']=[photo]
    course['_sections']=[programme,faq,gallery]
    course.update(cover='@upload:1',published=True)
    created=save('t_course',{'record':course,'revision':''},[('gallery.png',image),('course.png',image)])
    assert created['record']['enrollment_status']=='enquire'
    assert created['record']['teachers'][0]['staff']==person['record']['id']
    assert [section['kind'] for section in created['record']['_sections']]==['program','faq','gallery']
    assert all(section['course']==created['record']['id'] for section in created['record']['_sections'])
    assert created['record']['_sections'][2]['gallery'][0]['image']
    original=copy.deepcopy(created)
    created['record']['_sections'].reverse()
    created=save('t_course',created)
    assert [section['kind'] for section in created['record']['_sections']]==['gallery','faq','program']
    expect(*request('POST','/api/theater/content/t_course/'+created['record']['id'],original,moderator,files=[]),expected=409)
    invalid=copy.deepcopy(created)
    translated(invalid['record'],'title','Must roll back')
    invalid['record']['_sections'].append({'id':'foreignchild123','kind':'about'})
    expect(*request('POST','/api/theater/content/t_course/'+created['record']['id'],invalid,moderator,files=[]),expected=400)
    assert next(item for item in listing('t_course') if item['record']['id']==created['record']['id'])==created
    removed_section=created['record']['_sections'].pop(1)['id']
    created=save('t_course',created)
    assert not any(item['record']['id']==removed_section for item in listing('t_course_section'))
    print('PASS: complete course creation, single staff references, automatic URL, teacher, programme, FAQ, gallery, order, child removal and atomic rollback')

    play=blank(specs('t_play')); translated(play,'title','Fixture production'); play['cover']='@upload:0'; play['thumbnail']='@upload:1'
    show_spec=next(field for field in specs('t_play') if field['name']=='_performances')
    show=blank(show_spec['fields']); show['start_at']='2030-09-10T14:00:00Z'; play['_performances']=[show]
    production=save('t_play',{'record':play,'revision':''},[('cover.png',image),('poster.png',image)])
    assert production['record']['_performances'][0]['play']==production['record']['id']
    credit_spec=next(field for field in specs('t_staff') if field['name']=='_credits')
    credit=blank(credit_spec['fields']); translated(credit['role'],'name','The visitor'); credit['_plays']=[production['record']['id']]
    person['record']['_credits']=[credit]
    person_photo_spec=next(field for field in specs('t_staff') if field['name']=='_photos')
    photo=blank(person_photo_spec['fields']); photo['image']='@upload:0'; photo['plays']=[production['record']['id']]
    translated(photo,'alt','Team production photograph')
    person['record']['_photos']=[photo]
    person=save('t_staff',person,[('scene.png',image)])
    assert person['record']['_credits'][0]['staff']==person['record']['id']
    production=next(item for item in listing('t_play') if item['record']['id']==production['record']['id'])
    assert production['record']['roles'][0]['staff']==person['record']['id']
    assert production['record']['roles'][0]['role']['name_en']=='The visitor'
    assert len(production['record']['_photos'])==1, 'The photo must appear in both linked page galleries'
    shared_photo=person['record']['_photos'][0]['id']
    person['record']['_photos']=[]
    person=save('t_staff',person)
    photo=next(item for item in listing('t_media_library') if item['record']['id']==shared_photo)
    assert photo['record']['plays']==[production['record']['id']] and photo['record']['staff']==[]
    print('PASS: person portrait, department, credits, linked production, performance and contextual gallery; shared photo survives removal from one page')
    director=listing('t_page_director')[0]
    translated(director['record']['intro_block'],'title','Fixture artistic director')
    translated(director['record'],'biography','First paragraph.\n\nSecond paragraph.')
    translated(director['record']['awards'][0],'description','An edited award.')
    director=save('t_page_director',director)
    assert director['record']['awards'][0]['description_en']=='An edited award.'
    assert director['record']['intro_block']['title_en']=='Fixture artistic director'
    print('PASS: director introduction, biography and award editing')
    remove('t_course',created)
    assert not any(item['record']['course']==created['record']['id'] for item in listing('t_course_section'))
    # Removing a credited team member must also remove their page-owned assignments.
    remove('t_staff',person)
    production=next(item for item in listing('t_play') if item['record']['id']==production['record']['id'])
    remove('t_play',production)
    assert not any(item['record']['play']==production['record']['id'] for item in listing('t_performance'))
    print('PASS: deleting a course, person or production cleans up its owned child records')


def disposable(source):
    global ORIGIN
    with tempfile.TemporaryDirectory(prefix='theater-content-') as tmp:
        base=pathlib.Path(tmp)
        data=base/'pb_data'
        data.mkdir()
        with sqlite3.connect(source.resolve().as_uri()+'?mode=ro',uri=True) as original, sqlite3.connect(data/'data.db') as clone:
            original.backup(clone)
        # Only content hooks: no cron jobs, external notifications or deployment triggers.
        hooks=base/'pb_hooks'
        hooks.mkdir()
        shutil.copytree(ROOT/'pb_hooks/lib',hooks/'lib')
        for name in ['theater_content.pb.js','theater_home.pb.js','museum_page.pb.js','mask_order.pb.js','theater_slug.pb.js','theater_course.pb.js','theater_staff_profile.pb.js']:
            if (ROOT/'pb_hooks'/name).exists(): shutil.copy(ROOT/'pb_hooks'/name,hooks/name)
        (base/'shared').symlink_to(ROOT/'shared',target_is_directory=True)
        (base/'pb_migrations').symlink_to(ROOT/'pb_migrations',target_is_directory=True)
        args=[str(ROOT/'pocketbase'),'--dir',str(data),'--migrationsDir',str(base/'pb_migrations'),'--hooksDir',str(hooks),'--hooksWatch=false']
        subprocess.run(args+['migrate','up'],check=True,capture_output=True)
        subprocess.run(args+['superuser','upsert','content-fixture@example.com',PASSWORD],check=True,capture_output=True)
        with sqlite3.connect(data/'data.db') as clone:
            clone.execute('UPDATE t_festival SET published=0')
        with socket.socket() as sock:
            sock.bind(('127.0.0.1',0))
            port=sock.getsockname()[1]
        ORIGIN=f'http://127.0.0.1:{port}'
        with (base/'server.log').open('w') as log:
            process=subprocess.Popen(args+['serve','--http',f'127.0.0.1:{port}'],stdout=log,stderr=log)
            try:
                for _ in range(100):
                    if process.poll() is not None: raise RuntimeError((base/'server.log').read_text())
                    try:
                        if request('GET','/api/health')[0]==200: break
                    except OSError: time.sleep(.05)
                run()
            finally:
                process.terminate()
                process.wait(timeout=10)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--database',type=pathlib.Path,default=ROOT/'pb_data/data.db')
    parser.add_argument('--existing',action='store_true')
    options=parser.parse_args()
    if options.existing: run()
    else: disposable(options.database)
