/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('t_page_home')
    const maskCollection = app.findCollectionByNameOrId('t_mask')
    for (const name of ['afisha_mask', 'cta_mask'])
      collection.fields.add(new RelationField({ name, collectionId: maskCollection.id, maxSelect: 1 }))
    app.save(collection)
    for (const page of app.findAllRecords('t_page_home')) {
      for (const [field, slug] of [
        ['afisha_mask', '007'],
        ['cta_mask', '004'],
      ]) {
        if (page.getString(field)) continue
        const masks = app.findRecordsByFilter('t_mask', 'legacy_slug = {:slug}', '', 1, 0, { slug })
        if (masks[0]) page.set(field, masks[0].id)
      }
      app.save(page)
    }
  },
  () => {},
)
