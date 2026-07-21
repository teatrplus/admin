import type { AppRoute } from './router'

export type NavItemIcon = 'landing' | 'requests' | 'staff'

export type NavItem = {
  route: AppRoute
  labelKey: 'landing' | 'requests' | 'staff'
  icon: NavItemIcon
}

export type NavSectionId = 'space' | 'global'

export type NavSection = {
  id: NavSectionId
  labelKey: NavSectionId
  items: NavItem[]
}
