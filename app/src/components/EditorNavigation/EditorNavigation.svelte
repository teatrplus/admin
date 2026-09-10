<script lang="ts">
  import { useWorkspace } from '@/lib/workspace/context.svelte'
  import './EditorNavigation.css'

  let { label, items }: { label: string; items: { id: string; label: string }[] } = $props()
  const workspace = useWorkspace()
</script>

<nav class="editor_navigation" aria-label={label}>
  {#each items as item (item.id)}
    <a
      class="editor_navigation-link"
      href={`#${item.id}`}
      onclick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        workspace.scrollToSection(item.id)
      }}>{item.label}</a
    >
  {/each}
</nav>
