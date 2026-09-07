/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // Responsibilities documented in the existing staff biographies. No play participation is inferred.
  const people = [
  {
    "staff": "a4268c42c7d9f2e",
    "roleId": "79ffc09c4f4df89",
    "assignmentId": "add219231b3741c",
    "name_en": "Lighting designer",
    "name_ru": "Художник по свету",
    "name_uz": "Yoritish bo‘yicha rassom"
  },
  {
    "staff": "8ba044e8cd0530a",
    "roleId": "9cc28b9f68f5055",
    "assignmentId": "88bc83bc3df2102",
    "name_en": "Head of production department",
    "name_ru": "Заведующий постановочной частью",
    "name_uz": "Sahnalashtirish bo‘limi mudiri"
  },
  {
    "staff": "4d9da6ceac2966d",
    "roleId": "2997d87826f01cb",
    "assignmentId": "d789250ccbbc8d4",
    "name_en": "Sound engineer",
    "name_ru": "Звукорежиссёр",
    "name_uz": "Ovoz rejissyori"
  },
  {
    "staff": "e946351f9238991",
    "roleId": "3ed7dde2a0a4632",
    "assignmentId": "d4290e6f09d394a",
    "name_en": "Wardrobe supervisor",
    "name_ru": "Костюмер",
    "name_uz": "Kostyumer"
  }
]
  const roleCollection = app.findCollectionByNameOrId('t_role')
  const assignmentCollection = app.findCollectionByNameOrId('t_staff_role')
  for (const person of people) {
    const staff = app.findRecordById('t_staff', person.staff)
    if (staff.getString('role') !== 'production') throw new Error(`Expected production staff: ${person.staff}`)
    const existing = app.findRecordsByFilter('t_role', 'type = "production" && name_en = {:name}', '', 2, 0, { name: person.name_en })
    if (existing.length > 1) throw new Error(`Ambiguous production responsibility: ${person.name_en}`)
    let role = existing[0]
    if (!role) {
      role = new Record(roleCollection)
      role.set('id', person.roleId)
      role.set('type', 'production')
      for (const locale of ['en', 'ru', 'uz']) role.set(`name_${locale}`, person[`name_${locale}`])
      app.save(role)
    }
    const assigned = app.findRecordsByFilter('t_staff_role', 'staff = {:staff} && role = {:role}', '', 1, 0, { staff: staff.id, role: role.id })
    if (!assigned.length) {
      const assignment = new Record(assignmentCollection)
      assignment.set('id', person.assignmentId)
      assignment.set('staff', staff.id)
      assignment.set('role', role.id)
      app.save(assignment)
    }
  }
}, () => {
  // Content seed is intentionally retained on rollback: later editorial play links may use these records.
})
