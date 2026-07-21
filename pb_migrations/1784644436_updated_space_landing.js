/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2249861164")

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1468864550",
    "help": "",
    "hidden": false,
    "id": "relation2442205965",
    "maxSelect": 10,
    "minSelect": 0,
    "name": "venueItems",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2683434894",
    "help": "",
    "hidden": false,
    "id": "relation3136737876",
    "maxSelect": 10,
    "minSelect": 0,
    "name": "advantageItems",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3684452756",
    "help": "",
    "hidden": false,
    "id": "relation1194031162",
    "maxSelect": 10,
    "minSelect": 0,
    "name": "galleryItems",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2808787757",
    "help": "",
    "hidden": false,
    "id": "relation2250053782",
    "maxSelect": 10,
    "minSelect": 0,
    "name": "processItems",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
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
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2249861164")

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1468864550",
    "help": "",
    "hidden": false,
    "id": "relation2442205965",
    "maxSelect": 10,
    "minSelect": 0,
    "name": "venueItems",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2683434894",
    "help": "",
    "hidden": false,
    "id": "relation3136737876",
    "maxSelect": 10,
    "minSelect": 0,
    "name": "advantageItems",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3684452756",
    "help": "",
    "hidden": false,
    "id": "relation1194031162",
    "maxSelect": 10,
    "minSelect": 0,
    "name": "galleryItems",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2808787757",
    "help": "",
    "hidden": false,
    "id": "relation2250053782",
    "maxSelect": 10,
    "minSelect": 0,
    "name": "processItems",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
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

  return app.save(collection)
})
