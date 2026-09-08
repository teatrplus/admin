/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('t_blog_post')
    for (const name of ['category', 'category_ru', 'category_en', 'category_uz']) {
      collection.fields.removeByName(name)
    }
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('t_blog_post')
    // Removed values cannot be recovered; rollback restores optional empty fields.
    for (const locale of ['ru', 'en', 'uz']) {
      collection.fields.add(new TextField({ name: `category_${locale}`, max: 2000 }))
    }
    app.save(collection)
  },
)
