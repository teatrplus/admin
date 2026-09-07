/// <reference path="../pb_data/types.d.ts" />

/**
 * CMS edits → Cloudflare Pages rebuild (space landing is SSG).
 * Runs after persistence so a deploy-hook failure never blocks editors.
 *
 * Only s_landing + _user_staff: the landing editor upserts child collections first,
 * then updates s_landing once. Hooking every child record blocked the save UI
 * with repeated Cloudflare API calls (list/delete/hook per row).
 *
 * PocketBase only allows require() inside hook callbacks — not at file top level.
 */
onRecordAfterCreateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('s_landing', event)
}, 's_landing')

onRecordAfterUpdateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('s_landing', event)
}, 's_landing')

onRecordAfterDeleteSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('s_landing', event)
}, 's_landing')

onRecordAfterCreateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('_user_staff', event)
}, '_user_staff')

onRecordAfterUpdateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('_user_staff', event)
}, '_user_staff')

onRecordAfterDeleteSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('_user_staff', event)
}, '_user_staff')
