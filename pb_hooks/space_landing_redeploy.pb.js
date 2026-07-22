/// <reference path="../pb_data/types.d.ts" />

/**
 * CMS edits → Cloudflare Pages rebuild (space landing is SSG).
 * Runs after persistence so a deploy-hook failure never blocks editors.
 *
 * Only space_landing + staff: the landing editor upserts child collections first,
 * then updates space_landing once. Hooking every child record blocked the save UI
 * with repeated Cloudflare API calls (list/delete/hook per row).
 *
 * PocketBase only allows require() inside hook callbacks — not at file top level.
 */
onRecordAfterCreateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('space_landing', event)
}, 'space_landing')

onRecordAfterUpdateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('space_landing', event)
}, 'space_landing')

onRecordAfterDeleteSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('space_landing', event)
}, 'space_landing')

onRecordAfterCreateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('staff', event)
}, 'staff')

onRecordAfterUpdateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('staff', event)
}, 'staff')

onRecordAfterDeleteSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('staff', event)
}, 'staff')
