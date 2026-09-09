/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('t_partner')
    collection.listRule = 'is_hidden = false'
    collection.viewRule = 'is_hidden = false'
    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('t_partner')
    collection.listRule = null
    collection.viewRule = null
    return app.save(collection)
  },
)
