/// <reference path="../pb_data/types.d.ts" />

// Correct already-normalized Cyrillic о + acute to the requested literal ó.
migrate(
  (app) => {
    const typography = require(__hooks + '/../shared/localized-typography-v2.js')
    for (const collection of app.findAllCollections('base')) {
      if (!typography.localizedFields(collection).length) continue
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
      'Surname normalization cannot reconstruct original spellings. Restore a database backup to undo it.',
    )
  },
)
