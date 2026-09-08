/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('t_inquiry')
    collection.fields.getByName('email').required = false
    collection.fields.getByName('message').required = true
    collection.createRule = "@request.body.status = 'to-do' && (email != '' || phone != '')"
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('t_inquiry')
    // Existing phone-only correspondence must remain valid after rollback.
    collection.fields.getByName('message').required = false
    collection.createRule = "@request.body.status = 'to-do'"
    app.save(collection)
  },
)
