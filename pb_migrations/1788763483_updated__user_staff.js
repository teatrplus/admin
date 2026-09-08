/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_829252413')

    // update field
    collection.fields.addAt(
      7,
      new Field({
        autogeneratePattern: '',
        help: '',
        hidden: false,
        id: 'text3898508260',
        max: 0,
        min: 0,
        name: 'phone_number',
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
      10,
      new Field({
        autogeneratePattern: '',
        help: '',
        hidden: false,
        id: 'text774300842',
        max: 0,
        min: 0,
        name: 'telegram_username',
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
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_829252413')

    // update field
    collection.fields.addAt(
      7,
      new Field({
        autogeneratePattern: '',
        help: '',
        hidden: false,
        id: 'text3898508260',
        max: 0,
        min: 0,
        name: 'phoneNumber',
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
      10,
      new Field({
        autogeneratePattern: '',
        help: '',
        hidden: false,
        id: 'text774300842',
        max: 0,
        min: 0,
        name: 'telegramUsername',
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
