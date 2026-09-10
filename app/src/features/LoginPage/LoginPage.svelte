<script lang="ts">
  import ThemeToggle from '@/components/ThemeToggle/ThemeToggle.svelte'
  import StatusBanner from '@/components/StatusBanner/StatusBanner.svelte'
  import ArrowIcon from '~icons/material-symbols/arrow-forward'

  import * as v from 'valibot'
  import BrandTitle from '@/components/BrandTitle/BrandTitle.svelte'
  import Button from '@/components/Button/Button.svelte'
  import FormField from '@/components/FormField/FormField.svelte'
  import RawSvg from '@/components/RawSvg/RawSvg.svelte'
  import '@/components/RawSvg/RawSvg.css'
  import { createFormState } from '../../lib/forms/form-state.svelte'
  import { useLocale } from '../../lib/i18n/context.svelte'
  import { login } from '../../lib/pocketbase/auth'
  import { defaultRouteForUser } from '../../lib/pocketbase/permissions'
  import { navigate } from '../../lib/router'
  import iconSvg from './assets/logo.svg?raw'
  import './LoginPage.css'

  const localeCtx = useLocale()
  const schema = v.object({
    email: v.pipe(v.string(), v.nonEmpty(localeCtx.t.validation.required), v.email(localeCtx.t.validation.email)),
    password: v.pipe(v.string(), v.minLength(8, localeCtx.t.validation.minLength)),
  })

  const form = createFormState({ email: '', password: '' })
  let error = $state('')
  let loading = $state(false)

  const submit = async (event: SubmitEvent) => {
    event.preventDefault()
    error = ''
    if (!form.validate(schema).success) return

    loading = true
    try {
      await login(form.values.email, form.values.password)
      navigate(defaultRouteForUser(), true)
    } catch {
      error = localeCtx.t.auth.invalid
    } finally {
      loading = false
    }
  }
</script>

<div class="login_page">
  <aside class="login_page-identity">
    <a class="login_page-brand" href="/login">
      <RawSvg class="login_page-logo raw_svg" content={iconSvg} width="40" height="40" aria-hidden="true" />
      <BrandTitle />
    </a>
    <div class="login_page-story">
      <span class="login_page-eyebrow">{localeCtx.t.workspace.label}</span>
      <h2 class="login_page-statement">{localeCtx.t.workspace.loginCaption}</h2>
      <p class="login_page-description">{localeCtx.t.workspace.loginStory}</p>
    </div>
    <p class="login_page-signature">{localeCtx.t.workspace.loginFooter}</p>
  </aside>
  <main class="login_page-main">
    <div class="login_page-appearance"><ThemeToggle /></div>
    <div class="login_page-card">
      <div class="login_page-heading">
        <h1 class="login_page-title">{localeCtx.t.workspace.loginTitle}</h1>
        <p class="login_page-subtitle">{localeCtx.t.workspace.loginBody}</p>
      </div>
      <form class="login_page-form" onsubmit={submit}>
        <FormField
          label={localeCtx.t.auth.email}
          name="email"
          type="email"
          autocomplete="username"
          bind:value={form.values.email}
          error={form.errors.email}
          required
        />
        <FormField
          label={localeCtx.t.auth.password}
          name="password"
          type="password"
          autocomplete="current-password"
          bind:value={form.values.password}
          error={form.errors.password}
          required
        />
        {#if error}<StatusBanner tone="error">{error}</StatusBanner>{/if}
        <Button type="submit" size="lg" isLoading={loading}
          >{localeCtx.t.auth.submit}{#snippet rightIcon()}<ArrowIcon />{/snippet}</Button
        >
      </form>
    </div>
  </main>
</div>
