const copies = {
  intro_block: { title: 'title', lede: 'lede', description: 'description' },
  visit_block: { title: 'museum_title', description: 'museum_description' },
  excursion_block: { title: 'excursion_title', lede: 'excursion_kicker', description: 'excursion_description' },
}
const buttons = { visit_button: 'museum', excursion_button: 'excursion' }
const canEditMuseum = (auth) =>
  Boolean(
    auth &&
    (auth.collection().name === '_superusers' ||
      (auth.collection().name === '_user_staff' && auth.getString('role') === 'admin')),
  )
const revision = (page) =>
  [page, ...Object.values(page.expand)]
    .map((record) => record.id + ':' + record.updated)
    .sort()
    .join('|')
const readMuseumPage = (app) => {
  const records = app.findAllRecords('t_page_masks')
  if (records.length !== 1) throw new BadRequestError('Expected exactly one museum page.')
  const record = records[0]
  const page = record.publicExport()
  page.expand = {}
  for (const field of Object.keys(copies))
    page.expand[field] = app.findRecordById('_copy_block', record.getString(field)).publicExport()
  for (const field of Object.keys(buttons))
    page.expand[field] = app.findRecordById('_button', record.getString(field)).publicExport()
  return page
}
const text = (value) => {
  if (typeof value !== 'string' || !value.trim() || value.length > 10000)
    throw new BadRequestError('Complete the museum content in all three languages (up to 10,000 characters per field).')
  return value.trim()
}
const saveMuseumPage = (app, input, uploads) => {
  let result
  app.runInTransaction((tx) => {
    const current = readMuseumPage(tx)
    if (revision(current) !== input.revision) throw new ApiError(409, 'The museum page changed. Reload before saving.')
    const page = tx.findRecordById('t_page_masks', current.id)
    for (const [relation, fields] of Object.entries(copies)) {
      const record = tx.findRecordById('_copy_block', current[relation])
      for (const [field, source] of Object.entries(fields))
        for (const locale of ['ru', 'en', 'uz'])
          record.set(field + '_' + locale, text(input.draft?.[source + '_' + locale]))
      tx.save(record)
    }
    for (const [relation, prefix] of Object.entries(buttons)) {
      const record = tx.findRecordById('_button', current[relation])
      for (const locale of ['ru', 'en', 'uz'])
        record.set('label_' + locale, text(input.draft?.[prefix + '_button_label_' + locale]))
      record.set('url', text(input.draft?.[prefix + '_button_url']))
      tx.save(record)
    }
    if (!Array.isArray(input.photos) || input.photos.length > 30 || new Set(input.photos).size !== input.photos.length)
      throw new BadRequestError('Use up to 30 distinct photos.')
    const photos = input.photos.map((item) => {
      if (typeof item === 'string' && current.excursion_photos.includes(item)) return item
      if (Number.isInteger(item) && item >= 0 && uploads[item]) return uploads[item]
      throw new BadRequestError('Invalid gallery photo.')
    })
    page.set('excursion_photos', photos)
    tx.save(page)
    result = readMuseumPage(tx)
  })
  return result
}
module.exports = { canEditMuseum, readMuseumPage, saveMuseumPage, revision }
