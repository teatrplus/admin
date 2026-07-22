<script lang="ts">
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
  <div class="login_page-card">
    <RawSvg class="login_page-logo raw_svg" content={iconSvg} width="48" height="48" aria-hidden="true" />
    <h1 class="login_page-title"><BrandTitle /></h1>
    <form class="login_page-form" onsubmit={submit}>
      <FormField
        label={localeCtx.t.auth.email}
        name="email"
        type="email"
        bind:value={form.values.email}
        error={form.errors.email}
        required
      />
      <FormField
        label={localeCtx.t.auth.password}
        name="password"
        type="password"
        bind:value={form.values.password}
        error={form.errors.password}
        required
      />
      {#if error}
        <p class="login_page-error">{error}</p>
      {/if}
      <Button type="submit" isLoading={loading}>
        {localeCtx.t.auth.submit}
      </Button>
    </form>
  </div>
</div>
