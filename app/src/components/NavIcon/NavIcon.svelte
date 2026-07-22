<script lang="ts">
  import type { Component } from 'svelte'
  import type { NavItemIcon } from '@/lib/nav'
  import LandingIcon from '~icons/material-symbols/web-outline'
  import RequestsIcon from '~icons/material-symbols/view-kanban-outline'
  import StaffIcon from '~icons/material-symbols/group-outline'
  import AccountIcon from '~icons/material-symbols/person-outline'
  import CollapseIcon from '~icons/material-symbols/left-panel-close-outline'
  import ExpandIcon from '~icons/material-symbols/left-panel-open-outline'
  import LogoutIcon from '~icons/material-symbols/logout'
  import LanguageIcon from '~icons/material-symbols/language'
  import './NavIcon.css'

  const icons: Record<NavItemIcon, Component<Record<string, string>>> = {
    landing: LandingIcon,
    requests: RequestsIcon,
    staff: StaffIcon,
    account: AccountIcon,
  }

  let {
    name,
    size = 20,
  }: {
    name: NavItemIcon | 'collapse' | 'expand' | 'logout' | 'language'
    label?: string
    size?: number
  } = $props()

  const Icon = $derived(
    name === 'collapse'
      ? CollapseIcon
      : name === 'expand'
        ? ExpandIcon
        : name === 'logout'
          ? LogoutIcon
          : name === 'language'
            ? LanguageIcon
            : icons[name],
  )
</script>

<span class="g_icon_box nav_icon" aria-hidden="true">
  <Icon width={String(size)} height={String(size)} />
</span>
