/// <reference path="../pb_data/types.d.ts" />

// Model hooks cover the admin app, dashboard, custom routes and direct app.save().
onRecordCreate((event) => {
  require(__hooks + '/../shared/localized-typography-v2.js').normalizeRecord(event.record)
  event.next()
})

onRecordUpdate((event) => {
  require(__hooks + '/../shared/localized-typography-v2.js').normalizeRecord(event.record)
  event.next()
})
