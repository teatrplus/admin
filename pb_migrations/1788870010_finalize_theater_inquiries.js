/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const staff = "@request.auth.id != '' && @request.auth.collectionName = '_user_staff'"
    const scope = "(@request.auth.role = 'admin' || @request.auth.scope:each ?= 'theater')"
    const read = `${staff} && ${scope} && (@request.auth.role = 'admin' || @request.auth.role = 'moderator' || @request.auth.role = 'manager' || @request.auth.role = 'viewer')`
    const edit = `${staff} && ${scope} && (@request.auth.role = 'admin' || @request.auth.role = 'moderator' || @request.auth.role = 'manager')`
    // The local dev server can auto-apply a migration while it is being authored.
    // Repair that incomplete collection without deleting any correspondence.
    const collection = app.findCollectionByNameOrId('t_inquiry')
    if (collection.fields.getByName('email') && String(collection.listRule).includes('scope:each')) return
    collection.listRule = read
    collection.viewRule = read
    collection.createRule = "@request.body.status = 'to-do'"
    collection.updateRule = `${edit} && @request.body.name:changed = false && @request.body.email:changed = false && @request.body.phone:changed = false && @request.body.message:changed = false`
    collection.deleteRule = null
    const fields = [
      new TextField({ name: 'name', required: true, min: 2, max: 80 }),
      new EmailField({ name: 'email', required: true }),
      new TextField({ name: 'phone', max: 30, pattern: '^[+0-9 ().-]*$' }),
      new TextField({ name: 'message', max: 180 }),
      new SelectField({ name: 'status', required: true, maxSelect: 1, values: ['to-do', 'done'] }),
      new AutodateField({ name: 'created', onCreate: true }),
      new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }),
    ]
    for (const field of fields) collection.fields.add(field)
    collection.indexes = ['CREATE INDEX idx_t_inquiry_status_created ON t_inquiry (status, created)']
    app.save(collection)
  },
  (app) => {
    // Preserve correspondence on rollback; lock API access instead of deleting records.
    const collection = app.findCollectionByNameOrId('t_inquiry')
    collection.listRule = null
    collection.viewRule = null
    collection.createRule = null
    collection.updateRule = null
    collection.deleteRule = null
    app.save(collection)
  },
)
