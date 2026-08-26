import type { AppRoute } from './router'

export type NavItemIcon = 'landing' | 'requests' | 'staff' | 'account' | 'social'

export type NavItem = {
  route: AppRoute
  labelKey: 'landing' | 'requests' | 'staff' | 'account' | 'social'
  icon: NavItemIcon
}

export type NavSectionId = 'space' | 'theater' | 'global'

export type NavSection = {
  id: NavSectionId
  labelKey: NavSectionId
  items: NavItem[]
}
