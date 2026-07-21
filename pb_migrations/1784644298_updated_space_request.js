/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1387751846")

  // update field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text2497600358",
    "max": 0,
    "min": 0,
    "name": "clientName",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text2648555786",
    "max": 0,
    "min": 0,
    "name": "clientPhoneNumber",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "help": "",
    "hidden": false,
    "id": "date4149654986",
    "max": "",
    "min": "",
    "name": "dateRequested",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "date"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "select3262944105",
    "maxSelect": 0,
    "name": "stage",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "inquiry",
      "confirmed",
      "rejected",
      "preparation",
      "completed",
      "cancelled"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1387751846")

  // update field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text2497600358",
    "max": 0,
    "min": 0,
    "name": "clientName",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text2648555786",
    "max": 0,
    "min": 0,
    "name": "clientPhoneNumber",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "help": "",
    "hidden": false,
    "id": "date4149654986",
    "max": "",
    "min": "",
    "name": "dateRequested",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "select3262944105",
    "maxSelect": 0,
    "name": "stage",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "inquiry",
      "confirmed",
      "rejected",
      "preparation",
      "completed",
      "cancelled"
    ]
  }))

  return app.save(collection)
})
