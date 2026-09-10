const test = require('node:test')
const assert = require('node:assert/strict')
const { assign, slugify } = require('../pb_hooks/lib/theater_slug.js')
global.BadRequestError = class extends Error {}

function record(fields = {}, originalSlug = '') {
  return {
    id: fields.id || 'aaaaaaaaaaaaaaa',
    isNew: () => !originalSlug,
    collection: () => ({ name: fields.collection || 't_staff' }),
    getString: (key) => fields[key] || '',
    set: (key, value) => {
      fields[key] = value
    },
    original: () => ({ getString: () => originalSlug }),
  }
}
const app = (used = [], originalSlug = '') => ({
  findRecordById: () => ({ getString: () => originalSlug }),
  findRecordsByFilter: (_collection, _filter, _sort, _limit, _offset, params) =>
    used.includes(params.slug) ? [{}] : [],
})

test('English-first generation, transliteration and optional initial spelling', () => {
  assert.equal(slugify('Toy\r\nWorkshop'), 'toy-workshop')
  assert.equal(slugify('Zoë O‘Neill'), 'zoe-oneill')
  assert.equal(slugify('Антонов Артём'), 'antonov-artem')
  for (const [fields, expected] of [
    [{ collection: 't_play', title_en: 'Colors', title_ru: 'Краски' }, 'colors'],
    [{ collection: 't_mask', name_en: 'Still', name_ru: 'Долгий' }, 'still'],
    [{ collection: 't_mask', name_en: 'Tease' }, 'tease'],
    [{ collection: 't_course', title_en: 'Poetry School', title_ru: 'Школа поэзии' }, 'poetry-school'],
    [{ name_ru: 'Антонов Артём' }, 'antonov-artem'],
    [{ name_uz: 'O‘yinchoqlar ustaxonasi' }, 'oyinchoqlar-ustaxonasi'],
    [{ name_en: 'Antonov Artyom', slug: 'antonov-artem' }, 'antonov-artem'],
  ]) {
    const person = record(fields)
    assign(app(), person)
    assert.equal(person.getString('slug'), expected)
  }
})

test('existing URL survives name changes and attempts to clear or replace the slug', () => {
  for (const slug of ['', 'replacement']) {
    const person = record({ name_en: 'New Name', slug }, 'published-name')
    assign(app([], 'published-name'), person)
    assert.equal(person.getString('slug'), 'published-name')
  }
  const course = record({ collection: 't_course', title_en: 'Renamed course', slug: 'replacement' }, 'poetry-school')
  assign(app([], 'poetry-school'), course)
  assert.equal(course.getString('slug'), 'poetry-school')
})

test('new duplicate names get suffixes without changing the first person', () => {
  const person = record({ name_en: 'Same Name' })
  assign(app(['same-name', 'same-name-aaaaaaaaaaaaaaa']), person)
  assert.equal(person.getString('slug'), 'same-name-aaaaaaaaaaaaaaa-2')
})

test('existing mask addresses can change, normalize spelling and reject empty or duplicate addresses', () => {
  const mask = record({ collection: 't_mask', name_en: 'New name', slug: 'Edited Mask' }, 'original-mask')
  assign(app([], 'original-mask'), mask)
  assert.equal(mask.getString('slug'), 'edited-mask')
  for (const slug of ['', '!!!', 'taken']) {
    const invalid = record({ collection: 't_mask', slug }, 'original-mask')
    assert.throws(() => assign(app(['taken'], 'original-mask'), invalid), /empty|already in use/)
  }
  const renamed = record({ collection: 't_mask', name_en: 'Changed name', slug: 'original-mask' }, 'original-mask')
  assign(app([], 'original-mask'), renamed)
  assert.equal(renamed.getString('slug'), 'original-mask')
})

test('unnamed records and reserved routes remain valid and distinct', () => {
  for (const [name_en, expected] of [
    ['', 'person-aaaaaaaaaaaaaaa'],
    ['index', 'person-index'],
    ['bbbbbbbbbbbbbbb', 'person-bbbbbbbbbbbbbbb'],
  ]) {
    const person = record({ name_en })
    assign(app(), person)
    assert.equal(person.getString('slug'), expected)
  }
})
