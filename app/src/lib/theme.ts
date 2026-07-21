export type Theme = 'light' | 'dark'
export type ThemePreference = Theme | 'auto'

export const THEME_STORAGE_KEY = 'theaterplus.admin.theme'
export const DARK_MODE_QUERY = '(prefers-color-scheme: dark)'

const isThemePreference = (value: string | null): value is ThemePreference =>
  value === 'light' || value === 'auto' || value === 'dark'

export const readStoredThemePreference = (): ThemePreference => {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(value) ? value : 'auto'
  } catch {
    return 'auto'
  }
}

export const writeStoredThemePreference = (preference: ThemePreference) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // ignore
  }
}

export const resolveTheme = (preference: ThemePreference): Theme => {
  if (preference !== 'auto') return preference
  return window.matchMedia(DARK_MODE_QUERY).matches ? 'dark' : 'light'
}

export const applyTheme = (active: Theme) => {
  document.documentElement.setAttribute('data-theme', active)

  const resolved = getComputedStyle(document.documentElement).getPropertyValue('--bg-page').trim()

  if (resolved) {
    let meta = document.getElementById('meta-theme-color') as HTMLMetaElement | null
    if (!meta) {
      meta = document.createElement('meta')
      meta.id = 'meta-theme-color'
      meta.setAttribute('name', 'theme-color')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', resolved)
  }
}

export const initTheme = () => {
  applyTheme(resolveTheme(readStoredThemePreference()))
}
