import { getContext, setContext } from 'svelte'
import { DEFAULT_LOCALE, getTranslations, normalizeLocale, type Locale, type TranslationSchema } from '../i18n'
import { readStoredLocale, writeStoredLocale } from '../i18n/config'

const LOCALE_KEY = Symbol('locale')

export type LocaleContext = {
  readonly locale: Locale
  readonly t: TranslationSchema
  setLocale: (locale: Locale) => void
}

export const initLocaleContext = (initial = readStoredLocale()): LocaleContext => {
  let locale = $state<Locale>(normalizeLocale(initial))
  const ctx: LocaleContext = {
    get locale() {
      return locale
    },
    get t() {
      return getTranslations(locale)
    },
    setLocale(next) {
      locale = next
      writeStoredLocale(next)
      document.documentElement.lang = next
    },
  }

  document.documentElement.lang = ctx.locale
  setContext(LOCALE_KEY, ctx)
  return ctx
}

export const useLocale = (): LocaleContext => {
  const ctx = getContext<LocaleContext>(LOCALE_KEY)
  if (!ctx) {
    return {
      locale: DEFAULT_LOCALE,
      t: getTranslations(DEFAULT_LOCALE),
      setLocale: () => {},
    }
  }
  return ctx
}
