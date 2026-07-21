<script lang="ts">
  import { toastState } from '@/stores/toastStore.svelte'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import ToastAlert from './ToastAlert.svelte'
  import './ToastList.css'

  const localeCtx = useLocale()

  const spaceTokenToPx = (token: string): number => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
    if (raw.endsWith('rem')) {
      return parseFloat(raw) * parseFloat(getComputedStyle(document.documentElement).fontSize)
    }
    if (raw.endsWith('px')) return parseFloat(raw)
    return 8
  }

  let heights = $state<Record<number, number>>({})
  let gapPx = $state(8)

  $effect(() => {
    gapPx = spaceTokenToPx('--space-2')
  })

  const offsets = $derived.by(() => {
    const result: Record<number, number> = {}
    let top = 0

    for (const toast of toastState.items) {
      result[toast.id] = top
      if (toast.exiting) continue

      const height = heights[toast.id]
      if (height !== undefined) top += height + gapPx
    }

    return result
  })

  $effect(() => {
    const ids = new Set(toastState.items.map((toast) => toast.id))
    const next: Record<number, number> = {}
    let changed = false

    for (const [id, height] of Object.entries(heights)) {
      const numericId = Number(id)
      if (ids.has(numericId)) {
        next[numericId] = height
      } else {
        changed = true
      }
    }

    if (Object.keys(heights).length !== Object.keys(next).length) changed = true
    if (changed) heights = next
  })

  const setHeight = (id: number, height: number) => {
    if (heights[id] === height) return
    heights = { ...heights, [id]: height }
  }
</script>

<div class="toast_list" role="region" aria-label={localeCtx.t.common.notifications}>
  <div class="l_container">
    <div class="toast_list-stack">
      {#each toastState.items as toast (toast.id)}
        <div
          class="toast_list-item"
          data-exiting={toast.exiting ? 'true' : undefined}
          style:--c-toast-item-offset-top="{(offsets[toast.id] ?? 0) + 'px'}"
        >
          <ToastAlert {toast} onHeight={setHeight} />
        </div>
      {/each}
    </div>
  </div>
</div>
