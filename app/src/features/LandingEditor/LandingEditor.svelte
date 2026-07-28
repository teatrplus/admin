<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
  import { flip } from 'svelte/animate'
  import { dndzone, type DndEvent } from 'svelte-dnd-action'
  import TrashIcon from '~icons/material-symbols/delete-outline'
  import Button from '@/components/Button/Button.svelte'
  import Checkbox from '@/components/Checkbox/Checkbox.svelte'
  import FormField from '@/components/FormField/FormField.svelte'
  import MediaDropzone from '@/components/MediaDropzone/MediaDropzone.svelte'
  import Select from '@/components/Select/Select.svelte'
  import type { SelectOption } from '@/components/Select/Select.svelte'
  import type { SiteScope } from '@/lib/cms/scopes'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { isImageFile } from '@/lib/media/images'
  import { getCurrentUser, isStaffUser, normalizeRole } from '@/lib/pocketbase/auth'
  import {
    ASSIGNABLE_STAFF_ROLES,
    CONTENT_LOCALES,
    collectLandingFieldErrors,
    emptyGalleryRow,
    emptyHeadBodyRow,
    fillBlankLocales,
    firstIncompleteContentLocale,
    galleryRowHasImage,
    hasLandingFieldErrors,
    landingToForm,
    listManagers,
    loadLanding,
    saveLanding,
    serializeLandingForm,
    youtubeThumbnailUrl,
    type ContentLocale,
    type GalleryRow,
    type HeadBodyRow,
    type LandingFieldErrors,
    type LandingFormState,
    type PendingPartnerFile,
  } from '@/lib/pocketbase/landing'
  import type { StaffRecord } from '@/lib/pocketbase/types'
  import { pushToast } from '@/stores/toastStore.svelte'
  import LocalizedField from './LocalizedField.svelte'
  import './LandingEditor.css'

  let { scope }: { scope: SiteScope } = $props()

  const localeCtx = useLocale()
  const queryClient = useQueryClient()
  const flipDurationMs = 180

  const emptyForm = landingToForm(null)
  let form = $state<LandingFormState>(emptyForm)
  let baseline = $state(serializeLandingForm(emptyForm))
  let hydratedScope = $state<SiteScope | null>(null)
  let contentLocale = $state<ContentLocale>('ru')
  let showErrors = $state(false)

  const isDirty = $derived(serializeLandingForm(form) !== baseline)

  const fieldErrors = $derived.by((): LandingFieldErrors => {
    if (!showErrors) return {}
    return collectLandingFieldErrors(form)
  })

  const requiredMsg = $derived(localeCtx.t.validation.required)

  const fieldError = (path: string) => (fieldErrors[path] ? requiredMsg : undefined)

  const sectionError = (section: 'venues' | 'advantages' | 'process' | 'gallery') => {
    if (!fieldErrors[section]) return undefined
    const labelKey = section === 'venues' ? 'venue' : section
    return localeCtx.t.landing.validationMinItems.replace('{section}', localeCtx.t.landing[labelKey])
  }

  const galleryMediaError = (row: GalleryRow) => {
    const prefix = `galleryItems.${row.id}`
    if (fieldErrors[`${prefix}.both`]) return localeCtx.t.landing.validationGalleryBoth
    if (fieldErrors[`${prefix}.media`]) return localeCtx.t.landing.validationGalleryMedia
    if (fieldErrors[`${prefix}.youtubeUrl`]) return localeCtx.t.landing.validationYoutubeUrl
    return undefined
  }

  const galleryPreviewUrl = (row: GalleryRow) => row.previewUrl ?? youtubeThumbnailUrl(row.youtubeUrl) ?? undefined

  const stopGalleryDrag = (event: Event) => {
    event.stopPropagation()
  }

  const handleGalleryConsider = (event: CustomEvent<DndEvent<GalleryRow>>) => {
    form.galleryItems = event.detail.items
  }

  const handleGalleryFinalize = (event: CustomEvent<DndEvent<GalleryRow>>) => {
    form.galleryItems = event.detail.items
  }

  const applyForm = (next: LandingFormState) => {
    form = next
    baseline = serializeLandingForm(next)
    showErrors = false
  }

  const landingQuery = createQuery(() => ({
    queryKey: ['landing', scope],
    queryFn: async () => {
      const [landing, staff] = await Promise.all([loadLanding(scope), listManagers()])
      return { landing, staff: staff as StaffRecord[] }
    },
  }))

  $effect(() => {
    const currentScope = scope
    if (!landingQuery.isSuccess || !landingQuery.data) return
    if (hydratedScope === currentScope) return
    applyForm(landingToForm(landingQuery.data.landing))
    hydratedScope = currentScope
  })

  const saveMutation = createMutation(() => ({
    mutationFn: () => saveLanding(scope, form),
    onSuccess: (saved) => {
      applyForm(landingToForm(saved))
      queryClient.setQueryData(['landing', scope], (current: { landing: unknown; staff: StaffRecord[] } | undefined) =>
        current ? { ...current, landing: saved } : { landing: saved, staff: [] },
      )
      pushToast(localeCtx.t.landing.savedToast, 'success')
    },
    onError: (saveError) => {
      pushToast(saveError instanceof Error ? saveError.message : localeCtx.t.common.error, 'error')
    },
  }))

  const managers = $derived(landingQuery.data?.staff ?? [])

  const isAssignableStaff = (staff: StaffRecord) => {
    const role = normalizeRole(staff.role)
    return role !== null && (ASSIGNABLE_STAFF_ROLES as readonly string[]).includes(role)
  }

  const hasPhoneNumber = (staff: StaffRecord) => Boolean(staff.phoneNumber?.trim())
  const hasTelegramUsername = (staff: StaffRecord) => Boolean(staff.telegramUsername?.trim())

  const assignableStaff = $derived.by(() => {
    const byId = new Map<string, StaffRecord>()
    for (const manager of managers) {
      if (isAssignableStaff(manager)) byId.set(manager.id, manager)
    }

    const landing = landingQuery.data?.landing
    const expanded = [
      ...(landing?.expand?.footerContactManagers ?? []),
      landing?.expand?.headerPhoneManager,
      landing?.expand?.telegramManager,
    ]
    for (const contact of expanded) {
      if (contact && isAssignableStaff(contact)) byId.set(contact.id, contact)
    }

    const currentUser = getCurrentUser()
    if (currentUser && isStaffUser(currentUser) && isAssignableStaff(currentUser)) {
      byId.set(currentUser.id, currentUser)
    }

    return [...byId.values()].sort((a, b) =>
      (a.name || a.email).localeCompare(b.name || b.email),
    )
  })

  const phoneStaffOptions = $derived.by((): SelectOption[] =>
    assignableStaff.map((staff) => ({
      value: staff.id,
      label: staff.name || staff.email,
      disabled: !hasPhoneNumber(staff),
    })),
  )

  const telegramStaffOptions = $derived.by((): SelectOption[] => [
    { value: '', label: localeCtx.t.landing.none },
    ...assignableStaff.map((staff) => ({
      value: staff.id,
      label: staff.name || staff.email,
      disabled: !hasTelegramUsername(staff),
    })),
  ])

  const footerContactOptions = $derived.by(() =>
    assignableStaff.map((staff) => ({
      value: staff.id,
      label: staff.name || staff.email,
      disabled: !hasPhoneNumber(staff),
    })),
  )

  const warnMissingPhone = () => {
    pushToast(localeCtx.t.landing.missingPhoneToast, 'warning')
  }

  const warnMissingTelegram = () => {
    pushToast(localeCtx.t.landing.missingTelegramToast, 'warning')
  }

  const removeHeadBodyRow = (
    key: 'venueItems' | 'advantageItems' | 'processItems',
    removedKey: 'removedVenueIds' | 'removedAdvantageIds' | 'removedProcessIds',
    row: HeadBodyRow,
  ) => {
    if (form[key].length <= 1) return
    if (row.id) {
      form[removedKey] = [...form[removedKey], row.id]
    }
    form[key] = form[key].filter((item) => item.localId !== row.localId)
  }

  const revokePreview = (url?: string) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  }

  const removeGalleryRow = (row: GalleryRow) => {
    if (form.galleryItems.length <= 1) return
    revokePreview(row.previewUrl)
    if (row.recordId) {
      form.removedGalleryIds = [...form.removedGalleryIds, row.recordId]
    }
    form.galleryItems = form.galleryItems.filter((item) => item.id !== row.id)
  }

  const setGalleryFile = (row: GalleryRow, file: File) => {
    if (!isImageFile(file)) return
    revokePreview(row.previewUrl)
    row.youtubeUrl = ''
    row.file = file
    row.existingFile = undefined
    row.previewUrl = URL.createObjectURL(file)
  }

  const setGalleryYoutubeUrl = (row: GalleryRow, youtubeUrl: string) => {
    row.youtubeUrl = youtubeUrl
    if (!youtubeUrl.trim()) return
    revokePreview(row.previewUrl)
    row.file = null
    row.existingFile = undefined
    row.previewUrl = undefined
  }

  const addGalleryFiles = (files: File[]) => {
    const images = files.filter((file) => isImageFile(file))
    const rows = images.map((file) =>
      emptyGalleryRow({
        file,
        previewUrl: URL.createObjectURL(file),
      }),
    )
    form.galleryItems = [...form.galleryItems, ...rows]
  }

  const addGalleryYoutubeRow = () => {
    form.galleryItems = [...form.galleryItems, emptyGalleryRow()]
  }

  const removeExistingPartner = (name: string) => {
    form.existingPartners = form.existingPartners.filter((partner) => partner.name !== name)
  }

  const removePendingPartner = (localId: string) => {
    const pending = form.partnerFiles.find((item) => item.localId === localId)
    revokePreview(pending?.previewUrl)
    form.partnerFiles = form.partnerFiles.filter((item) => item.localId !== localId)
  }

  const addPartnerFiles = (files: File[]) => {
    const pending = files.map(
      (file): PendingPartnerFile => ({
        localId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      }),
    )
    form.partnerFiles = [...form.partnerFiles, ...pending]
  }

  const submit = (event: SubmitEvent) => {
    event.preventDefault()

    if (!isDirty) {
      pushToast(localeCtx.t.landing.noChanges, 'info')
      return
    }

    showErrors = true
    const errors = collectLandingFieldErrors(form)
    if (hasLandingFieldErrors(errors)) {
      const incompleteLocale = firstIncompleteContentLocale(errors)
      if (incompleteLocale) contentLocale = incompleteLocale
      pushToast(localeCtx.t.landing.validationFailed, 'error')
      return
    }

    fillBlankLocales(form)
    saveMutation.mutate()
  }

  const onSaveClick = (event: MouseEvent) => {
    // Button uses aria-disabled (not native disabled), so still receive clicks when clean.
    if (!isDirty || saveMutation.isPending) {
      event.preventDefault()
      if (!isDirty) pushToast(localeCtx.t.landing.noChanges, 'info')
    }
  }
</script>

<section class="landing_editor">
  <header class="landing_editor-toolbar">
    <div class="l_container">
      <div class="l_cluster" data-gap="4" data-justify="between" data-align="center">
        <div class="landing_editor-heading">
          <p class="landing_editor-eyebrow">{localeCtx.t.scopes[scope]}</p>
          <h1 class="landing_editor-title">{localeCtx.t.landing.title}</h1>
        </div>
        <div class="l_cluster" data-gap="3" data-align="center">
          <div class="landing_editor-locale_switch" role="tablist" aria-label={localeCtx.t.landing.contentLocale}>
            {#each CONTENT_LOCALES as locale}
              <button
                type="button"
                class="landing_editor-locale_btn u_reset_button"
                role="tab"
                aria-selected={contentLocale === locale}
                data-active={contentLocale === locale ? 'true' : undefined}
                onclick={() => (contentLocale = locale)}
              >
                {localeCtx.t.landing.contentLocales[locale]}
              </button>
            {/each}
          </div>
          <Button
            type="submit"
            form="landing-editor-form"
            isLoading={saveMutation.isPending}
            disabled={saveMutation.isPending}
            onclick={onSaveClick}
          >
            {localeCtx.t.common.save}
          </Button>
        </div>
      </div>
    </div>
  </header>
  <div class="l_container">
    {#if landingQuery.isPending}
      <p class="landing_editor-status">{localeCtx.t.common.loading}</p>
    {:else if landingQuery.isError}
      <p class="landing_editor-status" data-tone="error">
        {landingQuery.error instanceof Error ? landingQuery.error.message : localeCtx.t.common.error}
      </p>
    {:else}
      <form id="landing-editor-form" class="landing_editor-form" novalidate onsubmit={submit}>
        <section class="landing_editor-section">
          <h2 class="landing_editor-section_title">{localeCtx.t.landing.general}</h2>
          <div class="landing_editor-grid">
            <Select
              label={localeCtx.t.landing.headerPhoneManager}
              name="headerPhoneManager"
              bind:value={form.headerPhoneManagerId}
              options={phoneStaffOptions}
              placeholder={localeCtx.t.landing.none}
              error={fieldErrors.headerPhoneManager ? localeCtx.t.landing.validationHeaderPhone : undefined}
              required
              onDisabledOptionClick={warnMissingPhone}
            />
            <Select
              label={localeCtx.t.landing.telegramManager}
              name="telegramManager"
              bind:value={form.telegramManagerId}
              options={telegramStaffOptions}
              placeholder={localeCtx.t.landing.none}
              onDisabledOptionClick={warnMissingTelegram}
            />
            <FormField
              label={localeCtx.t.landing.presentationUrl}
              name="presentationUrl"
              bind:value={form.presentationUrl}
            />
          </div>
        </section>

        <section class="landing_editor-section">
          <h2 class="landing_editor-section_title">{localeCtx.t.landing.venue}</h2>
          {#if sectionError('venues')}
            <p class="landing_editor-section_error">{sectionError('venues')}</p>
          {/if}
          {#each form.venueItems as row (row.localId)}
            <div class="landing_editor-item">
              <div class="landing_editor-item_fields">
                <LocalizedField
                  locale={contentLocale}
                  label={localeCtx.t.landing.head}
                  nameBase={`venue-head-${row.localId}`}
                  bind:ru={row.headRu}
                  bind:en={row.headEn}
                  bind:uz={row.headUz}
                  errorRu={fieldError(`venueItems.${row.localId}.headRu`)}
                  errorEn={fieldError(`venueItems.${row.localId}.headEn`)}
                  errorUz={fieldError(`venueItems.${row.localId}.headUz`)}
                  required
                />
                <LocalizedField
                  locale={contentLocale}
                  label={localeCtx.t.landing.body}
                  nameBase={`venue-body-${row.localId}`}
                  bind:ru={row.bodyRu}
                  bind:en={row.bodyEn}
                  bind:uz={row.bodyUz}
                  errorRu={fieldError(`venueItems.${row.localId}.bodyRu`)}
                  errorEn={fieldError(`venueItems.${row.localId}.bodyEn`)}
                  errorUz={fieldError(`venueItems.${row.localId}.bodyUz`)}
                  multiline
                  required
                />
              </div>
              <Button
                class="landing_editor-delete_btn"
                type="button"
                variant="ghost"
                color="danger"
                shape="square"
                title={localeCtx.t.landing.removeRow}
                aria-label={localeCtx.t.landing.removeRow}
                disabled={form.venueItems.length <= 1}
                onclick={() => removeHeadBodyRow('venueItems', 'removedVenueIds', row)}
              >
                <TrashIcon />
              </Button>
            </div>
          {/each}
          <div class="landing_editor-add">
            <Button
              type="button"
              size="sm"
              variant="outline"
              color="contrast"
              onclick={() => (form.venueItems = [...form.venueItems, emptyHeadBodyRow()])}
            >
              {localeCtx.t.landing.addRow}
            </Button>
          </div>
        </section>

        <section class="landing_editor-section">
          <h2 class="landing_editor-section_title">{localeCtx.t.landing.advantages}</h2>
          {#if sectionError('advantages')}
            <p class="landing_editor-section_error">{sectionError('advantages')}</p>
          {/if}
          {#each form.advantageItems as row (row.localId)}
            <div class="landing_editor-item">
              <div class="landing_editor-item_fields">
                <LocalizedField
                  locale={contentLocale}
                  label={localeCtx.t.landing.head}
                  nameBase={`adv-head-${row.localId}`}
                  bind:ru={row.headRu}
                  bind:en={row.headEn}
                  bind:uz={row.headUz}
                  errorRu={fieldError(`advantageItems.${row.localId}.headRu`)}
                  errorEn={fieldError(`advantageItems.${row.localId}.headEn`)}
                  errorUz={fieldError(`advantageItems.${row.localId}.headUz`)}
                  required
                />
                <LocalizedField
                  locale={contentLocale}
                  label={localeCtx.t.landing.body}
                  nameBase={`adv-body-${row.localId}`}
                  bind:ru={row.bodyRu}
                  bind:en={row.bodyEn}
                  bind:uz={row.bodyUz}
                  errorRu={fieldError(`advantageItems.${row.localId}.bodyRu`)}
                  errorEn={fieldError(`advantageItems.${row.localId}.bodyEn`)}
                  errorUz={fieldError(`advantageItems.${row.localId}.bodyUz`)}
                  multiline
                  required
                />
              </div>
              <Button
                class="landing_editor-delete_btn"
                type="button"
                variant="ghost"
                color="danger"
                shape="square"
                title={localeCtx.t.landing.removeRow}
                aria-label={localeCtx.t.landing.removeRow}
                disabled={form.advantageItems.length <= 1}
                onclick={() => removeHeadBodyRow('advantageItems', 'removedAdvantageIds', row)}
              >
                <TrashIcon />
              </Button>
            </div>
          {/each}
          <div class="landing_editor-add">
            <Button
              type="button"
              variant="outline"
              color="contrast"
              size="sm"
              onclick={() => (form.advantageItems = [...form.advantageItems, emptyHeadBodyRow()])}
            >
              {localeCtx.t.landing.addRow}
            </Button>
          </div>
        </section>

        <section class="landing_editor-section">
          <h2 class="landing_editor-section_title">{localeCtx.t.landing.process}</h2>
          {#if sectionError('process')}
            <p class="landing_editor-section_error">{sectionError('process')}</p>
          {/if}
          {#each form.processItems as row (row.localId)}
            <div class="landing_editor-item">
              <div class="landing_editor-item_fields">
                <LocalizedField
                  locale={contentLocale}
                  label={localeCtx.t.landing.head}
                  nameBase={`proc-head-${row.localId}`}
                  bind:ru={row.headRu}
                  bind:en={row.headEn}
                  bind:uz={row.headUz}
                  errorRu={fieldError(`processItems.${row.localId}.headRu`)}
                  errorEn={fieldError(`processItems.${row.localId}.headEn`)}
                  errorUz={fieldError(`processItems.${row.localId}.headUz`)}
                  required
                />
                <LocalizedField
                  locale={contentLocale}
                  label={localeCtx.t.landing.body}
                  nameBase={`proc-body-${row.localId}`}
                  bind:ru={row.bodyRu}
                  bind:en={row.bodyEn}
                  bind:uz={row.bodyUz}
                  errorRu={fieldError(`processItems.${row.localId}.bodyRu`)}
                  errorEn={fieldError(`processItems.${row.localId}.bodyEn`)}
                  errorUz={fieldError(`processItems.${row.localId}.bodyUz`)}
                  multiline
                  required
                />
              </div>
              <Button
                class="landing_editor-delete_btn"
                type="button"
                variant="ghost"
                color="danger"
                shape="square"
                title={localeCtx.t.landing.removeRow}
                aria-label={localeCtx.t.landing.removeRow}
                disabled={form.processItems.length <= 1}
                onclick={() => removeHeadBodyRow('processItems', 'removedProcessIds', row)}
              >
                <TrashIcon />
              </Button>
            </div>
          {/each}
          <div class="landing_editor-add">
            <Button
              type="button"
              variant="outline"
              color="contrast"
              size="sm"
              onclick={() => (form.processItems = [...form.processItems, emptyHeadBodyRow()])}
            >
              {localeCtx.t.landing.addRow}
            </Button>
          </div>
        </section>

        <section class="landing_editor-section">
          <h2 class="landing_editor-section_title">{localeCtx.t.landing.gallery}</h2>
          {#if sectionError('gallery')}
            <p class="landing_editor-section_error">{sectionError('gallery')}</p>
          {/if}
          <div
            class="landing_editor-media_grid"
            use:dndzone={{
              items: form.galleryItems,
              type: 'landing-gallery',
              flipDurationMs,
              dropFromOthersDisabled: true,
              dropTargetStyle: {
                outline: '1px dashed var(--border-focus)',
                outlineOffset: '2px',
              },
            }}
            onconsider={handleGalleryConsider}
            onfinalize={handleGalleryFinalize}
          >
            {#each form.galleryItems as row (row.id)}
              {@const hasImage = galleryRowHasImage(row)}
              {@const hasYoutube = Boolean(row.youtubeUrl.trim())}
              {@const previewUrl = galleryPreviewUrl(row)}
              <article class="landing_editor-media_card" animate:flip={{ duration: flipDurationMs }}>
                <div class="landing_editor-media_preview" data-invalid={galleryMediaError(row) ? 'true' : undefined}>
                  {#if previewUrl}
                    <img class="landing_editor-media_image" src={previewUrl} alt="" />
                  {:else if hasYoutube}
                    <span class="landing_editor-media_empty">{localeCtx.t.landing.youtubeVideo}</span>
                  {:else}
                    <span class="landing_editor-media_empty">{localeCtx.t.landing.file}</span>
                  {/if}
                  <!-- svelte-ignore a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions -->
                  <div
                    class="landing_editor-media_actions"
                    onpointerdown={stopGalleryDrag}
                    onmousedown={stopGalleryDrag}
                    ontouchstart={stopGalleryDrag}
                  >
                    {#if !hasYoutube}
                      <Button
                        class="landing_editor-replace_btn"
                        type="button"
                        variant="outline"
                        color="contrast"
                        size="sm"
                        onclick={() => {
                          const input = document.getElementById(`gal-replace-${row.id}`) as HTMLInputElement | null
                          input?.click()
                        }}
                      >
                        {localeCtx.t.landing.replaceImage}
                      </Button>
                    {/if}
                    <Button
                      class="landing_editor-delete_btn"
                      type="button"
                      size="sm"
                      color="danger"
                      shape="square"
                      title={localeCtx.t.landing.deleteImage}
                      aria-label={localeCtx.t.landing.deleteImage}
                      disabled={form.galleryItems.length <= 1}
                      onclick={() => removeGalleryRow(row)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                  <input
                    id={`gal-replace-${row.id}`}
                    class="u_sr_only"
                    type="file"
                    accept="image/*"
                    disabled={hasYoutube}
                    onchange={(event) => {
                      const file = (event.currentTarget as HTMLInputElement).files?.[0]
                      if (file) setGalleryFile(row, file)
                      ;(event.currentTarget as HTMLInputElement).value = ''
                    }}
                  />
                </div>
                {#if galleryMediaError(row)}
                  <p class="landing_editor-section_error">{galleryMediaError(row)}</p>
                {/if}
                <!-- svelte-ignore a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions -->
                <div
                  class="landing_editor-media_fields"
                  onpointerdown={stopGalleryDrag}
                  onmousedown={stopGalleryDrag}
                  ontouchstart={stopGalleryDrag}
                >
                  <FormField
                    label={localeCtx.t.landing.youtubeUrl}
                    name={`gal-youtube-${row.id}`}
                    type="url"
                    bind:value={row.youtubeUrl}
                    hint={localeCtx.t.landing.youtubeUrlHint}
                    error={fieldErrors[`galleryItems.${row.id}.youtubeUrl`]
                      ? localeCtx.t.landing.validationYoutubeUrl
                      : undefined}
                    disabled={hasImage}
                    oninput={(event) => setGalleryYoutubeUrl(row, event.currentTarget.value)}
                  />
                  <LocalizedField
                    locale={contentLocale}
                    label={localeCtx.t.landing.caption}
                    nameBase={`gal-cap-${row.id}`}
                    bind:ru={row.captionRu}
                    bind:en={row.captionEn}
                    bind:uz={row.captionUz}
                  />
                </div>
              </article>
            {/each}
          </div>
          <div class="landing_editor-gallery_actions">
            <MediaDropzone
              label={localeCtx.t.landing.dropHint}
              hint={localeCtx.t.landing.gallery}
              multiple
              onFiles={addGalleryFiles}
            />
            <Button type="button" variant="outline" color="neutral" onclick={addGalleryYoutubeRow}>
              {localeCtx.t.landing.addYoutubeRow}
            </Button>
          </div>
        </section>

        <section class="landing_editor-section">
          <h2 class="landing_editor-section_title">{localeCtx.t.landing.partners}</h2>
          <div class="landing_editor-media_grid" data-size="sm">
            {#each form.existingPartners as partner (partner.name)}
              <article class="landing_editor-media_card" data-size="sm">
                <div class="landing_editor-media_preview">
                  <img class="landing_editor-media_image" src={partner.url} alt="" />
                  <div class="landing_editor-media_actions">
                    <Button
                      class="landing_editor-delete_btn"
                      type="button"
                      color="danger"
                      size="sm"
                      shape="square"
                      title={localeCtx.t.landing.deleteImage}
                      aria-label={localeCtx.t.landing.deleteImage}
                      onclick={() => removeExistingPartner(partner.name)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </div>
              </article>
            {/each}
            {#each form.partnerFiles as pending (pending.localId)}
              <article class="landing_editor-media_card" data-size="sm">
                <div class="landing_editor-media_preview">
                  <img class="landing_editor-media_image" src={pending.previewUrl} alt="" />
                  <div class="landing_editor-media_actions">
                    <Button
                      class="landing_editor-delete_btn"
                      type="button"
                      size="sm"
                      color="danger"
                      shape="square"
                      title={localeCtx.t.landing.deleteImage}
                      aria-label={localeCtx.t.landing.deleteImage}
                      onclick={() => removePendingPartner(pending.localId)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </div>
              </article>
            {/each}
          </div>
          <MediaDropzone
            label={localeCtx.t.landing.dropHint}
            hint={localeCtx.t.landing.partners}
            multiple
            onFiles={addPartnerFiles}
          />
        </section>

        <section class="landing_editor-section">
          <h2 class="landing_editor-section_title">{localeCtx.t.landing.contacts}</h2>
          <fieldset class="landing_editor-checkbox_list">
            <legend class="u_sr_only">{localeCtx.t.landing.contactManagers}</legend>
            {#each footerContactOptions as option}
              <Checkbox
                label={option.label}
                disabled={option.disabled}
                checked={form.footerContactManagerIds.includes(option.value)}
                onDisabledClick={warnMissingPhone}
                onCheckedChange={(checked) => {
                  if (checked) {
                    form.footerContactManagerIds = [...form.footerContactManagerIds, option.value]
                  } else {
                    form.footerContactManagerIds = form.footerContactManagerIds.filter(
                      (id) => id !== option.value,
                    )
                  }
                }}
              />
            {/each}
          </fieldset>
        </section>
      </form>
    {/if}
  </div>
</section>
