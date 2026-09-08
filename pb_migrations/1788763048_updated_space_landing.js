/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2249861164')

    // update collection data
    unmarshal(
      {
        name: 's_landing',
      },
      collection,
    )

    // update field
    collection.fields.addAt(
      1,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_1468864550',
        help: '',
        hidden: false,
        id: 'relation2442205965',
        maxSelect: 10,
        minSelect: 0,
        name: 'venue_items',
        presentable: false,
        required: true,
        system: false,
        type: 'relation',
      }),
    )

    // update field
    collection.fields.addAt(
      2,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_2683434894',
        help: '',
        hidden: false,
        id: 'relation3136737876',
        maxSelect: 10,
        minSelect: 0,
        name: 'advantage_items',
        presentable: false,
        required: true,
        system: false,
        type: 'relation',
      }),
    )

    // update field
    collection.fields.addAt(
      3,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_3684452756',
        help: '',
        hidden: false,
        id: 'relation1194031162',
        maxSelect: 10,
        minSelect: 0,
        name: 'gallery_items',
        presentable: false,
        required: true,
        system: false,
        type: 'relation',
      }),
    )

    // update field
    collection.fields.addAt(
      5,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_2808787757',
        help: '',
        hidden: false,
        id: 'relation2250053782',
        maxSelect: 10,
        minSelect: 0,
        name: 'process_items',
        presentable: false,
        required: true,
        system: false,
        type: 'relation',
      }),
    )

    // update field
    collection.fields.addAt(
      6,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_829252413',
        help: '',
        hidden: false,
        id: 'relation3193455276',
        maxSelect: 10,
        minSelect: 0,
        name: 'footer_contact_managers',
        presentable: false,
        required: false,
        system: false,
        type: 'relation',
      }),
    )

    // update field
    collection.fields.addAt(
      7,
      new Field({
        autogeneratePattern: '',
        help: '',
        hidden: false,
        id: 'text18397429',
        max: 0,
        min: 0,
        name: 'presentation_url',
        pattern: '',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text',
      }),
    )

    // update field
    collection.fields.addAt(
      8,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_829252413',
        help: '',
        hidden: false,
        id: 'relation3483911088',
        maxSelect: 0,
        minSelect: 0,
        name: 'header_phone_manager',
        presentable: false,
        required: true,
        system: false,
        type: 'relation',
      }),
    )

    // update field
    collection.fields.addAt(
      9,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_829252413',
        help: '',
        hidden: false,
        id: 'relation1415909401',
        maxSelect: 0,
        minSelect: 0,
        name: 'telegram_manager',
        presentable: false,
        required: false,
        system: false,
        type: 'relation',
      }),
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_2249861164')

    // update collection data
    unmarshal(
      {
        name: 'space_landing',
      },
      collection,
    )

    // update field
    collection.fields.addAt(
      1,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_1468864550',
        help: '',
        hidden: false,
        id: 'relation2442205965',
        maxSelect: 10,
        minSelect: 0,
        name: 'venueItems',
        presentable: false,
        required: true,
        system: false,
        type: 'relation',
      }),
    )

    // update field
    collection.fields.addAt(
      2,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_2683434894',
        help: '',
        hidden: false,
        id: 'relation3136737876',
        maxSelect: 10,
        minSelect: 0,
        name: 'advantageItems',
        presentable: false,
        required: true,
        system: false,
        type: 'relation',
      }),
    )

    // update field
    collection.fields.addAt(
      3,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_3684452756',
        help: '',
        hidden: false,
        id: 'relation1194031162',
        maxSelect: 10,
        minSelect: 0,
        name: 'galleryItems',
        presentable: false,
        required: true,
        system: false,
        type: 'relation',
      }),
    )

    // update field
    collection.fields.addAt(
      5,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_2808787757',
        help: '',
        hidden: false,
        id: 'relation2250053782',
        maxSelect: 10,
        minSelect: 0,
        name: 'processItems',
        presentable: false,
        required: true,
        system: false,
        type: 'relation',
      }),
    )

    // update field
    collection.fields.addAt(
      6,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_829252413',
        help: '',
        hidden: false,
        id: 'relation3193455276',
        maxSelect: 10,
        minSelect: 0,
        name: 'footerContactManagers',
        presentable: false,
        required: false,
        system: false,
        type: 'relation',
      }),
    )

    // update field
    collection.fields.addAt(
      7,
      new Field({
        autogeneratePattern: '',
        help: '',
        hidden: false,
        id: 'text18397429',
        max: 0,
        min: 0,
        name: 'presentationUrl',
        pattern: '',
        presentable: false,
        primaryKey: false,
        required: false,
        system: false,
        type: 'text',
      }),
    )

    // update field
    collection.fields.addAt(
      8,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_829252413',
        help: '',
        hidden: false,
        id: 'relation3483911088',
        maxSelect: 0,
        minSelect: 0,
        name: 'headerPhoneManager',
        presentable: false,
        required: true,
        system: false,
        type: 'relation',
      }),
    )

    // update field
    collection.fields.addAt(
      9,
      new Field({
        cascadeDelete: false,
        collectionId: 'pbc_829252413',
        help: '',
        hidden: false,
        id: 'relation1415909401',
        maxSelect: 0,
        minSelect: 0,
        name: 'telegramManager',
        presentable: false,
        required: false,
        system: false,
        type: 'relation',
      }),
    )

    return app.save(collection)
  },
)
