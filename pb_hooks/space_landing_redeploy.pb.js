/// <reference path="../pb_data/types.d.ts" />

/**
 * CMS edits → Cloudflare Pages rebuild (space landing is SSG).
 * Runs after persistence so a deploy-hook failure never blocks editors.
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
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('space_venue_item', event)
}, 'space_venue_item')

onRecordAfterUpdateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('space_venue_item', event)
}, 'space_venue_item')

onRecordAfterDeleteSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('space_venue_item', event)
}, 'space_venue_item')

onRecordAfterCreateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('space_advantage_item', event)
}, 'space_advantage_item')

onRecordAfterUpdateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('space_advantage_item', event)
}, 'space_advantage_item')

onRecordAfterDeleteSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('space_advantage_item', event)
}, 'space_advantage_item')

onRecordAfterCreateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('space_gallery_item', event)
}, 'space_gallery_item')

onRecordAfterUpdateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('space_gallery_item', event)
}, 'space_gallery_item')

onRecordAfterDeleteSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('space_gallery_item', event)
}, 'space_gallery_item')

onRecordAfterCreateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('space_process_item', event)
}, 'space_process_item')

onRecordAfterUpdateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('space_process_item', event)
}, 'space_process_item')

onRecordAfterDeleteSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('space_process_item', event)
}, 'space_process_item')

onRecordAfterCreateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('staff', event)
}, 'staff')

onRecordAfterUpdateSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('staff', event)
}, 'staff')

onRecordAfterDeleteSuccess((event) => {
  require(`${__hooks}/lib/trigger_pages_deploy.js`).onCmsRecordChange('staff', event)
}, 'staff')
