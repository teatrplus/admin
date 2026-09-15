<script lang="ts">
  import GalleryImage from '@/components/GalleryImage/GalleryImage.svelte'
  import PageActions from '@/components/PageActions/PageActions.svelte'
  import EditorNavigation from '@/components/EditorNavigation/EditorNavigation.svelte'
  import PageHeader from '@/components/PageHeader/PageHeader.svelte'
  import ContentLocaleTabs from '@/components/ContentLocaleTabs/ContentLocaleTabs.svelte'
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
  import SortableList from '@/components/SortableList/SortableList.svelte'
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
  const sectionKeys = ['general', 'venue', 'advantages', 'process', 'gallery', 'partners', 'contacts'] as const
  const queryClient = useQueryClient()

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

  const hasPhoneNumber = (staff: StaffRecord) => Boolean(staff.phone_number?.trim())
  const hasTelegramUsername = (staff: StaffRecord) => Boolean(staff.telegram_username?.trim())

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

    return [...byId.values()].sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email))
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
    const pending = files.map((file): PendingPartnerFile => ({
      localId: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }))
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
  <PageHeader
    title={localeCtx.t.landing.title}
    eyebrow={localeCtx.t.scopes[scope]}
    description={localeCtx.t.workspace.landingDescription}
  />
  <PageActions label={localeCtx.t.landing.title}>
    {#snippet leading()}<ContentLocaleTabs bind:value={contentLocale} disabled={saveMutation.isPending} />{/snippet}
    <Button type="submit" form="landing-editor-form" isLoading={saveMutation.isPending} onclick={onSaveClick}
      >{localeCtx.t.common.save}</Button
    >
  </PageActions>
  <div class="landing_editor-layout">
    <EditorNavigation
      label={localeCtx.t.landing.title}
      items={sectionKeys.map((key) => ({ id: `landing-${key}`, label: localeCtx.t.landing[key] }))}
    />
    <div class="l_stack" data-gap="6">
      {#if landingQuery.isPending}
        <p class="landing_editor-status">{localeCtx.t.common.loading}</p>
      {:else if landingQuery.isError}
        <p class="landing_editor-status" data-tone="error">
          {landingQuery.error instanceof Error ? landingQuery.error.message : localeCtx.t.common.error}
        </p>
      {:else}
        <form autocomplete="off" id="landing-editor-form" class="landing_editor-form" novalidate onsubmit={submit}>
          <section class="landing_editor-section" id="landing-general">
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

          <section class="landing_editor-section" id="landing-venue">
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

          <section class="landing_editor-section" id="landing-advantages">
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

          <section class="landing_editor-section" id="landing-process">
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

          <section class="landing_editor-section" id="landing-gallery">
            <h2 class="landing_editor-section_title">{localeCtx.t.landing.gallery}</h2>
            {#if sectionError('gallery')}
              <p class="landing_editor-section_error">{sectionError('gallery')}</p>
            {/if}
            <SortableList
              items={form.galleryItems}
              label={localeCtx.t.landing.gallery}
              itemLabel={(_, index) => `${localeCtx.t.landing.gallery} ${index + 1}`}
              layout="gallery"
              disabled={saveMutation.isPending}
              onReorder={(items) => (form.galleryItems = items)}
            >
              {#snippet children(row)}
                {@const hasImage = galleryRowHasImage(row)}
                {@const hasYoutube = Boolean(row.youtubeUrl.trim())}
                {@const previewUrl = galleryPreviewUrl(row)}
                <GalleryImage
                  src={previewUrl || undefined}
                  placeholder={hasYoutube ? localeCtx.t.landing.youtubeVideo : localeCtx.t.landing.file}
                  invalid={Boolean(galleryMediaError(row))}
                  disabled={saveMutation.isPending}
                  canDelete={form.galleryItems.length > 1}
                  onDelete={() => removeGalleryRow(row)}
                  onReplace={hasYoutube ? undefined : (file) => setGalleryFile(row, file)}
                />
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
              {/snippet}
            </SortableList>
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

          <section class="landing_editor-section" id="landing-partners">
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

          <section class="landing_editor-section" id="landing-contacts">
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
                      form.footerContactManagerIds = form.footerContactManagerIds.filter((id) => id !== option.value)
                    }
                  }}
                />
              {/each}
            </fieldset>
          </section>
        </form>
      {/if}
    </div>
  </div>
</section>
