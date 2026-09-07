/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3911028472")

  // update collection data
  unmarshal({
    "name": "t_instagram_sync"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3911028472")

  // update collection data
  unmarshal({
    "name": "_instagram_sync"
  }, collection)

  return app.save(collection)
})
