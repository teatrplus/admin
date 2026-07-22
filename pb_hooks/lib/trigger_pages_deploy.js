/**
 * Cloudflare Pages deploy-hook trigger for CMS changes.
 * Loaded from pb_hooks — keep side-effect free; callers own logging.
 *
 * When CLOUDFLARE_API_TOKEN + account/project are set, queued deploy-hook
 * builds are deleted before POSTing the hook so rapid CMS saves collapse to
 * one pending build. A build already in progress is not cancelled (Pages API).
 */

const readEnv = (key) => {
  const value = $os.getenv(key)
  if (!value || value.trim() === '') return ''
  return value.trim().replace(/^["']|["']$/g, '')
}

const cloudflareApiConfig = () => {
  const accountId = readEnv('CLOUDFLARE_ACCOUNT_ID')
  const projectName = readEnv('CLOUDFLARE_PAGES_PROJECT_NAME')
  const token = readEnv('CLOUDFLARE_API_TOKEN')

  if (!accountId || !projectName || !token) return null

  return { accountId, projectName, token }
}

const cloudflareApiRequest = (config, method, path) => {
  const response = $http.send({
    method,
    url: `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/pages/projects/${config.projectName}${path}`,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    timeout: 30,
  })

  const body = response.json

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const detail = body ? JSON.stringify(body) : String(response.raw || '(empty response)')
    return { ok: false, statusCode: response.statusCode, detail }
  }

  return { ok: true, body }
}

const isQueuedDeployHook = (deployment) => {
  if (deployment?.deployment_trigger?.type !== 'deploy_hook') return false

  const stage = deployment?.latest_stage
  return stage?.name === 'queued' && stage?.status === 'active'
}

const clearQueuedDeployHookDeployments = () => {
  const config = cloudflareApiConfig()
  if (!config) {
    $app.logger().warn(
      'skipping pages deploy queue cleanup',
      'reason',
      'set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_PAGES_PROJECT_NAME, and CLOUDFLARE_API_TOKEN to enable',
    )
    return null
  }

  const listed = cloudflareApiRequest(config, 'GET', '/deployments?per_page=25')
  if (!listed.ok) {
    return `list deployments failed: HTTP ${listed.statusCode}: ${listed.detail}`
  }

  const deployments = listed.body?.result ?? []
  let cleared = 0
  const errors = []

  for (const deployment of deployments) {
    if (!isQueuedDeployHook(deployment)) continue

    const deleted = cloudflareApiRequest(config, 'DELETE', `/deployments/${deployment.id}`)
    if (!deleted.ok) {
      errors.push(`delete ${deployment.id}: HTTP ${deleted.statusCode}: ${deleted.detail}`)
      continue
    }

    cleared++
  }

  if (cleared > 0) {
    $app.logger().info('cleared queued cloudflare pages deployments', 'count', cleared)
  }

  return errors.length > 0 ? errors.join('; ') : null
}

const triggerPagesDeploy = (collectionName) => {
  const cleanupError = clearQueuedDeployHookDeployments()
  if (cleanupError) {
    $app.logger().warn('cloudflare pages deploy queue cleanup had errors', 'detail', cleanupError)
  }

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
  clearQueuedDeployHookDeployments,
  onCmsRecordChange,
  triggerPagesDeploy,
}
