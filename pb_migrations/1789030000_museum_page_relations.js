/// <reference path="../pb_data/types.d.ts" />
// Keep editorial copy in reusable records; UI labels and SEO belong to website i18n.
migrate(
  (app) => {
    const pages = app.findAllRecords('t_page_masks')
    if (pages.length !== 1) throw new Error('Expected one museum page before migrating content.')
    const page = pages[0]
    const collection = app.findCollectionByNameOrId('t_page_masks')
    const copyCollection = app.findCollectionByNameOrId('_copy_block')
    const buttonCollection = app.findCollectionByNameOrId('_button')
    const copies = {
      intro_block: { title: 'title', lede: 'lede', description: 'description' },
      visit_block: { title: 'museum_title', description: 'museum_description' },
      excursion_block: { title: 'excursion_title', lede: 'excursion_kicker', description: 'excursion_description' },
    }
    const buttons = { visit_button: 'museum', excursion_button: 'excursion' }
    const values = {}
    for (const [relation, fields] of Object.entries(copies)) {
      const record = new Record(copyCollection)
      for (const [field, previous] of Object.entries(fields))
        for (const locale of ['ru', 'en', 'uz'])
          record.set(field + '_' + locale, page.getString(previous + '_' + locale))
      app.save(record)
      values[relation] = record.id
      collection.fields.add(
        new RelationField({ name: relation, collectionId: copyCollection.id, maxSelect: 1, cascadeDelete: false }),
      )
    }
    for (const [relation, prefix] of Object.entries(buttons)) {
      const record = new Record(buttonCollection)
      for (const locale of ['ru', 'en', 'uz'])
        record.set('label_' + locale, page.getString(prefix + '_button_label_' + locale))
      // URL fields store concrete URLs; locale routing is a frontend concern.
      record.set('url', page.getString(prefix + '_button_url').replaceAll('{locale}', 'ru'))
      app.save(record)
      values[relation] = record.id
      collection.fields.add(
        new RelationField({ name: relation, collectionId: buttonCollection.id, maxSelect: 1, cascadeDelete: false }),
      )
    }
    collection.indexes = collection.indexes.filter((index) => !index.includes('idx_t_page_masks_singleton'))
    for (const field of [...collection.fields]) {
      if (
        /_((en)|(ru)|(uz))$/.test(field.name) ||
        ['singleton', 'museum_button_url', 'excursion_button_url'].includes(field.name)
      )
        collection.fields.removeById(field.id)
    }
    collection.createRule = null
    collection.updateRule = null // All linked page changes go through the transactional museum editor endpoint.
    app.save(collection)
    // Shared public copy/button collections may still be locked on databases without the home seed.
    for (const related of [copyCollection, buttonCollection]) {
      related.listRule = ''
      related.viewRule = ''
      app.save(related)
    }
    const migrated = app.findRecordById('t_page_masks', page.id)
    for (const [field, value] of Object.entries(values)) migrated.set(field, value)
    app.save(migrated)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('t_page_masks')
    const page = app.findFirstRecordByFilter('t_page_masks', '')
    const restored = {}
    const copies = {
      intro_block: { title: 'title', lede: 'lede', description: 'description' },
      visit_block: { title: 'museum_title', description: 'museum_description' },
      excursion_block: { title: 'excursion_title', lede: 'excursion_kicker', description: 'excursion_description' },
    }
    for (const [relation, fields] of Object.entries(copies)) {
      const record = app.findRecordById('_copy_block', page.getString(relation))
      for (const [field, previous] of Object.entries(fields))
        for (const locale of ['ru', 'en', 'uz'])
          restored[previous + '_' + locale] = record.getString(field + '_' + locale)
    }
    for (const [relation, prefix] of Object.entries({ visit_button: 'museum', excursion_button: 'excursion' })) {
      const record = app.findRecordById('_button', page.getString(relation))
      for (const locale of ['ru', 'en', 'uz'])
        restored[prefix + '_button_label_' + locale] = record.getString('label_' + locale)
      restored[prefix + '_button_url'] = record.getString('url')
    }
    // Static fields restore the published defaults; editorial fields restore the current related content.
    const defaults = {
      kicker_ru: 'Ташкент',
      kicker_en: 'Tashkent',
      kicker_uz: 'Toshkent',
      back_label_ru: 'В музей',
      back_label_en: 'To the museum',
      back_label_uz: 'Muzeyga',
      serial_label_ru: '№ {id}',
      serial_label_en: 'No. {id}',
      serial_label_uz: '№ {id}',
      hall_title_ru: 'Коллекция',
      hall_title_en: 'Collection',
      hall_title_uz: 'Kolleksiya',
      excursion_photo_alt_ru: 'Экскурсия с Михаилом Долóко в музее масок Театр+',
      excursion_photo_alt_en: 'Excursion with Mikhail Doloko at the Theater+ mask museum',
      excursion_photo_alt_uz: 'Teatr+ niqoblar muzeyida Mixail Doloko bilan ekskursiya',
      excursion_gallery_label_ru: 'Фотографии с экскурсии',
      excursion_gallery_label_en: 'Photographs from the excursion',
      excursion_gallery_label_uz: 'Ekskursiya fotosuratlari',
      previous_photo_label_ru: 'Предыдущая фотография',
      previous_photo_label_en: 'Previous photograph',
      previous_photo_label_uz: 'Oldingi fotosurat',
      next_photo_label_ru: 'Следующая фотография',
      next_photo_label_en: 'Next photograph',
      next_photo_label_uz: 'Keyingi fotosurat',
      mask_image_alt_ru: '{name}',
      mask_image_alt_en: '{name}',
      mask_image_alt_uz: '{name}',
      meta_title_ru: 'Первый музей масок в СНГ — Театр+ Ташкент',
      meta_title_en: 'First mask museum in the CIS — Theater+ Tashkent',
      meta_title_uz: 'MDHdagi birinchi niqoblar muzeyi — Teatr+ Toshkent',
      meta_description_ru:
        'Первый музей театральных масок в СНГ — в Театр+ в Ташкенте: 90 масок, свободный вход в коллекцию и экскурсии с художественным руководителем Михаилом Долóко.',
      meta_description_en:
        'The first mask museum in the CIS is at Theater+ in Tashkent: 90 theatrical masks, free entry to the collection, and excursions with artistic director Mikhail Doloko.',
      meta_description_uz:
        'MDHdagi birinchi teatr niqoblari muzeyi Teatr+da, Toshkentda: 90 niqob, kolleksiyaga bepul kirish va badiiy rahbar Mixail Doloko bilan ekskursiyalar.',
      mask_meta_title_ru: '{name} — Первый музей масок в СНГ — Театр+ Ташкент',
      mask_meta_title_en: '{name} — First mask museum in the CIS — Theater+ Tashkent',
      mask_meta_title_uz: '{name} — MDHdagi birinchi niqoblar muzeyi — Teatr+ Toshkent',
      mask_meta_description_ru:
        '{name}. Первый музей театральных масок в СНГ — в Театр+ в Ташкенте: 90 масок, свободный вход в коллекцию и экскурсии с художественным руководителем Михаилом Долóко.',
      mask_meta_description_en:
        '{name}. The first mask museum in the CIS is at Theater+ in Tashkent: 90 theatrical masks, free entry to the collection, and excursions with artistic director Mikhail Doloko.',
      mask_meta_description_uz:
        '{name}. MDHdagi birinchi teatr niqoblari muzeyi Teatr+da, Toshkentda: 90 niqob, kolleksiyaga bepul kirish va badiiy rahbar Mixail Doloko bilan ekskursiyalar.',
    }
    for (const [field, value] of Object.entries({ ...defaults, ...restored })) {
      collection.fields.add(new TextField({ name: field, max: 10000 }))
    }
    collection.fields.add(new TextField({ name: 'singleton', required: true, pattern: '^museum$', max: 6 }))
    collection.indexes.push('CREATE UNIQUE INDEX idx_t_page_masks_singleton ON t_page_masks (singleton)')
    for (const field of ['intro_block', 'visit_block', 'excursion_block', 'visit_button', 'excursion_button'])
      collection.fields.removeByName(field)
    const admin =
      "@request.auth.id != '' && @request.auth.collectionName = '_user_staff' && @request.auth.role = 'admin'"
    collection.createRule = admin
    collection.updateRule = admin
    app.save(collection)
    const reverted = app.findRecordById('t_page_masks', page.id)
    for (const [field, value] of Object.entries({ ...defaults, ...restored })) reverted.set(field, value)
    reverted.set('singleton', 'museum')
    app.save(reverted)
    // Do not delete reusable records on rollback.
  },
)
