import { ACTIVE_SCOPES, type SiteScope } from '../cms/scopes'
import type { NavSection } from '../nav'
import { getCurrentUser, isStaffUser, isSuperuser, normalizeRole } from './auth'
import type { StaffScope } from './types'

export type AppRoute =
  | '/'
  | '/login'
  | '/staff'
  | '/account'
  | '/forbidden'
  | `/${SiteScope}/landing`
  | `/${SiteScope}/requests`

export const REQUEST_STAGES = [
  'inquiry',
  'confirmed',
  'rejected',
  'preparation',
  'completed',
  'cancelled',
] as const

export const normalizeStage = (stage: string | undefined | null) => stage?.trim() ?? ''

export const userScopes = (scopes: StaffScope[] | undefined): StaffScope[] => scopes ?? []

export const hasStaffScope = (userScopesList: StaffScope[], siteScope: SiteScope): boolean =>
  userScopesList.includes(siteScope)

export const isAdmin = () => isSuperuser() || normalizeRole(getCurrentUser()?.role) === 'admin'

export const isModerator = () => !isSuperuser() && normalizeRole(getCurrentUser()?.role) === 'moderator'

export const isManager = () => !isSuperuser() && normalizeRole(getCurrentUser()?.role) === 'manager'

export const canAccessScope = (siteScope: SiteScope): boolean => {
  const user = getCurrentUser()
  if (!user) return false
  if (isSuperuser()) return true
  if (!isStaffUser(user)) return false
  const role = normalizeRole(user.role)
  if (role === 'admin') return true
  return hasStaffScope(userScopes(user.scope), siteScope)
}

export const canAccessLanding = (siteScope: SiteScope): boolean => {
  if (!canAccessScope(siteScope)) return false
  if (isSuperuser()) return true
  const role = normalizeRole(getCurrentUser()?.role)
  return role === 'admin' || role === 'moderator'
}

export const canAccessRequests = (siteScope: SiteScope): boolean => {
  if (!canAccessScope(siteScope)) return false
  if (isSuperuser()) return true
  return normalizeRole(getCurrentUser()?.role) !== null
}

export const canAccessStaff = (): boolean => isAdmin()

export const canAccessAccount = (): boolean => Boolean(getCurrentUser())

export const canAccessRoute = (route: AppRoute): boolean => {
  if (route === '/login') return true
  if (!getCurrentUser()) return false
  if (route === '/' || route === '/forbidden') return true
  if (route === '/staff') return canAccessStaff()
  if (route === '/account') return canAccessAccount()

  const match = route.match(/^\/(space|theater)\/(landing|requests)$/)
  if (!match) return false

  const siteScope = match[1] as SiteScope
  const section = match[2]

  if (!(ACTIVE_SCOPES as readonly string[]).includes(siteScope)) return false
  if (section === 'landing') return canAccessLanding(siteScope)
  if (section === 'requests') return canAccessRequests(siteScope)
  return false
}

export const defaultRouteForUser = (): AppRoute => {
  const user = getCurrentUser()
  if (!user) return '/login'
  if (canAccessStaff()) return '/staff'

  for (const scope of ACTIVE_SCOPES) {
    if (canAccessLanding(scope)) return `/${scope}/landing`
    if (canAccessRequests(scope)) return `/${scope}/requests`
  }

  return '/forbidden'
}

export const navSectionsForUser = (): NavSection[] => {
  const sections: NavSection[] = []

  const spaceItems: NavSection['items'] = []
  for (const scope of ACTIVE_SCOPES) {
    if (scope !== 'space') continue
    if (canAccessLanding(scope)) {
      spaceItems.push({ route: `/${scope}/landing`, labelKey: 'landing', icon: 'landing' })
    }
    if (canAccessRequests(scope)) {
      spaceItems.push({ route: `/${scope}/requests`, labelKey: 'requests', icon: 'requests' })
    }
  }

  if (spaceItems.length) {
    sections.push({ id: 'space', labelKey: 'space', items: spaceItems })
  }

  const globalItems: NavSection['items'] = []
  if (canAccessStaff()) {
    globalItems.push({ route: '/staff', labelKey: 'staff', icon: 'staff' })
  }
  if (canAccessAccount()) {
    globalItems.push({ route: '/account', labelKey: 'account', icon: 'account' })
  }

  if (globalItems.length) {
    sections.push({
      id: 'global',
      labelKey: 'global',
      items: globalItems,
    })
  }

  return sections
}

/** @deprecated Use navSectionsForUser */
export const navItemsForUser = () => navSectionsForUser().flatMap((section) => section.items)
