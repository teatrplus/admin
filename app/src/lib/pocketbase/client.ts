import PocketBase, { LocalAuthStore } from 'pocketbase'

const url = import.meta.env.VITE_POCKETBASE_URL ?? 'http://127.0.0.1:8090'

export const pb = new PocketBase(url, new LocalAuthStore('theaterplus.admin.auth'))

pb.autoCancellation(false)

const saveListeners = new Set<() => void>()

export const onCmsSave = (listener: () => void) => {
  saveListeners.add(listener)
  return () => {
    saveListeners.delete(listener)
  }
}

pb.beforeSend = (url, options) => {
  const path = new URL(url).pathname
  const isSave =
    ['POST', 'PATCH', 'PUT', 'DELETE'].includes(options.method?.toUpperCase() ?? '') &&
    (/^\/api\/collections\/[^/]+\/records(?:\/|$)/.test(path) || path.startsWith('/api/theater/'))
  if (isSave) {
    const send = options.fetch ?? fetch
    options.fetch = async (input, init) => {
      try {
        return await send(input, init)
      } finally {
        // A multipart editor can persist some children before a later request fails.
        // Read authoritative publication state even after an interrupted save.
        for (const listener of saveListeners) listener()
      }
    }
  }
  return { url, options }
}
