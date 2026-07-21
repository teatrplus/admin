export const LOCALES = ['ru', 'en'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'ru'

export const LOCALE_STORAGE_KEY = 'theaterplus.admin.locale'

export const LOCALE_LABELS: Record<Locale, string> = {
  ru: 'RU',
  en: 'EN',
}

export const isLocale = (value: string | undefined | null): value is Locale =>
  value !== undefined && value !== null && (LOCALES as readonly string[]).includes(value)

export const normalizeLocale = (value: string | undefined | null): Locale =>
  isLocale(value) ? value : DEFAULT_LOCALE

export const readStoredLocale = (): Locale => {
  try {
    return normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY))
  } catch {
    return DEFAULT_LOCALE
  }
}

export const writeStoredLocale = (locale: Locale) => {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // ignore
  }
}
