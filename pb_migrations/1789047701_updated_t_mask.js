/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_4060796684')

    // remove field
    collection.fields.removeById('text3073187962')

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_4060796684')

    // add field
    collection.fields.addAt(
      12,
      new Field({
        autogeneratePattern: '',
        help: '',
        hidden: false,
        id: 'text3073187962',
        max: 80,
        min: 0,
        name: 'legacy_slug',
        pattern: '',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text',
      }),
    )

    return app.save(collection)
  },
)
