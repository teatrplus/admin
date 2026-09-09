/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('t_mask')
    collection.fields.add(new TextField({ name: 'legacy_slug', max: 80 }))
    collection.fields.getByName('slug').max = 180
    app.save(collection)
    const { slugify } = require(`${__hooks}/lib/theater_slug.js`)
    for (const record of app.findAllRecords('t_mask')) {
      const previous = record.getString('slug')
      if (!/^\d+$/.test(previous)) continue
      const base =
        ['en', 'ru', 'uz'].map((locale) => slugify(record.getString(`name_${locale}`))).find(Boolean) ||
        `mask-${record.id}`
      let slug = base.slice(0, 150).replace(/-$/, '')
      if (slug === 'index' || /^[a-z0-9]{15}$/.test(slug)) slug = `mask-${slug}`
      if (app.findRecordsByFilter('t_mask', 'slug = {:slug} && id != {:id}', '', 1, 0, { slug, id: record.id }).length)
        slug += `-${record.id}`
      // The normal model hook deliberately preserves published slugs. This one-time
      // URL migration must update the two fields directly within the migration transaction.
      app
        .db()
        .newQuery('UPDATE t_mask SET legacy_slug = {:previous}, slug = {:slug} WHERE id = {:id}')
        .bind({ previous, slug, id: record.id })
        .execute()
    }
    // Numbered captions are gone; metadata and alt text should describe the mask by name.
    const page = app.findFirstRecordByFilter('t_page_masks', '')
    for (const locale of ['en', 'ru', 'uz']) {
      page.set(`mask_meta_title_${locale}`, '{name} — ' + page.getString(`meta_title_${locale}`))
      page.set(`mask_meta_description_${locale}`, '{name}. ' + page.getString(`meta_description_${locale}`))
      page.set(`mask_image_alt_${locale}`, '{name}')
    }
    app.save(page)
  },
  () => {
    // Published names and redirects remain stable on rollback.
  },
)
