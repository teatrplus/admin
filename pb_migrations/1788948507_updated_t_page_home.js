/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2374593160')

    // add field
    collection.fields.addAt(
      5,
      new Field({
        help: '',
        hidden: false,
        id: 'file32868656',
        maxSelect: 0,
        maxSize: 0,
        mimeTypes: null,
        name: 'instagram_avatar',
        presentable: false,
        protected: false,
        required: false,
        system: false,
        thumbs: null,
        type: 'file',
      }),
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2374593160')

    // remove field
    collection.fields.removeById('file32868656')

    return app.save(collection)
  },
)
