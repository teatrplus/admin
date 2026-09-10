/// <reference path="../pb_data/types.d.ts" />
routerAdd(
  'POST',
  '/api/theater/mask-order',
  (e) => {
    const { canEditMuseum } = require(__hooks + '/lib/museum_page.js')
    if (!canEditMuseum(e.auth)) throw new ForbiddenError('Mask ordering requires theater content access.')
    const { saveMaskOrder } = require(__hooks + '/lib/mask_order.js')
    return e.json(200, saveMaskOrder(e.app, e.requestInfo().body))
  },
  $apis.requireAuth('_superusers', '_user_staff'),
)
