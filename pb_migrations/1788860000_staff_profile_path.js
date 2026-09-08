/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId('t_staff')
  collection.fields.add(new TextField({
    name: 'profile_path',
    max: 200,
    pattern: '^(/[a-z0-9]+(-[a-z0-9]+)*)+/?$',
    help: 'Optional dedicated website page, e.g. /mikhail-doloko. Leave empty for the standard team profile. Use a path without a language prefix.',
  }))
  app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId('t_staff')
  collection.fields.removeByName('profile_path')
  app.save(collection)
})
