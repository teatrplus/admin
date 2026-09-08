/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const fields = [
      new TextField({ name: 'slug', required: true, max: 180, pattern: '^[a-z0-9]+(-[a-z0-9]+)*$' }),
      new BoolField({ name: 'published' }),
      new BoolField({ name: 'sample' }),
      new DateField({ name: 'published_at', required: true }),
      new FileField({
        name: 'cover',
        required: true,
        maxSelect: 1,
        maxSize: 15000000,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        thumbs: ['800x0', '1600x0'],
      }),
      new FileField({
        name: 'gallery',
        maxSelect: 30,
        maxSize: 15000000,
        mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }),
      new NumberField({ name: 'cover_width', min: 1, onlyInt: true, required: true }),
      new NumberField({ name: 'cover_height', min: 1, onlyInt: true, required: true }),
    ]
    for (const locale of ['ru', 'en', 'uz']) {
      for (const name of [
        'title',
        'excerpt',
        'body',
        'category',
        'author',
        'cover_alt',
        'gallery_alt',
        'photo_credit',
      ]) {
        fields.push(
          new TextField({
            name: `${name}_${locale}`,
            required: ['title', 'excerpt', 'body', 'category', 'author', 'cover_alt'].includes(name),
            max: name === 'body' ? 100000 : 2000,
          }),
        )
      }
    }
    const collection = new Collection({
      type: 'base',
      name: 't_blog_post',
      listRule: 'published = true && published_at <= @now',
      viewRule: 'published = true && published_at <= @now',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      indexes: [
        'CREATE UNIQUE INDEX idx_t_blog_post_slug ON t_blog_post (slug)',
        'CREATE INDEX idx_t_blog_post_date ON t_blog_post (published, published_at)',
      ],
    })
    for (const field of fields) collection.fields.add(field)
    app.save(collection)
  },
  () => {
    // Retain editorial content and uploaded files on rollback.
  },
)
