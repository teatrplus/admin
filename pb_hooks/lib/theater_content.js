// One explicit field catalogue drives both the editor and its transactional write boundary.
const schema = JSON.parse(toString($os.readFile(__hooks + '/../shared/theater-content.json')))
const locales = ['ru', 'en', 'uz']
const canEdit = (auth) => require(__hooks + '/lib/theater_home.js').canEditHome(auth)
const definition = (name) => {
  const result = schema[name]
  if (!result) throw new NotFoundError('Unknown theater content collection.')
  return result
}
const fields = (spec) => spec.fields || definition(spec.collection).sections.flatMap((section) => section.fields)
const related = (app, spec, id) =>
  app.findRecordsByFilter(
    spec.collection,
    spec.via + (spec.viaMany ? '.id ?= {:parent}' : ' = {:parent}'),
    spec.sort || 'id',
    1000,
    0,
    { parent: id },
  )
const readRecord = (app, record, specs) => {
  const value = record.publicExport()
  // Owned relations become nested drafts; ordinary references remain IDs.
  for (const spec of specs) {
    if (spec.type === 'children' || spec.type === 'membership') {
      const records = related(app, spec, record.id)
      value[spec.name] =
        spec.type === 'membership'
          ? records.map((item) => item.id)
          : records.map((item) => readRecord(app, item, fields(spec)))
      continue
    }
    if (spec.type !== 'owned') continue
    const ids = spec.many ? record.getStringSlice(spec.name) : [record.getString(spec.name)].filter(Boolean)
    const records = ids.map((id) => readRecord(app, app.findRecordById(spec.collection, id), fields(spec)))
    value[spec.name] = spec.many ? records : records[0] || null
  }
  return value
}
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value
const revision = (record) => $security.sha256(JSON.stringify(canonical(record)))
const read = (app, name, id) => {
  definition(name)
  const record = readRecord(app, app.findRecordById(name, id), fields({ collection: name }))
  return { record, revision: revision(record) }
}
const list = (app, name) => {
  const spec = definition(name)
  return app.findRecordsByFilter(name, '', spec.sort || '-created', 1000).map((record) => read(app, name, record.id))
}
const text = (value, limit) => {
  if (typeof value !== 'string' || value.length > limit) throw new BadRequestError('Invalid text value.')
  return value.trim()
}
const validLink = (value) =>
  !value || /^(https?:\/\/[^\s/]+(?:[/?#][^\s]*)?|tel:[+0-9() .-]+|mailto:[^\s@]+@[^\s@]+)$/i.test(value)
const writeRecord = (app, name, specs, input, current, uploads, assigned = {}) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BadRequestError('Invalid content record.')
  if (input.id && (!current || input.id !== current.id))
    throw new BadRequestError('This record does not belong to the edited content.')
  const record = current ? app.findRecordById(name, current.id) : new Record(app.findCollectionByNameOrId(name))
  for (const key of Object.keys(assigned)) record.set(key, assigned[key])
  for (const spec of specs) {
    if (spec.type === 'children' || spec.type === 'membership') continue
    const value = input[spec.name]
    if (spec.immutable && current?.[spec.name]) continue
    const required =
      spec.required && (!spec.showWhen || spec.showWhen.values.includes(input[spec.showWhen.field] || ''))
    if (
      required &&
      spec.type !== 'localized' &&
      (value === '' || value == null || (Array.isArray(value) && !value.length))
    )
      throw new BadRequestError(spec.label.split(' / ')[0] + ' is required.')
    if (spec.type === 'localized') {
      for (const locale of locales) {
        const key = spec.name + '_' + locale
        if (required && !String(input[key] || '').trim())
          throw new BadRequestError(spec.label.split(' / ')[0] + ' is required in ' + locale.toUpperCase() + '.')
        record.set(key, text(input[key] ?? '', spec.multiline ? 100000 : 10000))
      }
    } else if (spec.type === 'owned') {
      const values = spec.many ? value : value ? [value] : []
      if (!Array.isArray(values) || values.length > 100) throw new BadRequestError('Use up to 100 content items.')
      const previous = spec.many ? current?.[spec.name] || [] : [current?.[spec.name]].filter(Boolean)
      const used = new Set()
      const ids = values.map((item) => {
        if (item.id && used.has(item.id)) throw new BadRequestError('Duplicate content item.')
        const old = item.id ? previous.find((candidate) => candidate.id === item.id) : null
        if (item.id && !old) throw new BadRequestError('Content item belongs to another section.')
        const saved = writeRecord(app, spec.collection, fields(spec), item, old, uploads)
        used.add(saved.id)
        return saved.id
      })
      record.set(spec.name, spec.many ? ids : ids[0] || '')
    } else if (spec.type === 'file') {
      const values = spec.many ? value || [] : value ? [value] : []
      const previous = Array.isArray(current?.[spec.name]) ? current[spec.name] : [current?.[spec.name]].filter(Boolean)
      if (!Array.isArray(values) || values.length > (spec.many ? 30 : 1) || new Set(values).size !== values.length)
        throw new BadRequestError('Invalid media selection.')
      record.set(
        spec.name,
        values.map((filename) => {
          if (typeof filename !== 'string') throw new BadRequestError('Invalid media file.')
          if (filename.startsWith('@upload:')) {
            const index = Number(filename.slice(8))
            if (!Number.isInteger(index) || index < 0 || !uploads[index])
              throw new BadRequestError('Missing media upload.')
            return uploads[index]
          }
          if (!previous.includes(filename)) throw new BadRequestError('Media does not belong to this record.')
          return filename
        }),
      )
    } else if (spec.type === 'relation') {
      const values = spec.many ? value || [] : value ? [value] : []
      if (!Array.isArray(values) || values.length > 100 || new Set(values).size !== values.length)
        throw new BadRequestError('Invalid relation selection.')
      for (const id of values) app.findRecordById(spec.collection, text(id, 100))
      record.set(spec.name, spec.many ? values : values[0] || '')
    } else if (spec.type === 'bool') {
      if (typeof value !== 'boolean') throw new BadRequestError('Invalid checkbox value.')
      record.set(spec.name, value)
    } else if (spec.type === 'number') {
      if (value !== '' && value !== null && !Number.isFinite(Number(value)))
        throw new BadRequestError('Invalid number.')
      record.set(spec.name, value === '' || value == null ? 0 : Number(value))
    } else if (spec.type === 'select' && spec.many) {
      if (!Array.isArray(value) || value.some((item) => !spec.options.includes(item)))
        throw new BadRequestError('Invalid selection.')
      record.set(spec.name, value)
    } else {
      const result = text(value ?? '', spec.multiline ? 100000 : 10000)
      if (['link', 'url'].includes(spec.type) && !validLink(result))
        throw new BadRequestError('Use an HTTP(S), phone or email link.')
      if (spec.type === 'date' && result && !Number.isFinite(Date.parse(result)))
        throw new BadRequestError('Invalid date.')
      record.set(spec.name, spec.type === 'date' && result ? new Date(result).toISOString() : result)
    }
  }
  if (!record.id) record.set('id', $security.randomStringWithAlphabet(15, 'abcdefghijklmnopqrstuvwxyz0123456789'))
  if (['t_staff', 't_play', 't_course'].includes(name)) require(__hooks + '/lib/theater_slug.js').assign(app, record)
  if (['t_festival', 't_blog_post'].includes(name) && !record.getString('slug')) {
    const title =
      input.title_en || input.title_ru || input.intro_block?.title_en || input.intro_block?.title_ru || name.slice(2)
    record.set('slug', require(__hooks + '/lib/theater_slug.js').slugify(title) + '-' + record.id.slice(0, 6))
  }
  if (name === 't_festival' && record.getString('ends_at') < record.getString('starts_at'))
    throw new BadRequestError('The festival must end after it starts.')
  if (name === 't_blog_post') {
    // The editor reads these from the uploaded image, not from editable inputs.
    if (input.cover !== current?.cover) {
      for (const field of ['cover_width', 'cover_height']) {
        const size = input.cover ? Number(input[field]) : 0
        if (!Number.isInteger(size) || size < 0 || size > 30000 || (input.cover && size === 0))
          throw new BadRequestError('Missing image dimensions. Choose the cover again.')
        record.set(field, size)
      }
    }
  }
  app.save(record)
  for (const spec of specs.filter((field) => field.type === 'children' || field.type === 'membership')) {
    const values = input[spec.name] || []
    if (!Array.isArray(values) || values.length > 100) throw new BadRequestError('Use up to 100 content items.')
    const previous = current?.[spec.name] || []
    if (spec.type === 'membership') {
      if (new Set(values).size !== values.length) throw new BadRequestError('Duplicate selection.')
      for (const id of new Set([...previous, ...values])) {
        const target = app.findRecordById(spec.collection, text(id, 100))
        const ids = target.getStringSlice(spec.via).filter((value) => value !== record.id)
        if (values.includes(id)) ids.push(record.id)
        target.set(spec.via, ids)
        app.save(target)
      }
      continue
    }
    const used = new Set()
    values.forEach((item, index) => {
      const old = item.id ? previous.find((candidate) => candidate.id === item.id) : null
      if (item.id && (!old || used.has(item.id)))
        throw new BadRequestError('Content item belongs to another page or is duplicated.')
      const parent = spec.viaMany ? [...new Set([...(old?.[spec.via] || []), record.id])] : record.id
      const extras = { [spec.via]: parent }
      if (spec.sort === 'sort_order') extras.sort_order = index
      const child = writeRecord(app, spec.collection, fields(spec), item, old, uploads, extras)
      used.add(child.id)
    })
    for (const old of previous.filter((item) => !used.has(item.id))) {
      const child = app.findRecordById(spec.collection, old.id)
      if (spec.detach) {
        child.set(
          spec.via,
          child.getStringSlice(spec.via).filter((id) => id !== record.id),
        )
        app.save(child)
      } else app.delete(child)
    }
  }
  return record
}
const save = (app, name, id, input, uploads) => {
  const spec = definition(name)
  let result
  app.runInTransaction((tx) => {
    if (!id && spec.singleton && tx.countRecords(name))
      throw new ApiError(409, 'This page already exists. Reload before editing.')
    const current = id ? read(tx, name, id) : null
    if ((current?.revision || '') !== input.revision) throw new ApiError(409, 'Content changed. Reload before saving.')
    const record = writeRecord(tx, name, fields({ collection: name }), input.record, current?.record, uploads)
    result = read(tx, name, record.id)
  })
  return result
}
const remove = (app, name, id, input) => {
  if (definition(name).singleton) throw new BadRequestError('A page cannot be deleted.')
  app.runInTransaction((tx) => {
    if (read(tx, name, id).revision !== input.revision)
      throw new ApiError(409, 'Content changed. Reload before deleting.')
    for (const spec of fields({ collection: name }).filter((field) => field.type === 'children')) {
      for (const child of related(tx, spec, id)) {
        if (spec.detach) {
          child.set(
            spec.via,
            child.getStringSlice(spec.via).filter((value) => value !== id),
          )
          tx.save(child)
        } else tx.delete(child)
      }
    }
    tx.delete(tx.findRecordById(name, id))
  })
}
const reorder = (app, name, input) => {
  if (definition(name).sort !== 'sort_order') throw new BadRequestError('This collection has no manual order.')
  app.runInTransaction((tx) => {
    const records = list(tx, name)
    if (
      input.revision !== revision(records) ||
      !Array.isArray(input.ids) ||
      input.ids.length !== records.length ||
      new Set(input.ids).size !== records.length ||
      input.ids.some((id) => !records.some((entry) => entry.record.id === id))
    )
      throw new ApiError(409, 'The collection changed. Reload before saving its order.')
    input.ids.forEach((id, index) => {
      const record = tx.findRecordById(name, id)
      record.set('sort_order', index)
      tx.save(record)
    })
  })
  return { items: list(app, name), revision: revision(list(app, name)) }
}
module.exports = { canEdit, definition, list, read, save, remove, reorder, revision }
