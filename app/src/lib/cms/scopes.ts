export const SITE_SCOPES = ['space', 'theater'] as const

export type SiteScope = (typeof SITE_SCOPES)[number]

/** Scopes with CMS routes implemented in this app. */
export const ACTIVE_SCOPES: readonly SiteScope[] = ['space']

export const GLOBAL_COLLECTIONS = {
  staff: 'staff',
} as const

export const scopedCollection = {
  landing: (scope: SiteScope) => `${scope}_landing`,
  request: (scope: SiteScope) => `${scope}_request`,
  venueItem: (scope: SiteScope) => `${scope}_venue_item`,
  advantageItem: (scope: SiteScope) => `${scope}_advantage_item`,
  galleryItem: (scope: SiteScope) => `${scope}_gallery_item`,
  processItem: (scope: SiteScope) => `${scope}_process_item`,
} as const

export type ScopedCollectionKey = keyof typeof scopedCollection

export const isSiteScope = (value: string): value is SiteScope =>
  (SITE_SCOPES as readonly string[]).includes(value)

export const scopeLabelKey = (scope: SiteScope) => `scopes.${scope}` as const
