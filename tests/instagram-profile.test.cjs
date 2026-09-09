const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const path = require('node:path')

const context = {
  module: { exports: {} },
  __hooks: '/hooks',
  require: () => ({
    readEnv: () => {
      throw new Error('Profile must not use environment configuration')
    },
  }),
}
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../pb_hooks/lib/instagram_refresh.js'), 'utf8'), context)
const { readInstagramProfileUrl } = context.module.exports
const app = (urls) => ({
  findRecordsByFilter: (collection) => {
    assert.equal(collection, 't_contact')
    return urls.map((url) => ({
      getString: (field) => {
        assert.equal(field, 'instagram_url')
        return url
      },
    }))
  },
})

test('refresh derives its source from the current contact URL on each call', () => {
  assert.equal(
    readInstagramProfileUrl(app(['https://www.instagram.com/teatr__plus/'])),
    'https://www.instagram.com/teatr__plus/',
  )
  assert.equal(
    readInstagramProfileUrl(app(['https://instagram.com/another.theater/?hl=en'])),
    'https://www.instagram.com/another.theater/',
  )
})

test('missing, ambiguous, non-profile and foreign URLs fail without a hardcoded fallback', () => {
  for (const urls of [
    [],
    ['', ''],
    [''],
    ['https://example.com/teatr__plus/'],
    ['https://instagram.com.evil.test/teatr__plus/'],
    ['https://instagram.com/p/'],
    ['https://instagram.com/reel/abc/'],
    ['javascript:alert(1)'],
  ]) {
    assert.throws(() => readInstagramProfileUrl(app(urls)))
  }
})
