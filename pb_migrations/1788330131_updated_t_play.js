/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3555510918")

  // add field
  collection.fields.addAt(16, new Field({
    "exceptDomains": null,
    "help": "",
    "hidden": false,
    "id": "url3986445568",
    "name": "ticket_purchase_url",
    "onlyDomains": null,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "url"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3555510918")

  // remove field
  collection.fields.removeById("url3986445568")

  return app.save(collection)
})
