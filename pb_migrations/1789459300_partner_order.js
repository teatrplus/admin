/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('t_partner')
    collection.fields.add(new NumberField({ name: 'sort_order', min: 0, onlyInt: true }))
    app.save(collection)

    // Keep the website's existing order until an editor rearranges the logos.
    const partners = app.findRecordsByFilter('t_partner', '', 'created,id', 0)
    partners.forEach((partner, index) => {
      partner.set('sort_order', index)
      app.save(partner)
    })
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('t_partner')
    collection.fields.removeByName('sort_order')
    return app.save(collection)
  },
)
