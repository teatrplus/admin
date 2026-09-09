<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query'
  import Button from '@/components/Button/Button.svelte'
  import FormField from '@/components/FormField/FormField.svelte'
  import MediaDropzone from '@/components/MediaDropzone/MediaDropzone.svelte'
  import StatusBanner from '@/components/StatusBanner/StatusBanner.svelte'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { pb } from '@/lib/pocketbase/client'
  import {
    contentLocales,
    getMuseumContent,
    maskFields,
    museumFields,
    museumDraft,
    museumFieldLabels,
    saveMuseumContent,
  } from '@/lib/pocketbase/masks'
  import { pushToast } from '@/stores/toastStore.svelte'
  import './TheaterMasksPanel.css'

  const localeCtx = useLocale()
  const queryClient = useQueryClient()
  const tr = (en: string, ru: string) => (localeCtx.locale === 'ru' ? ru : en)
  const label = (field: string) => museumFieldLabels[field]?.[localeCtx.locale === 'ru' ? 1 : 0] ?? field
  const query = createQuery(() => ({ queryKey: ['museum-content'], queryFn: getMuseumContent }))
  let selected = $state('')
  let language = $state<(typeof contentLocales)[number]>('ru')
  let draft = $state<Record<string, string>>({})
  let files = $state<(File | string)[]>([])
  let baseline = $state('')
  let saving = $state(false)
  let error = $state('')
  let fieldErrors = $state<Record<string, string>>({})
  const isPage = $derived(selected === 'page')
  const record = $derived(isPage ? query.data?.page : query.data?.masks.find((mask) => mask.id === selected))
  const dirty = $derived(
    Boolean(selected) &&
      (JSON.stringify(draft) !== baseline ||
        files.some((file) => file instanceof File) ||
        JSON.stringify(files) !==
          JSON.stringify(isPage ? (record?.excursion_photos ?? []) : record?.image ? [record.image] : [])),
  )
  let previews = $state<{ file: File | string; url: string }[]>([])

  $effect(() => {
    const urls = files.map((file) => ({
      file,
      url: typeof file === 'string' ? (record ? pb.files.getURL(record, file) : '') : URL.createObjectURL(file),
    }))
    previews = urls
    return () => {
      for (const item of urls) if (item.file instanceof File) URL.revokeObjectURL(item.url)
    }
  })

  function select(id: string) {
    if (saving) return
    if (dirty && !window.confirm(tr('Discard unsaved changes?', 'Отменить несохранённые изменения?'))) return
    selected = id
    const page = id === 'page'
    const item = page ? query.data?.page : query.data?.masks.find((mask) => mask.id === id)
    draft = museumDraft(item, page)
    files = page ? [...(item?.excursion_photos ?? [])] : item?.image ? [item.image] : []
    baseline = JSON.stringify(draft)
    error = ''
    fieldErrors = {}
  }

  async function save(event: SubmitEvent) {
    event.preventDefault()
    if (saving) return
    saving = true
    error = ''
    fieldErrors = {}
    try {
      if (!isPage && !files.length) throw new Error(tr('Select a mask image.', 'Выберите изображение маски.'))
      for (const [field, value] of Object.entries(draft)) {
        if (field === 'slug') continue
        if (!String(value).trim()) fieldErrors[field] = tr('Required', 'Обязательное поле')
      }
      if (Object.keys(fieldErrors).length)
        throw new Error(
          tr(
            'Complete the required fields in all three languages.',
            'Заполните обязательные поля на всех трёх языках.',
          ),
        )
      if (isPage) {
        for (const key of ['museum_button_url', 'excursion_button_url']) {
          const url = new URL(draft[key]!.replaceAll('{locale}', 'ru'))
          if (!['https:', 'http:'].includes(url.protocol))
            throw new Error(tr('Links must use HTTP(S).', 'Ссылки должны использовать HTTP(S).'))
        }
      }
      const saved = await saveMuseumContent(record, isPage, draft, files)
      // Keep the saved result even if a subsequent refresh fails.
      queryClient.setQueryData(
        ['museum-content'],
        (previous: Awaited<ReturnType<typeof getMuseumContent>> | undefined) => {
          if (!previous) return previous
          return isPage
            ? { ...previous, page: saved }
            : {
                ...previous,
                masks: [...previous.masks.filter((mask) => mask.id !== saved.id), saved].sort(
                  (a, b) => a.sort_order - b.sort_order || a.slug.localeCompare(b.slug),
                ),
              }
        },
      )
      selected = isPage ? 'page' : saved.id
      draft = museumDraft(saved, isPage)
      files = isPage ? [...(saved.excursion_photos ?? [])] : [saved.image]
      baseline = JSON.stringify(draft)
      pushToast(
        tr('Saved. Rebuild the website to publish changes.', 'Сохранено. Пересоберите сайт для публикации изменений.'),
        'success',
      )
    } catch (cause) {
      error = cause instanceof Error ? cause.message : localeCtx.t.common.error
      const details = (cause as { response?: { data?: Record<string, { message?: string }> } })?.response?.data
      if (details) for (const [key, value] of Object.entries(details)) fieldErrors[key] = value.message ?? error
    } finally {
      saving = false
    }
  }

  function move(index: number, offset: number) {
    const next = [...files]
    ;[next[index], next[index + offset]] = [next[index + offset]!, next[index]!]
    files = next
  }
</script>

<svelte:window
  onbeforeunload={(event) => {
    if (dirty) {
      event.preventDefault()
      event.returnValue = ''
    }
  }}
/>

<section class="theater_masks_panel">
  <header class="theater_masks_panel-header">
    <p class="theater_masks_panel-eyebrow">{localeCtx.t.nav.sections.theater}</p>
    <h1 class="theater_masks_panel-title">{localeCtx.t.nav.masks}</h1>
  </header>
  {#if query.isPending}
    <p role="status">{tr('Loading…', 'Загрузка…')}</p>
  {:else if query.isError}
    <StatusBanner tone="error"
      >{tr('Could not load museum content.', 'Не удалось загрузить содержимое музея.')}</StatusBanner
    >
    <Button onclick={() => query.refetch()}>{tr('Retry', 'Повторить')}</Button>
  {:else}
    <div class="theater_masks_panel-layout">
      <nav class="theater_masks_panel-list" aria-label={tr('Museum content', 'Содержимое музея')}>
        <Button variant={isPage ? 'solid' : 'outline'} disabled={saving} onclick={() => select('page')}
          >{tr('Museum page', 'Страница музея')}</Button
        >
        {#each query.data?.masks ?? [] as mask (mask.id)}
          <button
            class="theater_masks_panel-mask u_reset_button"
            type="button"
            aria-current={selected === mask.id ? 'true' : undefined}
            disabled={saving}
            onclick={() => select(mask.id)}
          >
            <img
              class="theater_masks_panel-thumbnail"
              src={pb.files.getURL(mask, mask.image, { thumb: '460x0' })}
              alt=""
            />
            <span>{mask[`name_${localeCtx.locale}`]}</span>
          </button>
        {/each}
        <Button variant="outline" disabled={saving} onclick={() => select('new')}
          >{tr('Add mask', 'Добавить маску')}</Button
        >
      </nav>
      {#if selected}
        <form class="theater_masks_panel-editor" onsubmit={save}>
          <div class="theater_masks_panel-actions">
            {#each contentLocales as code}
              <Button
                variant={language === code ? 'solid' : 'outline'}
                aria-pressed={language === code}
                onclick={() => (language = code)}>{code.toUpperCase()}</Button
              >
            {/each}
            <Button type="submit" isLoading={saving}>{tr('Save', 'Сохранить')}</Button>
          </div>
          {#if error}<StatusBanner tone="error">{error}</StatusBanner>{/if}
          <fieldset class="theater_masks_panel-fields" disabled={saving}>
            <legend class="theater_masks_panel-legend"
              >{isPage ? tr('Museum page', 'Страница музея') : tr('Mask', 'Маска')}</legend
            >
            {#if !isPage}
              <FormField
                label={tr('URL identifier', 'Идентификатор URL')}
                name="mask-slug"
                bind:value={draft.slug}
                hint={tr(
                  'Generated from the English name when left empty; stays fixed after creation.',
                  'Генерируется из английского названия, если не указан; после создания не меняется.',
                )}
                disabled={Boolean(record)}
                error={fieldErrors.slug}
              />
              <FormField
                label={tr('Display order', 'Порядок показа')}
                name="mask-order"
                type="number"
                bind:value={draft.sort_order}
                required
                error={fieldErrors.sort_order}
              />
            {/if}
            {#each isPage ? museumFields : maskFields as field}
              <FormField
                label={label(field)}
                name={`${field}-${language}`}
                bind:value={draft[`${field}_${language}`]}
                required
                multiline={field.includes('description') || field === 'lede'}
                error={fieldErrors[`${field}_${language}`]}
              />
            {/each}
            {#if isPage}
              {#each ['museum_button_url', 'excursion_button_url'] as field}
                <FormField
                  label={label(field)}
                  name={field}
                  bind:value={draft[field]}
                  required
                  error={fieldErrors[field]}
                />
              {/each}
              <p class="theater_masks_panel-hint">
                {tr(
                  'Templates support {id} and {name}; the ticket URL supports {locale}.',
                  'Шаблоны поддерживают {id} и {name}; ссылка на билеты — {locale}.',
                )}
              </p>
            {/if}
            <div class="theater_masks_panel-media">
              {#each previews as preview, index (preview.url)}
                <div class="theater_masks_panel-photo">
                  <img
                    class="theater_masks_panel-preview"
                    src={preview.url}
                    alt={typeof preview.file === 'string' ? preview.file : preview.file.name}
                  />
                  {#if isPage}
                    <div class="theater_masks_panel-actions">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={index === 0 || saving}
                        onclick={() => move(index, -1)}
                        aria-label={tr('Move earlier', 'Переместить раньше')}>↑</Button
                      >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={index === files.length - 1 || saving}
                        onclick={() => move(index, 1)}
                        aria-label={tr('Move later', 'Переместить позже')}>↓</Button
                      >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        onclick={() => (files = files.filter((_, i) => i !== index))}>{tr('Remove', 'Убрать')}</Button
                      >
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
            <MediaDropzone
              label={isPage
                ? tr('Add tour photos', 'Добавить фото экскурсии')
                : tr('Choose mask image', 'Выбрать изображение маски')}
              hint={tr('PNG, JPEG or WebP. Up to 10 MB per file.', 'PNG, JPEG или WebP. До 10 МБ на файл.')}
              accept="image/png,image/jpeg,image/webp"
              multiple={isPage}
              disabled={saving}
              onFiles={(added) => {
                files = isPage ? [...files, ...added] : added.slice(0, 1)
              }}
            />
            {#if fieldErrors.image || fieldErrors.excursion_photos}<StatusBanner tone="error"
                >{fieldErrors.image || fieldErrors.excursion_photos}</StatusBanner
              >{/if}
          </fieldset>
        </form>
      {:else}
        <p>
          {tr('Select a mask or the museum page to edit.', 'Выберите маску или страницу музея для редактирования.')}
        </p>
      {/if}
    </div>
  {/if}
</section>
