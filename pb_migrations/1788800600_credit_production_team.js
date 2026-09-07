/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // Confirmed production participants for these two plays only.
  const people = [
    ['a4268c42c7d9f2e', 'Lighting designer'],
    ['8ba044e8cd0530a', 'Head of production department'],
    ['4d9da6ceac2966d', 'Sound engineer'],
    ['e946351f9238991', 'Wardrobe supervisor'],
  ]
  const assignments = people.map(([staff, name]) => {
    const roles = app.findRecordsByFilter('t_role', 'type = "production" && name_en = {:name}', '', 2, 0, { name })
    if (roles.length !== 1) throw new Error(`Expected one production responsibility: ${name}`)
    const matches = app.findRecordsByFilter('t_staff_role', 'staff = {:staff} && role = {:role}', '', 2, 0, { staff, role: roles[0].id })
    if (matches.length !== 1) throw new Error(`Expected one production assignment: ${staff} / ${name}`)
    return matches[0].id
  })
  const plays = ['g4y4xrydwm24afv', 'gohd1i0tdhgoo6b'].map((id) => app.findRecordById('t_play', id))
  for (const play of plays) {
    const original = Array.from(play.getStringSlice('roles'))
    const added = assignments.filter((id) => !original.includes(id))
    if (!added.length) continue
    play.set('roles', original.concat(added))
    app.save(play)
  }
}, () => {
  // Preserve confirmed content on rollback, including later editorial changes.
})
