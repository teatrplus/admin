<script lang="ts">
  import { onMount } from 'svelte'
  import LightIcon from '~icons/material-symbols/wb-sunny-outline'
  import DarkIcon from '~icons/material-symbols/dark-mode-outline'
  import Button from '@/components/Button/Button.svelte'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import {
    applyTheme,
    DARK_MODE_QUERY,
    readStoredThemePreference,
    resolveTheme,
    writeStoredThemePreference,
    type Theme,
    type ThemePreference,
  } from '@/lib/theme'
  import './ThemeToggle.css'

  const localeCtx = useLocale()

  let preference = $state<ThemePreference>(readStoredThemePreference())

  const toggleTheme = () => {
    const current = resolveTheme(preference)
    const next: Theme = current === 'light' ? 'dark' : 'light'
    preference = next
    writeStoredThemePreference(next)
    applyTheme(next)
  }

  onMount(() => {
    applyTheme(resolveTheme(preference))

    const media = window.matchMedia(DARK_MODE_QUERY)
    const onSchemeChange = (event: MediaQueryListEvent) => {
      if (preference === 'auto') {
        applyTheme(event.matches ? 'dark' : 'light')
      }
    }

    media.addEventListener('change', onSchemeChange)
    return () => media.removeEventListener('change', onSchemeChange)
  })
</script>

<Button
  id="theme-toggle"
  variant="unstyled"
  class="theme_toggle u_pressable"
  aria-label={localeCtx.t.common.toggleTheme}
  title={localeCtx.t.common.toggleTheme}
  onclick={toggleTheme}
>
  <span class="theme_toggle-icon" data-theme-icon="light">
    <LightIcon width="20" height="20" aria-hidden="true" />
  </span>
  <span class="theme_toggle-icon" data-theme-icon="dark">
    <DarkIcon width="20" height="20" aria-hidden="true" />
  </span>
</Button>
