const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

test('staff position migration preserves only administration and production translations', (t) => {
  const root = path.resolve(__dirname, '..')
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'theater-staff-position-'))
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }))
  const migrations = path.join(temporary, 'migrations')
  fs.mkdirSync(migrations)
  fs.writeFileSync(
    path.join(migrations, '1790294390_fixture.js'),
    `migrate((app) => {
    const collection = new Collection({ name: 't_staff', type: 'base', fields:
      ['role', 'education_en', 'quote_ru', ...['en', 'ru', 'uz'].map(locale => 'description_' + locale)].map(name => ({ name, type: 'text' }))
    })
    app.save(collection)
    for (const department of ['administration', 'production', 'actor', 'artistic_director', '']) {
      const record = new Record(collection)
      record.set('role', department)
      record.set('education_en', 'Education')
      record.set('quote_ru', 'Цитата')
      for (const locale of ['en', 'ru', 'uz']) record.set('description_' + locale, department + '-' + locale)
      app.save(record)
    }
  }, () => {})`,
  )
  fs.copyFileSync(
    path.join(root, 'pb_migrations/1790294400_staff_position.js'),
    path.join(migrations, '1790294400_staff_position.js'),
  )
  fs.writeFileSync(
    path.join(migrations, '1790294410_assertions.js'),
    `migrate((app) => {
    const collection = app.findCollectionByNameOrId('t_staff')
    for (const locale of ['en', 'ru', 'uz']) {
      if (collection.fields.getByName('description_' + locale)) throw new Error('Old field remains')
      if (!collection.fields.getByName('position_' + locale)) throw new Error('Position missing')
    }
    const records = app.findAllRecords('t_staff')
    if (records.length !== 5) throw new Error('Record count changed')
    for (const record of records) {
      const department = record.getString('role')
      for (const locale of ['en', 'ru', 'uz']) {
        const expected = ['administration', 'production'].includes(department) ? department + '-' + locale : ''
        if (record.getString('position_' + locale) !== expected) throw new Error('Wrong position: ' + department + '/' + locale)
      }
      if (record.getString('education_en') !== 'Education' || record.getString('quote_ru') !== 'Цитата') throw new Error('Unrelated data changed')
    }
  }, () => {})`,
  )
  const run = (direction) =>
    spawnSync(
      process.env.POCKETBASE_BINARY || path.join(root, 'pocketbase'),
      [
        'migrate',
        direction,
        '--dir=' + path.join(temporary, 'data'),
        '--migrationsDir=' + migrations,
        '--hooksDir=' + path.join(temporary, 'hooks'),
      ],
      { encoding: 'utf8', input: 'y\n' },
    )
  const up = run('up')
  assert.equal(up.status, 0, up.stdout + up.stderr)
})
