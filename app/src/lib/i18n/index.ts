import { DEFAULT_LOCALE, normalizeLocale, type Locale } from './config'
import { en } from './locales/en'
import { ru } from './locales/ru'
import type { TranslationSchema } from './schema'

const translations: Record<Locale, TranslationSchema> = {
  ru,
  en,
}

export const getTranslations = (locale: string | undefined | null): TranslationSchema =>
  translations[normalizeLocale(locale)]

export const tPath = (schema: TranslationSchema, path: string): string => {
  const value = path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, schema)

  return typeof value === 'string' ? value : path
}

export { DEFAULT_LOCALE, normalizeLocale }
export type { Locale, TranslationSchema }
