<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
  import * as v from 'valibot'
  import Button from '@/components/Button/Button.svelte'
  import FormField from '@/components/FormField/FormField.svelte'
  import { createFormState } from '@/lib/forms/form-state.svelte'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { getAccount, updateAccount } from '@/lib/pocketbase/account-api'
  import { normalizeRole } from '@/lib/pocketbase/auth'
  import type { StaffScope } from '@/lib/pocketbase/types'
  import { pushToast } from '@/stores/toastStore.svelte'
  import './AccountSettings.css'

  const localeCtx = useLocale()
  const queryClient = useQueryClient()

  const emptyValues = {
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phoneNumber: '',
    telegramUsername: '',
  }

  const schema = $derived(
    v.pipe(
      v.object({
        email: v.pipe(v.string(), v.nonEmpty(localeCtx.t.validation.required), v.email(localeCtx.t.validation.email)),
        password: v.string(),
        passwordConfirm: v.string(),
        name: v.optional(v.string()),
        phoneNumber: v.optional(v.string()),
        telegramUsername: v.optional(v.string()),
      }),
      v.forward(
        v.partialCheck(
          [['password']],
          (input) => !(input.password ?? '') || (input.password?.length ?? 0) >= 8,
          localeCtx.t.validation.minLength,
        ),
        ['password'],
      ),
      v.forward(
        v.partialCheck(
          [['password'], ['passwordConfirm']],
          (input) => {
            const password = input.password ?? ''
            const confirm = input.passwordConfirm ?? ''
            if (!password && !confirm) return true
            return password === confirm
          },
          localeCtx.t.validation.passwordMatch,
        ),
        ['passwordConfirm'],
      ),
    ),
  )

  const form = createFormState({ ...emptyValues })

  const accountQuery = createQuery(() => ({
    queryKey: ['account'],
    queryFn: () => getAccount(),
  }))

  const account = $derived(accountQuery.data)

  const roleLabel = $derived(
    account ? localeCtx.t.staff.roles[normalizeRole(account.role) ?? 'manager'] : '',
  )

  const formatScopes = (scopes: StaffScope[] | undefined) =>
    (scopes ?? []).map((scope) => localeCtx.t.staff.scopes[scope]).join(', ') || '—'

  $effect(() => {
    if (!account) return
    form.reset({
      email: account.email ?? '',
      password: '',
      passwordConfirm: '',
      name: account.name ?? '',
      phoneNumber: account.phoneNumber ?? '',
      telegramUsername: account.telegramUsername ?? '',
    })
  })

  const buildFormData = () => {
    const formData = new FormData()
    formData.set('email', form.values.email)
    formData.set('name', form.values.name)
    formData.set('phoneNumber', form.values.phoneNumber)
    formData.set('telegramUsername', form.values.telegramUsername)

    if (form.values.password) {
      formData.set('password', form.values.password)
      formData.set('passwordConfirm', form.values.passwordConfirm)
    }

    return formData
  }

  const saveMutation = createMutation(() => ({
    mutationFn: () => updateAccount(buildFormData()),
    onSuccess: async (updated) => {
      form.reset({
        email: updated.email ?? '',
        password: '',
        passwordConfirm: '',
        name: updated.name ?? '',
        phoneNumber: updated.phoneNumber ?? '',
        telegramUsername: updated.telegramUsername ?? '',
      })
      await queryClient.invalidateQueries({ queryKey: ['account'] })
      pushToast(localeCtx.t.account.updated, 'success')
    },
    onError: (saveError) => {
      pushToast(saveError instanceof Error ? saveError.message : localeCtx.t.common.error, 'error')
    },
  }))

  const submit = (event: SubmitEvent) => {
    event.preventDefault()
    if (!form.validate(schema).success) {
      pushToast(localeCtx.t.account.validationFailed, 'error')
      return
    }
    saveMutation.mutate()
  }
</script>

<section class="account_settings">
  <header class="account_settings-toolbar">
    <div class="l_container">
      <div class="account_settings-heading">
        <p class="account_settings-eyebrow">{localeCtx.t.nav.sections.global}</p>
        <h1 class="account_settings-title">{localeCtx.t.account.title}</h1>
      </div>
    </div>
  </header>

  <div class="l_container">
    {#if accountQuery.isPending}
      <p class="account_settings-status">{localeCtx.t.common.loading}</p>
    {:else if accountQuery.isError}
      <p class="account_settings-status" data-tone="error">
        {accountQuery.error instanceof Error ? accountQuery.error.message : localeCtx.t.common.error}
      </p>
    {:else}
      <div class="account_settings-body">
        <section class="account_settings-section">
          <form class="account_settings-form" autocomplete="off" onsubmit={submit}>
            <div class="account_settings-form_header">
              <h2 class="account_settings-section_title">{localeCtx.t.account.profile}</h2>
              <Button type="submit" isLoading={saveMutation.isPending}>
                {localeCtx.t.common.save}
              </Button>
            </div>

            <FormField label={localeCtx.t.staff.name} name="name" bind:value={form.values.name} />
            <FormField
              label={localeCtx.t.staff.email}
              name="email"
              type="email"
              autocomplete="off"
              bind:value={form.values.email}
              error={form.errors.email}
              required
            />
            <FormField
              label={localeCtx.t.staff.phoneNumber}
              name="phoneNumber"
              bind:value={form.values.phoneNumber}
            />
            <FormField
              label={localeCtx.t.staff.telegramUsername}
              name="telegramUsername"
              bind:value={form.values.telegramUsername}
            />
            <FormField
              label={localeCtx.t.staff.password}
              name="password"
              type="password"
              autocomplete="new-password"
              bind:value={form.values.password}
              error={form.errors.password}
              hint={localeCtx.t.staff.passwordOptional}
            />
            <FormField
              label={localeCtx.t.staff.passwordConfirm}
              name="passwordConfirm"
              type="password"
              autocomplete="new-password"
              bind:value={form.values.passwordConfirm}
              error={form.errors.passwordConfirm}
            />

            <div class="account_settings-meta">
              <p class="account_settings-meta_label">{localeCtx.t.staff.role}</p>
              <p class="account_settings-meta_value">{roleLabel}</p>
            </div>
            <div class="account_settings-meta">
              <p class="account_settings-meta_label">{localeCtx.t.staff.scope}</p>
              <p class="account_settings-meta_value">{formatScopes(account?.scope)}</p>
            </div>
          </form>
        </section>
      </div>
    {/if}
  </div>
</section>
