/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3684452756')
    const fileField = collection.fields.getByName('file')
    if (fileField) {
      fileField.mimeTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/avif',
        'image/bmp',
        'image/svg+xml',
      ]
    }
    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3684452756')
    const fileField = collection.fields.getByName('file')
    if (fileField) {
      fileField.mimeTypes = null
    }
    return app.save(collection)
  },
)
