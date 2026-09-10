<script lang="ts">
  import type { Snippet } from 'svelte'
  import { createWorkspace } from '@/lib/workspace/context.svelte'
  import { MediaQuery } from 'svelte/reactivity'
  import BrandTitle from '@/components/BrandTitle/BrandTitle.svelte'
  import Button from '@/components/Button/Button.svelte'
  import NavIcon from '@/components/NavIcon/NavIcon.svelte'
  import RawSvg from '@/components/RawSvg/RawSvg.svelte'
  import Select from '@/components/Select/Select.svelte'
  import ThemeToggle from '@/components/ThemeToggle/ThemeToggle.svelte'
  import '@/components/RawSvg/RawSvg.css'
  import { LOCALES, LOCALE_LABELS, type Locale } from '@/lib/i18n/config'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { getCurrentUser, logout } from '@/lib/pocketbase/auth'
  import { navSectionsForUser } from '@/lib/pocketbase/permissions'
  import type { NavItem, NavSection } from '@/lib/nav'
  import { getRoute, navigate, type AppRoute } from '@/lib/router'
  import iconSvg from './assets/logo.svg?raw'
  import './AdminShell.css'

  const SIDEBAR_STORAGE_KEY = 'theaterplus.admin.sidebar'

  let { children }: { children: Snippet } = $props()

  const workspace = createWorkspace()
  const localeCtx = useLocale()
  const user = $derived(getCurrentUser())
  const navSections = $derived(navSectionsForUser())
  const currentRoute = $derived(getRoute())
  const currentSection = $derived(
    navSections.find((section) => section.items.some((item) => item.route === currentRoute)),
  )
  const currentItem = $derived(currentSection?.items.find((item) => item.route === currentRoute))
  const localeOptions = $derived(LOCALES.map((locale) => ({ value: locale, label: LOCALE_LABELS[locale] })))

  const desktop = new MediaQuery('(min-width: 48rem)')
  const isDesktopViewport = () => desktop.current

  const readCollapsed = () => {
    try {
      if (!isDesktopViewport()) return true
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed'
    } catch {
      return !isDesktopViewport()
    }
  }

  let collapsed = $state(readCollapsed())

  const itemLabel = (labelKey: NavItem['labelKey']) => localeCtx.t.nav[labelKey]

  const sectionLabel = (labelKey: NavSection['labelKey']) => localeCtx.t.nav.sections[labelKey]

  const toggleSidebar = () => {
    collapsed = !collapsed
    try {
      if (isDesktopViewport()) {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? 'collapsed' : 'expanded')
      }
    } catch {
      // ignore
    }
  }

  const closeSidebarOnMobile = () => {
    if (!isDesktopViewport()) collapsed = true
  }

  const go = (route: AppRoute) => {
    navigate(route)
    closeSidebarOnMobile()
  }

  const signOut = () => {
    logout()
    navigate('/login', true)
  }
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === 'Escape') closeSidebarOnMobile()
  }}
/>

<div class="admin_shell" data-collapsed={collapsed ? 'true' : undefined}>
  <button
    type="button"
    class="admin_shell-backdrop"
    aria-label={localeCtx.t.nav.collapse}
    aria-hidden={collapsed ? 'true' : undefined}
    tabindex={collapsed ? -1 : 0}
    onclick={toggleSidebar}
  ></button>
  <aside id="admin-shell-sidebar" class="admin_shell-sidebar" inert={!desktop.current && collapsed}>
    <a
      class="admin_shell-brand"
      href="/"
      onclick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        go('/')
      }}
    >
      <RawSvg class="admin_shell-brand_mark raw_svg" content={iconSvg} width="32" height="32" aria-hidden="true" />
      <div class="admin_shell-brand_text">
        <BrandTitle />
        <span class="admin_shell-brand_caption">{localeCtx.t.workspace.label}</span>
      </div>
    </a>
    <nav class="admin_shell-nav" aria-label="CMS">
      {#each navSections as section}
        <section class="admin_shell-section">
          <p class="admin_shell-section_label">{sectionLabel(section.labelKey)}</p>
          {#each section.items as item}
            <a
              class="admin_shell-nav_link"
              href={item.route}
              aria-current={currentRoute === item.route ? 'page' : undefined}
              title={itemLabel(item.labelKey)}
              onclick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                event.preventDefault()
                go(item.route)
              }}
            >
              <NavIcon name={item.icon} />
              <span class="admin_shell-nav_label">{itemLabel(item.labelKey)}</span>
            </a>
          {/each}
        </section>
      {/each}
    </nav>
    <div class="admin_shell-sidebar_footer">
      <Button
        variant="unstyled"
        class="admin_shell-collapse_button"
        onclick={toggleSidebar}
        aria-expanded={!collapsed}
        aria-label={collapsed ? localeCtx.t.nav.expand : localeCtx.t.nav.collapse}
        title={collapsed ? localeCtx.t.nav.expand : localeCtx.t.nav.collapse}
      >
        <NavIcon name={collapsed ? 'expand' : 'collapse'} />
        <span class="admin_shell-collapse_label">{localeCtx.t.nav.collapse}</span>
      </Button>
    </div>
  </aside>
  <div class="admin_shell-main">
    <header class="admin_shell-header">
      <div class="admin_shell-header_start">
        <Button
          variant="unstyled"
          class="admin_shell-menu_button"
          aria-controls="admin-shell-sidebar"
          aria-expanded={!collapsed}
          aria-label={collapsed ? localeCtx.t.nav.expand : localeCtx.t.nav.collapse}
          onclick={toggleSidebar}
        >
          <NavIcon name={collapsed ? 'menu' : 'close'} />
        </Button>
        <div class="admin_shell-breadcrumb">
          <span class="admin_shell-breadcrumb_section"
            >{currentSection ? sectionLabel(currentSection.labelKey) : localeCtx.t.workspace.label}</span
          >
          <span class="admin_shell-breadcrumb_separator" aria-hidden="true">/</span>
          <span class="admin_shell-breadcrumb_current"
            >{currentItem ? itemLabel(currentItem.labelKey) : localeCtx.t.workspace.overview}</span
          >
        </div>
      </div>
      <div class="admin_shell-header_actions">
        <ThemeToggle />
        <div class="admin_shell-locale">
          <Select
            aria-label={localeCtx.t.common.language}
            size="sm"
            value={localeCtx.locale}
            options={localeOptions}
            onValueChange={(next) => localeCtx.setLocale(next as Locale)}
          />
        </div>
        <a
          class="admin_shell-user"
          href="/account"
          title={localeCtx.t.nav.account}
          onclick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
            event.preventDefault()
            go('/account')
          }}
        >
          <span class="admin_shell-avatar" aria-hidden="true"
            >{(user?.name || user?.email || '?').slice(0, 2).toUpperCase()}</span
          >
          <span class="admin_shell-user_name">{user?.name || user?.email}</span>
        </a>
        <Button
          variant="ghost"
          color="neutral"
          shape="square"
          size="sm"
          aria-label={localeCtx.t.common.logout}
          title={localeCtx.t.common.logout}
          onclick={signOut}
        >
          <NavIcon name="logout" />
        </Button>
      </div>
    </header>
    {#if workspace.state.actions}
      <div class="admin_shell-actions">{@render workspace.state.actions()}</div>
    {/if}
    <main class="admin_shell-content" bind:this={workspace.state.content}>
      <div class="admin_shell-page">{@render children()}</div>
    </main>
  </div>
</div>
