/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('t_mask')
    for (const locale of ['ru', 'en', 'uz']) {
      collection.fields.add(new TextField({ name: `origin_${locale}`, required: false }))
    }
    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('t_mask')
    for (const locale of ['ru', 'en', 'uz']) collection.fields.removeByName(`origin_${locale}`)
    return app.save(collection)
  },
)
