<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
  import * as v from 'valibot'
  import EditIcon from '~icons/material-symbols/edit-outline'
  import TrashIcon from '~icons/material-symbols/delete-outline'
  import Button from '@/components/Button/Button.svelte'
  import Checkbox from '@/components/Checkbox/Checkbox.svelte'
  import FormField from '@/components/FormField/FormField.svelte'
  import Select from '@/components/Select/Select.svelte'
  import { createFormState } from '@/lib/forms/form-state.svelte'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { getCurrentUser, normalizeRole } from '@/lib/pocketbase/auth'
  import { createStaff, deleteStaff, listStaff, updateStaff } from '@/lib/pocketbase/staff-api'
  import type { StaffRecord, StaffRole, StaffScope } from '@/lib/pocketbase/types'
  import { pushToast } from '@/stores/toastStore.svelte'
  import './StaffManager.css'

  const localeCtx = useLocale()
  const queryClient = useQueryClient()
  const currentUserId = getCurrentUser()?.id

  const emptyValues = {
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phoneNumber: '',
    telegramUsername: '',
    role: 'manager' as StaffRole,
    scopeTheater: false,
    scopeSpace: true,
  }

  let editingId = $state<string | null>(null)
  const isEditing = $derived(editingId !== null)

  const schema = $derived(
    v.pipe(
      v.object({
        email: v.pipe(
          v.string(),
          v.nonEmpty(localeCtx.t.validation.required),
          v.email(localeCtx.t.validation.email),
        ),
        password: v.string(),
        passwordConfirm: v.string(),
        name: v.optional(v.string()),
        phoneNumber: v.optional(v.string()),
        telegramUsername: v.optional(v.string()),
        role: v.picklist(['admin', 'moderator', 'manager']),
        scopeTheater: v.boolean(),
        scopeSpace: v.boolean(),
      }),
      v.forward(
        v.partialCheck(
          [['password']],
          (input) => {
            if (isEditing && !(input.password ?? '')) return true
            return (input.password?.length ?? 0) >= 8
          },
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
            if (!password && !confirm) return isEditing
            return password === confirm
          },
          localeCtx.t.validation.passwordMatch,
        ),
        ['passwordConfirm'],
      ),
      v.forward(
        v.partialCheck(
          [['scopeTheater'], ['scopeSpace']],
          (input) => input.scopeTheater || input.scopeSpace,
          localeCtx.t.validation.required,
        ),
        ['scopeSpace'],
      ),
    ),
  )

  const form = createFormState({ ...emptyValues })

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

  const staff = $derived(staffQuery.data ?? [])

  const buildFormData = () => {
    const scopes: StaffScope[] = []
    if (form.values.scopeTheater) scopes.push('theater')
    if (form.values.scopeSpace) scopes.push('space')

    const formData = new FormData()
    formData.set('email', form.values.email)
    formData.set('name', form.values.name)
    formData.set('phoneNumber', form.values.phoneNumber)
    formData.set('telegramUsername', form.values.telegramUsername)
    formData.set('role', form.values.role)
    for (const scopeValue of scopes) {
      formData.append('scope', scopeValue)
    }

    if (form.values.password) {
      formData.set('password', form.values.password)
      formData.set('passwordConfirm', form.values.passwordConfirm)
    }

    return formData
  }

  const resetToCreate = () => {
    editingId = null
    form.reset({ ...emptyValues })
  }

  const startEdit = (member: StaffRecord) => {
    editingId = member.id
    form.reset({
      email: member.email ?? '',
      password: '',
      passwordConfirm: '',
      name: member.name ?? '',
      phoneNumber: member.phoneNumber ?? '',
      telegramUsername: member.telegramUsername ?? '',
      role: normalizeRole(member.role) ?? 'manager',
      scopeTheater: (member.scope ?? []).includes('theater'),
      scopeSpace: (member.scope ?? []).includes('space'),
    })
  }

  const saveMutation = createMutation(() => ({
    mutationFn: async () => {
      const formData = buildFormData()
      if (editingId) return updateStaff(editingId, formData)
      return createStaff(formData)
    },
    onSuccess: async () => {
      const wasEdit = Boolean(editingId)
      resetToCreate()
      await queryClient.invalidateQueries({ queryKey: ['staff'] })
      pushToast(wasEdit ? localeCtx.t.staff.updated : localeCtx.t.staff.created, 'success')
    },
    onError: (saveError) => {
      pushToast(saveError instanceof Error ? saveError.message : localeCtx.t.common.error, 'error')
    },
  }))

  const deleteMutation = createMutation(() => ({
    mutationFn: (id: string) => deleteStaff(id),
    onSuccess: async () => {
      if (editingId) resetToCreate()
      await queryClient.invalidateQueries({ queryKey: ['staff'] })
      pushToast(localeCtx.t.staff.deleted, 'success')
    },
    onError: (deleteError) => {
      pushToast(deleteError instanceof Error ? deleteError.message : localeCtx.t.common.error, 'error')
    },
  }))

  const submit = (event: SubmitEvent) => {
    event.preventDefault()
    if (!form.validate(schema).success) {
      pushToast(localeCtx.t.staff.validationFailed, 'error')
      return
    }
    saveMutation.mutate()
  }

  const confirmDelete = (member: StaffRecord) => {
    if (member.id === currentUserId) return
    const label = member.name || member.email
    const message = localeCtx.t.staff.deleteConfirm.replace('{name}', label)
    if (!window.confirm(message)) return
    deleteMutation.mutate(member.id)
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
          <h2 class="staff_manager-section_title">
            {isEditing ? localeCtx.t.staff.edit : localeCtx.t.staff.create}
          </h2>
          <form class="staff_manager-form" onsubmit={submit}>
            <FormField label={localeCtx.t.staff.name} name="name" bind:value={form.values.name} />
            <FormField
              label={localeCtx.t.staff.email}
              name="email"
              type="email"
              bind:value={form.values.email}
              error={form.errors.email}
              required
            />
            <FormField label={localeCtx.t.staff.phoneNumber} name="phoneNumber" bind:value={form.values.phoneNumber} />
            <FormField
              label={localeCtx.t.staff.telegramUsername}
              name="telegramUsername"
              bind:value={form.values.telegramUsername}
            />
            <FormField
              label={localeCtx.t.staff.password}
              name="password"
              type="password"
              bind:value={form.values.password}
              error={form.errors.password}
              hint={isEditing ? localeCtx.t.staff.passwordOptional : undefined}
              required={!isEditing}
            />
            <FormField
              label={localeCtx.t.staff.passwordConfirm}
              name="passwordConfirm"
              type="password"
              bind:value={form.values.passwordConfirm}
              error={form.errors.passwordConfirm}
              required={!isEditing}
            />
            <Select
              label={localeCtx.t.staff.role}
              name="role"
              bind:value={form.values.role}
              options={roleOptions}
              error={form.errors.role}
              required
            />

            <fieldset class="staff_manager-scope_list">
              <legend class="u_sr_only">{localeCtx.t.staff.scope}</legend>
              <p class="staff_manager-scope_label">
                {localeCtx.t.staff.scope}<span class="form_field-required" aria-hidden="true">*</span>
              </p>
              <div class="staff_manager-scope_options">
                <Checkbox bind:checked={form.values.scopeTheater} label={localeCtx.t.staff.scopes.theater} />
                <Checkbox bind:checked={form.values.scopeSpace} label={localeCtx.t.staff.scopes.space} />
              </div>
              {#if form.errors.scopeSpace}
                <p class="form_field-error">{form.errors.scopeSpace}</p>
              {/if}
            </fieldset>

            <div class="staff_manager-form_actions">
              {#if isEditing}
                <Button type="button" variant="ghost" color="neutral" onclick={resetToCreate}>
                  {localeCtx.t.common.cancel}
                </Button>
              {/if}
              <Button type="submit" isLoading={saveMutation.isPending}>
                {isEditing ? localeCtx.t.common.save : localeCtx.t.staff.create}
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {#each staff as member (member.id)}
                  <tr data-active={editingId === member.id ? 'true' : undefined}>
                    <td>{member.name || '—'}</td>
                    <td>{member.email}</td>
                    <td>{localeCtx.t.staff.roles[normalizeRole(member.role) ?? 'manager']}</td>
                    <td>{formatScopes(member.scope)}</td>
                    <td class="staff_manager-table_actions">
                      <Button
                        variant="ghost"
                        color="neutral"
                        size="sm"
                        shape="square"
                        title={localeCtx.t.staff.editUser}
                        aria-label={localeCtx.t.staff.editUser}
                        onclick={() => startEdit(member)}
                      >
                        <EditIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        color="danger"
                        size="sm"
                        shape="square"
                        title={localeCtx.t.staff.deleteUser}
                        aria-label={localeCtx.t.staff.deleteUser}
                        disabled={member.id === currentUserId || deleteMutation.isPending}
                        onclick={() => confirmDelete(member)}
                      >
                        <TrashIcon />
                      </Button>
                    </td>
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
