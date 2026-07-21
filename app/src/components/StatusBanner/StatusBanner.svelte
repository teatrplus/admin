<script lang="ts">
  import type { Snippet } from 'svelte'
  import './StatusBanner.css'

  let {
    tone = 'neutral',
    children,
  }: {
    tone?: 'neutral' | 'success' | 'error'
    children: Snippet
  } = $props()
</script>

<div class="status_banner" data-tone={tone}>
  {@render children()}
</div>
