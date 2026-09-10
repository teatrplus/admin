<script lang="ts">
  import SuccessIcon from '~icons/material-symbols/check-circle-outline'
  import ErrorIcon from '~icons/material-symbols/error-outline'
  import WarningIcon from '~icons/material-symbols/warning-outline'
  import InfoIcon from '~icons/material-symbols/info-outline'
  import './ToastAlert.css'

  import type { ToastModel } from '@/stores/toastStore.svelte'

  let {
    toast,
    onHeight,
  }: {
    toast: ToastModel
    onHeight: (id: number, height: number) => void
  } = $props()

  const icons = { success: SuccessIcon, error: ErrorIcon, warning: WarningIcon, info: InfoIcon }
  const Icon = $derived(icons[toast.type])

  const role = $derived(toast.type === 'error' ? 'alert' : 'status')

  let alertEl = $state<HTMLDivElement | null>(null)

  $effect(() => {
    const el = alertEl
    if (!el || toast.exiting) return

    const report = () => onHeight(toast.id, Math.round(el.getBoundingClientRect().height))
    report()

    const observer = new ResizeObserver(report)
    observer.observe(el)
    return () => observer.disconnect()
  })
</script>

<div
  class="toast_alert"
  data-type={toast.type}
  data-exiting={toast.exiting ? 'true' : undefined}
  {role}
  bind:this={alertEl}
>
  <span class="toast_alert-icon" aria-hidden="true"><Icon width="20" height="20" /></span>
  <p class="toast_alert-message">{toast.message}</p>
</div>
