<script lang="ts">
  import type { Snippet } from 'svelte'
  import { useWorkspace } from '@/lib/workspace/context.svelte'
  import './PageActions.css'

  let { children, leading, label }: { children: Snippet; leading?: Snippet; label: string } = $props()
  const workspace = useWorkspace()

  $effect(() => {
    workspace.state.actions = content
    return () => {
      if (workspace.state.actions === content) workspace.state.actions = undefined
    }
  })
</script>

{#snippet content()}
  <div class="page_actions" role="region" aria-label={label}>
    <div class="page_actions-context">
      {#if leading}{@render leading()}{:else}<span class="page_actions-label">{label}</span>{/if}
    </div>
    <div class="page_actions-controls">{@render children()}</div>
  </div>
{/snippet}
