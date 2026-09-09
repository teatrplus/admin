const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawn, spawnSync } = require('node:child_process')
const net = require('node:net')

// Exercise real PocketBase validation and anonymous API rules in a disposable database.
test('course migrations preserve URLs and enforce publication and write permissions', { timeout: 30000 }, async (t) => {
  const root = path.resolve(__dirname, '..')
  const binary = process.env.POCKETBASE_BINARY || path.join(root, 'pocketbase')
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'theater-course-test-'))
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }))
  const migrations = path.join(temporary, 'migrations')
  const hooks = path.join(temporary, 'hooks')
  fs.mkdirSync(migrations)
  fs.mkdirSync(path.join(hooks, 'lib'), { recursive: true })
  for (const file of ['theater_slug.pb.js', 'lib/theater_slug.js'])
    fs.copyFileSync(path.join(root, 'pb_hooks', file), path.join(hooks, file))
  for (const file of [
    '1788800800_theater_courses.js',
    '1788800810_seed_theater_courses.js',
    '1788950000_course_media_sections.js',
  ])
    fs.copyFileSync(path.join(root, 'pb_migrations', file), path.join(migrations, file))
  fs.writeFileSync(
    path.join(migrations, '1788800790_fixture.js'),
    `migrate((app) => {
    const staff = new Collection({ name: 't_staff', type: 'base', listRule: '', viewRule: '', fields: [{ type: 'text', name: 'name_en' }, { type: 'text', name: 'slug' }] })
    app.save(staff)
    const person = new Record(staff)
    person.set('id', '0e23f88702e8a8c')
    person.set('name_en', 'Sherzod Sismatov')
    app.save(person)
    app.save(new Collection({ name: 't_media_library', type: 'base', fields: [] }))
  }, () => {})`,
  )
  fs.writeFileSync(
    path.join(migrations, '1788800820_assertions.js'),
    `migrate((app) => {
    if (app.countRecords('t_course') !== 4 || app.countRecords('t_course_section') !== 14) throw new Error('Incomplete seed')
    const original = app.findFirstRecordByData('t_course', 'slug', 'acting')
    original.set('title_en', 'A renamed acting course')
    original.set('slug', 'overwrite-url')
    app.save(original)
    if (app.findRecordById('t_course', original.id).getString('slug') !== 'acting') throw new Error('Published URL changed')
    const draft = new Record(app.findCollectionByNameOrId('t_course'))
    draft.set('id', 'testdraftcourse')
    draft.set('title_en', 'Private draft')
    draft.set('enrollment_status', 'closed')
    app.save(draft)
    if (draft.getString('slug') !== 'private-draft') throw new Error('Course slug generation failed')
    const section = new Record(app.findCollectionByNameOrId('t_course_section'))
    section.set('id', 'testdraftsect01')
    section.set('course', draft.id)
    section.set('kind', 'program')
    section.set('title_ru', 'Private programme')
    app.save(section)
    const duplicate = new Record(app.findCollectionByNameOrId('t_course'))
    duplicate.set('title_en', 'A second acting course')
    duplicate.set('slug', 'acting')
    duplicate.set('enrollment_status', 'enquire')
    app.save(duplicate)
    if (duplicate.getString('slug') === 'acting') throw new Error('Slug collision was not resolved')
  }, () => {})`,
  )
  fs.writeFileSync(
    path.join(migrations, '1788950010_media_assertions.js'),
    `migrate((app) => {
      const collection = app.findCollectionByNameOrId('t_course_section')
      const course = app.findFirstRecordByData('t_course', 'slug', 'acting')
      const photo = new Record(app.findCollectionByNameOrId('t_media_library'))
      app.save(photo)
      const gallery = new Record(collection)
      gallery.set('course', course.id)
      gallery.set('kind', 'gallery')
      gallery.set('gallery', [photo.id])
      app.save(gallery)
      const teaser = new Record(collection)
      teaser.set('course', course.id)
      teaser.set('kind', 'teaser')
      teaser.set('teaser_url', 'https://youtu.be/abcdefghijk?t=30')
      app.save(teaser)
      teaser.set('teaser_url', 'https://example.com/video')
      let rejected = false
      try { app.save(teaser) } catch (_) { rejected = true }
      if (!rejected) throw new Error('Non-YouTube teaser was accepted')
      const privateTeaser = new Record(collection)
      privateTeaser.set('id', 'privateteaser01')
      privateTeaser.set('course', 'testdraftcourse')
      privateTeaser.set('kind', 'teaser')
      privateTeaser.set('teaser_url', 'https://www.youtube.com/watch?v=abcdefghijk')
      app.save(privateTeaser)
    }, () => {})`,
  )
  const args = [`--dir=${path.join(temporary, 'data')}`, `--migrationsDir=${migrations}`, `--hooksDir=${hooks}`]
  const migrate = spawnSync(binary, ['migrate', 'up', ...args], { encoding: 'utf8' })
  assert.equal(migrate.status, 0, migrate.stdout + migrate.stderr)
  const repeated = spawnSync(binary, ['migrate', 'up', ...args], { encoding: 'utf8' })
  assert.equal(repeated.status, 0, repeated.stdout + repeated.stderr)

  const port = await new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const port = probe.address().port
      probe.close(() => resolve(port))
    })
  })
  const server = spawn(binary, ['serve', ...args, `--http=127.0.0.1:${port}`], { stdio: 'ignore' })
  t.after(async () => {
    if (server.exitCode === null)
      await new Promise((resolve) => {
        server.once('exit', resolve)
        server.kill('SIGTERM')
      })
  })
  const base = `http://127.0.0.1:${port}/api`
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`${base}/health`)).ok) {
        ready = true
        break
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  assert.ok(ready, 'Temporary PocketBase server did not start')
  const get = async (resource) => fetch(`${base}/collections/${resource}`)
  const courses = await (await get('t_course/records?expand=teachers.staff')).json()
  assert.equal(courses.totalItems, 4)
  assert.ok(courses.items.every((course) => course.published && !('source_url' in course)))
  assert.ok(
    courses.items.every((course) =>
      ['ru', 'en', 'uz'].every((locale) => course[`title_${locale}`] && course[`description_${locale}`]),
    ),
  )
  const acting = courses.items.find((course) => course.slug === 'acting')
  assert.equal(acting.expand.teachers[0].expand.staff.id, '0e23f88702e8a8c')
  assert.equal(courses.items.find((course) => course.slug === 'speak-with-confidence').enrollment_status, 'waitlist')
  const sections = await (await get('t_course_section/records')).json()
  assert.equal(sections.totalItems, 16)
  assert.equal(sections.items.find((section) => section.kind === 'gallery').gallery.length, 1)
  assert.equal(
    sections.items.find((section) => section.kind === 'teaser').teaser_url,
    'https://youtu.be/abcdefghijk?t=30',
  )
  assert.equal((await get('t_course_section/records/privateteaser01')).status, 404)
  assert.equal((await get('t_course/records/testdraftcourse')).status, 404)
  assert.equal((await get('t_course_section/records/testdraftsect01')).status, 404)
  for (const collection of ['t_course', 't_course_teacher', 't_course_section']) {
    const response = await fetch(`${base}/collections/${collection}/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    assert.equal(response.status, 403, `${collection} must reject anonymous writes`)
  }
})
