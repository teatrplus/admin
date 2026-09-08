/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    for (const record of app.findRecordsByFilter('t_blog_post', 'cover = {:cover}', '', 0, 0, {
      cover: 'fest_cover_96nay6vo4x.jpg',
    })) {
      // Measured from this replacement cover; do not change other editorial uploads.
      record.set('cover_width', 1600)
      record.set('cover_height', 1717)
      app.save(record)
    }
  },
  () => {
    // Keep the corrected dimensions; the previous values described another image.
  },
)
