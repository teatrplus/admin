<script lang="ts">
  import type { Snippet } from 'svelte'
  import './PageHeader.css'

  let {
    eyebrow,
    title,
    description,
    actions,
  }: {
    eyebrow?: string
    title: string
    description?: string
    actions?: Snippet
  } = $props()
</script>

<header class="page_header">
  <div class="page_header-copy">
    {#if eyebrow}<p class="page_header-eyebrow">{eyebrow}</p>{/if}
    <h1 class="page_header-title">{title}</h1>
    {#if description}<p class="page_header-description">{description}</p>{/if}
  </div>
  {#if actions}<div class="page_header-actions">{@render actions()}</div>{/if}
</header>
