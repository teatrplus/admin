/// <reference path="../pb_data/types.d.ts" />
routerAdd(
  'GET',
  '/api/theater/home',
  (e) => {
    const lib = require(__hooks + '/lib/theater_home.js')
    if (!lib.canEditHome(e.auth)) throw new ForbiddenError('Only theater moderators and admins can edit the homepage.')
    return e.json(200, lib.readHome(e.app))
  },
  $apis.requireAuth('_superusers', '_user_staff'),
)

routerAdd(
  'POST',
  '/api/theater/home',
  (e) => {
    const lib = require(__hooks + '/lib/theater_home.js')
    if (!lib.canEditHome(e.auth)) throw new ForbiddenError('Only theater moderators and admins can edit the homepage.')
    let input
    try {
      input = JSON.parse(e.requestInfo().body.content)
    } catch {
      throw new BadRequestError('Invalid homepage content.')
    }
    if (!input || typeof input !== 'object') throw new BadRequestError('Invalid homepage content.')
    const uploaded = (field) => {
      if (!e.request.header.get('Content-Type').startsWith('multipart/form-data')) return []
      try {
        return e.findUploadedFiles(field)
      } catch (error) {
        if (String(error).includes('http: no such file')) return []
        throw error
      }
    }
    return e.json(
      200,
      lib.saveHome(e.app, input, {
        instagram_avatar: uploaded('instagram_avatar'),
        bottom_image: uploaded('bottom_image'),
      }),
    )
  },
  $apis.requireAuth('_superusers', '_user_staff'),
  $apis.bodyLimit(25 * 1024 * 1024),
)
