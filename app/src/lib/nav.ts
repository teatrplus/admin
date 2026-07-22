import type { AppRoute } from './router'

export type NavItemIcon = 'landing' | 'requests' | 'staff' | 'account'

export type NavItem = {
  route: AppRoute
  labelKey: 'landing' | 'requests' | 'staff' | 'account'
  icon: NavItemIcon
}

export type NavSectionId = 'space' | 'global'

export type NavSection = {
  id: NavSectionId
  labelKey: NavSectionId
  items: NavItem[]
}
