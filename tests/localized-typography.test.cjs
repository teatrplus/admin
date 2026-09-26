const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync, spawn } = require('node:child_process')
const { formatText, formatDocument } = require('../shared/localized-typography-v2.js')

const examples = [
  ['en', `She said, "I heard him shout, 'Stop!'"`, 'She said, “I heard him shout, ‘Stop!’”'],
  ['ru', 'Он сказал: «Она назвала это „хорошей идеей“».', 'Он сказал: «Она назвала это „хорошей идеей“».'],
  ['ru', `Он сказал: "Она назвала это 'хорошей идеей'".`, 'Он сказал: «Она назвала это „хорошей идеей“».'],
  ['uz', `U dedi: "Bu 'yangi usul' ancha qulay."`, 'U dedi: “Bu ‘yangi usul’ ancha qulay.”'],
  ['ru', '“Внешняя «внутренняя» цитата”', '«Внешняя „внутренняя“ цитата»'],
  ['en', '«Outer „inner“ quote»', '“Outer ‘inner’ quote”'],
  ['en', '«one» and "two"', '“one” and “two”'],
  ['ru', '"Он сказал "Стоп!" и ушёл"', '«Он сказал „Стоп!“ и ушёл»'],
  ['en', `Don't change actors' names or O'Neill; "it's fine".`, `Don't change actors' names or O'Neill; “it's fine”.`],
  [
    'uz',
    `O'zbek, o‘g‘il, g’oya, san'at, ma’no, mo‘jiza: "g'oya".`,
    `O'zbek, o‘g‘il, g’oya, san'at, ma’no, mo‘jiza: “g'oya”.`,
  ],
  [
    'en',
    '5" screen (parentheses) [brackets] and an unmatched "quote',
    '5" screen (parentheses) [brackets] and an unmatched "quote',
  ],
  [
    'en',
    'Mikhail Doloko / DOLOKO / doloko / DoLoKo / Dolóko / Dolóko',
    'Mikhail Dolóko / DOLÓKO / dolóko / DoLóKo / Dolóko / Dolóko',
  ],
  ['ru', 'Михаил Долоко / ДОЛОКО / долоко / Долóко', 'Михаил Долóко / ДОЛÓКО / долóко / Долóко'],
  ['ru', 'Доло́ко / ДОЛО́КО / Долóко / ДОЛÓКО', 'Долóко / ДОЛÓКО / Долóко / ДОЛÓКО'],
  ['uz', 'Mixail Doloko — Долоко', 'Mixail Dolóko — Долóко'],
  ['en', 'Dolokov, NotDoloko, Doloko123, Долоков', 'Dolokov, NotDoloko, Doloko123, Долоков'],
  ['en', 'Doloko: https://example.org/Doloko?q="raw"', 'Dolóko: https://example.org/Doloko?q="raw"'],
]

test('localized quotes and surname stress are correct and idempotent', () => {
  for (const [locale, input, expected] of examples) {
    assert.equal(formatText(input, locale), expected, `${locale}: ${input}`)
    assert.equal(formatText(expected, locale), expected, `repeat ${locale}: ${expected}`)
  }
})

test('rich text preserves structure and attributes while formatting across inline marks', () => {
  const doc = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: '"Mikhail Do' },
          { type: 'text', text: 'lo', marks: [{ type: 'bold' }] },
          { type: 'text', text: 'ko says ' },
          {
            type: 'text',
            text: "'hello'",
            marks: [{ type: 'link', attrs: { href: 'https://example.com/Doloko?q="raw"' } }],
          },
          { type: 'text', text: '"' },
        ],
      },
      { type: 'paragraph', content: [{ type: 'text', text: 'Doloko "code"', marks: [{ type: 'code' }] }] },
      { type: 'codeBlock', content: [{ type: 'text', text: 'Doloko "code"' }] },
    ],
  }
  const before = JSON.stringify(doc)
  const formatted = formatDocument(doc, 'ru')
  assert.equal(formatted.content[0].content.map((node) => node.text).join(''), '«Mikhail Dolóko says „hello“»')
  assert.equal(formatted.content[0].content[1].text, 'ló')
  assert.deepEqual(formatted.content[0].content[3].marks, doc.content[0].content[3].marks)
  assert.deepEqual(formatted.content.slice(1), doc.content.slice(1))
  assert.equal(JSON.stringify(doc), before)
  assert.deepEqual(formatDocument(formatted, 'ru'), formatted)
  assert.deepEqual(formatDocument({ arbitrary: 'Doloko "data"' }, 'ru'), { arbitrary: 'Doloko "data"' })
})

test('PocketBase migration paginates and save hooks normalize creates and updates', async (t) => {
  const root = path.resolve(__dirname, '..')
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'theater-typography-'))
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }))
  for (const directory of ['pb_hooks', 'pb_migrations', 'shared', 'empty-hooks'])
    fs.mkdirSync(path.join(temporary, directory))
  fs.copyFileSync(
    path.join(root, 'shared/localized-typography-v2.js'),
    path.join(temporary, 'shared/localized-typography-v2.js'),
  )
  fs.copyFileSync(
    path.join(root, 'pb_hooks/localized_typography.pb.js'),
    path.join(temporary, 'pb_hooks/localized_typography.pb.js'),
  )
  fs.writeFileSync(
    path.join(temporary, 'pb_migrations/1000000000_fixture.js'),
    `migrate((app) => {
    const collection = new Collection({ name: 'typography_fixture', type: 'base',
      listRule: '', viewRule: '', createRule: '', updateRule: '',
      fields: [
        ...['name_en', 'name_ru', 'name_uz', 'slug', 'url'].map(name => ({name, type: 'text'})),
        {name: 'body_ru', type: 'json'}, {name: 'metadata_en', type: 'json'}
      ]
    })
    app.save(collection)
    for (let index = 0; index < 205; index++) {
      const record = new Record(collection)
      record.set('name_en', '"Doloko"')
      record.set('name_ru', '"Долоко"')
      record.set('name_uz', '"DOLOKO"')
      record.set('slug', 'mikhail-doloko')
      record.set('url', 'https://example.com/Doloko?q="raw"')
      record.set('body_ru', {type: 'doc', content: [{type:'paragraph',content:[{type:'text',text:'"Долоко"'}]}]})
      record.set('metadata_en', { label: 'Doloko "metadata"' })
      app.save(record)
    }
  }, () => {})`,
  )
  const binary = process.env.POCKETBASE_BINARY || path.join(root, 'pocketbase')
  const args = [`--dir=${temporary}/data`, `--migrationsDir=${temporary}/pb_migrations`]
  const run = (extra, hooks = 'pb_hooks') => {
    const result = spawnSync(binary, [...extra, ...args, `--hooksDir=${temporary}/${hooks}`], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.doesNotMatch(result.stdout + result.stderr, /Error:|failed to apply migration/)
    return result
  }
  run(['migrate', 'up'], 'empty-hooks')
  fs.copyFileSync(
    path.join(root, 'pb_migrations/1790410000_localized_typography.js'),
    path.join(temporary, 'pb_migrations/1790410000_localized_typography.js'),
  )
  fs.copyFileSync(
    path.join(root, 'shared/localized-typography-v1.js'),
    path.join(temporary, 'shared/localized-typography-v1.js'),
  )
  run(['migrate', 'up'])
  fs.copyFileSync(
    path.join(root, 'pb_migrations/1790410100_literal_surname_accent.js'),
    path.join(temporary, 'pb_migrations/1790410100_literal_surname_accent.js'),
  )
  run(['migrate', 'up'])
  fs.writeFileSync(
    path.join(temporary, 'pb_migrations/1790410101_assertions.js'),
    `migrate((app) => {
    const typography = require(__hooks + '/../shared/localized-typography-v2.js')
    const records = app.findAllRecords('typography_fixture')
    if (records.length !== 205) throw new Error('Record count changed')
    for (const record of records) {
      if (record.getString('name_en') !== '“Dolóko”' || record.getString('name_ru') !== '«Долóко»' || record.getString('name_uz') !== '“DOLÓKO”') throw new Error('Migration missed text: ' + record.getString('name_en'))
      if (JSON.parse(record.getString('body_ru')).content[0].content[0].text !== '«Долóко»') throw new Error('Migration missed rich text')
      if (record.getString('slug') !== 'mikhail-doloko' || record.getString('url') !== 'https://example.com/Doloko?q="raw"') throw new Error('Technical field changed')
      if (JSON.parse(record.getString('metadata_en')).label !== 'Doloko "metadata"') throw new Error('Arbitrary JSON changed')
      if (typography.normalizeRecord(record)) throw new Error('Second normalization changed record')
    }
  }, () => {})`,
  )
  run(['migrate', 'up'])

  // Real HTTP saves exercise hook registration, not a mock of PocketBase's lifecycle.
  const net = require('node:net')
  const listener = net.createServer()
  await new Promise((resolve) => listener.listen(0, '127.0.0.1', resolve))
  const port = listener.address().port
  await new Promise((resolve) => listener.close(resolve))
  const origin = `http://127.0.0.1:${port}`
  const server = spawn(binary, ['serve', ...args, `--hooksDir=${temporary}/pb_hooks`, `--http=127.0.0.1:${port}`])
  let logs = ''
  server.stdout.on('data', (data) => {
    logs += data
  })
  server.stderr.on('data', (data) => {
    logs += data
  })
  t.after(async () => {
    if (server.exitCode === null) {
      server.kill()
      await new Promise((resolve) => server.once('exit', resolve))
    }
  })
  let ready = false
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      ready = (await fetch(origin + '/api/health')).ok
    } catch {}
    if (ready || server.exitCode !== null) break
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  assert.ok(ready, logs)
  const endpoint = origin + '/api/collections/typography_fixture/records'
  const create = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name_en: '"Doloko"', name_ru: '"Долоко"', name_uz: '"DOLOKO"' }),
  })
  const created = await create.json()
  assert.equal(create.status, 200, JSON.stringify(created) + logs)
  assert.equal(created.name_en, '“Dolóko”')
  assert.equal(created.name_ru, '«Долóко»')
  assert.equal(created.name_uz, '“DOLÓKO”')
  const update = await fetch(endpoint + '/' + created.id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name_en: `Doloko said "a 'new' method".` }),
  })
  const updated = await update.json()
  assert.equal(update.status, 200, JSON.stringify(updated) + logs)
  assert.equal(updated.name_en, 'Dolóko said “a ‘new’ method”.')
  assert.equal((await (await fetch(endpoint + '/' + created.id)).json()).name_en, updated.name_en)
})
