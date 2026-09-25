/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('t_staff')
    // These are new biographies; the former text descriptions are now positions.
    for (const locale of ['en', 'ru', 'uz']) {
      collection.fields.add(new JSONField({ name: `description_${locale}`, required: false, maxSize: 1000000 }))
    }
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('t_staff')
    for (const locale of ['en', 'ru', 'uz']) collection.fields.removeByName(`description_${locale}`)
    app.save(collection)
  },
)
