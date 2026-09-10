/// <reference path="../pb_data/types.d.ts" />

// Track in the same transaction as the content, including custom editor routes.
onRecordCreateExecute((e) => require(__hooks + '/lib/site_publication.js').trackChange(e, 'create'))
onRecordUpdateExecute((e) => require(__hooks + '/lib/site_publication.js').trackChange(e, 'update'))
onRecordDeleteExecute((e) => require(__hooks + '/lib/site_publication.js').trackChange(e, 'delete'))

routerAdd(
  'GET',
  '/api/publication',
  (e) => e.json(200, { sites: require(__hooks + '/lib/site_publication.js').status(e.app, e.auth) }),
  $apis.requireAuth('_superusers', '_user_staff'),
)

routerAdd(
  'POST',
  '/api/publication',
  (e) => e.json(200, require(__hooks + '/lib/site_publication.js').publish(e.app, e.auth)),
  $apis.requireAuth('_superusers', '_user_staff'),
)
