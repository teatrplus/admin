<script lang="ts">
  import type { Snippet } from 'svelte'
  import './Toast.css'

  let {
    open = $bindable(false),
    tone = 'success',
    duration = 2800,
    children,
  }: {
    open?: boolean
    tone?: 'success' | 'error' | 'neutral'
    duration?: number
    children: Snippet
  } = $props()

  $effect(() => {
    if (!open) return
    const timer = window.setTimeout(() => {
      open = false
    }, duration)
    return () => window.clearTimeout(timer)
  })
</script>

{#if open}
  <div class="toast" data-tone={tone} role="status" aria-live="polite">
    {@render children()}
  </div>
{/if}
