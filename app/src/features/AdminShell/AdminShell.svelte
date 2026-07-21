<script lang="ts">
  import type { Snippet } from 'svelte'
  import ActionButton from '../../components/ui/ActionButton/ActionButton.svelte'
  import { LOCALES, LOCALE_LABELS } from '../../lib/i18n/config'
  import { useLocale } from '../../lib/i18n/context.svelte'
  import { getCurrentUser, logout } from '../../lib/pocketbase/auth'
  import { navItemsForUser } from '../../lib/pocketbase/permissions'
  import { getRoute, navigate, type AppRoute } from '../../lib/router'
  import './AdminShell.css'

  let { children }: { children: Snippet } = $props()

  const localeCtx = useLocale()
  const user = $derived(getCurrentUser())
  const navItems = $derived(navItemsForUser())
  const currentRoute = $derived(getRoute())

  const navLabel = (item: (typeof navItems)[number]) => {
    const base = localeCtx.t.nav[item.labelKey.split('.')[1] as keyof typeof localeCtx.t.nav]
    if (!item.scope) return base
    return `${localeCtx.t.scopes[item.scope]} · ${base}`
  }

  const go = (route: AppRoute) => navigate(route)
  const signOut = () => {
    logout()
    navigate('/login', true)
  }
</script>

<div class="admin_shell">
  <aside class="admin_shell-sidebar">
    <div class="admin_shell-brand">{localeCtx.t.common.appName}</div>
    <nav class="l_stack" data-gap="1">
      {#each navItems as item}
        <button
          class="admin_shell-nav_link"
          type="button"
          data-active={currentRoute === item.route ? 'true' : 'false'}
          onclick={() => go(item.route)}
        >
          {navLabel(item)}
        </button>
      {/each}
    </nav>
  </aside>

  <div class="l_stack admin_shell-main" data-gap="0">
    <header class="admin_shell-header">
      <div class="admin_shell-user">{user?.name || user?.email}</div>
      <div class="l_cluster admin_shell-locale" data-gap="2">
        <label class="u_sr_only" for="locale-select">{localeCtx.t.common.language}</label>
        <select
          id="locale-select"
          class="admin_shell-locale_select"
          value={localeCtx.locale}
          onchange={(event) => localeCtx.setLocale(event.currentTarget.value as typeof localeCtx.locale)}
        >
          {#each LOCALES as locale}
            <option value={locale}>{LOCALE_LABELS[locale]}</option>
          {/each}
        </select>
        <ActionButton variant="ghost" size="sm" onclick={signOut}>{localeCtx.t.common.logout}</ActionButton>
      </div>
    </header>
    <main class="admin_shell-content">
      {@render children()}
    </main>
  </div>
</div>
