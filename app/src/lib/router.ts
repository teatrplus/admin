import { canAccessRoute, defaultRouteForUser, type AppRoute } from './pocketbase/permissions'

const normalizePath = (pathname: string): AppRoute | '/unknown' => {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return '/'
  if (path === '/login') return '/login'
  if (path === '/staff') return '/staff'
  if (path === '/forbidden') return '/forbidden'
  if (path === '/space/landing') return '/space/landing'
  if (path === '/space/requests') return '/space/requests'
  if (path === '/theater/landing') return '/theater/landing'
  if (path === '/theater/requests') return '/theater/requests'
  return '/unknown'
}

export const getRoute = () => normalizePath(window.location.pathname)

export const navigate = (route: AppRoute, replace = false) => {
  if (replace) {
    window.history.replaceState({}, '', route)
  } else {
    window.history.pushState({}, '', route)
  }
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export const resolveGuardedRoute = (pathname: string): AppRoute => {
  const route = normalizePath(pathname)
  if (route === '/unknown') return defaultRouteForUser()
  if (route === '/login') return route
  if (!canAccessRoute(route)) return '/forbidden'
  return route
}

export type { AppRoute }
