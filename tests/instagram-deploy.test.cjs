const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')

const source = fs.readFileSync(path.join(__dirname, '../pb_hooks/lib/instagram_refresh.js'), 'utf8')

const refreshFixture = ({ origin = 'manual', progress = 'ready', empty = false, deployStatus = 200 } = {}) => {
  const record = (data) => ({
    getString: (key) => String(data[key] || ''),
    getInt: (key) => Number(data[key] || 0),
    getDateTime: () => undefined,
    set: (key, value) => {
      data[key] = value
    },
  })
  const sync = record({ status: 'running', snapshot_id: 'snapshot', source: origin })
  const post = record({ instagram_id: 'post', image: 'existing.webp' })
  const events = []
  const warnings = []
  const deployUrl = 'https://deploy.example/theater'
  const context = {
    module: { exports: {} },
    __hooks: '/hooks',
    DateTime: class {},
    require: () => ({
      readEnv: (key) =>
        ({
          BRIGHTDATA_API_TOKEN: 'test-token',
          WEBSITE_PAGES_DEPLOY_HOOK_URL: deployUrl,
        })[key] || '',
    }),
    $app: {
      findRecordById: () => sync,
      findCollectionByNameOrId: () => ({}),
      findFirstRecordByData: () => post,
      findAllRecords: () => [post],
      save: (saved) => events.push(saved === post ? 'post saved' : `sync ${sync.getString('status')}`),
      logger: () => ({ info: () => {}, error: () => {}, warn: (...args) => warnings.push(args) }),
    },
    $http: {
      send: ({ url, method }) => {
        if (url.includes('/progress/')) return { statusCode: 200, json: { status: progress } }
        if (url.includes('/snapshot/'))
          return {
            statusCode: 200,
            json: empty
              ? []
              : [
                  {
                    id: 'post',
                    url: 'https://www.instagram.com/p/post/',
                    image_url: 'https://images.example/post.webp',
                    caption: 'Updated caption',
                  },
                ],
          }
        assert.equal(url, deployUrl, 'Only the theater hook may be called')
        assert.equal(method, 'POST')
        events.push('website deploy')
        return { statusCode: deployStatus }
      },
    },
  }
  vm.runInNewContext(source, context)
  return { tick: context.module.exports.tickInstagramRefresh, events, warnings }
}

for (const origin of ['manual', 'cron']) {
  test(`${origin} Instagram refresh rebuilds the website once after posts are saved`, () => {
    const { tick, events } = refreshFixture({ origin })
    assert.equal(tick().body.status, 'success')
    assert.deepEqual(events, ['post saved', 'sync success', 'website deploy'])
    tick()
    assert.equal(events.filter((event) => event === 'website deploy').length, 1)
  })
}

test('running and failed Instagram refreshes never request a website rebuild', () => {
  for (const options of [{ progress: 'running' }, { progress: 'failed' }, { empty: true }]) {
    const { tick, events } = refreshFixture(options)
    assert.notEqual(tick().body.status, 'success')
    assert.ok(!events.includes('website deploy'))
  }
})

test('a rejected website hook preserves saved Instagram posts and logs the failure', () => {
  const { tick, events, warnings } = refreshFixture({ deployStatus: 503 })
  assert.equal(tick().body.status, 'success')
  assert.deepEqual(events, ['post saved', 'sync success', 'website deploy'])
  assert.ok(warnings.some(([message]) => message === 'website deploy hook failed'))
})
