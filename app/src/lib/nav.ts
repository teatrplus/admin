import type { AppRoute } from './router'

export type NavItemIcon =
  'landing' | 'requests' | 'staff' | 'account' | 'social' | 'homepage' | 'masks' | 'inquiries' | 'general'

export type NavItem = {
  route: AppRoute
  labelKey:
    'inquiries' | 'landing' | 'requests' | 'staff' | 'account' | 'social' | 'masks' | 'homepage' | 'content' | 'general'
  icon: NavItemIcon
}

export type NavSectionId = 'space' | 'theater' | 'global'

export type NavSection = {
  id: NavSectionId
  labelKey: NavSectionId
  items: NavItem[]
}
