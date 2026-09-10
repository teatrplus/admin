const { test } = require('node:test')
const assert = require('node:assert/strict')
global.BadRequestError = class extends Error {}
global.ApiError = class extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
const { revision, saveMaskOrder } = require('../pb_hooks/lib/mask_order.js')
const { canEditMuseum } = require('../pb_hooks/lib/museum_page.js')

const original = [
  { id: 'a', sort_order: 5, name_en: 'A' },
  { id: 'b', sort_order: 10, name_en: 'B' },
]
function database(failId) {
  let rows = structuredClone(original)
  return {
    rows: () => rows,
    runInTransaction(fn) {
      const draft = structuredClone(rows)
      fn({
        findAllRecords: () =>
          draft.map((row) => ({
            id: row.id,
            get: (key) => row[key],
            set: (key, value) => {
              row[key] = value
            },
            publicExport: () => ({ ...row }),
          })),
        save: (record) => {
          if (record.id === failId) throw new Error('Storage failure')
        },
      })
      rows = draft
    },
  }
}

test('persists a complete order without changing mask content', () => {
  const db = database()
  const result = saveMaskOrder(db, { ids: ['b', 'a'], revision: revision(original) })
  assert.deepEqual(result, [
    { ...original[1], sort_order: 0 },
    { ...original[0], sort_order: 1 },
  ])
  assert.equal(db.rows()[0].sort_order, 1)
})

test('rejects stale order or collection membership before writing', () => {
  for (const input of [
    { ids: ['b', 'a'], revision: 'stale' },
    { ids: ['b'], revision: revision(original) },
    { ids: ['b', 'unknown'], revision: revision(original) },
  ]) {
    const db = database()
    assert.throws(
      () => saveMaskOrder(db, input),
      (error) => error.status === 409,
    )
    assert.deepEqual(db.rows(), original)
  }
})

test('rejects duplicate and malformed IDs', () => {
  for (const ids of [['a', 'a'], [1, 'b'], null]) {
    const db = database()
    assert.throws(() => saveMaskOrder(db, { ids, revision: revision(original) }), BadRequestError)
    assert.deepEqual(db.rows(), original)
  }
})

test('rolls back all order changes if one record fails', () => {
  const db = database('a')
  assert.throws(() => saveMaskOrder(db, { ids: ['b', 'a'], revision: revision(original) }), /Storage failure/)
  assert.deepEqual(db.rows(), original)
})

test('museum permissions allow admins and reject other staff roles', () => {
  const staff = (role) => ({ collection: () => ({ name: '_user_staff' }), getString: () => role })
  assert.equal(canEditMuseum(staff('admin')), true)
  assert.equal(canEditMuseum(staff('manager')), false)
  assert.equal(canEditMuseum(null), false)
})
