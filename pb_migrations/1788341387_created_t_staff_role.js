/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = new Collection({
      createRule: null,
      deleteRule: null,
      fields: [
        {
          autogeneratePattern: '[a-z0-9]{15}',
          help: '',
          hidden: false,
          id: 'text3208210256',
          max: 15,
          min: 15,
          name: 'id',
          pattern: '^[a-z0-9]+$',
          presentable: false,
          primaryKey: true,
          required: true,
          system: true,
          type: 'text',
        },
        {
          cascadeDelete: false,
          collectionId: 'pbc_1837951489',
          help: '',
          hidden: false,
          id: 'relation1114567570',
          maxSelect: 0,
          minSelect: 0,
          name: 'staff',
          presentable: false,
          required: false,
          system: false,
          type: 'relation',
        },
        {
          cascadeDelete: false,
          collectionId: 'pbc_3658260054',
          help: '',
          hidden: false,
          id: 'relation1466534506',
          maxSelect: 0,
          minSelect: 0,
          name: 'role',
          presentable: false,
          required: false,
          system: false,
          type: 'relation',
        },
        {
          hidden: false,
          id: 'autodate2990389176',
          name: 'created',
          onCreate: true,
          onUpdate: false,
          presentable: false,
          system: false,
          type: 'autodate',
        },
        {
          hidden: false,
          id: 'autodate3332085495',
          name: 'updated',
          onCreate: true,
          onUpdate: true,
          presentable: false,
          system: false,
          type: 'autodate',
        },
      ],
      id: 'pbc_3063055763',
      indexes: [],
      listRule: null,
      name: 't_staff_role',
      system: false,
      type: 'base',
      updateRule: null,
      viewRule: null,
    })

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_3063055763')

    return app.delete(collection)
  },
)
