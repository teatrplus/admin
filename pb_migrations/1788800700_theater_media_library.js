/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = new Collection({
      type: 'base',
      name: 't_media_library',
      listRule: '',
      viewRule: '',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          type: 'file',
          name: 'image',
          required: true,
          maxSelect: 1,
          maxSize: 52428800,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'],
          help: 'One gallery image. Upload once and tag all relevant plays and people.',
        },
        {
          type: 'relation',
          name: 'plays',
          collectionId: app.findCollectionByNameOrId('t_play').id,
          maxSelect: 100,
          cascadeDelete: false,
          help: 'Plays shown in this image. The image appears in each play gallery.',
        },
        {
          type: 'relation',
          name: 'staff',
          collectionId: app.findCollectionByNameOrId('t_staff').id,
          maxSelect: 100,
          cascadeDelete: false,
          help: 'People actually pictured, including production staff. Appears in each tagged person’s gallery; does not assign play credits.',
        },
        {
          type: 'number',
          name: 'sort_order',
          onlyInt: true,
          min: 0,
          help: 'Lower numbers appear first. Ties use the record ID.',
        },
        {
          type: 'text',
          name: 'source_key',
          hidden: true,
          help: 'Original gallery file key for the one-time import. Leave empty for new uploads.',
        },
        ...['ru', 'en', 'uz'].flatMap((locale) => [
          {
            type: 'text',
            name: `alt_${locale}`,
            max: 1000,
            help: 'Describe what is visible for someone who cannot see the photo.',
          },
          { type: 'text', name: `description_${locale}`, max: 5000, help: 'Optional visible caption. Plain text.' },
        ]),
      ],
      indexes: ["CREATE UNIQUE INDEX idx_media_source ON t_media_library (source_key) WHERE source_key != ''"],
    })
    app.save(collection)

    const fs = app.newFilesystem()
    try {
      for (const name of ['t_play', 't_staff']) {
        const source = app.findCollectionByNameOrId(name)
        for (const owner of app.findAllRecords(name)) {
          Array.from(owner.getStringSlice('gallery')).forEach((filename, index) => {
            const key = `${source.id}/${owner.id}/${filename}`
            const item = new Record(collection)
            item.set('image', fs.getReuploadableFile(key, true))
            item.set('source_key', key)
            item.set('sort_order', index)
            item.set(name === 't_play' ? 'plays' : 'staff', [owner.id])
            app.save(item)
          })
        }
        source.fields.getByName('gallery').help =
          'Legacy originals retained for recovery. Manage gallery photos, captions and people in t_media_library.'
        app.save(source)
      }
    } finally {
      fs.close()
    }
  },
  () => {
    // Retain uploaded files and editorial tags on rollback; deleting this collection would lose content.
  },
)
