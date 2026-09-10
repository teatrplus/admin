import type { RecordModel } from 'pocketbase'
import { pb } from './client'

export const contentLocales = ['ru', 'en', 'uz'] as const
export const maskFields = ['name', 'description'] as const
const museumCopyFields: Record<string, [string, string]> = {
  title: ['intro_block', 'title'],
  lede: ['intro_block', 'lede'],
  description: ['intro_block', 'description'],
  museum_title: ['visit_block', 'title'],
  museum_description: ['visit_block', 'description'],
  excursion_title: ['excursion_block', 'title'],
  excursion_kicker: ['excursion_block', 'lede'],
  excursion_description: ['excursion_block', 'description'],
  museum_button_label: ['visit_button', 'label'],
  excursion_button_label: ['excursion_button', 'label'],
}
export const museumFields = Object.keys(museumCopyFields)
const museumExpand = 'intro_block,visit_block,visit_button,excursion_block,excursion_button'
const museumRevision = (record: RecordModel) =>
  [record, ...Object.values(record.expand ?? {})]
    .map((item) => item.id + ':' + item.updated)
    .sort()
    .join('|')

export async function getMuseumContent() {
  const [masks, pages] = await Promise.all([
    pb.collection('t_mask').getFullList({ sort: 'sort_order,slug' }),
    pb.collection('t_page_masks').getFullList({ expand: museumExpand }),
  ])
  if (pages.length !== 1) throw new Error('Expected one museum page')
  return { masks, page: pages[0]! }
}

export function museumDraft(record: RecordModel | undefined, page: boolean): Record<string, string> {
  const draft: Record<string, string> = {}
  if (page) {
    for (const [field, [relation, source]] of Object.entries(museumCopyFields)) {
      const related = record?.expand?.[relation]
      if (!related) throw new Error(`Missing museum relation: ${relation}`)
      for (const locale of contentLocales) draft[`${field}_${locale}`] = String(related[`${source}_${locale}`] ?? '')
    }
    draft.museum_button_url = String(record?.expand?.visit_button?.url ?? '')
    draft.excursion_button_url = String(record?.expand?.excursion_button?.url ?? '')
  } else {
    for (const field of maskFields)
      for (const locale of contentLocales) draft[`${field}_${locale}`] = String(record?.[`${field}_${locale}`] ?? '')
    draft.slug = String(record?.slug ?? '')
    if (!record) draft.sort_order = '0'
  }
  return draft
}

export async function saveMuseumContent(
  record: RecordModel | undefined,
  page: boolean,
  draft: Record<string, string>,
  files: (File | string)[],
) {
  const form = new FormData()
  if (page) {
    if (!record) throw new Error('Missing museum page')
    const photos: (string | number)[] = []
    let uploadIndex = 0
    for (const file of files) {
      if (typeof file === 'string') photos.push(file)
      else {
        photos.push(uploadIndex++)
        form.append('excursion_photos', file)
      }
    }
    form.set('content', JSON.stringify({ revision: museumRevision(record), draft, photos }))
    return pb.send<RecordModel>('/api/theater/museum-page', { method: 'POST', body: form })
  }
  for (const [key, value] of Object.entries(draft)) form.set(key, String(value).trim())
  const field = 'image'
  if (files.length) for (const file of files) form.append(field, file)
  else form.set(field, '')
  const collection = pb.collection('t_mask')
  return record ? collection.update(record.id, form) : collection.create(form)
}

export const museumFieldLabels: Record<string, [string, string]> = {
  name: ['Name', 'Название'],
  description: ['Description', 'Описание'],
  title: ['Title', 'Заголовок'],
  lede: ['Introduction', 'Вступление'],
  museum_title: ['Visit heading', 'Заголовок посещения'],
  museum_description: ['Visit description', 'Описание посещения'],
  museum_button_label: ['Directions button', 'Кнопка маршрута'],
  excursion_kicker: ['Tour eyebrow', 'Надзаголовок экскурсии'],
  excursion_title: ['Tour title', 'Заголовок экскурсии'],
  excursion_description: ['Tour description', 'Описание экскурсии'],
  excursion_button_label: ['Tour button', 'Кнопка экскурсии'],
  museum_button_url: ['Directions URL', 'Ссылка на маршрут'],
  excursion_button_url: ['Tour tickets URL', 'Ссылка на билеты экскурсии'],
}

export function saveMaskOrder(ids: string[], masks: RecordModel[]) {
  const revision = masks
    .map((mask) => `${mask.id}:${mask.sort_order ?? 0}`)
    .sort()
    .join('|')
  return pb.send<RecordModel[]>('/api/theater/mask-order', { method: 'POST', body: { ids, revision } })
}
