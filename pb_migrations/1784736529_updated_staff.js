/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_829252413")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_tokenKey_2m3lls7nll` ON `staff` (`tokenKey`)",
      "CREATE UNIQUE INDEX `idx_email_2m3lls7nll` ON `staff` (`email`) WHERE `email` != ''"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_829252413")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_tokenKey_2m3lls7nll` ON `staff` (`tokenKey`)",
      "CREATE UNIQUE INDEX `idx_email_2m3lls7nll` ON `staff` (`email`) WHERE `email` != ''",
      "CREATE UNIQUE INDEX `idx_q1tlxepr8j` ON `staff` (`phoneNumber`)"
    ]
  }, collection)

  return app.save(collection)
})
