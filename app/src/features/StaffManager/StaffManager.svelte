<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
  import * as v from 'valibot'
  import Button from '@/components/Button/Button.svelte'
  import Checkbox from '@/components/Checkbox/Checkbox.svelte'
  import FormField from '@/components/FormField/FormField.svelte'
  import Select from '@/components/Select/Select.svelte'
  import { createFormState } from '@/lib/forms/form-state.svelte'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { normalizeRole } from '@/lib/pocketbase/auth'
  import { createStaff, listStaff } from '@/lib/pocketbase/staff-api'
  import type { StaffRole, StaffScope } from '@/lib/pocketbase/types'
  import { pushToast } from '@/stores/toastStore.svelte'
  import './StaffManager.css'

  const localeCtx = useLocale()
  const queryClient = useQueryClient()

  const schema = v.pipe(
    v.object({
      email: v.pipe(v.string(), v.nonEmpty(), v.email()),
      password: v.pipe(v.string(), v.minLength(8)),
      passwordConfirm: v.pipe(v.string(), v.minLength(8)),
      name: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      role: v.picklist(['admin', 'moderator', 'manager']),
      scopeTheater: v.boolean(),
      scopeSpace: v.boolean(),
    }),
    v.forward(
      v.partialCheck(
        [['password'], ['passwordConfirm']],
        (input) => input.password === input.passwordConfirm,
        'Passwords must match',
      ),
      ['passwordConfirm'],
    ),
    v.forward(
      v.partialCheck(
        [['scopeTheater'], ['scopeSpace']],
        (input) => input.scopeTheater || input.scopeSpace,
        'Select at least one scope',
      ),
      ['scopeSpace'],
    ),
  )

  const form = createFormState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phoneNumber: '',
    role: 'manager' as StaffRole,
    scopeTheater: false,
    scopeSpace: true,
  })

  const roleOptions = $derived(
    (['admin', 'moderator', 'manager'] as StaffRole[]).map((role) => ({
      value: role,
      label: localeCtx.t.staff.roles[role],
    })),
  )

  const staffQuery = createQuery(() => ({
    queryKey: ['staff'],
    queryFn: () => listStaff(),
  }))

  const createStaffMutation = createMutation(() => ({
    mutationFn: async () => {
      const scopes: StaffScope[] = []
      if (form.values.scopeTheater) scopes.push('theater')
      if (form.values.scopeSpace) scopes.push('space')

      const formData = new FormData()
      formData.set('email', form.values.email)
      formData.set('password', form.values.password)
      formData.set('passwordConfirm', form.values.passwordConfirm)
      formData.set('name', form.values.name)
      formData.set('phoneNumber', form.values.phoneNumber)
      formData.set('role', form.values.role)
      for (const scopeValue of scopes) {
        formData.append('scope', scopeValue)
      }

      return createStaff(formData)
    },
    onSuccess: async () => {
      form.reset()
      form.values.scopeSpace = true
      await queryClient.invalidateQueries({ queryKey: ['staff'] })
      pushToast(localeCtx.t.staff.created, 'success')
    },
    onError: (createError) => {
      pushToast(createError instanceof Error ? createError.message : localeCtx.t.common.error, 'error')
    },
  }))

  const staff = $derived(staffQuery.data ?? [])

  const submit = (event: SubmitEvent) => {
    event.preventDefault()
    if (!form.validate(schema).success) return
    createStaffMutation.mutate()
  }

  const formatScopes = (scopes: StaffScope[] | undefined) =>
    (scopes ?? []).map((scope) => localeCtx.t.staff.scopes[scope]).join(', ')
</script>

<section class="staff_manager">
  <header class="staff_manager-toolbar">
    <div class="l_container">
      <div class="staff_manager-heading">
        <p class="staff_manager-eyebrow">{localeCtx.t.nav.sections.global}</p>
        <h1 class="staff_manager-title">{localeCtx.t.staff.title}</h1>
      </div>
    </div>
  </header>

  <div class="l_container">
    {#if staffQuery.isPending}
      <p class="staff_manager-status">{localeCtx.t.common.loading}</p>
    {:else if staffQuery.isError}
      <p class="staff_manager-status" data-tone="error">
        {staffQuery.error instanceof Error ? staffQuery.error.message : localeCtx.t.common.error}
      </p>
    {:else}
      <div class="staff_manager-body">
        <section class="staff_manager-section">
          <h2 class="staff_manager-section_title">{localeCtx.t.staff.create}</h2>
          <form class="staff_manager-form" onsubmit={submit}>
            <FormField label={localeCtx.t.staff.name} name="name" bind:value={form.values.name} />
            <FormField label={localeCtx.t.staff.email} name="email" type="email" bind:value={form.values.email} />
            <FormField
              label={localeCtx.t.staff.phoneNumber}
              name="phoneNumber"
              bind:value={form.values.phoneNumber}
            />
            <FormField
              label={localeCtx.t.staff.password}
              name="password"
              type="password"
              bind:value={form.values.password}
            />
            <FormField
              label={localeCtx.t.staff.passwordConfirm}
              name="passwordConfirm"
              type="password"
              bind:value={form.values.passwordConfirm}
              error={form.errors.passwordConfirm}
            />
            <Select label={localeCtx.t.staff.role} name="role" bind:value={form.values.role} options={roleOptions} />

            <fieldset class="staff_manager-scope_list">
              <legend class="u_sr_only">{localeCtx.t.staff.scope}</legend>
              <p class="staff_manager-scope_label">{localeCtx.t.staff.scope}</p>
              <div class="staff_manager-scope_options">
                <Checkbox bind:checked={form.values.scopeTheater} label={localeCtx.t.staff.scopes.theater} />
                <Checkbox bind:checked={form.values.scopeSpace} label={localeCtx.t.staff.scopes.space} />
              </div>
              {#if form.errors.scopeSpace}
                <p class="form_field-error">{form.errors.scopeSpace}</p>
              {/if}
            </fieldset>

            <div class="staff_manager-form_actions">
              <Button type="submit" isLoading={createStaffMutation.isPending}>
                {localeCtx.t.staff.create}
              </Button>
            </div>
          </form>
        </section>

        <section class="staff_manager-section">
          <h2 class="staff_manager-section_title">{localeCtx.t.staff.list}</h2>
          <div class="staff_manager-table_wrap">
            <table class="staff_manager-table">
              <thead>
                <tr>
                  <th>{localeCtx.t.staff.name}</th>
                  <th>{localeCtx.t.staff.email}</th>
                  <th>{localeCtx.t.staff.role}</th>
                  <th>{localeCtx.t.staff.scope}</th>
                </tr>
              </thead>
              <tbody>
                {#each staff as member (member.id)}
                  <tr>
                    <td>{member.name || '—'}</td>
                    <td>{member.email}</td>
                    <td>{localeCtx.t.staff.roles[normalizeRole(member.role) ?? 'manager']}</td>
                    <td>{formatScopes(member.scope)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    {/if}
  </div>
</section>
