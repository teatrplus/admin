<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import { pb } from './lib/pocketbase/client'
  import { initLocaleContext } from './lib/i18n/context.svelte'
  import { queryClient } from './lib/query/client'
  import { navigate, resolveGuardedRoute, type AppRoute } from './lib/router'
  import AdminShell from './features/AdminShell/AdminShell.svelte'
  import ForbiddenPage from './features/ForbiddenPage/ForbiddenPage.svelte'
  import HomePage from './features/HomePage/HomePage.svelte'
  import LoginPage from './features/LoginPage/LoginPage.svelte'
  import AccountSettings from './features/AccountSettings/AccountSettings.svelte'
  import ToastList from './components/ToastList/ToastList.svelte'
  import './App.css'

  const loadStaffManager = () => import('./features/StaffManager/StaffManager.svelte')
  const loadLandingEditor = () => import('./features/LandingEditor/LandingEditor.svelte')
  const loadRequestsBoard = () => import('./features/RequestsBoard/RequestsBoard.svelte')

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

<QueryClientProvider client={queryClient}>
  {#if !authed || route === '/login'}
    <LoginPage />
  {:else if route === '/'}
    <AdminShell>
      <HomePage />
    </AdminShell>
  {:else if route === '/forbidden'}
    <AdminShell>
      <ForbiddenPage />
    </AdminShell>
  {:else if route === '/staff'}
    <AdminShell>
      {#await loadStaffManager() then { default: StaffManager }}
        <StaffManager />
      {:catch}
        <p class="app_route_status" role="alert">Failed to load staff manager.</p>
      {/await}
    </AdminShell>
  {:else if route === '/account'}
    <AdminShell>
      <AccountSettings />
    </AdminShell>
  {:else if route === '/space/landing'}
    <AdminShell>
      {#await loadLandingEditor() then { default: LandingEditor }}
        <LandingEditor scope="space" />
      {:catch}
        <p class="app_route_status" role="alert">Failed to load landing editor.</p>
      {/await}
    </AdminShell>
  {:else if route === '/space/requests'}
    <AdminShell>
      {#await loadRequestsBoard() then { default: RequestsBoard }}
        <RequestsBoard scope="space" />
      {:catch}
        <p class="app_route_status" role="alert">Failed to load requests board.</p>
      {/await}
    </AdminShell>
  {:else}
    <AdminShell>
      <ForbiddenPage />
    </AdminShell>
  {/if}

  <ToastList />
</QueryClientProvider>
