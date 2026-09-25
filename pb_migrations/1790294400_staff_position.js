/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('t_staff')
    // Keeping field IDs lets PocketBase rename the columns without losing translations.
    for (const locale of ['en', 'ru', 'uz']) {
      collection.fields.getByName(`description_${locale}`).name = `position_${locale}`
    }
    app.save(collection)
    // Only these departments used descriptions as job titles.
    for (const record of app.findAllRecords('t_staff')) {
      if (['administration', 'production'].includes(record.getString('role'))) continue
      for (const locale of ['en', 'ru', 'uz']) record.set(`position_${locale}`, '')
      app.save(record)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('t_staff')
    // Rollback restores the schema, not the intentionally purged biographies.
    for (const locale of ['en', 'ru', 'uz']) {
      collection.fields.getByName(`position_${locale}`).name = `description_${locale}`
    }
    app.save(collection)
  },
)
