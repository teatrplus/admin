import type { RecordModel } from 'pocketbase'
import { pb } from './client'

export const homeLocales = ['ru', 'en', 'uz'] as const
export const copyRelations = ['about_block', 'instagram_block', 'cta_block', 'bottom_block'] as const
export const buttonRelations = ['instagram_button', 'cta_button', 'bottom_button'] as const
export const imageFields = ['instagram_avatar', 'bottom_image'] as const
export type HomeImageField = (typeof imageFields)[number]
export type HomeContent = {
  page: RecordModel
  contact: RecordModel
  copies: Record<string, RecordModel | null>
  buttons: Record<string, RecordModel | null>
  stats: RecordModel[]
  revision: string
}
export type HomeDraft = {
  revision: string
  featured_plays: string[]
  about_mask: string
  afisha_mask: string
  cta_mask: string
  instagram_url: string
  copies: Record<string, Record<string, string>>
  buttons: Record<string, Record<string, string>>
  stats: Record<string, string>[]
}
export function blankCopy(
  record?: RecordModel | Record<string, string> | null,
  fields = ['title', 'lede', 'description'],
) {
  return Object.fromEntries(
    fields.flatMap((field) =>
      homeLocales.map((locale) => [`${field}_${locale}`, String(record?.[`${field}_${locale}`] ?? '')]),
    ),
  )
}
export function homeDraft(data: HomeContent): HomeDraft {
  return {
    revision: data.revision,
    featured_plays: [...(data.page.featured_plays ?? [])],
    about_mask: data.page.about_mask ?? '',
    afisha_mask: data.page.afisha_mask ?? '',
    cta_mask: data.page.cta_mask ?? '',
    instagram_url: data.contact.instagram_url ?? '',
    copies: Object.fromEntries(copyRelations.map((field) => [field, blankCopy(data.copies[field])])),
    buttons: Object.fromEntries(
      buttonRelations.map((field) => [
        field,
        { ...blankCopy(data.buttons[field], ['label']), url: data.buttons[field]?.url ?? '' },
      ]),
    ),
    stats: data.stats.map((record) => ({ ...blankCopy(record), id: record.id })),
  }
}
export const getHomeContent = () => pb.send<HomeContent>('/api/theater/home', { method: 'GET' })
export async function getHomeChoices() {
  const [plays, masks] = await Promise.all([
    pb.collection('t_play').getFullList({ sort: 'created', fields: 'id,title_ru,title_en,title_uz' }),
    pb.collection('t_mask').getFullList({ sort: 'sort_order,slug', fields: 'id,name_ru,name_en,name_uz' }),
  ])
  return { plays, masks }
}
export const saveHomeContent = (draft: HomeDraft, images: Record<HomeImageField, File | string | null>) => {
  const form = new FormData()
  form.set(
    'content',
    JSON.stringify({ ...draft, remove_images: imageFields.filter((field) => images[field] === null) }),
  )
  for (const field of imageFields) if (images[field] instanceof File) form.set(field, images[field])
  return pb.send<HomeContent>('/api/theater/home', { method: 'POST', body: form })
}
