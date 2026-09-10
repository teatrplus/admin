import type { AppRoute } from './router'

export type NavItemIcon = 'landing' | 'requests' | 'staff' | 'account' | 'social' | 'homepage' | 'masks' | 'inquiries'

export type NavItem = {
  route: AppRoute
  labelKey: 'inquiries' | 'landing' | 'requests' | 'staff' | 'account' | 'social' | 'masks' | 'homepage'
  icon: NavItemIcon
}

export type NavSectionId = 'space' | 'theater' | 'global'

export type NavSection = {
  id: NavSectionId
  labelKey: NavSectionId
  items: NavItem[]
}
