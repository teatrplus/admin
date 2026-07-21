<script lang="ts">
  import type { Snippet } from 'svelte'
  import NavIcon from '@/components/NavIcon/NavIcon.svelte'
  import RawSvg from '@/components/RawSvg/RawSvg.svelte'
  import '@/components/RawSvg/RawSvg.css'
  import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/config'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { getCurrentUser, logout } from '@/lib/pocketbase/auth'
  import { navSectionsForUser } from '@/lib/pocketbase/permissions'
  import { getRoute, navigate, type AppRoute } from '@/lib/router'
  import iconSvg from '../../../public/icon.svg?raw'
  import './AdminShell.css'

  const SIDEBAR_STORAGE_KEY = 'theaterplus.admin.sidebar'

  let { children }: { children: Snippet } = $props()

  const localeCtx = useLocale()
  const user = $derived(getCurrentUser())
  const navSections = $derived(navSectionsForUser())
  const currentRoute = $derived(getRoute())

  const readCollapsed = () => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed'
    } catch {
      return false
    }
  }

  let collapsed = $state(readCollapsed())

  const itemLabel = (labelKey: 'landing' | 'requests' | 'staff') => localeCtx.t.nav[labelKey]

  const sectionLabel = (labelKey: 'space' | 'global') => localeCtx.t.nav.sections[labelKey]

  const toggleSidebar = () => {
    collapsed = !collapsed
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? 'collapsed' : 'expanded')
    } catch {
      // ignore
    }
  }

  const go = (route: AppRoute) => navigate(route)

  const signOut = () => {
    logout()
    navigate('/login', true)
  }
</script>

<div class="admin_shell" data-sidebar-collapsed={collapsed ? 'true' : 'false'}>
  <aside class="admin_shell-sidebar">
    <div class="admin_shell-brand">
      <RawSvg class="admin_shell-brand_mark raw_svg" content={iconSvg} width="36" height="36" aria-hidden="true" />
      <span class="admin_shell-brand_text">{localeCtx.t.common.appName}</span>
    </div>

    <nav class="admin_shell-nav" aria-label="CMS">
      {#each navSections as section}
        <section class="admin_shell-section">
          <p class="admin_shell-section_label">{sectionLabel(section.labelKey)}</p>
          <div class="admin_shell-section_rule" aria-hidden="true"></div>
          {#each section.items as item}
            <button
              class="admin_shell-nav_link"
              type="button"
              data-active={currentRoute === item.route ? 'true' : 'false'}
              title={itemLabel(item.labelKey)}
              aria-label={itemLabel(item.labelKey)}
              onclick={() => go(item.route)}
            >
              <NavIcon name={item.icon} label={itemLabel(item.labelKey)} />
              <span class="admin_shell-nav_label">{itemLabel(item.labelKey)}</span>
            </button>
          {/each}
        </section>
      {/each}
    </nav>

    <div class="admin_shell-sidebar_footer">
      <button
        class="admin_shell-collapse_button"
        type="button"
        onclick={toggleSidebar}
        aria-hidden="true"
        aria-expanded={!collapsed}
        title={collapsed ? localeCtx.t.nav.expand : localeCtx.t.nav.collapse}
      >
        <NavIcon
          name={collapsed ? 'expand' : 'collapse'}
          label={collapsed ? localeCtx.t.nav.expand : localeCtx.t.nav.collapse}
        />
        <span class="admin_shell-collapse_label">
          {collapsed ? localeCtx.t.nav.expand : localeCtx.t.nav.collapse}
        </span>
      </button>
    </div>
  </aside>

  <div class="l_stack admin_shell-main" data-gap="0">
    <header class="admin_shell-header">
      <div class="admin_shell-user">{user?.name || user?.email}</div>
      <div class="admin_shell-header_actions">
        <label class="u_sr_only" for="locale-select">{localeCtx.t.common.language}</label>
        <div class="admin_shell-header_button">
          <NavIcon name="language" label={localeCtx.t.common.language} size={18} />
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
        </div>
        <button class="admin_shell-header_button" type="button" onclick={signOut} title={localeCtx.t.common.logout}>
          <NavIcon name="logout" label={localeCtx.t.common.logout} size={18} />
          <span>{localeCtx.t.common.logout}</span>
        </button>
      </div>
    </header>
    <main class="admin_shell-content">
      {@render children()}
    </main>
  </div>
</div>
