export const SITE_SCOPES = ['space', 'theater'] as const

export type SiteScope = (typeof SITE_SCOPES)[number]

/** Scopes with CMS routes implemented in this app. */
export const ACTIVE_SCOPES: readonly SiteScope[] = ['space']

export const GLOBAL_COLLECTIONS = {
  staff: '_user_staff',
} as const

export const scopedCollection = {
  landing: (scope: SiteScope) => `${scope === 'space' ? 's' : 't'}_landing`,
  request: (scope: SiteScope) => `${scope === 'space' ? 's' : 't'}_request`,
  venueItem: (scope: SiteScope) => `${scope === 'space' ? 's' : 't'}_venue_item`,
  advantageItem: (scope: SiteScope) => `${scope === 'space' ? 's' : 't'}_advantage_item`,
  galleryItem: (scope: SiteScope) => `${scope === 'space' ? 's' : 't'}_gallery_item`,
  processItem: (scope: SiteScope) => `${scope === 'space' ? 's' : 't'}_process_item`,
} as const

export type ScopedCollectionKey = keyof typeof scopedCollection

export const isSiteScope = (value: string): value is SiteScope =>
  (SITE_SCOPES as readonly string[]).includes(value)

export const scopeLabelKey = (scope: SiteScope) => `scopes.${scope}` as const
