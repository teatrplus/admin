import type { RecordModel } from 'pocketbase'
import { pb } from './client'

export const contentLocales = ['ru', 'en', 'uz'] as const
export const maskFields = ['name', 'description'] as const
export const museumFields = [
  'title',
  'lede',
  'description',
  'kicker',
  'hall_title',
  'back_label',
  'museum_title',
  'museum_description',
  'museum_button_label',
  'excursion_kicker',
  'excursion_title',
  'excursion_description',
  'excursion_button_label',
  'excursion_photo_alt',
  'excursion_gallery_label',
  'previous_photo_label',
  'next_photo_label',
  'mask_image_alt',
  'meta_title',
  'meta_description',
  'mask_meta_title',
  'mask_meta_description',
] as const

export async function getMuseumContent() {
  const [masks, pages] = await Promise.all([
    pb.collection('t_mask').getFullList({ sort: 'sort_order,slug' }),
    pb.collection('t_page_masks').getFullList(),
  ])
  if (pages.length !== 1) throw new Error('Expected one museum page')
  return { masks, page: pages[0]! }
}

export function museumDraft(record: RecordModel | undefined, page: boolean): Record<string, string> {
  const draft: Record<string, string> = {}
  for (const field of page ? museumFields : maskFields) {
    for (const locale of contentLocales) draft[`${field}_${locale}`] = String(record?.[`${field}_${locale}`] ?? '')
  }
  for (const field of page ? ['museum_button_url', 'excursion_button_url'] : ['slug', 'sort_order']) {
    draft[field] = String(record?.[field] ?? (field === 'sort_order' ? '0' : ''))
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
  for (const [key, value] of Object.entries(draft)) form.set(key, String(value).trim())
  const field = page ? 'excursion_photos' : 'image'
  if (files.length) for (const file of files) form.append(field, file)
  else form.set(field, '')
  const collection = pb.collection(page ? 't_page_masks' : 't_mask')
  return record ? collection.update(record.id, form) : collection.create(form)
}

export const museumFieldLabels: Record<string, [string, string]> = {
  name: ['Name', 'Название'],
  description: ['Description', 'Описание'],
  title: ['Title', 'Заголовок'],
  lede: ['Introduction', 'Вступление'],
  kicker: ['Eyebrow', 'Надзаголовок'],
  hall_title: ['Collection heading', 'Заголовок коллекции'],
  back_label: ['Back link', 'Ссылка назад'],
  museum_title: ['Visit heading', 'Заголовок посещения'],
  museum_description: ['Visit description', 'Описание посещения'],
  museum_button_label: ['Directions button', 'Кнопка маршрута'],
  excursion_kicker: ['Tour eyebrow', 'Надзаголовок экскурсии'],
  excursion_title: ['Tour title', 'Заголовок экскурсии'],
  excursion_description: ['Tour description', 'Описание экскурсии'],
  excursion_button_label: ['Tour button', 'Кнопка экскурсии'],
  excursion_photo_alt: ['Tour photo description', 'Описание фото экскурсии'],
  excursion_gallery_label: ['Gallery label', 'Название галереи'],
  previous_photo_label: ['Previous photo button', 'Кнопка предыдущего фото'],
  next_photo_label: ['Next photo button', 'Кнопка следующего фото'],
  mask_image_alt: ['Mask image description template', 'Шаблон описания изображения маски'],
  meta_title: ['Page SEO title', 'SEO-заголовок страницы'],
  meta_description: ['Page SEO description', 'SEO-описание страницы'],
  mask_meta_title: ['Mask SEO title template', 'Шаблон SEO-заголовка маски'],
  mask_meta_description: ['Mask SEO description template', 'Шаблон SEO-описания маски'],
  museum_button_url: ['Directions URL', 'Ссылка на маршрут'],
  excursion_button_url: ['Tour tickets URL', 'Ссылка на билеты экскурсии'],
}
