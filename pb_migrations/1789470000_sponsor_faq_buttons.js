/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('_copy_block')
    collection.fields.add(
      new RelationField({
        name: 'button',
        collectionId: app.findCollectionByNameOrId('_button').id,
        required: false,
        maxSelect: 1,
        cascadeDelete: false,
      }),
    )
    return app.save(collection)
  },
  () => {
    // Preserve optional button selections and their content on rollback.
  },
)
