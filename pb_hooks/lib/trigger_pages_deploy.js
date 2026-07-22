/**
 * Cloudflare Pages deploy-hook trigger for CMS changes.
 * Loaded from pb_hooks — keep side-effect free; callers own logging.
 */

const readEnv = (key) => {
  const value = $os.getenv(key)
  if (!value || value.trim() === '') return ''
  return value.trim().replace(/^["']|["']$/g, '')
}

const triggerPagesDeploy = (collectionName) => {
  const url = readEnv('CLOUDFLARE_PAGES_DEPLOY_HOOK_URL')
  if (!url) {
    return 'CLOUDFLARE_PAGES_DEPLOY_HOOK_URL is not set in the PocketBase process environment.'
  }

  try {
    const response = $http.send({
      method: 'POST',
      url,
      timeout: 30,
    })

    if (response.statusCode < 200 || response.statusCode >= 300) {
      const detail = response.raw ? String(response.raw) : '(empty response)'
      return `HTTP ${response.statusCode}: ${detail}`
    }

    $app.logger().info('cloudflare pages deploy triggered', 'collection', collectionName)
    return null
  } catch (error) {
    return String(error)
  }
}

const onCmsRecordChange = (collectionName, event) => {
  const error = triggerPagesDeploy(collectionName)
  if (!error) return

  $app.logger().error(
    'cloudflare pages deploy hook failed',
    'collection',
    collectionName,
    'recordId',
    event?.record?.id ?? '',
    'detail',
    error,
  )
}

module.exports = {
  onCmsRecordChange,
  triggerPagesDeploy,
}
