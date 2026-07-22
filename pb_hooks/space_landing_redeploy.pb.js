/// <reference path="../pb_data/types.d.ts" />

/**
 * CMS edits → Cloudflare Pages rebuild (space landing is SSG).
 * Runs after persistence so a deploy-hook failure never blocks editors.
 */
const redeploy = require(`${__hooks}/lib/trigger_pages_deploy.js`)

const CMS_COLLECTIONS = [
  'space_landing',
  'space_venue_item',
  'space_advantage_item',
  'space_gallery_item',
  'space_process_item',
  'staff',
]

const onCmsChange = (collectionName) => (event) => {
  const error = redeploy.triggerPagesDeploy(collectionName)
  if (!error) return

  $app.logger().error(
    'cloudflare pages deploy hook failed',
    'collection',
    collectionName,
    'recordId',
    event.record?.id ?? '',
    'detail',
    error,
  )
}

for (const name of CMS_COLLECTIONS) {
  onRecordAfterCreateSuccess(onCmsChange(name), name)
  onRecordAfterUpdateSuccess(onCmsChange(name), name)
  onRecordAfterDeleteSuccess(onCmsChange(name), name)
}
