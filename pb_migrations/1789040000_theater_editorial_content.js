/// <reference path="../pb_data/types.d.ts" />
// This snapshot belongs to the migration. Runtime editor definitions can evolve independently.
migrate(
  (app) => {
    const read = (name) => JSON.parse(toString($os.readFile(__hooks + '/../pb_migrations/' + name)))
    const schema = read('content-schema.json')
    const seed = read('content-seed.json')
    const editor =
      "@request.auth.collectionName = '_user_staff' && (@request.auth.role = 'admin' || (@request.auth.role = 'moderator' && @request.auth.scope:each ?= 'theater'))"
    const locales = ['ru', 'en', 'uz']
    const fields = (definition) => definition.fields || schema[definition.collection].sections.flatMap((s) => s.fields)
    for (const definition of Object.values(schema)) {
      let collection
      try {
        collection = app.findCollectionByNameOrId(definition.name)
      } catch {
        collection = new Collection({ name: definition.name, type: 'base' })
      }
      app.save(collection)
    }
    const addField = (collection, spec) => {
      if (spec.type === 'localized') {
        for (const locale of locales) addField(collection, { ...spec, name: spec.name + '_' + locale, type: 'text' })
        return
      }
      if (collection.fields.getByName(spec.name)) return
      const options = { name: spec.name, required: Boolean(spec.required) }
      let field
      switch (spec.type) {
        case 'owned':
        case 'relation':
          field = new RelationField({
            ...options,
            collectionId: app.findCollectionByNameOrId(spec.collection).id,
            maxSelect: spec.many ? 100 : 1,
            cascadeDelete: false,
          })
          break
        case 'file':
          field = new FileField({
            ...options,
            maxSelect: spec.many ? 30 : 1,
            maxSize: spec.video ? 150 * 1024 * 1024 : 10 * 1024 * 1024,
            mimeTypes: spec.video
              ? ['video/mp4', 'video/webm']
              : ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
          })
          break
        case 'bool':
          field = new BoolField(options)
          break
        case 'number':
          field = new NumberField(options)
          break
        case 'date':
          field = new DateField(options)
          break
        case 'url':
          field = new URLField(options)
          break
        case 'email':
          field = new EmailField(options)
          break
        case 'select':
          field = new SelectField({ ...options, values: spec.options, maxSelect: spec.many ? spec.options.length : 1 })
          break
        default:
          field = new TextField({ ...options, max: spec.multiline ? 100000 : 10000 })
      }
      collection.fields.add(field)
    }
    for (const definition of Object.values(schema)) {
      const collection = app.findCollectionByNameOrId(definition.name)
      for (const field of fields({ collection: definition.name })) addField(collection, field)
      if (!collection.fields.getByName('updated'))
        collection.fields.add(new AutodateField({ name: 'updated', onCreate: true, onUpdate: true }))
      if (!collection.fields.getByName('created'))
        collection.fields.add(new AutodateField({ name: 'created', onCreate: true }))
      const publicRule =
        definition.name === 't_festival' ? 'published = true' : String(collection.listRule || '').trim()
      collection.listRule = publicRule ? '(' + publicRule + ') || (' + editor + ')' : ''
      collection.viewRule = collection.listRule
      collection.createRule = editor
      collection.updateRule = editor
      collection.deleteRule = definition.singleton ? null : editor
      if (definition.singleton) {
        const index = 'CREATE UNIQUE INDEX idx_' + definition.name + '_singleton ON ' + definition.name + ' ((1))'
        if (!collection.indexes.includes(index)) collection.indexes.push(index)
      }
      if (definition.name === 't_festival') {
        collection.fields.add(
          new TextField({ name: 'slug', required: true, max: 180, pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' }),
        )
        collection.indexes.push('CREATE UNIQUE INDEX idx_t_festival_slug ON t_festival (slug)')
      }
      try {
        app.save(collection)
      } catch (error) {
        throw new Error(definition.name + ': ' + error)
      }
    }
    // Editorial calls to action include phone and email links. All rendering paths validate schemes.
    const buttons = app.findCollectionByNameOrId('_button')
    const oldUrl = buttons.fields.getByName('url')
    const buttonUrls = app.findAllRecords('_button').map((record) => [record.id, record.getString('url')])
    oldUrl.name = 'legacy_http_url'
    buttons.fields.add(oldUrl)
    app.save(buttons)
    buttons.fields.add(
      new TextField({
        name: 'url',
        max: 2048,
        pattern: '^(https?://[^\\s]+|tel:[+0-9() .-]+|mailto:[^\\s@]+@[^\\s@]+)?$',
      }),
    )
    app.save(buttons)
    for (const [id, url] of buttonUrls) {
      const record = app.findRecordById('_button', id)
      record.set('url', url)
      app.save(record)
    }
    buttons.fields.removeByName('legacy_http_url')
    app.save(buttons)

    const write = (collectionName, data, specs, existing) => {
      const collection = app.findCollectionByNameOrId(collectionName)
      const record = existing || new Record(collection)
      for (const spec of specs) {
        if (spec.type === 'localized') {
          for (const locale of locales) {
            const key = spec.name + '_' + locale
            if (key in data && !record.getString(key)) record.set(key, data[key])
          }
          continue
        }
        if (!(spec.name in data)) continue
        const old = record.get(spec.name)
        if (existing && old && (!Array.isArray(old) || old.length)) continue
        let value = data[spec.name]
        if (spec.type === 'owned') {
          const values = spec.many ? value : [value]
          const ids = values.map((item) => write(spec.collection, item, fields(spec)).id)
          value = spec.many ? ids : ids[0]
        } else if (spec.type === 'file' && typeof value === 'string' && value.startsWith('@asset:')) {
          value = $filesystem.fileFromPath(__hooks + '/../pb_migrations/content-assets/' + value.slice(7))
        } else if (spec.type === 'relation') {
          const resolve = (id) => {
            if (!id.startsWith('@')) return id
            const isMask = id.startsWith('@mask:')
            const found = isMask
              ? app.findRecordsByFilter('t_mask', 'legacy_slug = {:value}', '', 2, 0, { value: id.slice(6) })
              : app
                  .findAllRecords('t_play')
                  .filter((record) => record.getString('title_ru').replace(/\s+/g, ' ') === id.slice(6))
            if (found.length !== 1) throw new Error('Cannot resolve seed relation ' + id)
            return found[0].id
          }
          value = spec.many ? value.map(resolve) : resolve(value)
        }
        record.set(spec.name, value)
      }
      app.save(record)
      return record
    }
    for (const [name, records] of Object.entries(seed)) {
      const existing = schema[name].singleton ? app.findAllRecords(name) : []
      if (existing.length > 1) throw new Error('Expected at most one ' + name)
      for (const data of records) write(name, data, fields({ collection: name }), existing[0])
    }
    // Replace auth-record phone relations with public phone records, preserving any existing selections.
    const contacts = app.findAllRecords('t_contact')
    for (const record of contacts) {
      for (const [oldName, newName] of [
        ['cashier_phone', 'box_office_phones'],
        ['administration_phone', 'administration_phones'],
      ]) {
        const ids = record.getStringSlice(newName)
        const numbers = ids.map((id) =>
          app.findRecordById('t_contact_phone', id).getString('number').replace(/\D/g, ''),
        )
        for (const id of record.getStringSlice(oldName)) {
          const person = app.findRecordById('_user_staff', id)
          const number = person.getString('phone_number')
          if (number && !numbers.includes(number.replace(/\D/g, ''))) {
            const phone = new Record(app.findCollectionByNameOrId('t_contact_phone'), { number })
            app.save(phone)
            ids.push(phone.id)
          }
        }
        record.set(newName, ids)
      }
      app.save(record)
    }
    const contactCollection = app.findCollectionByNameOrId('t_contact')
    contactCollection.fields.removeByName('cashier_phone')
    contactCollection.fields.removeByName('administration_phone')
    app.save(contactCollection)
    // Existing museum CRUD now has the same scope as the other theater editors.
    const masks = app.findCollectionByNameOrId('t_mask')
    masks.createRule = editor
    masks.updateRule = editor
    masks.deleteRule = editor
    app.save(masks)
  },
  () => {
    // Preserve editorial records and uploaded media on rollback. Restore from a backup for a destructive rollback.
  },
)
