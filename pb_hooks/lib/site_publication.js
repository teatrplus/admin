const SITES = ['landing', 'theater']
const HOOK_ENV = {
  landing: 'SPACE_PAGES_DEPLOY_HOOK_URL',
  theater: 'WEBSITE_PAGES_DEPLOY_HOOK_URL',
}

const allowedSites = (auth) => {
  if (!auth) return []
  if (auth.collection().name === '_superusers') return SITES
  if (auth.collection().name !== '_user_staff') return []
  const role = auth.getString('role')
  if (role === 'admin') return SITES
  if (role !== 'moderator') return []
  const scopes = auth.getStringSlice('scope')
  return SITES.filter((site) => scopes.includes(site === 'landing' ? 'space' : 'theater'))
}

const contentSite = (collection) => {
  if (['s_request', 't_request', 't_inquiry', 't_instagram_post', 't_instagram_sync'].includes(collection)) return null
  if (collection.startsWith('s_')) return 'landing'
  if (collection.startsWith('t_') || ['_copy_block', '_button'].includes(collection)) return 'theater'
  return null
}

const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, canonical(value[key])]),
        )
      : value

const contentValue = (record) => {
  const value = record.publicExport()
  // Saving an unchanged form still updates PocketBase's timestamp.
  for (const key of ['created', 'updated', 'expand', 'collectionId', 'collectionName']) delete value[key]
  return JSON.stringify(canonical(value))
}

const changedSite = (app, record, operation) => {
  const name = record.collection().name
  const site = contentSite(name)
  if (!site && name !== '_user_staff') return null
  const original = operation === 'update' ? app.findRecordById(name, record.id) : null
  if (name === '_user_staff') {
    // The landing exposes only these contact fields from explicitly selected staff.
    if (
      original &&
      ['phone_number', 'telegram_username'].every((key) => original.getString(key) === record.getString(key))
    )
      return null
    const referenced = app.findRecordsByFilter(
      's_landing',
      'header_phone_manager = {:id} || telegram_manager = {:id} || footer_contact_managers.id ?= {:id}',
      '',
      1,
      0,
      { id: record.id },
    )
    return referenced.length ? 'landing' : null
  }
  if (original && contentValue(original) === contentValue(record)) return null
  return site
}

const trackChange = (event, operation) => {
  const site = changedSite(event.app, event.record, operation)
  if (!site) return event.next()
  // Initial content migrations can run before the publication migration exists.
  const schema = new DynamicModel({ count: 0 })
  event.app
    .db()
    .newQuery("SELECT count(*) AS count FROM sqlite_master WHERE type = 'table' AND name = '_site_publication'")
    .one(schema)
  if (!schema.count) return event.next()

  const app = event.app
  app.runInTransaction((txApp) => {
    event.app = txApp
    try {
      event.next()
      txApp
        .db()
        .newQuery('UPDATE _site_publication SET revision = revision + 1 WHERE site = {:site}')
        .bind({ site })
        .execute()
    } finally {
      event.app = app
    }
  })
}

const readState = (app, site) => {
  const state = new DynamicModel({ revision: 0, published_revision: 0, claim: '', claim_until: 0 })
  app
    .db()
    .newQuery('SELECT revision, published_revision, claim, claim_until FROM _site_publication WHERE site = {:site}')
    .bind({ site })
    .one(state)
  return state
}

const status = (app, auth) =>
  allowedSites(auth).map((site) => {
    const state = readState(app, site)
    return { site, pending: state.revision > state.published_revision, publishing: state.claim_until > Date.now() }
  })

const claimSites = (app, sites) => {
  const claimed = []
  app.runInTransaction((txApp) => {
    for (const site of sites) {
      const state = readState(txApp, site)
      if (state.revision <= state.published_revision || state.claim_until > Date.now()) continue
      const token = $security.randomString(32)
      txApp
        .db()
        .newQuery('UPDATE _site_publication SET claim = {:token}, claim_until = {:until} WHERE site = {:site}')
        .bind({ site, token, until: Date.now() + 60000 })
        .execute()
      claimed.push({ site, token, revision: state.revision })
    }
  })
  return claimed
}

const triggerDeploy = (site) => {
  const url = require(__hooks + '/lib/env.js').readEnv(HOOK_ENV[site])
  if (!url) throw new Error(HOOK_ENV[site] + ' is not configured.')
  const response = $http.send({ method: 'POST', url, timeout: 10 })
  if (response.statusCode < 200 || response.statusCode >= 300 || response.json?.success === false)
    throw new Error('Cloudflare rejected the deploy request (HTTP ' + response.statusCode + ').')
}

const publish = (app, auth) => {
  const sites = allowedSites(auth)
  if (!sites.length) throw new ForbiddenError('Only site editors can publish.')
  const accepted = []
  const failed = []
  // Snapshot both sites before contacting either hook.
  for (const claim of claimSites(app, sites)) {
    const site = claim.site
    let succeeded = false
    try {
      // Never hold a database transaction while waiting on Cloudflare.
      triggerDeploy(site)
      succeeded = true
      accepted.push(site)
    } catch (error) {
      failed.push(site)
      app.logger().error('site publication failed', 'site', site, 'detail', String(error))
    } finally {
      // Acknowledge only the claimed revision; saves made during the request stay pending.
      app
        .db()
        .newQuery(
          `UPDATE _site_publication
        SET published_revision = CASE WHEN {:succeeded} THEN {:revision} ELSE published_revision END,
            claim = '', claim_until = 0
        WHERE site = {:site} AND claim = {:token}`,
        )
        .bind({ site, token: claim.token, revision: claim.revision, succeeded })
        .execute()
    }
  }
  return { sites: status(app, auth), accepted, failed }
}

module.exports = { allowedSites, contentSite, changedSite, trackChange, status, publish }
