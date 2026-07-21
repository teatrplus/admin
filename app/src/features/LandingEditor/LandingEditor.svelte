<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
  import TrashIcon from '~icons/material-symbols/delete-outline'
  import Button from '@/components/Button/Button.svelte'
  import Checkbox from '@/components/Checkbox/Checkbox.svelte'
  import FormField from '@/components/FormField/FormField.svelte'
  import MediaDropzone from '@/components/MediaDropzone/MediaDropzone.svelte'
  import Toast from '@/components/Toast/Toast.svelte'
  import type { SiteScope } from '@/lib/cms/scopes'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import {
    landingToForm,
    listManagers,
    loadLanding,
    saveLanding,
    type GalleryRow,
    type HeadBodyRow,
    type LandingFormState,
    type PendingPartnerFile,
  } from '@/lib/pocketbase/landing'
  import type { StaffRecord } from '@/lib/pocketbase/types'
  import './LandingEditor.css'

  let { scope }: { scope: SiteScope } = $props()

  const localeCtx = useLocale()
  const queryClient = useQueryClient()

  let form = $state<LandingFormState>(landingToForm(null))
  let toastOpen = $state(false)
  let toastTone = $state<'success' | 'error'>('success')
  let toastMessage = $state('')
  let hydratedScope = $state<SiteScope | null>(null)

  const newRow = (): HeadBodyRow => ({ localId: crypto.randomUUID(), head: '', body: '' })

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
    form = landingToForm(landingQuery.data.landing)
    hydratedScope = currentScope
  })

  const saveMutation = createMutation(() => ({
    mutationFn: () => saveLanding(scope, form),
    onSuccess: (saved) => {
      form = landingToForm(saved)
      queryClient.setQueryData(['landing', scope], (current: { landing: unknown; staff: StaffRecord[] } | undefined) =>
        current ? { ...current, landing: saved } : { landing: saved, staff: [] },
      )
      toastTone = 'success'
      toastMessage = localeCtx.t.common.saved
      toastOpen = true
    },
    onError: (saveError) => {
      toastTone = 'error'
      toastMessage = saveError instanceof Error ? saveError.message : localeCtx.t.common.error
      toastOpen = true
    },
  }))

  const managers = $derived(landingQuery.data?.staff ?? [])
  const managerOptions = $derived(
    managers.map((manager) => ({
      value: manager.id,
      label: manager.name || manager.email,
    })),
  )

  const removeHeadBodyRow = (
    key: 'venueItems' | 'advantageItems' | 'processItems',
    removedKey: 'removedVenueIds' | 'removedAdvantageIds' | 'removedProcessIds',
    row: HeadBodyRow,
  ) => {
    if (row.id) {
      form[removedKey] = [...form[removedKey], row.id]
    }
    form[key] = form[key].filter((item) => item.localId !== row.localId)
  }

  const revokePreview = (url?: string) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  }

  const removeGalleryRow = (row: GalleryRow) => {
    revokePreview(row.previewUrl)
    if (row.id) {
      form.removedGalleryIds = [...form.removedGalleryIds, row.id]
    }
    form.galleryItems = form.galleryItems.filter((item) => item.localId !== row.localId)
  }

  const setGalleryFile = (row: GalleryRow, file: File) => {
    revokePreview(row.previewUrl)
    row.file = file
    row.previewUrl = URL.createObjectURL(file)
  }

  const addGalleryFiles = (files: File[]) => {
    const rows = files.map(
      (file): GalleryRow => ({
        localId: crypto.randomUUID(),
        caption: '',
        file,
        previewUrl: URL.createObjectURL(file),
      }),
    )
    form.galleryItems = [...form.galleryItems, ...rows]
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
    saveMutation.mutate()
  }
</script>

<section class="landing_editor">
  <header class="landing_editor-toolbar">
    <div class="l_container">
      <div class="l_cluster" data-gap="4" data-justify="between">
        <div class="landing_editor-heading">
          <p class="landing_editor-eyebrow">{localeCtx.t.scopes[scope]}</p>
          <h1 class="landing_editor-title">{localeCtx.t.landing.title}</h1>
        </div>
        <Button type="submit" form="landing-editor-form" isLoading={saveMutation.isPending}>
          {localeCtx.t.common.save}
        </Button>
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
      <form id="landing-editor-form" class="landing_editor-form" onsubmit={submit}>
        <section class="landing_editor-section">
          <h2 class="landing_editor-section_title">{localeCtx.t.landing.general}</h2>
          <div class="landing_editor-grid">
            <FormField
              label={localeCtx.t.landing.headerPhoneNumber}
              name="headerPhoneNumber"
              bind:value={form.headerPhoneNumber}
            />
            <FormField
              label={localeCtx.t.landing.telegramManagerUrl}
              name="telegramManagerUrl"
              bind:value={form.telegramManagerUrl}
            />
            <FormField
              label={localeCtx.t.landing.presentationUrl}
              name="presentationUrl"
              bind:value={form.presentationUrl}
            />
          </div>
        </section>

        <section class="landing_editor-section">
          <h2 class="landing_editor-section_title">{localeCtx.t.landing.venues}</h2>
          {#each form.venueItems as row (row.localId)}
            <div class="landing_editor-item">
              <div class="landing_editor-item_fields">
                <FormField label={localeCtx.t.landing.head} name={`venue-head-${row.localId}`} bind:value={row.head} />
                <FormField
                  label={localeCtx.t.landing.body}
                  name={`venue-body-${row.localId}`}
                  multiline
                  bind:value={row.body}
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
              onclick={() => (form.venueItems = [...form.venueItems, newRow()])}
            >
              {localeCtx.t.landing.addRow}
            </Button>
          </div>
        </section>

        <section class="landing_editor-section">
          <h2 class="landing_editor-section_title">{localeCtx.t.landing.advantages}</h2>
          {#each form.advantageItems as row (row.localId)}
            <div class="landing_editor-item">
              <div class="landing_editor-item_fields">
                <FormField label={localeCtx.t.landing.head} name={`adv-head-${row.localId}`} bind:value={row.head} />
                <FormField
                  label={localeCtx.t.landing.body}
                  name={`adv-body-${row.localId}`}
                  multiline
                  bind:value={row.body}
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
              onclick={() => (form.advantageItems = [...form.advantageItems, newRow()])}
            >
              {localeCtx.t.landing.addRow}
            </Button>
          </div>
        </section>

        <section class="landing_editor-section">
          <h2 class="landing_editor-section_title">{localeCtx.t.landing.process}</h2>
          {#each form.processItems as row (row.localId)}
            <div class="landing_editor-item">
              <div class="landing_editor-item_fields">
                <FormField label={localeCtx.t.landing.head} name={`proc-head-${row.localId}`} bind:value={row.head} />
                <FormField
                  label={localeCtx.t.landing.body}
                  name={`proc-body-${row.localId}`}
                  multiline
                  bind:value={row.body}
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
              onclick={() => (form.processItems = [...form.processItems, newRow()])}
            >
              {localeCtx.t.landing.addRow}
            </Button>
          </div>
        </section>

        <section class="landing_editor-section">
          <h2 class="landing_editor-section_title">{localeCtx.t.landing.gallery}</h2>
          <div class="landing_editor-media_grid">
            {#each form.galleryItems as row (row.localId)}
              <article class="landing_editor-media_card">
                <div class="landing_editor-media_preview">
                  {#if row.previewUrl}
                    <img class="landing_editor-media_image" src={row.previewUrl} alt="" />
                  {:else}
                    <span class="landing_editor-media_empty">{localeCtx.t.landing.file}</span>
                  {/if}
                  <div class="landing_editor-media_actions">
                    <Button
                      type="button"
                      variant="outline"
                      color="contrast"
                      size="sm"
                      onclick={() => {
                        const input = document.getElementById(`gal-replace-${row.localId}`) as HTMLInputElement | null
                        input?.click()
                      }}
                    >
                      {localeCtx.t.landing.replaceImage}
                    </Button>
                    <Button
                      class="landing_editor-delete_btn"
                      type="button"
                      variant="ghost"
                      color="danger"
                      shape="square"
                      title={localeCtx.t.landing.deleteImage}
                      aria-label={localeCtx.t.landing.deleteImage}
                      onclick={() => removeGalleryRow(row)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                  <input
                    id={`gal-replace-${row.localId}`}
                    class="u_sr_only"
                    type="file"
                    accept="image/*"
                    onchange={(event) => {
                      const file = (event.currentTarget as HTMLInputElement).files?.[0]
                      if (file) setGalleryFile(row, file)
                      ;(event.currentTarget as HTMLInputElement).value = ''
                    }}
                  />
                </div>
                <FormField
                  label={localeCtx.t.landing.caption}
                  name={`gal-cap-${row.localId}`}
                  bind:value={row.caption}
                />
              </article>
            {/each}
          </div>
          <MediaDropzone
            label={localeCtx.t.landing.dropHint}
            hint={localeCtx.t.landing.gallery}
            multiple
            onFiles={addGalleryFiles}
          />
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
            {#each managerOptions as option}
              <Checkbox
                label={option.label}
                checked={form.contactManagerIds.includes(option.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    form.contactManagerIds = [...form.contactManagerIds, option.value]
                  } else {
                    form.contactManagerIds = form.contactManagerIds.filter((id) => id !== option.value)
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

<Toast bind:open={toastOpen} tone={toastTone}>{toastMessage}</Toast>
