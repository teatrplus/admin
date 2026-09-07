/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1347229479")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_tokenKey_xok6jblw9k` ON `_user_system` (`tokenKey`)",
      "CREATE UNIQUE INDEX `idx_email_xok6jblw9k` ON `_user_system` (`email`) WHERE `email` != ''"
    ],
    "name": "_user_system"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1347229479")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_tokenKey_xok6jblw9k` ON `user_system` (`tokenKey`)",
      "CREATE UNIQUE INDEX `idx_email_xok6jblw9k` ON `user_system` (`email`) WHERE `email` != ''"
    ],
    "name": "user_system"
  }, collection)

  return app.save(collection)
})
