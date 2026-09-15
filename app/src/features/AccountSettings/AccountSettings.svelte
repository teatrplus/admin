<script lang="ts">
  import PageActions from '@/components/PageActions/PageActions.svelte'
  import PageHeader from '@/components/PageHeader/PageHeader.svelte'
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
  import * as v from 'valibot'
  import Button from '@/components/Button/Button.svelte'
  import FormField from '@/components/FormField/FormField.svelte'
  import { createFormState } from '@/lib/forms/form-state.svelte'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { getAccount, updateAccount } from '@/lib/pocketbase/account-api'
  import { isStaffUser, normalizeRole } from '@/lib/pocketbase/auth'
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
  const isStaffAccount = $derived(account ? isStaffUser(account) : false)

  const roleLabel = $derived(
    account && isStaffAccount ? localeCtx.t.staff.roles[normalizeRole(account.role) ?? 'manager'] : '',
  )

  const formatScopes = (scopes: StaffScope[] | undefined) =>
    (scopes ?? []).map((scope) => localeCtx.t.staff.scopes[scope]).join(', ') || '—'

  $effect(() => {
    if (!account) return
    form.reset({
      email: account.email ?? '',
      password: '',
      passwordConfirm: '',
      name: isStaffUser(account) ? (account.name ?? '') : '',
      phoneNumber: isStaffUser(account) ? (account.phone_number ?? '') : '',
      telegramUsername: isStaffUser(account) ? (account.telegram_username ?? '') : '',
    })
  })

  const buildFormData = () => {
    const formData = new FormData()
    formData.set('email', form.values.email)

    if (isStaffAccount) {
      formData.set('name', form.values.name)
      formData.set('phone_number', form.values.phoneNumber)
      formData.set('telegram_username', form.values.telegramUsername)
    }

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
        name: isStaffUser(updated) ? (updated.name ?? '') : '',
        phoneNumber: isStaffUser(updated) ? (updated.phone_number ?? '') : '',
        telegramUsername: isStaffUser(updated) ? (updated.telegram_username ?? '') : '',
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
  <PageHeader
    title={localeCtx.t.account.title}
    eyebrow={localeCtx.t.nav.sections.global}
    description={localeCtx.t.workspace.accountDescription}
  />
  {#if account}
    <PageActions label={localeCtx.t.account.title}>
      <Button type="submit" form="account-settings-form" isLoading={saveMutation.isPending}
        >{localeCtx.t.common.save}</Button
      >
    </PageActions>
  {/if}
  {#if accountQuery.isPending}
    <p class="account_settings-status" role="status">{localeCtx.t.common.loading}</p>
  {:else if accountQuery.isError}
    <p class="account_settings-status" data-tone="error" role="alert">
      {accountQuery.error instanceof Error ? accountQuery.error.message : localeCtx.t.common.error}
    </p>
  {:else}
    <form id="account-settings-form" class="account_settings-form" autocomplete="off" onsubmit={submit}>
      <section class="account_settings-section">
        <h2 class="account_settings-section_title">{localeCtx.t.workspace.profile}</h2>
        <div class="account_settings-fields">
          <FormField
            label={localeCtx.t.staff.email}
            name="email"
            type="email"
            autocomplete="off"
            bind:value={form.values.email}
            error={form.errors.email}
            required
          />
          {#if isStaffAccount}
            <FormField label={localeCtx.t.staff.name} name="name" bind:value={form.values.name} />
            <FormField label={localeCtx.t.staff.phoneNumber} name="phoneNumber" bind:value={form.values.phoneNumber} />
            <FormField
              label={localeCtx.t.staff.telegramUsername}
              name="telegramUsername"
              bind:value={form.values.telegramUsername}
            />
          {/if}
        </div>
      </section>
      <section class="account_settings-section">
        <div class="l_stack" data-gap="2">
          <h2 class="account_settings-section_title">{localeCtx.t.workspace.security}</h2>
          <p class="account_settings-section_hint">{localeCtx.t.workspace.securityHint}</p>
        </div>
        <div class="account_settings-fields">
          <FormField
            label={localeCtx.t.staff.password}
            name="password"
            type="password"
            bind:value={form.values.password}
            error={form.errors.password}
          />
          <FormField
            label={localeCtx.t.staff.passwordConfirm}
            name="passwordConfirm"
            type="password"
            bind:value={form.values.passwordConfirm}
            error={form.errors.passwordConfirm}
          />
        </div>
      </section>
      {#if isStaffAccount}
        <section class="account_settings-section">
          <h2 class="account_settings-section_title">{localeCtx.t.workspace.access}</h2>
          <div class="account_settings-access">
            <div class="account_settings-meta">
              <p class="account_settings-meta_label">{localeCtx.t.staff.role}</p>
              <p class="account_settings-meta_value">{roleLabel}</p>
            </div>
            <div class="account_settings-meta">
              <p class="account_settings-meta_label">{localeCtx.t.staff.scope}</p>
              <p class="account_settings-meta_value">{formatScopes(account?.scope)}</p>
            </div>
          </div>
        </section>
      {/if}
    </form>
  {/if}
</section>
