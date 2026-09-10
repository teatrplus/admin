import catalogue from '../../../../shared/theater-content.json'
import { pb } from './client'

export type ContentField = {
  name: string
  label: string
  type: string
  collection?: string
  fields?: ContentField[]
  many?: boolean
  multiline?: boolean
  required?: boolean
  immutable?: boolean
  video?: boolean
  options?: string[]
  optionLabels?: Record<string, string>
  hidden?: boolean
  hint?: string
  default?: string | number | boolean
  showWhen?: { field: string; values: string[] }
  addLabel?: string
  gallery?: boolean
}
export type ContentDefinition = {
  name: string
  label: string
  singleton: boolean
  embedded: boolean
  sort?: string
  sections: { name: string; label: string; description?: string; fields: ContentField[] }[]
}
// Field values are validated against the catalogue at the API boundary. A draft is a
// heterogeneous tree because owned relations use the same editor as their parent.
export type ContentRecord = { id?: string; collectionName?: string; [key: string]: any }
export type ContentItem = { record: ContentRecord; revision: string }
export type ContentList = { items: ContentItem[]; revision: string }
export const contentDefinitions = catalogue as Record<string, ContentDefinition>
export const contentLabel = (value: string, language: string) => {
  const parts = value.split(' / ')
  return parts[language === 'ru' && parts.length > 1 ? 1 : 0] || value
}
export const contentFields = (field: ContentField): ContentField[] =>
  field.fields || contentDefinitions[field.collection!]!.sections.flatMap((section) => section.fields)
export function blankRecord(fields: ContentField[]): ContentRecord {
  return Object.fromEntries(
    fields.flatMap((field): [string, unknown][] => {
      if (field.type === 'localized') return ['ru', 'en', 'uz'].map((locale) => [`${field.name}_${locale}`, ''])
      return [
        [
          field.name,
          field.default ??
            (field.many
              ? []
              : field.type === 'owned'
                ? blankRecord(contentFields(field))
                : field.type === 'bool'
                  ? false
                  : ''),
        ],
      ]
    }),
  )
}
export function recordLabel(
  record: ContentRecord,
  language = 'ru',
  choices: Record<string, ContentRecord[]> = {},
): string {
  if (record.collectionName === 't_staff_role') {
    const staff = choices.t_staff?.find((item) => item.id === record.staff)
    const role = typeof record.role === 'object' ? record.role : choices.t_role?.find((item) => item.id === record.role)
    if (staff || role)
      return [staff, role]
        .filter(Boolean)
        .map((item) => recordLabel(item!, language))
        .join(' — ')
  }
  if (record.staff && (record.collectionName === 't_course_teacher' || !record.collectionName)) {
    const staff = choices.t_staff?.find((item) => item.id === record.staff)
    if (staff) return recordLabel(staff, language)
  }
  if (record.collectionName === 't_performance') {
    const play = choices.t_play?.find((item) => item.id === record.play)
    const date = new Date(record.start_at)
    if (play)
      return `${recordLabel(play, language)} · ${Number.isFinite(date.getTime()) ? date.toLocaleString(language, { dateStyle: 'medium', timeStyle: 'short' }) : ''}`
  }
  for (const field of ['title', 'name', 'label', 'alt', 'description']) {
    const value = record[`${field}_${language}`] || record[`${field}_ru`]
    if (typeof value === 'string' && value) return value.length > 100 ? value.slice(0, 100) + '…' : value
  }
  if (record.collectionName === 't_partner') {
    if (record.website_url) {
      try {
        return new URL(record.website_url).hostname.replace(/^www\./, '')
      } catch {
        // Incomplete URLs can occur while editing a draft.
      }
    }
    return contentLabel('Unnamed partner / Партнёр без названия', language)
  }
  for (const field of ['intro_block', 'copy', 'seo', 'role']) {
    if (record[field] && typeof record[field] === 'object') {
      const label = recordLabel(record[field], language)
      if (label) return label
    }
  }
  if (record.start_at || record.starts_at) {
    const date = new Date(record.start_at || record.starts_at)
    if (Number.isFinite(date.getTime()))
      return date.toLocaleString(language, { dateStyle: 'medium', timeStyle: 'short' })
  }
  return record.slug || record.number || ''
}
export const getContent = (name: string) => pb.send<ContentList>(`/api/theater/content/${name}`, { method: 'GET' })
export const saveContent = async (name: string, item: ContentItem, uploads: File[]) => {
  let content = item
  if (name === 't_blog_post' && typeof item.record.cover === 'string' && item.record.cover.startsWith('@upload:')) {
    const file = uploads[Number(item.record.cover.slice(8))]
    if (file) {
      const image = await createImageBitmap(file)
      content = { ...item, record: { ...item.record, cover_width: image.width, cover_height: image.height } }
      image.close()
    }
  }
  const body = new FormData()
  body.set('content', JSON.stringify(content))
  for (const file of uploads) body.append('files', file)
  return pb.send<ContentItem>(`/api/theater/content/${name}/${item.record.id || 'new'}`, { method: 'POST', body })
}
export const deleteContent = (name: string, item: ContentItem) =>
  pb.send(`/api/theater/content/${name}/${item.record.id}`, { method: 'DELETE', body: { revision: item.revision } })
export const reorderContent = (name: string, list: ContentList, ids: string[]) =>
  pb.send<ContentList>(`/api/theater/content-order/${name}`, { method: 'POST', body: { ids, revision: list.revision } })
export async function loadContentChoices(definition: ContentDefinition) {
  const collections = new Set<string>()
  const visit = (fields: ContentField[]) =>
    fields.forEach((field) => {
      if (['relation', 'membership'].includes(field.type)) collections.add(field.collection!)
      if (['owned', 'children'].includes(field.type)) visit(contentFields(field))
    })
  definition.sections.forEach((section) => visit(section.fields))
  if (collections.has('t_staff_role')) {
    collections.add('t_staff')
    collections.add('t_role')
  }
  return Object.fromEntries(
    await Promise.all(
      [...collections].map(async (collection) => [
        collection,
        await pb.collection(collection).getFullList({ sort: 'id' }),
      ]),
    ),
  )
}
