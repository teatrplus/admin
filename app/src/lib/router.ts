import { canAccessRoute, defaultRouteForUser, type AppRoute } from './pocketbase/permissions'

const normalizePath = (pathname: string): AppRoute | '/unknown' => {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return '/'
  if (path === '/login') return '/login'
  if (path === '/staff') return '/staff'
  if (path === '/account') return '/account'
  if (path === '/forbidden') return '/forbidden'
  if (path === '/space/landing') return '/space/landing'
  if (path === '/space/requests') return '/space/requests'
  if (path === '/theater/landing') return '/theater/landing'
  if (path === '/theater/requests') return '/theater/requests'
  if (path === '/theater/inquiries') return '/theater/inquiries'
  if (path === '/theater/social') return '/theater/social'
  if (path === '/theater/home') return '/theater/home'
  if (path === '/theater/masks') return '/theater/masks'
  if (['/theater/general', '/theater/content/settings', '/theater/content/t_site_settings'].includes(path))
    return '/theater/general'
  if (path === '/theater/content' || /^\/theater\/content\/[a-z_-]+$/.test(path)) return path as AppRoute
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
