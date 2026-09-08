const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

test('staff profile migrations seed one director and restrict overrides to local paths', (t) => {
  const root = path.resolve(__dirname, '..')
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'theater-staff-profile-'))
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }))
  const migrations = path.join(temporary, 'migrations')
  fs.mkdirSync(migrations)
  fs.writeFileSync(
    path.join(migrations, '1788859990_fixture.js'),
    `migrate((app) => {
    const staff = new Collection({ name: 't_staff', type: 'base', fields: [
      ...['slug', 'gender', ...['en', 'ru', 'uz'].flatMap(locale => ['name_' + locale, 'description_' + locale])].map(name => ({ name, type: 'text' })),
      { name: 'role', type: 'select', maxSelect: 1, values: ['actor', 'production', 'administration'] }
    ] })
    app.save(staff)
    const other = new Record(staff)
    other.set('id', 'existingstaff01')
    other.set('name_en', 'Existing colleague')
    other.set('role', 'actor')
    app.save(other)
    const roles = new Collection({ name: 't_role', type: 'base', fields: ['type', 'name_en', 'name_ru', 'name_uz'].map(name => ({ name, type: 'text' })) })
    app.save(roles)
    app.save(new Collection({ name: 't_staff_role', type: 'base', fields: [
      { name: 'staff', type: 'relation', collectionId: staff.id, maxSelect: 1, required: true },
      { name: 'role', type: 'relation', collectionId: roles.id, maxSelect: 1, required: true }
    ] }))
  }, () => {})`,
  )
  for (const file of [
    '1788860000_staff_profile_path.js',
    '1788860010_seed_mikhail_doloko.js',
    '1788860040_artistic_director_department.js',
  ]) {
    fs.copyFileSync(path.join(root, 'pb_migrations', file), path.join(migrations, file))
  }
  // Execute the seed a second time to verify it reuses all three records.
  fs.copyFileSync(
    path.join(root, 'pb_migrations/1788860010_seed_mikhail_doloko.js'),
    path.join(migrations, '1788860020_repeat_seed.js'),
  )
  fs.writeFileSync(
    path.join(migrations, '1788860050_assertions.js'),
    `migrate((app) => {
    if (app.countRecords('t_staff') !== 2 || app.countRecords('t_role') !== 1 || app.countRecords('t_staff_role') !== 1) throw new Error('Missing or duplicate seed records')
    const person = app.findRecordById('t_staff', 'mikhaildoloko01')
    if (person.getString('role') !== 'artistic_director') throw new Error('Director has no separate department')
    if (person.getString('profile_path') !== '/mikhail-doloko') throw new Error('Missing dedicated path')
    if (person.getString('name_ru') !== 'Михаил Долоко') throw new Error('Missing localized name')
    const assignment = app.findRecordById('t_staff_role', 'dolokoartdir001')
    const role = app.findRecordById('t_role', assignment.getString('role'))
    if (assignment.getString('staff') !== person.id || role.getString('name_ru') !== 'Художественный руководитель') throw new Error('Incorrect role assignment')
    const other = app.findRecordById('t_staff', 'existingstaff01')
    if (other.getString('role') !== 'actor' || other.getString('profile_path') || other.getString('name_en') !== 'Existing colleague') throw new Error('Existing staff changed')
    for (const invalid of ['https://example.com', '//example.com', '/foo/../bar', '/foo?bar', '/foo#bar']) {
      person.set('profile_path', invalid)
      let rejected = false
      try { app.save(person) } catch { rejected = true }
      if (!rejected) throw new Error('Accepted invalid path: ' + invalid)
    }
    for (const valid of ['', '/custom-profile', '/about/director/']) {
      person.set('profile_path', valid)
      app.save(person)
    }
  }, () => {})`,
  )
  const result = spawnSync(
    process.env.POCKETBASE_BINARY || path.join(root, 'pocketbase'),
    [
      'migrate',
      'up',
      `--dir=${path.join(temporary, 'data')}`,
      `--migrationsDir=${migrations}`,
      `--hooksDir=${path.join(temporary, 'hooks')}`,
    ],
    { encoding: 'utf8' },
  )
  assert.equal(result.status, 0, result.stdout + result.stderr)
})
