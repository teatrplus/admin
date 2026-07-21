<script lang="ts">
  import { pb } from './lib/pocketbase/client'
  import { initLocaleContext } from './lib/i18n/context.svelte'
  import { navigate, resolveGuardedRoute, type AppRoute } from './lib/router'
  import AdminShell from './features/AdminShell/AdminShell.svelte'
  import ForbiddenPage from './features/ForbiddenPage/ForbiddenPage.svelte'
  import LandingEditor from './features/LandingEditor/LandingEditor.svelte'
  import LoginPage from './features/LoginPage/LoginPage.svelte'
  import RequestsBoard from './features/RequestsBoard/RequestsBoard.svelte'
  import StaffManager from './features/StaffManager/StaffManager.svelte'

  initLocaleContext()

  let route = $state<AppRoute>(resolveGuardedRoute(window.location.pathname))
  let authed = $state(pb.authStore.isValid)

  const syncRoute = () => {
    authed = pb.authStore.isValid
    if (!authed) {
      route = '/login'
      if (window.location.pathname !== '/login') {
        navigate('/login', true)
      }
      return
    }

    const next = resolveGuardedRoute(window.location.pathname)
    route = next
    if (window.location.pathname !== next) {
      navigate(next, true)
    }
  }

  $effect(() => {
    syncRoute()
    const unsubscribe = pb.authStore.onChange(() => syncRoute())
    const onPopState = () => syncRoute()
    window.addEventListener('popstate', onPopState)

    return () => {
      unsubscribe()
      window.removeEventListener('popstate', onPopState)
    }
  })
</script>

{#if !authed || route === '/login'}
  <LoginPage />
{:else if route === '/forbidden'}
  <AdminShell>
    <ForbiddenPage />
  </AdminShell>
{:else if route === '/staff'}
  <AdminShell>
    <StaffManager />
  </AdminShell>
{:else if route === '/space/landing'}
  <AdminShell>
    <LandingEditor scope="space" />
  </AdminShell>
{:else if route === '/space/requests'}
  <AdminShell>
    <RequestsBoard scope="space" />
  </AdminShell>
{:else}
  <AdminShell>
    <ForbiddenPage />
  </AdminShell>
{/if}
