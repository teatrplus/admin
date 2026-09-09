/**
 * Bright Data → t_instagram_post sync.
 * Loaded from pb_hooks — keep side-effect free; callers own logging.
 *
 * Bright Data discovery is async and can take several minutes. Do not hold an
 * HTTP request open for it. Start the snapshot, persist the job, return, then
 * tick (UI poll + minute cron) until the snapshot is ready and posts are saved.
 */

const POSTS_COLLECTION = 't_instagram_post'
const SYNC_COLLECTION = 't_instagram_sync'
const SYNC_ID = 'instagramsync00'
const POSTS_LIMIT = 9
const DEFAULT_DATASET_ID = 'gd_lk5ns7kz21pck8jpis'
const HTTP_TIMEOUT = 60
const IMAGE_TIMEOUT = 30
const DEPLOY_TIMEOUT = 10
const JOB_MAX_SECONDS = 30 * 60

let starting = false
let ticking = false

const { readEnv } = require(`${__hooks}/lib/env.js`)

// Read the same contact record used by the website; environment defaults must not override CMS edits.
const readInstagramProfileUrl = (app) => {
  const contacts = app.findRecordsByFilter('t_contact', '', 'created', 2)
  if (contacts.length !== 1) throw new Error('t_contact: expected exactly one contact record')
  const value = contacts[0].getString('instagram_url').trim()
  const match = value.match(/^https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]{1,30})\/?(?:[?#].*)?$/i)
  if (!match || ['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'direct'].includes(match[1].toLowerCase())) {
    throw new Error('t_contact.instagram_url must be an Instagram profile URL')
  }
  return 'https://www.instagram.com/' + match[1] + '/'
}

const readJson = (response) => {
  if (response.json !== undefined && response.json !== null) return response.json
  try {
    const text = toString(response.body)
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

const httpError = (response, fallback) => {
  const payload = readJson(response)
  if (payload && typeof payload === 'object') {
    const message = payload.error || payload.message || payload.error_message
    if (message) return String(message)
  }
  return `${fallback} (HTTP ${response.statusCode})`
}

const brightDataHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
})

const isHttpOk = (statusCode) => statusCode >= 200 && statusCode < 300

const normalizeMediaType = (value) => {
  const kind = String(value || '')
    .trim()
    .toLowerCase()
  if (kind === 'video' || kind === 'reel') return 'video'
  if (kind === 'carousel') return 'carousel'
  return 'image'
}

const toDateTime = (value) => {
  if (!value) return new DateTime()
  const raw = String(value).trim()
  if (!raw) return new DateTime()
  const normalized = raw.includes('T') ? raw.replace('T', ' ') : raw
  try {
    return new DateTime(normalized)
  } catch {
    return new DateTime()
  }
}

const firstString = (value) => {
  if (value === undefined || value === null || value === '') return ''
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const found = firstString(value[i])
      if (found) return found
    }
    return ''
  }
  if (typeof value === 'object') {
    return firstString(value.url || value.image_url || value.thumbnail || value.src)
  }
  return ''
}

const extractRawPosts = (payload) => {
  const rows = Array.isArray(payload) ? payload : payload ? [payload] : []
  const posts = []

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue

    if (Array.isArray(row.posts) && row.posts.length > 0) {
      for (const post of row.posts) {
        if (post && typeof post === 'object') posts.push(post)
      }
      continue
    }

    const isErrorOnly = (row.error || row.error_code) && !row.thumbnail && !row.image_url && !row.shortcode
    if (isErrorOnly) continue

    if (row.image_url || row.thumbnail || row.url || row.shortcode || row.post_id) posts.push(row)
  }

  return posts
}

const normalizePost = (raw) => {
  const instagramId = String(raw.id || raw.post_id || raw.pk || raw.shortcode || raw.content_id || '').trim()
  const permalink = String(raw.url || '').trim()
  const imageUrl =
    firstString(raw.image_url) ||
    firstString(raw.thumbnail) ||
    firstString(raw.photos) ||
    firstString(raw.images) ||
    firstString(raw.thumbnail_array) ||
    firstString(raw.post_content)

  if (!instagramId || !permalink || !imageUrl) return null

  return {
    instagramId: instagramId.slice(0, 64),
    permalink,
    caption: String(raw.caption || raw.description || '')
      .trim()
      .slice(0, 2200),
    datetime: raw.datetime || raw.date_posted || '',
    imageUrl,
    mediaType: normalizeMediaType(raw.content_type),
  }
}

const findExisting = (instagramId) => {
  try {
    return $app.findFirstRecordByData(POSTS_COLLECTION, 'instagram_id', instagramId)
  } catch {
    return null
  }
}

const downloadImage = (url) => {
  try {
    return $filesystem.fileFromURL(url, IMAGE_TIMEOUT)
  } catch (error) {
    $app.logger().warn('instagram image download failed', 'detail', String(error))
    return null
  }
}

const triggerSnapshot = (token, datasetId, profileUrl) => {
  const url =
    'https://api.brightdata.com/datasets/v3/trigger' +
    `?dataset_id=${encodeURIComponent(datasetId)}` +
    '&type=discover_new' +
    '&discover_by=url' +
    '&notify=false' +
    '&include_errors=true' +
    '&format=json'

  const response = $http.send({
    method: 'POST',
    url,
    headers: brightDataHeaders(token),
    body: JSON.stringify([
      {
        url: profileUrl,
        num_of_posts: POSTS_LIMIT,
        post_type: '',
        start_date: '',
        end_date: '',
      },
    ]),
    timeout: HTTP_TIMEOUT,
  })

  if (!isHttpOk(response.statusCode)) {
    return { ok: false, error: httpError(response, 'Bright Data trigger failed') }
  }

  const payload = readJson(response)
  const snapshotId = payload && payload.snapshot_id ? String(payload.snapshot_id) : ''
  if (!snapshotId) {
    return { ok: false, error: 'Bright Data trigger did not return a snapshot_id' }
  }

  return { ok: true, snapshotId }
}

const checkProgress = (token, snapshotId) => {
  const url = `https://api.brightdata.com/datasets/v3/progress/${encodeURIComponent(snapshotId)}`
  const response = $http.send({
    method: 'GET',
    url,
    headers: { Authorization: `Bearer ${token}` },
    timeout: HTTP_TIMEOUT,
  })

  if (!isHttpOk(response.statusCode)) {
    return { ok: false, error: httpError(response, 'Bright Data progress failed') }
  }

  const payload = readJson(response) || {}
  const status = String(payload.status || '').toLowerCase()
  if (status === 'ready') return { ok: true, ready: true }
  if (status === 'failed' || status === 'error') {
    const detail = payload.error || payload.message || status
    return { ok: false, error: `Bright Data snapshot failed: ${detail}` }
  }

  return { ok: true, ready: false }
}

const parseSnapshotPayload = (response) => {
  const direct = readJson(response)
  if (direct !== undefined && direct !== null) return direct

  const text = toString(response.body)
  if (!text) return null

  const rows = []
  const lines = String(text).split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    try {
      rows.push(JSON.parse(line))
    } catch {
      return null
    }
  }
  return rows.length ? rows : null
}

const downloadSnapshot = (token, snapshotId) => {
  const url = `https://api.brightdata.com/datasets/v3/snapshot/${encodeURIComponent(snapshotId)}` + '?format=json'

  const response = $http.send({
    method: 'GET',
    url,
    headers: { Authorization: `Bearer ${token}` },
    timeout: HTTP_TIMEOUT,
  })

  if (!isHttpOk(response.statusCode)) {
    return { ok: false, error: httpError(response, 'Bright Data snapshot download failed') }
  }

  return { ok: true, payload: parseSnapshotPayload(response) }
}

const upsertPosts = (posts) => {
  const collection = $app.findCollectionByNameOrId(POSTS_COLLECTION)
  const keep = {}
  let saved = 0

  for (const post of posts) {
    keep[post.instagramId] = true

    let record = findExisting(post.instagramId)
    const isNew = !record
    if (!record) record = new Record(collection)

    record.set('instagram_id', post.instagramId)
    record.set('permalink', post.permalink)
    record.set('caption', post.caption)
    record.set('posted_at', toDateTime(post.datetime))
    record.set('media_type', post.mediaType)

    const hasImage = !isNew && record.getString('image')
    if (!hasImage) {
      const file = downloadImage(post.imageUrl)
      if (!file) {
        if (isNew) continue
      } else {
        record.set('image', file)
      }
    }

    $app.save(record)
    saved++
  }

  const existing = $app.findAllRecords(POSTS_COLLECTION)
  for (const record of existing) {
    if (!record) continue
    if (!keep[record.getString('instagram_id')]) $app.delete(record)
  }

  return saved
}

const triggerWebsiteRebuild = () => {
  const url = readEnv('WEBSITE_PAGES_DEPLOY_HOOK_URL', '')
  if (!url) return

  try {
    const response = $http.send({
      method: 'POST',
      url,
      timeout: DEPLOY_TIMEOUT,
    })

    if (!isHttpOk(response.statusCode)) {
      $app.logger().warn('website deploy hook failed', 'status', response.statusCode)
      return
    }

    $app.logger().info('website deploy hook triggered')
  } catch (error) {
    $app.logger().warn('website deploy hook failed', 'detail', String(error))
  }
}

const dateField = (record, key) => {
  const value = record.getDateTime(key)
  if (!value || (typeof value.isZero === 'function' && value.isZero())) return undefined
  if (typeof value.string === 'function') {
    const text = value.string()
    return text || undefined
  }
  return undefined
}

const serializeSync = (record) => {
  const snapshotId = record.getString('snapshot_id')
  const error = record.getString('error')
  const source = record.getString('source')

  return {
    ok: true,
    status: record.getString('status') || 'idle',
    count: record.getInt('count'),
    snapshotId: snapshotId || undefined,
    error: error || undefined,
    source: source || undefined,
    startedAt: dateField(record, 'started_at'),
    finishedAt: dateField(record, 'finished_at'),
  }
}

const ensureSyncRecord = () => {
  try {
    return $app.findRecordById(SYNC_COLLECTION, SYNC_ID)
  } catch {
    const collection = $app.findCollectionByNameOrId(SYNC_COLLECTION)
    const record = new Record(collection)
    record.id = SYNC_ID
    record.set('status', 'idle')
    record.set('count', 0)
    $app.save(record)
    return $app.findRecordById(SYNC_COLLECTION, SYNC_ID)
  }
}

const isTimedOut = (record) => {
  const started = record.getDateTime('started_at')
  if (!started || typeof started.unix !== 'function') return false
  if (typeof started.isZero === 'function' && started.isZero()) return false
  const startedUnix = started.unix()
  if (!startedUnix) return false
  return Date.now() / 1000 - startedUnix > JOB_MAX_SECONDS
}

const markFailed = (record, error) => {
  record.set('status', 'failed')
  record.set('error', String(error || 'Instagram refresh failed').slice(0, 500))
  record.set('finished_at', new DateTime())
  $app.save(record)
  $app.logger().error('instagram refresh failed', 'detail', record.getString('error'))
}

const savePostsFromSnapshot = (token, snapshotId) => {
  const downloaded = downloadSnapshot(token, snapshotId)
  if (!downloaded.ok) return { ok: false, error: downloaded.error }

  const rawPosts = extractRawPosts(downloaded.payload)
  const posts = rawPosts
    .map(normalizePost)
    .filter((post) => post != null)
    .sort((a, b) => {
      const aTime = Date.parse(String(a.datetime)) || 0
      const bTime = Date.parse(String(b.datetime)) || 0
      return bTime - aTime
    })
    .slice(0, POSTS_LIMIT)

  if (posts.length === 0) {
    const n = Array.isArray(downloaded.payload) ? downloaded.payload.length : downloaded.payload ? 1 : 0
    $app.logger().warn('instagram snapshot had no usable posts', 'records', n, 'extracted', rawPosts.length)
    return {
      ok: false,
      error:
        n > 0
          ? `Bright Data returned ${n} records but none had a usable image (thumbnail/image_url).`
          : 'Bright Data returned no Instagram posts',
    }
  }

  const count = upsertPosts(posts)
  if (count === 0) {
    return { ok: false, error: 'Failed to save Instagram posts (image download failed)' }
  }

  return { ok: true, count }
}

const startInstagramRefresh = (source) => {
  if (starting) {
    return { httpStatus: 409, body: { ok: false, status: 'running', error: 'refresh already in progress' } }
  }

  starting = true
  try {
    const record = ensureSyncRecord()
    if (record.getString('status') === 'running' && !isTimedOut(record)) {
      const body = serializeSync(record)
      body.ok = false
      body.error = 'refresh already in progress'
      return { httpStatus: 409, body }
    }

    const token = readEnv('BRIGHTDATA_API_TOKEN', '')
    if (!token) {
      markFailed(
        record,
        'BRIGHTDATA_API_TOKEN is missing. Put it in .env next to the PocketBase binary (not app/.env).',
      )
      return { httpStatus: 500, body: serializeSync(record) }
    }

    const datasetId = readEnv('BRIGHTDATA_INSTAGRAM_DATASET_ID', DEFAULT_DATASET_ID)
    const profileUrl = readInstagramProfileUrl($app)
    const triggered = triggerSnapshot(token, datasetId, profileUrl)
    if (!triggered.ok) {
      markFailed(record, triggered.error)
      return { httpStatus: 502, body: serializeSync(record) }
    }

    record.set('status', 'running')
    record.set('source', source === 'cron' ? 'cron' : 'manual')
    record.set('snapshot_id', triggered.snapshotId)
    record.set('error', '')
    record.set('started_at', new DateTime())
    record.set('finished_at', '')
    $app.save(record)

    $app.logger().info('instagram refresh started', 'snapshot_id', triggered.snapshotId, 'source', source)
    return { httpStatus: 202, body: serializeSync(record) }
  } catch (error) {
    return {
      httpStatus: 500,
      body: { ok: false, status: 'failed', error: String(error) },
    }
  } finally {
    starting = false
  }
}

const tickInstagramRefresh = () => {
  const record = ensureSyncRecord()
  if (record.getString('status') !== 'running') {
    return { httpStatus: 200, body: serializeSync(record) }
  }

  if (ticking) {
    return { httpStatus: 200, body: serializeSync(record) }
  }

  ticking = true
  try {
    if (isTimedOut(record)) {
      markFailed(record, 'Bright Data snapshot timed out')
      return { httpStatus: 200, body: serializeSync(record) }
    }

    const token = readEnv('BRIGHTDATA_API_TOKEN', '')
    if (!token) {
      markFailed(
        record,
        'BRIGHTDATA_API_TOKEN is missing. Put it in .env next to the PocketBase binary (not app/.env).',
      )
      return { httpStatus: 200, body: serializeSync(record) }
    }

    const snapshotId = record.getString('snapshot_id')
    if (!snapshotId) {
      markFailed(record, 'Instagram refresh has no snapshot_id')
      return { httpStatus: 200, body: serializeSync(record) }
    }

    const progress = checkProgress(token, snapshotId)
    if (!progress.ok) {
      markFailed(record, progress.error)
      return { httpStatus: 200, body: serializeSync(record) }
    }
    if (!progress.ready) {
      return { httpStatus: 200, body: serializeSync(record) }
    }

    const saved = savePostsFromSnapshot(token, snapshotId)
    if (!saved.ok) {
      markFailed(record, saved.error)
      return { httpStatus: 200, body: serializeSync(record) }
    }

    record.set('status', 'success')
    record.set('count', saved.count)
    record.set('error', '')
    record.set('finished_at', new DateTime())
    $app.save(record)
    triggerWebsiteRebuild()
    $app.logger().info('instagram refresh completed', 'count', saved.count)

    return { httpStatus: 200, body: serializeSync(record) }
  } catch (error) {
    markFailed(record, String(error))
    return { httpStatus: 200, body: serializeSync(record) }
  } finally {
    ticking = false
  }
}

const canRefreshInstagram = (auth) => {
  if (!auth) return false
  if (typeof auth.isSuperuser === 'function' && auth.isSuperuser()) return true

  const collection = auth.collection()
  if (!collection || collection.name !== '_user_staff') return false

  const role = String(auth.getString('role') || '').trim()
  return role === 'admin' || role === 'moderator'
}

module.exports = {
  readInstagramProfileUrl,
  canRefreshInstagram,
  startInstagramRefresh,
  tickInstagramRefresh,
}
