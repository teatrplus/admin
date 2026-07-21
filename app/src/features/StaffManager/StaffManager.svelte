<script lang="ts">
  import * as v from 'valibot'
  import Button from '@/components/Button/Button.svelte'
  import Checkbox from '@/components/Checkbox/Checkbox.svelte'
  import FormField from '@/components/FormField/FormField.svelte'
  import Select from '@/components/Select/Select.svelte'
  import StatusBanner from '@/components/StatusBanner/StatusBanner.svelte'
  import { createFormState } from '../../lib/forms/form-state.svelte'
  import { useLocale } from '../../lib/i18n/context.svelte'
  import { normalizeRole } from '../../lib/pocketbase/auth'
  import { createStaff, listStaff } from '../../lib/pocketbase/staff-api'
  import type { StaffRecord, StaffRole, StaffScope } from '../../lib/pocketbase/types'
  import './StaffManager.css'

  const localeCtx = useLocale()

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

  let staff = $state<StaffRecord[]>([])
  let loading = $state(true)
  let saving = $state(false)
  let message = $state('')
  let error = $state('')

  const roleOptions = $derived(
    (['admin', 'moderator', 'manager'] as StaffRole[]).map((role) => ({
      value: role,
      label: localeCtx.t.staff.roles[role],
    })),
  )

  const load = async () => {
    loading = true
    error = ''
    try {
      staff = await listStaff()
    } catch (loadError) {
      error = loadError instanceof Error ? loadError.message : localeCtx.t.common.error
    } finally {
      loading = false
    }
  }

  $effect(() => {
    void load()
  })

  const submit = async (event: SubmitEvent) => {
    event.preventDefault()
    message = ''
    error = ''

    if (!form.validate(schema).success) return

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

    saving = true
    try {
      await createStaff(formData)
      form.reset()
      form.values.scopeSpace = true
      message = localeCtx.t.staff.created
      await load()
    } catch (createError) {
      error = createError instanceof Error ? createError.message : localeCtx.t.common.error
    } finally {
      saving = false
    }
  }

  const formatScopes = (scopes: StaffScope[] | undefined) =>
    (scopes ?? []).map((scope) => localeCtx.t.staff.scopes[scope]).join(', ')
</script>

<section class="staff_manager">
  <h1 class="staff_manager-title">{localeCtx.t.staff.title}</h1>

  {#if loading}
    <p>{localeCtx.t.common.loading}</p>
  {:else}
    <div class="staff_manager-grid">
      <section class="staff_manager-panel">
        <h2 class="staff_manager-panel_title">{localeCtx.t.staff.create}</h2>
        <form class="staff_manager-form" onsubmit={submit}>
          {#if message}
            <StatusBanner tone="success">{message}</StatusBanner>
          {/if}
          {#if error}
            <StatusBanner tone="error">{error}</StatusBanner>
          {/if}

          <FormField label={localeCtx.t.staff.email} name="email" type="email" bind:value={form.values.email} />
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
          <FormField label={localeCtx.t.staff.name} name="name" bind:value={form.values.name} />
          <FormField label={localeCtx.t.staff.phoneNumber} name="phoneNumber" bind:value={form.values.phoneNumber} />
          <Select label={localeCtx.t.staff.role} name="role" bind:value={form.values.role} options={roleOptions} />

          <fieldset class="staff_manager-scope_list">
            <legend>{localeCtx.t.staff.scope}</legend>
            <Checkbox bind:checked={form.values.scopeTheater} label={localeCtx.t.staff.scopes.theater} />
            <Checkbox bind:checked={form.values.scopeSpace} label={localeCtx.t.staff.scopes.space} />
          </fieldset>
          {#if form.errors.scopeSpace}
            <p class="form_field-error">{form.errors.scopeSpace}</p>
          {/if}

          <Button type="submit" isLoading={saving}>
            {localeCtx.t.staff.create}
          </Button>
        </form>
      </section>

      <section class="staff_manager-panel">
        <h2 class="staff_manager-panel_title">{localeCtx.t.staff.list}</h2>
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
            {#each staff as member}
              <tr>
                <td>{member.name || '—'}</td>
                <td>{member.email}</td>
                <td>{localeCtx.t.staff.roles[normalizeRole(member.role) ?? 'manager']}</td>
                <td>{formatScopes(member.scope)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>
    </div>
  {/if}
</section>
