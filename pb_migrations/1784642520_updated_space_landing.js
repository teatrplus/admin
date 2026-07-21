/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2249861164")

  // remove field
  collection.fields.removeById("text2942233724")

  // remove field
  collection.fields.removeById("text2832604259")

  // add field
  collection.fields.addAt(8, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_829252413",
    "help": "",
    "hidden": false,
    "id": "relation3483911088",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "headerPhoneManager",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(9, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_829252413",
    "help": "",
    "hidden": false,
    "id": "relation1415909401",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "telegramManager",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(6, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_829252413",
    "help": "",
    "hidden": false,
    "id": "relation3193455276",
    "maxSelect": 10,
    "minSelect": 0,
    "name": "footerContactManagers",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2249861164")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text2942233724",
    "max": 0,
    "min": 0,
    "name": "headerPhoneNumber",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text2832604259",
    "max": 0,
    "min": 0,
    "name": "telegramManagerUrl",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("relation3483911088")

  // remove field
  collection.fields.removeById("relation1415909401")

  // update field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_829252413",
    "help": "",
    "hidden": false,
    "id": "relation3193455276",
    "maxSelect": 10,
    "minSelect": 0,
    "name": "contactManagers",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
