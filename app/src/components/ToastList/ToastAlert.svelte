<script lang="ts">
  import type { ToastModel, ToastType } from '@/stores/toastStore.svelte'

  let {
    toast,
    onHeight,
  }: {
    toast: ToastModel
    onHeight: (id: number, height: number) => void
  } = $props()

  const TOAST_EMOJI: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }

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

<div class="toast_list-alert" data-type={toast.type} {role} bind:this={alertEl}>
  <div class="l_cluster" data-gap="3" data-nowrap>
    <span class="toast_list-icon" aria-hidden="true">{TOAST_EMOJI[toast.type]}</span>
    <p class="toast_list-message">{toast.message}</p>
  </div>
</div>
