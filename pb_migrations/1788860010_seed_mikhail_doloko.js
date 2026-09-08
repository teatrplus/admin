/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const people = app.findRecordsByFilter('t_staff', 'slug = "mikhail-doloko" || name_en = "Mikhail Doloko" || name_ru = "Михаил Долоко"', '', 2)
  if (people.length > 1) throw new Error('Ambiguous Mikhail Doloko staff record')
  const person = people[0] || new Record(app.findCollectionByNameOrId('t_staff'))
  if (!people.length) {
    person.set('id', 'mikhaildoloko01')
    person.set('slug', 'mikhail-doloko')
    person.set('name_en', 'Mikhail Doloko')
    person.set('name_ru', 'Михаил Долоко')
    person.set('name_uz', 'Mixail Doloko')
    person.set('gender', 'male')
    person.set('role', 'administration')
    person.set('description_en', 'Artistic director')
    person.set('description_ru', 'Художественный руководитель')
    person.set('description_uz', 'Badiiy rahbar')
  }
  person.set('profile_path', '/mikhail-doloko')
  app.save(person)

  const roles = app.findRecordsByFilter('t_role', 'type = "administration" && name_en = "Artistic director"', '', 2)
  if (roles.length > 1) throw new Error('Ambiguous artistic director role')
  const role = roles[0] || new Record(app.findCollectionByNameOrId('t_role'))
  if (!roles.length) {
    role.set('id', 'artdirector0001')
    role.set('type', 'administration')
    role.set('name_en', 'Artistic director')
    role.set('name_ru', 'Художественный руководитель')
    role.set('name_uz', 'Badiiy rahbar')
    app.save(role)
  }
  const assignments = app.findRecordsByFilter('t_staff_role', 'staff = {:staff} && role = {:role}', '', 1, 0, { staff: person.id, role: role.id })
  if (!assignments.length) {
    const assignment = new Record(app.findCollectionByNameOrId('t_staff_role'))
    assignment.set('id', 'dolokoartdir001')
    assignment.set('staff', person.id)
    assignment.set('role', role.id)
    app.save(assignment)
  }
}, () => {
  // Retain editorial content on rollback; later credits may reference these records.
})
