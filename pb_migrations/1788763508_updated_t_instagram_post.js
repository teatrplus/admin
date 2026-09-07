/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_instagram_post")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_instagram_post_instagramId` ON `t_instagram_post` (`instagram_id`)"
    ]
  }, collection)

  // update field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "help": "Instagram media id from Bright Data",
    "hidden": false,
    "id": "text3911028471",
    "max": 64,
    "min": 1,
    "name": "instagram_id",
    "pattern": "",
    "presentable": true,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "help": "",
    "hidden": false,
    "id": "date4149654991",
    "max": "",
    "min": "",
    "name": "posted_at",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "select3262944111",
    "maxSelect": 1,
    "name": "media_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "image",
      "video",
      "carousel"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_instagram_post")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_instagram_post_instagramId` ON `t_instagram_post` (`instagramId`)"
    ]
  }, collection)

  // update field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "help": "Instagram media id from Bright Data",
    "hidden": false,
    "id": "text3911028471",
    "max": 64,
    "min": 1,
    "name": "instagramId",
    "pattern": "",
    "presentable": true,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "help": "",
    "hidden": false,
    "id": "date4149654991",
    "max": "",
    "min": "",
    "name": "postedAt",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "select3262944111",
    "maxSelect": 1,
    "name": "mediaType",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "image",
      "video",
      "carousel"
    ]
  }))

  return app.save(collection)
})
