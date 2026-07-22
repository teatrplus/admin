import { scopedCollection, type SiteScope } from '../cms/scopes'
import { isImageFile } from '../media/images'
import { pb } from './client'
import type { GalleryItem, HeadBodyItem, SpaceLandingRecord } from './types'

export const CONTENT_LOCALES = ['ru', 'en', 'uz'] as const
export type ContentLocale = (typeof CONTENT_LOCALES)[number]

const expand =
  'venueItems,advantageItems,galleryItems,processItems,headerPhoneManager,telegramManager,footerContactManagers'

const asRelationId = (value: string | string[] | undefined | null) => {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export const loadLanding = async (scope: SiteScope) => {
  const collection = scopedCollection.landing(scope)
  try {
    return (await pb.collection(collection).getFirstListItem('', { expand })) as SpaceLandingRecord
  } catch (error) {
    const status = (error as { status?: number }).status
    if (status === 404) return null
    throw error
  }
}

export type HeadBodyRow = {
  localId: string
  id?: string
  headRu: string
  headEn: string
  headUz: string
  bodyRu: string
  bodyEn: string
  bodyUz: string
}

export type GalleryRow = {
  localId: string
  id?: string
  captionRu: string
  captionEn: string
  captionUz: string
  youtubeUrl: string
  file?: File | null
  existingFile?: string
  previewUrl?: string
}

export type PartnerAsset = {
  name: string
  url: string
}

export type PendingPartnerFile = {
  localId: string
  file: File
  previewUrl: string
}

export type LandingFormState = {
  landingId?: string
  headerPhoneManagerId: string
  telegramManagerId: string
  presentationUrl: string
  venueItems: HeadBodyRow[]
  advantageItems: HeadBodyRow[]
  processItems: HeadBodyRow[]
  galleryItems: GalleryRow[]
  footerContactManagerIds: string[]
  partnerFiles: PendingPartnerFile[]
  existingPartners: PartnerAsset[]
  removedVenueIds: string[]
  removedAdvantageIds: string[]
  removedProcessIds: string[]
  removedGalleryIds: string[]
}

const newLocalId = () => crypto.randomUUID()

export const emptyHeadBodyRow = (): HeadBodyRow => ({
  localId: newLocalId(),
  headRu: '',
  headEn: '',
  headUz: '',
  bodyRu: '',
  bodyEn: '',
  bodyUz: '',
})

export const emptyGalleryRow = (partial?: Partial<GalleryRow>): GalleryRow => ({
  localId: newLocalId(),
  captionRu: '',
  captionEn: '',
  captionUz: '',
  youtubeUrl: '',
  file: null,
  ...partial,
})

export const galleryRowHasImage = (row: GalleryRow) => Boolean(row.file || row.existingFile)

export const youtubeVideoId = (url: string): string | null => {
  const trimmed = url.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id || null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v')
      const parts = parsed.pathname.split('/').filter(Boolean)
      if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') {
        return parts[1] ?? null
      }
    }
  } catch {
    return null
  }

  return null
}

export const isValidYoutubeUrl = (url: string) => Boolean(youtubeVideoId(url))

export const youtubeThumbnailUrl = (url: string) => {
  const id = youtubeVideoId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

const toHeadBodyRow = (item: HeadBodyItem): HeadBodyRow => ({
  localId: newLocalId(),
  id: item.id,
  headRu: item.headRu ?? '',
  headEn: item.headEn ?? '',
  headUz: item.headUz ?? '',
  bodyRu: item.bodyRu ?? '',
  bodyEn: item.bodyEn ?? '',
  bodyUz: item.bodyUz ?? '',
})

const withMinHeadBody = (items: HeadBodyItem[] | undefined) => {
  const rows = (items ?? []).map(toHeadBodyRow)
  return rows.length > 0 ? rows : [emptyHeadBodyRow()]
}

export const landingToForm = (record: SpaceLandingRecord | null): LandingFormState => {
  if (!record) {
    return {
      headerPhoneManagerId: '',
      telegramManagerId: '',
      presentationUrl: '',
      venueItems: [emptyHeadBodyRow()],
      advantageItems: [emptyHeadBodyRow()],
      processItems: [emptyHeadBodyRow()],
      galleryItems: [],
      footerContactManagerIds: [],
      partnerFiles: [],
      existingPartners: [],
      removedVenueIds: [],
      removedAdvantageIds: [],
      removedProcessIds: [],
      removedGalleryIds: [],
    }
  }

  return {
    landingId: record.id,
    headerPhoneManagerId: asRelationId(record.headerPhoneManager),
    telegramManagerId: asRelationId(record.telegramManager),
    presentationUrl: record.presentationUrl ?? '',
    venueItems: withMinHeadBody(record.expand?.venueItems),
    advantageItems: withMinHeadBody(record.expand?.advantageItems),
    processItems: withMinHeadBody(record.expand?.processItems),
    galleryItems: (record.expand?.galleryItems ?? []).map((item) =>
      emptyGalleryRow({
        id: item.id,
        captionRu: item.captionRu ?? '',
        captionEn: item.captionEn ?? '',
        captionUz: item.captionUz ?? '',
        youtubeUrl: item.youtubeUrl ?? '',
        existingFile: item.file,
        previewUrl: item.file ? pb.files.getURL(item, item.file) : undefined,
      }),
    ),
    footerContactManagerIds: record.footerContactManagers ?? [],
    partnerFiles: [],
    existingPartners: (record.partners ?? []).map((name) => ({
      name,
      url: pb.files.getURL(record, name),
    })),
    removedVenueIds: [],
    removedAdvantageIds: [],
    removedProcessIds: [],
    removedGalleryIds: [],
  }
}

const isBlank = (value: string) => !value.trim()

const hasAnyText = (...values: string[]) => values.some((value) => !isBlank(value))

const headKeys = ['headRu', 'headEn', 'headUz'] as const
const bodyKeys = ['bodyRu', 'bodyEn', 'bodyUz'] as const

export type LandingFieldErrors = Record<string, true>

/**
 * Copy the first non-empty locale into blank siblings so PB required
 * headRu/En/Uz (etc.) can be satisfied while editing one language at a time.
 */
export const fillBlankLocales = (form: LandingFormState) => {
  const triad = (ru: string, en: string, uz: string): [string, string, string] => {
    const fallback = ru.trim() || en.trim() || uz.trim()
    return [ru.trim() || fallback, en.trim() || fallback, uz.trim() || fallback]
  }

  for (const row of form.venueItems) {
    ;[row.headRu, row.headEn, row.headUz] = triad(row.headRu, row.headEn, row.headUz)
    ;[row.bodyRu, row.bodyEn, row.bodyUz] = triad(row.bodyRu, row.bodyEn, row.bodyUz)
  }
  for (const row of form.advantageItems) {
    ;[row.headRu, row.headEn, row.headUz] = triad(row.headRu, row.headEn, row.headUz)
    ;[row.bodyRu, row.bodyEn, row.bodyUz] = triad(row.bodyRu, row.bodyEn, row.bodyUz)
  }
  for (const row of form.processItems) {
    ;[row.headRu, row.headEn, row.headUz] = triad(row.headRu, row.headEn, row.headUz)
    ;[row.bodyRu, row.bodyEn, row.bodyUz] = triad(row.bodyRu, row.bodyEn, row.bodyUz)
  }
  for (const row of form.galleryItems) {
    ;[row.captionRu, row.captionEn, row.captionUz] = triad(
      row.captionRu,
      row.captionEn,
      row.captionUz,
    )
  }
}

/** Collects every invalid path so the UI can mark fields and summarize in a toast. */
export const collectLandingFieldErrors = (form: LandingFormState): LandingFieldErrors => {
  const errors: LandingFieldErrors = {}

  if (!form.headerPhoneManagerId) errors.headerPhoneManager = true

  const markHeadBody = (
    items: HeadBodyRow[],
    prefix: 'venueItems' | 'advantageItems' | 'processItems',
    section: 'venues' | 'advantages' | 'process',
  ) => {
    if (items.length === 0) {
      errors[section] = true
      return
    }
    for (const row of items) {
      if (!hasAnyText(row.headRu, row.headEn, row.headUz)) {
        for (const key of headKeys) errors[`${prefix}.${row.localId}.${key}`] = true
      }
      if (!hasAnyText(row.bodyRu, row.bodyEn, row.bodyUz)) {
        for (const key of bodyKeys) errors[`${prefix}.${row.localId}.${key}`] = true
      }
    }
  }

  markHeadBody(form.venueItems, 'venueItems', 'venues')
  markHeadBody(form.advantageItems, 'advantageItems', 'advantages')
  markHeadBody(form.processItems, 'processItems', 'process')

  if (form.galleryItems.length === 0) {
    errors.gallery = true
  } else {
    for (const row of form.galleryItems) {
      const hasImage = galleryRowHasImage(row)
      const hasYoutube = !isBlank(row.youtubeUrl)

      if (!hasImage && !hasYoutube) errors[`galleryItems.${row.localId}.media`] = true
      if (hasImage && hasYoutube) errors[`galleryItems.${row.localId}.both`] = true
      if (hasYoutube && !isValidYoutubeUrl(row.youtubeUrl)) {
        errors[`galleryItems.${row.localId}.youtubeUrl`] = true
      }
    }
  }

  return errors
}

export const hasLandingFieldErrors = (errors: LandingFieldErrors) => Object.keys(errors).length > 0

/** First content locale that still has blank required text fields. */
export const firstIncompleteContentLocale = (
  errors: LandingFieldErrors,
): ContentLocale | null => {
  for (const locale of CONTENT_LOCALES) {
    const suffix = locale === 'ru' ? 'Ru' : locale === 'en' ? 'En' : 'Uz'
    const hit = Object.keys(errors).some(
      (path) => path.endsWith(`.head${suffix}`) || path.endsWith(`.body${suffix}`),
    )
    if (hit) return locale
  }
  return null
}

const headBodySnapshot = ({ id, headRu, headEn, headUz, bodyRu, bodyEn, bodyUz }: HeadBodyRow) => ({
  id: id ?? null,
  headRu,
  headEn,
  headUz,
  bodyRu,
  bodyEn,
  bodyUz,
})

/** Stable snapshot for dirty checking (ignores ephemeral localIds / blob URLs). */
export const serializeLandingForm = (form: LandingFormState) =>
  JSON.stringify({
    landingId: form.landingId ?? null,
    headerPhoneManagerId: form.headerPhoneManagerId,
    telegramManagerId: form.telegramManagerId,
    presentationUrl: form.presentationUrl,
    venueItems: form.venueItems.map(headBodySnapshot),
    advantageItems: form.advantageItems.map(headBodySnapshot),
    processItems: form.processItems.map(headBodySnapshot),
    galleryItems: form.galleryItems.map(
      ({ id, captionRu, captionEn, captionUz, youtubeUrl, existingFile, file }) => ({
        id: id ?? null,
        captionRu,
        captionEn,
        captionUz,
        youtubeUrl: youtubeUrl.trim(),
        existingFile: existingFile ?? null,
        file: file ? `${file.name}:${file.size}:${file.lastModified}` : null,
      }),
    ),
    footerContactManagerIds: [...form.footerContactManagerIds].sort(),
    existingPartners: form.existingPartners.map((partner) => partner.name),
    partnerFiles: form.partnerFiles.map(
      (pending) => `${pending.file.name}:${pending.file.size}:${pending.file.lastModified}`,
    ),
    removedVenueIds: [...form.removedVenueIds].sort(),
    removedAdvantageIds: [...form.removedAdvantageIds].sort(),
    removedProcessIds: [...form.removedProcessIds].sort(),
    removedGalleryIds: [...form.removedGalleryIds].sort(),
  })

const headBodyPayload = (row: HeadBodyRow) => ({
  headRu: row.headRu,
  headEn: row.headEn,
  headUz: row.headUz,
  bodyRu: row.bodyRu,
  bodyEn: row.bodyEn,
  bodyUz: row.bodyUz,
})

const upsertHeadBody = async (collection: string, row: HeadBodyRow): Promise<string> => {
  const payload = headBodyPayload(row)
  if (row.id) {
    await pb.collection(collection).update(row.id, payload)
    return row.id
  }
  const created = (await pb.collection(collection).create(payload)) as HeadBodyItem
  return created.id
}

const setGalleryCaptions = (formData: FormData, row: GalleryRow) => {
  formData.set('captionRu', row.captionRu)
  formData.set('captionEn', row.captionEn)
  formData.set('captionUz', row.captionUz)
}

const upsertGallery = async (collection: string, row: GalleryRow): Promise<string> => {
  const youtubeUrl = row.youtubeUrl.trim()
  const hasImage = galleryRowHasImage(row)
  const hasYoutube = Boolean(youtubeUrl)

  if (row.file) {
    if (!isImageFile(row.file)) {
      throw new Error('Gallery file must be an image')
    }

    const formData = new FormData()
    setGalleryCaptions(formData, row)
    formData.set('youtubeUrl', '')
    formData.set('file', row.file)
    if (row.id) {
      await pb.collection(collection).update(row.id, formData)
      return row.id
    }
    const created = (await pb.collection(collection).create(formData)) as GalleryItem
    return created.id
  }

  if (hasYoutube) {
    const formData = new FormData()
    setGalleryCaptions(formData, row)
    formData.set('youtubeUrl', youtubeUrl)
    formData.set('file', '')
    if (row.id) {
      await pb.collection(collection).update(row.id, formData)
      return row.id
    }
    const created = (await pb.collection(collection).create(formData)) as GalleryItem
    return created.id
  }

  if (hasImage) {
    const payload = {
      captionRu: row.captionRu,
      captionEn: row.captionEn,
      captionUz: row.captionUz,
      youtubeUrl: '',
    }
    if (row.id) {
      await pb.collection(collection).update(row.id, payload)
      return row.id
    }
    const created = (await pb.collection(collection).create(payload)) as GalleryItem
    return created.id
  }

  throw new Error('Gallery item must include an image or YouTube link')
}

export const saveLanding = async (scope: SiteScope, form: LandingFormState) => {
  const landingCollection = scopedCollection.landing(scope)
  const venueCollection = scopedCollection.venueItem(scope)
  const advantageCollection = scopedCollection.advantageItem(scope)
  const processCollection = scopedCollection.processItem(scope)
  const galleryCollection = scopedCollection.galleryItem(scope)

  for (const id of form.removedVenueIds) await pb.collection(venueCollection).delete(id)
  for (const id of form.removedAdvantageIds) await pb.collection(advantageCollection).delete(id)
  for (const id of form.removedProcessIds) await pb.collection(processCollection).delete(id)
  for (const id of form.removedGalleryIds) await pb.collection(galleryCollection).delete(id)

  const venueIds = await Promise.all(form.venueItems.map((row) => upsertHeadBody(venueCollection, row)))
  const advantageIds = await Promise.all(
    form.advantageItems.map((row) => upsertHeadBody(advantageCollection, row)),
  )
  const processIds = await Promise.all(form.processItems.map((row) => upsertHeadBody(processCollection, row)))
  const galleryIds = await Promise.all(form.galleryItems.map((row) => upsertGallery(galleryCollection, row)))

  const landingForm = new FormData()
  landingForm.set('headerPhoneManager', form.headerPhoneManagerId)
  landingForm.set('telegramManager', form.telegramManagerId)
  landingForm.set('presentationUrl', form.presentationUrl)
  for (const id of venueIds) landingForm.append('venueItems', id)
  for (const id of advantageIds) landingForm.append('advantageItems', id)
  for (const id of processIds) landingForm.append('processItems', id)
  for (const id of galleryIds) landingForm.append('galleryItems', id)
  if (form.footerContactManagerIds.length === 0) {
    landingForm.set('footerContactManagers', '')
  } else {
    for (const id of form.footerContactManagerIds) landingForm.append('footerContactManagers', id)
  }
  for (const partner of form.existingPartners) landingForm.append('partners', partner.name)
  for (const pending of form.partnerFiles) landingForm.append('partners', pending.file)

  if (form.landingId) {
    await pb.collection(landingCollection).update(form.landingId, landingForm)
  } else {
    await pb.collection(landingCollection).create(landingForm)
  }

  // PocketBase create/update responses omit expands — reload so repeaters stay populated.
  const fresh = await loadLanding(scope)
  if (!fresh) throw new Error('Landing record missing after save')
  return fresh
}

export const listManagers = async () => {
  const records = await pb.collection('staff').getFullList({
    filter: "role = 'manager'",
    sort: 'name',
  })
  return records
}
