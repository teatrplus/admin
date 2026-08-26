/// <reference path="../pb_data/types.d.ts" />

/**
 * Instagram preview refresh (homepage SSG).
 *
 * POST /api/instagram/refresh starts a Bright Data snapshot and returns immediately.
 * GET  /api/instagram/refresh ticks progress (also run every minute) and returns job status.
 * Daily cron only starts a job; it does not wait for Bright Data.
 *
 * PocketBase only allows require() inside hook callbacks — not at file top level.
 */

cronAdd('instagram_refresh', '23 4 * * *', () => {
  const { startInstagramRefresh } = require(`${__hooks}/lib/instagram_refresh.js`)
  const result = startInstagramRefresh('cron')

  if (result.httpStatus === 202) {
    $app.logger().info('instagram daily refresh started', 'snapshotId', result.body.snapshotId || '')
    return
  }

  if (result.httpStatus === 409) {
    $app.logger().info('instagram daily refresh skipped', 'reason', 'already running')
    return
  }

  $app.logger().error('instagram daily refresh failed to start', 'detail', result.body.error || '')
})

cronAdd('instagram_refresh_tick', '* * * * *', () => {
  const { tickInstagramRefresh } = require(`${__hooks}/lib/instagram_refresh.js`)
  tickInstagramRefresh()
})

routerAdd(
  'POST',
  '/api/instagram/refresh',
  (e) => {
    const lib = require(`${__hooks}/lib/instagram_refresh.js`)

    if (!lib.canRefreshInstagram(e.auth)) {
      return e.json(403, {
        ok: false,
        error: 'Only admins and moderators can refresh Instagram posts',
      })
    }

    const result = lib.startInstagramRefresh('manual')
    return e.json(result.httpStatus, result.body)
  },
  $apis.requireAuth('_superusers', 'staff'),
)

routerAdd(
  'GET',
  '/api/instagram/refresh',
  (e) => {
    const lib = require(`${__hooks}/lib/instagram_refresh.js`)

    if (!lib.canRefreshInstagram(e.auth)) {
      return e.json(403, {
        ok: false,
        error: 'Only admins and moderators can refresh Instagram posts',
      })
    }

    const result = lib.tickInstagramRefresh()
    return e.json(result.httpStatus, result.body)
  },
  $apis.requireAuth('_superusers', 'staff'),
)
