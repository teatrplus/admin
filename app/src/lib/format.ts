import type { Locale } from './i18n'

const localeTag = (locale: Locale) => (locale === 'ru' ? 'ru-RU' : 'en-GB')

/**
 * PocketBase date fields often arrive as `YYYY-MM-DD HH:mm:ss.SSSZ`.
 * Show calendar date only — time is noise on a booking board.
 */
export const formatDateOnly = (value: string | null | undefined, locale: Locale) => {
  if (!value) return '—'

  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)

  if (Number.isNaN(date.getTime())) {
    const ymd = value.slice(0, 10)
    return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : value
  }

  return new Intl.DateTimeFormat(localeTag(locale), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** Value for `<input type="date">` — PocketBase stores a datetime string. */
export const toDateInputValue = (value: string | null | undefined) => {
  if (!value) return ''
  const ymd = value.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(ymd) ? ymd : ''
}
