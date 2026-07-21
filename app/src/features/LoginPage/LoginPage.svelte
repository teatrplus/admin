<script lang="ts">
  import * as v from 'valibot'
  import ActionButton from '../../components/ui/ActionButton/ActionButton.svelte'
  import FormField from '../../components/ui/FormField/FormField.svelte'
  import { createFormState } from '../../lib/forms/form-state.svelte'
  import { useLocale } from '../../lib/i18n/context.svelte'
  import { login } from '../../lib/pocketbase/auth'
  import { defaultRouteForUser } from '../../lib/pocketbase/permissions'
  import { navigate } from '../../lib/router'
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
    <h1 class="login_page-title">{localeCtx.t.auth.title}</h1>
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
      <ActionButton type="submit" disabled={loading}>
        {loading ? localeCtx.t.common.loading : localeCtx.t.auth.submit}
      </ActionButton>
    </form>
  </div>
</div>
