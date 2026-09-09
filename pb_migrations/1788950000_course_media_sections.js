/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const sections = app.findCollectionByNameOrId('t_course_section')
    const kind = sections.fields.getByName('kind')
    kind.values = [...kind.values, 'gallery', 'teaser']
    kind.help =
      'Program and FAQ expand. Gallery shows selected library photos; teaser embeds a YouTube video. Other kinds remain visible.'
    sections.fields.add(
      new RelationField({
        name: 'gallery',
        collectionId: app.findCollectionByNameOrId('t_media_library').id,
        maxSelect: 100,
        cascadeDelete: false,
        help: 'For gallery sections: select library photos in display order. Captions, alt text and people tags are reused. Course tags are not required.',
      }),
    )
    sections.fields.add(
      new URLField({
        name: 'teaser_url',
        onlyDomains: [
          'youtube.com',
          'www.youtube.com',
          'm.youtube.com',
          'music.youtube.com',
          'youtu.be',
          'youtube-nocookie.com',
          'www.youtube-nocookie.com',
        ],
        help: 'For teaser sections: a YouTube watch, share, Shorts, live or embed URL. Optional start time is preserved. Empty or unrecognized videos are hidden.',
      }),
    )
    app.save(sections)
  },
  () => {
    // Preserve media selections and teaser URLs on rollback.
  },
)
