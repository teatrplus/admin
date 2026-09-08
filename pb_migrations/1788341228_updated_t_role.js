/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3658260054')

    // remove field
    collection.fields.removeById('relation1586093754')

    // remove field
    collection.fields.removeById('relation1114567570')

    // remove field
    collection.fields.removeById('file1194031162')

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3658260054')

    // add field
    collection.fields.addAt(
      1,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_3555510918',
        help: '',
        hidden: false,
        id: 'relation1586093754',
        maxSelect: 0,
        minSelect: 0,
        name: 'play',
        presentable: false,
        required: false,
        system: false,
        type: 'relation',
      }),
    )

    // add field
    collection.fields.addAt(
      2,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_1837951489',
        help: '',
        hidden: false,
        id: 'relation1114567570',
        maxSelect: 10,
        minSelect: 0,
        name: 'staff',
        presentable: false,
        required: false,
        system: false,
        type: 'relation',
      }),
    )

    // add field
    collection.fields.addAt(
      11,
      new Field({
        help: '',
        hidden: false,
        id: 'file1194031162',
        maxSelect: 10,
        maxSize: 0,
        mimeTypes: null,
        name: 'gallery',
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
)
