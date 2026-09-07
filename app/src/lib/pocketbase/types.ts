import type { RecordModel } from 'pocketbase'

export type StaffRole = 'admin' | 'moderator' | 'manager' | 'viewer'

export type StaffScope = 'theater' | 'space'

export type RequestStage =
  | 'inquiry'
  | 'confirmed'
  | 'rejected'
  | 'preparation'
  | 'completed'
  | 'cancelled'

export type StaffRecord = RecordModel & {
  collectionName: '_user_staff'
  email: string
  name?: string
  phone_number?: string
  telegram_username?: string
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
  head_ru?: string
  head_en?: string
  head_uz?: string
  body_ru?: string
  body_en?: string
  body_uz?: string
}

export type GalleryItem = RecordModel & {
  caption_ru?: string
  caption_en?: string
  caption_uz?: string
  file?: string
  youtube_url?: string
}

export type SpaceLandingRecord = RecordModel & {
  header_phone_manager?: string
  telegram_manager?: string
  presentation_url?: string
  venue_items?: string[]
  advantage_items?: string[]
  gallery_items?: string[]
  process_items?: string[]
  footer_contact_managers?: string[]
  partners?: string[]
  expand?: {
    venue_items?: HeadBodyItem[]
    advantage_items?: HeadBodyItem[]
    gallery_items?: GalleryItem[]
    process_items?: HeadBodyItem[]
    header_phone_manager?: StaffRecord
    telegram_manager?: StaffRecord
    footer_contact_managers?: StaffRecord[]
  }
}

export type SpaceRequestRecord = RecordModel & {
  client_name?: string
  client_phone_number?: string
  date_requested?: string
  manager?: string
  stage?: RequestStage | string
  /** Higher values render at the top of a stage column. */
  column_index?: number
  is_archived?: boolean
  expand?: {
    manager?: StaffRecord
  }
}
