/// <reference path="../pb_data/types.d.ts" />
routerAdd(
  'GET',
  '/api/theater/content/{collection}',
  (e) => {
    const lib = require(__hooks + '/lib/theater_content.js')
    if (!lib.canEdit(e.auth)) throw new ForbiddenError('Only theater moderators and admins can edit content.')
    const items = lib.list(e.app, e.request.pathValue('collection'))
    return e.json(200, { items, revision: lib.revision(items) })
  },
  $apis.requireAuth('_superusers', '_user_staff'),
)

routerAdd(
  'POST',
  '/api/theater/content/{collection}/{id}',
  (e) => {
    const lib = require(__hooks + '/lib/theater_content.js')
    if (!lib.canEdit(e.auth)) throw new ForbiddenError('Only theater moderators and admins can edit content.')
    let input
    try {
      input = JSON.parse(e.requestInfo().body.content)
    } catch {
      throw new BadRequestError('Invalid content.')
    }
    let files = []
    if (e.request.header.get('Content-Type').startsWith('multipart/form-data')) {
      try {
        files = e.findUploadedFiles('files')
      } catch (error) {
        if (!String(error).includes('http: no such file')) throw error
      }
    }
    const id = e.request.pathValue('id')
    return e.json(200, lib.save(e.app, e.request.pathValue('collection'), id === 'new' ? '' : id, input, files))
  },
  $apis.requireAuth('_superusers', '_user_staff'),
  $apis.bodyLimit(200 * 1024 * 1024),
)

routerAdd(
  'DELETE',
  '/api/theater/content/{collection}/{id}',
  (e) => {
    const lib = require(__hooks + '/lib/theater_content.js')
    if (!lib.canEdit(e.auth)) throw new ForbiddenError('Only theater moderators and admins can edit content.')
    lib.remove(e.app, e.request.pathValue('collection'), e.request.pathValue('id'), e.requestInfo().body)
    return e.noContent(204)
  },
  $apis.requireAuth('_superusers', '_user_staff'),
)

routerAdd(
  'POST',
  '/api/theater/content-order/{collection}',
  (e) => {
    const lib = require(__hooks + '/lib/theater_content.js')
    if (!lib.canEdit(e.auth)) throw new ForbiddenError('Only theater moderators and admins can edit content.')
    return e.json(200, lib.reorder(e.app, e.request.pathValue('collection'), e.requestInfo().body))
  },
  $apis.requireAuth('_superusers', '_user_staff'),
)
