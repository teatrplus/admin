/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const names = ['t_play', 't_performance', 't_staff', 't_role', 't_staff_role']

    for (const name of names) {
      const collection = app.findCollectionByNameOrId(name)
      collection.listRule = ''
      collection.viewRule = ''
      app.save(collection)
    }
  },
  (app) => {
    const names = ['t_play', 't_performance', 't_staff', 't_role', 't_staff_role']

    for (const name of names) {
      const collection = app.findCollectionByNameOrId(name)
      collection.listRule = null
      collection.viewRule = null
      app.save(collection)
    }
  },
)
