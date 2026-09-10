/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const settings = app.findCollectionByNameOrId('t_site_settings')
    settings.fields.add(new BoolField({ name: 'announcement_enabled' }))
    app.save(settings)
    const collection = app.findCollectionByNameOrId('t_page_masks')
    collection.fields.add(
      new RelationField({
        name: 'seo_block',
        collectionId: app.findCollectionByNameOrId('_copy_block').id,
        maxSelect: 1,
      }),
    )
    for (const locale of ['ru', 'en', 'uz'])
      collection.fields.add(new TextField({ name: 'gallery_alt_' + locale, max: 1000 }))
    app.save(collection)
    const data = JSON.parse(toString($os.readFile(__hooks + '/../pb_migrations/museum-metadata.json')))
    const pages = app.findAllRecords('t_page_masks')
    if (pages.length !== 1) throw new Error('Expected one museum page')
    const page = pages[0]
    if (!page.getString('seo_block')) {
      const copy = new Record(app.findCollectionByNameOrId('_copy_block'), data.copy)
      app.save(copy)
      page.set('seo_block', copy.id)
    }
    for (const locale of ['ru', 'en', 'uz'])
      if (!page.getString('gallery_alt_' + locale)) page.set('gallery_alt_' + locale, data['gallery_alt_' + locale])
    app.save(page)
  },
  () => {},
)
