/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3911028472')

    // update field
    collection.fields.addAt(
      2,
      new Field({
        autogeneratePattern: '',
        help: '',
        hidden: false,
        id: 'text3911028480',
        max: 80,
        min: 0,
        name: 'snapshot_id',
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
      6,
      new Field({
        help: '',
        hidden: false,
        id: 'date4149654992',
        max: '',
        min: '',
        name: 'started_at',
        presentable: false,
        required: false,
        system: false,
        type: 'date',
      }),
    )

    // update field
    collection.fields.addAt(
      7,
      new Field({
        help: '',
        hidden: false,
        id: 'date4149654993',
        max: '',
        min: '',
        name: 'finished_at',
        presentable: false,
        required: false,
        system: false,
        type: 'date',
      }),
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3911028472')

    // update field
    collection.fields.addAt(
      2,
      new Field({
        autogeneratePattern: '',
        help: '',
        hidden: false,
        id: 'text3911028480',
        max: 80,
        min: 0,
        name: 'snapshotId',
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
      6,
      new Field({
        help: '',
        hidden: false,
        id: 'date4149654992',
        max: '',
        min: '',
        name: 'startedAt',
        presentable: false,
        required: false,
        system: false,
        type: 'date',
      }),
    )

    // update field
    collection.fields.addAt(
      7,
      new Field({
        help: '',
        hidden: false,
        id: 'date4149654993',
        max: '',
        min: '',
        name: 'finishedAt',
        presentable: false,
        required: false,
        system: false,
        type: 'date',
      }),
    )

    return app.save(collection)
  },
)
