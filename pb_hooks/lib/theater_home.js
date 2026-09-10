const copyRelations = ['about_block', 'instagram_block', 'cta_block', 'bottom_block']
const buttonRelations = ['instagram_button', 'cta_button', 'bottom_button']
const locales = ['ru', 'en', 'uz']

const canEditHome = (auth) => {
  if (!auth) return false
  const collection = auth.collection().name
  if (collection === '_superusers') return true
  if (collection !== '_user_staff') return false
  return (
    auth.getString('role') === 'admin' ||
    (auth.getString('role') === 'moderator' && auth.getStringSlice('scope').includes('theater'))
  )
}

const singleton = (app, collection) => {
  const records = app.findRecordsByFilter(collection, '', '', 2)
  if (records.length !== 1) throw new BadRequestError('Expected exactly one ' + collection + ' record.')
  return records[0]
}

const readHome = (app) => {
  const page = singleton(app, 't_page_home')
  const contact = singleton(app, 't_contact')
  const copies = {}
  const buttons = {}
  for (const field of copyRelations) {
    const id = page.getString(field)
    copies[field] = id ? app.findRecordById('_copy_block', id).publicExport() : null
  }
  for (const field of buttonRelations) {
    const id = page.getString(field)
    buttons[field] = id ? app.findRecordById('_button', id).publicExport() : null
  }
  const stats = page
    .getStringSlice('about_info_blocks')
    .map((id) => app.findRecordById('_copy_block', id).publicExport())
  const records = [
    page.publicExport(),
    contact.publicExport(),
    ...Object.values(copies),
    ...Object.values(buttons),
    ...stats,
  ].filter(Boolean)
  return {
    page: page.publicExport(),
    contact: contact.publicExport(),
    copies,
    buttons,
    stats,
    revision: records
      .map((r) => r.id + ':' + r.updated)
      .sort()
      .join('|'),
  }
}

const text = (value) => {
  if (typeof value !== 'string' || value.length > 10000)
    throw new BadRequestError('Text must be at most 10,000 characters.')
  return value.trim()
}
const localized = (record, data, fields) => {
  if (!data || typeof data !== 'object') throw new BadRequestError('Missing translated content.')
  for (const field of fields)
    for (const locale of locales) record.set(field + '_' + locale, text(data[field + '_' + locale]))
}
const url = (value) => {
  const result = text(value)
  if (result && !/^https?:\/\/[^\s/]+(?:[/?#][^\s]*)?$/i.test(result))
    throw new BadRequestError('Links must use HTTP(S).')
  return result
}

const saveHome = (app, input, uploads) => {
  let result
  app.runInTransaction((tx) => {
    const current = readHome(tx)
    if (input.revision !== current.revision) throw new ApiError(409, 'This page changed. Reload before saving.')
    const page = tx.findRecordById('t_page_home', current.page.id)
    const contact = tx.findRecordById('t_contact', current.contact.id)
    if (
      !Array.isArray(input.featured_plays) ||
      input.featured_plays.length > 10 ||
      new Set(input.featured_plays).size !== input.featured_plays.length
    )
      throw new BadRequestError('Select up to ten distinct plays.')
    for (const id of input.featured_plays) tx.findRecordById('t_play', text(id))
    if (input.about_mask) tx.findRecordById('t_mask', text(input.about_mask))
    page.set('featured_plays', input.featured_plays)
    page.set('about_mask', text(input.about_mask))
    for (const field of ['afisha_mask', 'cta_mask']) {
      if (input[field] === undefined) continue
      const id = text(input[field])
      if (id) tx.findRecordById('t_mask', id)
      page.set(field, id)
    }
    contact.set('instagram_url', url(input.instagram_url))
    tx.save(contact)
    const { readInstagramProfileUrl } = require(__hooks + '/lib/instagram_refresh.js')
    const instagramUrl = readInstagramProfileUrl(tx)

    for (const field of copyRelations) {
      const record = current.copies[field]
        ? tx.findRecordById('_copy_block', current.copies[field].id)
        : new Record(tx.findCollectionByNameOrId('_copy_block'))
      localized(record, input.copies?.[field], ['title', 'lede', 'description'])
      tx.save(record)
      page.set(field, record.id)
    }
    for (const field of buttonRelations) {
      const record = current.buttons[field]
        ? tx.findRecordById('_button', current.buttons[field].id)
        : new Record(tx.findCollectionByNameOrId('_button'))
      localized(record, input.buttons?.[field], ['label'])
      record.set('url', field === 'instagram_button' ? instagramUrl : url(input.buttons[field].url))
      tx.save(record)
      page.set(field, record.id)
    }
    if (!Array.isArray(input.stats) || input.stats.length > 10) throw new BadRequestError('Use up to ten statistics.')
    const used = new Set()
    const statIds = input.stats.map((data) => {
      if (data.id && (!current.stats.some((stat) => stat.id === data.id) || used.has(data.id)))
        throw new BadRequestError('Invalid statistic.')
      const record = data.id
        ? tx.findRecordById('_copy_block', data.id)
        : new Record(tx.findCollectionByNameOrId('_copy_block'))
      localized(record, data, ['title', 'lede', 'description'])
      tx.save(record)
      used.add(record.id)
      return record.id
    })
    // Unlink removed statistics; copy blocks can be shared by other pages.
    page.set('about_info_blocks', statIds)
    for (const field of ['instagram_avatar', 'bottom_image']) {
      const files = uploads[field] || []
      if (files.length > 1) throw new BadRequestError('Choose one image per field.')
      if (files[0]) {
        if (files[0].size > 10485760 || !/\.(png|jpe?g|webp)$/i.test(files[0].originalName))
          throw new BadRequestError('Use PNG, JPEG or WebP images up to 10 MB.')
        page.set(field, files[0])
      } else if (input.remove_images?.includes(field)) page.set(field, '')
    }
    tx.save(page)
    result = readHome(tx)
  })
  return result
}
module.exports = { canEditHome, readHome, saveHome }
