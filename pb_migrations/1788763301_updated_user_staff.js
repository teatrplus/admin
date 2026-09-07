/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_829252413")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_tokenKey_2m3lls7nll` ON `_user_staff` (`tokenKey`)",
      "CREATE UNIQUE INDEX `idx_email_2m3lls7nll` ON `_user_staff` (`email`) WHERE `email` != ''"
    ],
    "name": "_user_staff"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_829252413")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_tokenKey_2m3lls7nll` ON `user_staff` (`tokenKey`)",
      "CREATE UNIQUE INDEX `idx_email_2m3lls7nll` ON `user_staff` (`email`) WHERE `email` != ''"
    ],
    "name": "user_staff"
  }, collection)

  return app.save(collection)
})
