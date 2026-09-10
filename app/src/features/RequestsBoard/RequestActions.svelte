<script lang="ts">
  import { DropdownMenu } from 'bits-ui'
  import ArchiveIcon from '~icons/material-symbols/archive-outline'
  import UnarchiveIcon from '~icons/material-symbols/unarchive-outline'
  import MoreIcon from '~icons/material-symbols/more-horiz'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import './RequestActions.css'

  let {
    archived = false,
    blocked = false,
    onSelect,
  }: { archived?: boolean; blocked?: boolean; onSelect: () => void } = $props()
  const localeCtx = useLocale()
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger class="request_actions-trigger" aria-label={localeCtx.t.requests.actions}>
    <MoreIcon width="20" height="20" />
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content class="request_actions-menu" sideOffset={6} align="end">
      <DropdownMenu.Item {onSelect}>
        {#snippet child({ props })}
          <!-- Keep this focusable so the caller can explain why archiving is unavailable. -->
          <div {...props} class="request_actions-item" aria-disabled={blocked ? 'true' : undefined}>
            {#if archived}<UnarchiveIcon width="16" height="16" />{:else}<ArchiveIcon width="16" height="16" />{/if}
            {archived ? localeCtx.t.requests.unarchive : localeCtx.t.requests.archive}
          </div>
        {/snippet}
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
