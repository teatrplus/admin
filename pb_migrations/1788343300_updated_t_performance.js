/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1001558001")

  // update field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3063055763",
    "help": "",
    "hidden": false,
    "id": "relation3057528519",
    "maxSelect": 100,
    "minSelect": 0,
    "name": "roles",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1001558001")

  // update field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3063055763",
    "help": "",
    "hidden": false,
    "id": "relation3057528519",
    "maxSelect": 10,
    "minSelect": 0,
    "name": "roles",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
