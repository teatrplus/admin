/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('t_blog_post')
    collection.fields.removeByName('sample')
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('t_blog_post')
    // Removed flags cannot be reconstructed; restored fields default to false.
    collection.fields.add(new BoolField({ name: 'sample' }))
    app.save(collection)
  },
)
