/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const { assign } = require(`${__hooks}/lib/theater_slug.js`)
  for (const name of ['t_staff', 't_play']) {
    const collection = app.findCollectionByNameOrId(name)
    collection.fields.add(new TextField({ name: 'slug', max: 200, pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' }))
    app.save(collection)

    for (const record of app.findAllRecords(name)) {
      // Preserve the already chosen public spelling during this one-time backfill.
      if (name === 't_staff' && record.id === 'a4268c42c7d9f2e') record.set('slug', 'antonov-artem')
      assign(app, record)
      app.save(record)
    }

    collection.fields.getByName('slug').required = true
    collection.indexes.push(`CREATE UNIQUE INDEX idx_${name}_slug ON ${name} (slug)`)
    app.save(collection)
  }
}, (app) => {
  for (const name of ['t_staff', 't_play']) {
    const collection = app.findCollectionByNameOrId(name)
    collection.indexes = collection.indexes.filter((index) => !index.includes(`idx_${name}_slug`))
    collection.fields.removeByName('slug')
    app.save(collection)
  }
})
