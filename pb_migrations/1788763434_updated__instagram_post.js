/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_instagram_post')

    // update collection data
    unmarshal(
      {
        indexes: ['CREATE UNIQUE INDEX `idx_instagram_post_instagramId` ON `t_instagram_post` (`instagramId`)'],
        name: 't_instagram_post',
      },
      collection,
    )

    return app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pbc_instagram_post')

    // update collection data
    unmarshal(
      {
        indexes: ['CREATE UNIQUE INDEX `idx_instagram_post_instagramId` ON `_instagram_post` (`instagramId`)'],
        name: '_instagram_post',
      },
      collection,
    )

    return app.save(collection)
  },
)
