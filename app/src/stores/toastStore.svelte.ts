export const TOAST_DURATION_MS = 3000

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export type ToastModel = {
  id: number
  message: string
  type: ToastType
  exiting?: boolean
}

export const toastState = $state({
  items: [] as ToastModel[],
})

let nextToastId = 0
const dismissTimers = new Map<number, number>()

const readDurationMs = (token: string, fallback: number) => {
  if (typeof document === 'undefined') return fallback
  const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
  if (raw.endsWith('ms')) return parseFloat(raw) || fallback
  if (raw.endsWith('s')) return parseFloat(raw) * 1000 || fallback
  return fallback
}

const removeToast = (id: number) => {
  toastState.items = toastState.items.filter((toast) => toast.id !== id)
  dismissTimers.delete(id)
}

const dismissToast = (id: number) => {
  const timer = dismissTimers.get(id)
  if (timer !== undefined) {
    window.clearTimeout(timer)
    dismissTimers.delete(id)
  }

  toastState.items = toastState.items.map((toast) =>
    toast.id === id ? { ...toast, exiting: true } : toast,
  )

  window.setTimeout(() => {
    removeToast(id)
  }, readDurationMs('--duration-base', 300))
}

export const pushToast = (message: string, type: ToastType) => {
  const id = ++nextToastId
  toastState.items = [...toastState.items, { id, message, type }]

  const timer = window.setTimeout(() => {
    dismissToast(id)
  }, TOAST_DURATION_MS)

  dismissTimers.set(id, timer)
}
