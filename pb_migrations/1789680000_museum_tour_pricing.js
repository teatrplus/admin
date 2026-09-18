/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('t_page_masks')
    collection.fields.add(
      new NumberField({ name: 'excursion_total_uzs', required: true, onlyInt: true, min: 1, max: 1000000000000 }),
    )
    collection.fields.add(new JSONField({ name: 'excursion_group_sizes', required: true, maxSize: 256 }))
    app.save(collection)
    // The tour has one total; per-person prices are derived from the group size.
    for (const page of app.findAllRecords('t_page_masks')) {
      page.set('excursion_total_uzs', 6600000)
      page.set('excursion_group_sizes', [60, 50, 40, 30])
      app.save(page)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('t_page_masks')
    collection.fields.removeByName('excursion_total_uzs')
    collection.fields.removeByName('excursion_group_sizes')
    app.save(collection)
  },
)
