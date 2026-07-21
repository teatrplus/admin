/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_829252413")

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text774300842",
    "max": 0,
    "min": 0,
    "name": "telegramUsername",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_829252413")

  // remove field
  collection.fields.removeById("text774300842")

  return app.save(collection)
})
