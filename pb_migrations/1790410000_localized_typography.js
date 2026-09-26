/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const typography = require(__hooks + '/../shared/localized-typography-v1.js')
    for (const collection of app.findAllCollections('base')) {
      if (!typography.localizedFields(collection).length) continue
      // Stable pagination: normalizing text must not affect the iteration order.
      for (let offset = 0; ; offset += 200) {
        const records = app.findRecordsByFilter(collection, '', 'id', 200, offset)
        for (const record of records) {
          if (typography.normalizeRecord(record)) app.save(record)
        }
        if (records.length < 200) break
      }
    }
  },
  () => {
    throw new Error(
      'Typography normalization cannot reconstruct original punctuation. Restore a database backup to undo it.',
    )
  },
)
