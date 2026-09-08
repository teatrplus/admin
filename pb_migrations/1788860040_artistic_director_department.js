/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const staff = app.findCollectionByNameOrId('t_staff')
  const department = staff.fields.getByName('role')
  if (!department.values.includes('artistic_director')) department.values.push('artistic_director')
  department.help = 'Department: artistic_director, actor, production or administration. This does not automatically credit the person on any play.'
  app.save(staff)

  const person = app.findFirstRecordByData('t_staff', 'profile_path', '/mikhail-doloko')
  person.set('role', 'artistic_director')
  app.save(person)
}, (app) => {
  for (const person of app.findAllRecords('t_staff', $dbx.hashExp({ role: 'artistic_director' }))) {
    person.set('role', 'administration')
    app.save(person)
  }
  const staff = app.findCollectionByNameOrId('t_staff')
  const department = staff.fields.getByName('role')
  department.values = department.values.filter((value) => value !== 'artistic_director')
  department.help = 'Department: actor, production or administration. This does not automatically credit the person on any play.'
  app.save(staff)
})
