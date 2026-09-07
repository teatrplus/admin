/// <reference path="../pb_data/types.d.ts" />

// Model hooks cover dashboard, API and app.save() writes, not just HTTP requests.
onRecordCreate((event) => {
  require(`${__hooks}/lib/theater_slug.js`).assign(event.app, event.record)
  event.next()
}, 't_staff', 't_play', 't_course')

onRecordUpdate((event) => {
  require(`${__hooks}/lib/theater_slug.js`).assign(event.app, event.record)
  event.next()
}, 't_staff', 't_play', 't_course')
