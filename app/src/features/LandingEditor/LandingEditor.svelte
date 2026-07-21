<script lang="ts">
  import Button from '@/components/Button/Button.svelte'
  import Checkbox from '@/components/Checkbox/Checkbox.svelte'
  import FormField from '@/components/FormField/FormField.svelte'
  import StatusBanner from '@/components/StatusBanner/StatusBanner.svelte'
  import type { SiteScope } from '../../lib/cms/scopes'
  import { useLocale } from '../../lib/i18n/context.svelte'
  import {
    landingToForm,
    listManagers,
    loadLanding,
    saveLanding,
    type GalleryRow,
    type HeadBodyRow,
    type LandingFormState,
  } from '../../lib/pocketbase/landing'
  import type { StaffRecord } from '../../lib/pocketbase/types'
  import './LandingEditor.css'

  let { scope }: { scope: SiteScope } = $props()

  const localeCtx = useLocale()
  let form = $state<LandingFormState>(landingToForm(null))
  let managers = $state<StaffRecord[]>([])
  let loading = $state(true)
  let saving = $state(false)
  let message = $state('')
  let error = $state('')

  const newRow = (): HeadBodyRow => ({ localId: crypto.randomUUID(), head: '', body: '' })
  const newGalleryRow = (): GalleryRow => ({ localId: crypto.randomUUID(), caption: '', file: null })

  const load = async () => {
    loading = true
    error = ''
    try {
      const [landing, staff] = await Promise.all([loadLanding(scope), listManagers()])
      form = landingToForm(landing)
      managers = staff as StaffRecord[]
    } catch (loadError) {
      error = loadError instanceof Error ? loadError.message : localeCtx.t.common.error
    } finally {
      loading = false
    }
  }

  $effect(() => {
    scope
    void load()
  })

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

  const removeGalleryRow = (row: GalleryRow) => {
    if (row.id) {
      form.removedGalleryIds = [...form.removedGalleryIds, row.id]
    }
    form.galleryItems = form.galleryItems.filter((item) => item.localId !== row.localId)
  }

  const onPartnerFiles = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement
    form.partnerFiles = input.files ? [...input.files] : []
  }

  const submit = async (event: SubmitEvent) => {
    event.preventDefault()
    saving = true
    message = ''
    error = ''
    try {
      const saved = await saveLanding(scope, form)
      form = landingToForm(saved)
      message = localeCtx.t.common.saved
    } catch (saveError) {
      error = saveError instanceof Error ? saveError.message : localeCtx.t.common.error
    } finally {
      saving = false
    }
  }

  const managerOptions = $derived(
    managers.map((manager) => ({
      value: manager.id,
      label: manager.name || manager.email,
    })),
  )
</script>

<section class="landing_editor">
  <h1 class="landing_editor-title">
    {localeCtx.t.scopes[scope]} · {localeCtx.t.landing.title}
  </h1>

  {#if loading}
    <p>{localeCtx.t.common.loading}</p>
  {:else}
    <form class="l_stack" data-gap="6" onsubmit={submit}>
      {#if message}
        <StatusBanner tone="success">{message}</StatusBanner>
      {/if}
      {#if error}
        <StatusBanner tone="error">{error}</StatusBanner>
      {/if}

      <section class="landing_editor-section">
        <h2 class="landing_editor-section_title">{localeCtx.t.landing.general}</h2>
        <div class="l_stack" data-gap="4">
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
        <div class="l_stack" data-gap="4">
          {#each form.venueItems as row (row.localId)}
            <div class="landing_editor-row l_stack" data-gap="3">
              <FormField label={localeCtx.t.landing.head} name={`venue-head-${row.localId}`} bind:value={row.head} />
              <FormField
                label={localeCtx.t.landing.body}
                name={`venue-body-${row.localId}`}
                multiline
                bind:value={row.body}
              />
              <div class="landing_editor-row_actions">
                <Button
                  type="button"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  onclick={() => removeHeadBodyRow('venueItems', 'removedVenueIds', row)}
                >
                  {localeCtx.t.landing.removeRow}
                </Button>
              </div>
            </div>
          {/each}
          <Button type="button" color="neutral" onclick={() => (form.venueItems = [...form.venueItems, newRow()])}>
            {localeCtx.t.landing.addRow}
          </Button>
        </div>
      </section>

      <section class="landing_editor-section">
        <h2 class="landing_editor-section_title">{localeCtx.t.landing.advantages}</h2>
        <div class="l_stack" data-gap="4">
          {#each form.advantageItems as row (row.localId)}
            <div class="landing_editor-row l_stack" data-gap="3">
              <FormField label={localeCtx.t.landing.head} name={`adv-head-${row.localId}`} bind:value={row.head} />
              <FormField
                label={localeCtx.t.landing.body}
                name={`adv-body-${row.localId}`}
                multiline
                bind:value={row.body}
              />
              <div class="landing_editor-row_actions">
                <Button
                  type="button"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  onclick={() => removeHeadBodyRow('advantageItems', 'removedAdvantageIds', row)}
                >
                  {localeCtx.t.landing.removeRow}
                </Button>
              </div>
            </div>
          {/each}
          <Button
            type="button"
            color="neutral"
            onclick={() => (form.advantageItems = [...form.advantageItems, newRow()])}
          >
            {localeCtx.t.landing.addRow}
          </Button>
        </div>
      </section>

      <section class="landing_editor-section">
        <h2 class="landing_editor-section_title">{localeCtx.t.landing.process}</h2>
        <div class="l_stack" data-gap="4">
          {#each form.processItems as row (row.localId)}
            <div class="landing_editor-row l_stack" data-gap="3">
              <FormField label={localeCtx.t.landing.head} name={`proc-head-${row.localId}`} bind:value={row.head} />
              <FormField
                label={localeCtx.t.landing.body}
                name={`proc-body-${row.localId}`}
                multiline
                bind:value={row.body}
              />
              <div class="landing_editor-row_actions">
                <Button
                  type="button"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  onclick={() => removeHeadBodyRow('processItems', 'removedProcessIds', row)}
                >
                  {localeCtx.t.landing.removeRow}
                </Button>
              </div>
            </div>
          {/each}
          <Button
            type="button"
            color="neutral"
            onclick={() => (form.processItems = [...form.processItems, newRow()])}
          >
            {localeCtx.t.landing.addRow}
          </Button>
        </div>
      </section>

      <section class="landing_editor-section">
        <h2 class="landing_editor-section_title">{localeCtx.t.landing.gallery}</h2>
        <div class="l_stack" data-gap="4">
          {#each form.galleryItems as row (row.localId)}
            <div class="landing_editor-row l_stack" data-gap="3">
              <FormField label={localeCtx.t.landing.caption} name={`gal-cap-${row.localId}`} bind:value={row.caption} />
              <FormField label={localeCtx.t.landing.file} name={`gal-file-${row.localId}`} type="file">
                {#snippet input()}
                  <input
                    class="form_field-control"
                    id={`gal-file-${row.localId}`}
                    name={`gal-file-${row.localId}`}
                    type="file"
                    accept="image/*"
                    onchange={(event) => {
                      const file = (event.currentTarget as HTMLInputElement).files?.[0] ?? null
                      row.file = file
                    }}
                  />
                  {#if row.existingFile}
                    <p class="form_field-hint">{row.existingFile}</p>
                  {/if}
                {/snippet}
              </FormField>
              <div class="landing_editor-row_actions">
                <Button type="button" variant="ghost" color="neutral" size="sm" onclick={() => removeGalleryRow(row)}>
                  {localeCtx.t.landing.removeRow}
                </Button>
              </div>
            </div>
          {/each}
          <Button
            type="button"
            color="neutral"
            onclick={() => (form.galleryItems = [...form.galleryItems, newGalleryRow()])}
          >
            {localeCtx.t.landing.addRow}
          </Button>
        </div>
      </section>

      <section class="landing_editor-section">
        <h2 class="landing_editor-section_title">{localeCtx.t.landing.partners}</h2>
        <div class="l_stack" data-gap="3">
          {#if form.existingPartners.length}
            <div class="landing_editor-partners_list">
              {#each form.existingPartners as partner}
                <span>{partner}</span>
              {/each}
            </div>
          {/if}
          <FormField label={localeCtx.t.landing.file} name="partners" type="file">
            {#snippet input()}
              <input
                class="form_field-control"
                id="partners"
                name="partners"
                type="file"
                accept="image/*"
                multiple
                onchange={onPartnerFiles}
              />
            {/snippet}
          </FormField>
        </div>
      </section>

      <section class="landing_editor-section">
        <h2 class="landing_editor-section_title">{localeCtx.t.landing.contacts}</h2>
        <fieldset class="landing_editor-checkbox_list">
          <legend>{localeCtx.t.landing.contactManagers}</legend>
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

      <div class="landing_editor-actions">
        <Button type="submit" isLoading={saving}>
          {localeCtx.t.common.save}
        </Button>
      </div>
    </form>
  {/if}
</section>
