import type { RecordModel } from 'pocketbase'

export type StaffRole = 'admin' | 'moderator' | 'manager'

export type StaffScope = 'theater' | 'space'

export type RequestStage =
  | 'inquiry'
  | 'confirmed'
  | 'rejected'
  | 'preparation'
  | 'completed'
  | 'cancelled'

export type StaffRecord = RecordModel & {
  collectionName: 'staff'
  email: string
  name?: string
  phoneNumber?: string
  telegramUsername?: string
  role?: StaffRole | string
  scope?: StaffScope[]
  verified?: boolean
}

export type SuperuserRecord = RecordModel & {
  collectionName: '_superusers'
  email: string
  verified?: boolean
}

export type AuthUser = StaffRecord | SuperuserRecord

export type HeadBodyItem = RecordModel & {
  headRu?: string
  headEn?: string
  headUz?: string
  bodyRu?: string
  bodyEn?: string
  bodyUz?: string
}

export type GalleryItem = RecordModel & {
  captionRu?: string
  captionEn?: string
  captionUz?: string
  file?: string
  youtubeUrl?: string
}

export type SpaceLandingRecord = RecordModel & {
  headerPhoneManager?: string
  telegramManager?: string
  presentationUrl?: string
  venueItems?: string[]
  advantageItems?: string[]
  galleryItems?: string[]
  processItems?: string[]
  footerContactManagers?: string[]
  partners?: string[]
  expand?: {
    venueItems?: HeadBodyItem[]
    advantageItems?: HeadBodyItem[]
    galleryItems?: GalleryItem[]
    processItems?: HeadBodyItem[]
    headerPhoneManager?: StaffRecord
    telegramManager?: StaffRecord
    footerContactManagers?: StaffRecord[]
  }
}

export type SpaceRequestRecord = RecordModel & {
  clientName?: string
  clientPhoneNumber?: string
  dateRequested?: string
  manager?: string
  stage?: RequestStage | string
  /** Higher values render at the top of a stage column. */
  columnIndex?: number
  isArchived?: boolean
  expand?: {
    manager?: StaffRecord
  }
}
