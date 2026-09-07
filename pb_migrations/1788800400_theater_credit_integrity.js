/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const assignments = app.findCollectionByNameOrId('t_staff_role')
  const seen = new Set()
  for (const record of app.findAllRecords('t_staff_role')) {
    const staff = record.getString('staff')
    const role = record.getString('role')
    const pair = `${staff}:${role}`
    if (!staff || !role || seen.has(pair)) throw new Error(`Incomplete or duplicate staff-role assignment: ${record.id}`)
    app.findRecordById('t_staff', staff)
    app.findRecordById('t_role', role)
    seen.add(pair)
  }
  assignments.fields.getByName('staff').required = true
  assignments.fields.getByName('role').required = true
  assignments.fields.getByName('staff').help = 'Person receiving this credit. Reuse the same person-role pair across plays.'
  assignments.fields.getByName('role').help = 'Character or production responsibility. This assignment only appears on plays that select it in their roles field.'
  assignments.indexes.push('CREATE UNIQUE INDEX idx_t_staff_role_pair ON t_staff_role (staff, role)')
  app.save(assignments)

  for (const [name, field, help] of [
    ['t_staff', 'role', 'Department: actor, production or administration. This does not automatically credit the person on any play.'],
    ['t_role', 'type', 'actor = character; production = production responsibility; administration = administrative responsibility.'],
    ['t_play', 'roles', 'Confirmed participants: select person-role assignments from t_staff_role. Includes cast and production team; reuse assignments on other plays when appropriate.'],
  ]) {
    const collection = app.findCollectionByNameOrId(name)
    collection.fields.getByName(field).help = help
    app.save(collection)
  }
}, (app) => {
  const assignments = app.findCollectionByNameOrId('t_staff_role')
  assignments.fields.getByName('staff').required = false
  assignments.fields.getByName('role').required = false
  assignments.fields.getByName('staff').help = ''
  assignments.fields.getByName('role').help = ''
  assignments.indexes = assignments.indexes.filter((index) => !index.includes('idx_t_staff_role_pair'))
  app.save(assignments)
  for (const [name, field] of [['t_staff', 'role'], ['t_role', 'type'], ['t_play', 'roles']]) {
    const collection = app.findCollectionByNameOrId(name)
    collection.fields.getByName(field).help = ''
    app.save(collection)
  }
})
