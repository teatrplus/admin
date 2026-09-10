/// <reference path="../pb_data/types.d.ts" />
routerAdd(
  'POST',
  '/api/theater/museum-page',
  (e) => {
    const lib = require(__hooks + '/lib/museum_page.js')
    if (!lib.canEditMuseum(e.auth)) throw new ForbiddenError('Museum editing requires theater content access.')
    let input
    try {
      input = JSON.parse(e.requestInfo().body.content)
    } catch {
      throw new BadRequestError('Invalid museum content.')
    }
    if (!input || typeof input !== 'object') throw new BadRequestError('Invalid museum content.')
    let uploads = []
    if (e.request.header.get('Content-Type').startsWith('multipart/form-data')) {
      try {
        uploads = e.findUploadedFiles('excursion_photos')
      } catch (error) {
        if (!String(error).includes('http: no such file')) throw error
      }
    }
    return e.json(200, lib.saveMuseumPage(e.app, input, uploads))
  },
  $apis.requireAuth('_superusers', '_user_staff'),
  $apis.bodyLimit(310 * 1024 * 1024),
)
