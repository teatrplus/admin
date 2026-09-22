<script lang="ts">
  import GalleryImage from '@/components/GalleryImage/GalleryImage.svelte'
  import PageActions from '@/components/PageActions/PageActions.svelte'
  import PageHeader from '@/components/PageHeader/PageHeader.svelte'
  import EditorBackLink from '@/components/EditorBackLink/EditorBackLink.svelte'
  import ContentLocaleTabs from '@/components/ContentLocaleTabs/ContentLocaleTabs.svelte'
  import { createQuery, useQueryClient } from '@tanstack/svelte-query'
  import Button from '@/components/Button/Button.svelte'
  import FormField from '@/components/FormField/FormField.svelte'
  import MediaDropzone from '@/components/MediaDropzone/MediaDropzone.svelte'
  import StatusBanner from '@/components/StatusBanner/StatusBanner.svelte'
  import SortableList from '@/components/SortableList/SortableList.svelte'
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
    saveMaskOrder,
  } from '@/lib/pocketbase/masks'
  import { pushToast } from '@/stores/toastStore.svelte'
  import './TheaterMasksPanel.css'

  const localeCtx = useLocale()
  const queryClient = useQueryClient()
  const tr = (en: string, ru: string) => (localeCtx.locale === 'ru' ? ru : en)
  const label = (field: string) => museumFieldLabels[field]?.[localeCtx.locale === 'ru' ? 1 : 0] ?? field
  const query = createQuery(() => ({ queryKey: ['museum-content'], queryFn: getMuseumContent }))
  let selected = $state('')
  let orderIds = $state<string[] | null>(null)
  const orderedMasks = $derived(
    orderIds
      ? [
          ...orderIds
            .map((id) => query.data?.masks.find((mask) => mask.id === id))
            .filter((mask) => mask !== undefined),
          ...(query.data?.masks.filter((mask) => !orderIds!.includes(mask.id)) ?? []),
        ]
      : (query.data?.masks ?? []),
  )
  const orderDirty = $derived(
    orderIds !== null && orderIds.join('|') !== query.data?.masks.map((mask) => mask.id).join('|'),
  )
  let language = $state<(typeof contentLocales)[number]>('ru')
  let draft = $state<Record<string, string>>({})
  let files = $state<(File | string)[]>([])
  let baseline = $state('')
  let saving = $state(false)
  let error = $state('')
  let fieldErrors = $state<Record<string, string>>({})
  const pricingTotal = $derived(Number(draft.excursion_total_uzs))
  const pricingGroups = $derived((draft.excursion_group_sizes ?? '').split(',').map(Number))
  const pricingErrors = $derived.by(() => {
    const errors: Record<string, string> = {}
    if (
      !/^\d+$/.test(String(draft.excursion_total_uzs ?? '').trim()) ||
      pricingTotal < 1 ||
      pricingTotal > 1000000000000
    )
      errors.excursion_total_uzs = tr(
        'Enter a whole amount from 1 to 1,000,000,000,000 without separators.',
        'Введите целую сумму от 1 до 1 000 000 000 000 без разделителей.',
      )
    if (
      !/^\d+(\s*,\s*\d+)*$/.test((draft.excursion_group_sizes ?? '').trim()) ||
      pricingGroups.length > 12 ||
      new Set(pricingGroups).size !== pricingGroups.length ||
      pricingGroups.some((size) => size < 1 || size > 1000)
    )
      errors.excursion_group_sizes = tr(
        'Enter up to 12 distinct whole group sizes (1–1,000), separated by commas.',
        'Укажите через запятую до 12 разных размеров групп: целые числа от 1 до 1 000.',
      )
    return errors
  })
  const pricingRows = $derived(Object.keys(pricingErrors).length ? [] : [...pricingGroups].sort((a, b) => b - a))
  const formatPrice = (amount: number) =>
    new Intl.NumberFormat(localeCtx.locale, { maximumFractionDigits: 2 }).format(amount)
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
    if (query.data && !selected) select('page')
  })

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
    if (!page && !item)
      draft.sort_order = String(Math.max(-1, ...(query.data?.masks.map((mask) => Number(mask.sort_order)) ?? [])) + 1)
    files = page ? [...(item?.excursion_photos ?? [])] : item?.image ? [item.image] : []
    baseline = JSON.stringify(draft)
    error = ''
    fieldErrors = {}
  }

  async function save(event: SubmitEvent) {
    event.preventDefault()
    if (saving || (!dirty && !orderDirty)) return
    saving = true
    error = ''
    fieldErrors = {}
    try {
      if (dirty) {
        if (!isPage && !files.length) throw new Error(tr('Select a mask image.', 'Выберите изображение маски.'))
        for (const [field, value] of Object.entries(draft)) {
          if (field === 'slug' || (!isPage && field.startsWith('origin_'))) continue
          if (!String(value).trim()) fieldErrors[field] = tr('Required', 'Обязательное поле')
        }
        if (isPage) fieldErrors = { ...fieldErrors, ...pricingErrors }
        if (Object.keys(fieldErrors).length)
          throw new Error(
            tr(
              'Check the highlighted fields in all three languages.',
              'Проверьте выделенные поля на всех трёх языках.',
            ),
          )
        if (isPage) {
          for (const key of ['museum_button_url', 'excursion_button_url']) {
            const url = new URL(draft[key]!)
            const protocols =
              key === 'excursion_button_url' ? ['https:', 'http:', 'mailto:', 'tel:'] : ['https:', 'http:']
            if (!protocols.includes(url.protocol))
              throw new Error(
                tr(
                  'Directions must use HTTP(S); tour tickets may also use mailto: or tel:.',
                  'Маршрут должен использовать HTTP(S); билеты экскурсии также могут использовать mailto: или tel:.',
                ),
              )
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
      }
      if (orderDirty) {
        const current = queryClient.getQueryData<Awaited<ReturnType<typeof getMuseumContent>>>(['museum-content'])!
        const ids = [
          ...orderIds!.filter((id) => current.masks.some((mask) => mask.id === id)),
          ...current.masks.filter((mask) => !orderIds!.includes(mask.id)).map((mask) => mask.id),
        ]
        const masks = await saveMaskOrder(ids, current.masks)
        queryClient.setQueryData(['museum-content'], { ...current, masks })
        orderIds = null
      }
      pushToast(
        tr('Saved. Click Publish to update the site.', 'Сохранено. Нажмите «Опубликовать», чтобы обновить сайт.'),
        'success',
      )
    } catch (cause) {
      error =
        (cause as { response?: { message?: string } })?.response?.message ||
        (cause instanceof Error ? cause.message : localeCtx.t.common.error)
      const details = (cause as { response?: { data?: Record<string, { message?: string }> } })?.response?.data
      if (details) for (const [key, value] of Object.entries(details)) fieldErrors[key] = value.message ?? error
    } finally {
      saving = false
    }
  }
</script>

<svelte:window
  onbeforeunload={(event) => {
    if (dirty || orderDirty) {
      event.preventDefault()
      event.returnValue = ''
    }
  }}
/>

<section class="theater_masks_panel">
  <EditorBackLink dirty={dirty || orderDirty} />
  <PageHeader
    title={localeCtx.t.nav.masks}
    eyebrow={localeCtx.t.nav.sections.theater}
    description={localeCtx.t.workspace.masksDescription}
  />
  {#if query.isPending}
    <p role="status">{tr('Loading…', 'Загрузка…')}</p>
  {:else if query.isError}
    <StatusBanner tone="error"
      >{tr('Could not load museum content.', 'Не удалось загрузить содержимое музея.')}</StatusBanner
    >
    <Button onclick={() => query.refetch()}>{tr('Retry', 'Повторить')}</Button>
  {:else}
    <PageActions label={localeCtx.t.nav.masks}>
      {#snippet leading()}<ContentLocaleTabs bind:value={language} disabled={saving} />{/snippet}
      <Button variant="outline" disabled={saving} onclick={() => select('new')}
        >{tr('Add mask', 'Добавить маску')}</Button
      >
      <Button
        type="submit"
        form="museum-content-form"
        formnovalidate={!dirty}
        isLoading={saving}
        disabled={!dirty && !orderDirty}>{tr('Save', 'Сохранить')}</Button
      >
    </PageActions>
    {#if error}<StatusBanner tone="error">{error}</StatusBanner>{/if}
    <div class="theater_masks_panel-layout">
      <nav class="theater_masks_panel-list" aria-label={tr('Museum content', 'Содержимое музея')}>
        <h2 class="theater_masks_panel-list_heading">{localeCtx.t.workspace.museumContent}</h2>
        <p class="theater_masks_panel-hint">
          {tr('Drag masks to reorder, then save.', 'Перетащите маски в нужном порядке и сохраните.')}
        </p>
        <Button variant={isPage ? 'solid' : 'outline'} disabled={saving} onclick={() => select('page')}
          >{tr('Museum page', 'Страница музея')}</Button
        >
        <SortableList
          items={orderedMasks}
          label={tr('Mask order', 'Порядок масок')}
          itemLabel={(mask) => mask[`name_${localeCtx.locale}`] || mask.name_ru}
          disabled={saving}
          density="compact"
          onReorder={(items) => {
            orderIds = items.map((mask) => mask.id)
          }}
        >
          {#snippet children(mask)}
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
          {/snippet}
        </SortableList>
      </nav>
      {#if selected}
        <form autocomplete="off" id="museum-content-form" class="theater_masks_panel-editor" onsubmit={save}>
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
                  'Used in /museum/mask/…/. Changing it changes the page address. Leave empty on creation to generate it from the name.',
                  'Используется в /museum/mask/…/. При изменении меняется адрес страницы. При создании можно оставить пустым для генерации из названия.',
                )}
                required={Boolean(record)}
                disabled={saving}
                error={fieldErrors.slug}
              />
            {/if}
            {#each isPage ? museumFields : maskFields as field}
              <FormField
                label={label(field)}
                name={`${field}-${language}`}
                bind:value={draft[`${field}_${language}`]}
                required={field !== 'origin'}
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
                  'Use a full URL. Tour tickets also accept mailto: and tel: links. iTicket links follow the visitor’s language automatically.',
                  'Укажите полную ссылку. Для билетов экскурсии также доступны mailto: и tel:. Язык ссылок iTicket выбирается автоматически.',
                )}
              </p>
            {/if}
            {#if isPage}
              <section class="theater_masks_panel-pricing" aria-labelledby="museum-pricing-heading">
                <h3 class="theater_masks_panel-pricing_heading" id="museum-pricing-heading">
                  {tr('Tour pricing', 'Стоимость экскурсии')}
                </h3>
                <p class="theater_masks_panel-hint">
                  {tr(
                    'The total applies to every group. Per-person prices are calculated automatically. Prices are shared across all languages.',
                    'Общая стоимость одинакова для всех групп. Цена на человека рассчитывается автоматически. Цены общие для всех языков.',
                  )}
                </p>
                <FormField
                  label={label('excursion_total_uzs')}
                  name="excursion_total_uzs"
                  bind:value={draft.excursion_total_uzs}
                  hint={tr(
                    'Whole sums, without separators. Example: 6600000.',
                    'Целая сумма без разделителей. Например: 6600000.',
                  )}
                  required
                  error={fieldErrors.excursion_total_uzs}
                />
                <FormField
                  label={label('excursion_group_sizes')}
                  name="excursion_group_sizes"
                  bind:value={draft.excursion_group_sizes}
                  hint={tr(
                    'Separate sizes with commas. Example: 60, 50, 40, 30.',
                    'Разделяйте числа запятыми. Например: 60, 50, 40, 30.',
                  )}
                  required
                  error={fieldErrors.excursion_group_sizes}
                />
                {#if pricingRows.length}
                  <div class="theater_masks_panel-pricing_preview">
                    <table class="theater_masks_panel-pricing_table">
                      <caption class="theater_masks_panel-pricing_caption"
                        >{tr('Price preview · UZS', 'Предпросмотр цен · сум')}</caption
                      >
                      <thead>
                        <tr>
                          <th class="theater_masks_panel-pricing_cell" scope="col">{tr('People', 'Человек')}</th>
                          <th class="theater_masks_panel-pricing_cell" scope="col">{tr('Per person', 'Цена / чел.')}</th
                          >
                          <th class="theater_masks_panel-pricing_cell" scope="col">{tr('Total', 'Стоимость')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each pricingRows as size}
                          <tr>
                            <th class="theater_masks_panel-pricing_cell" scope="row">{size}</th>
                            <td class="theater_masks_panel-pricing_cell"
                              >{(pricingTotal * 100) % size ? '≈ ' : ''}{formatPrice(pricingTotal / size)}</td
                            >
                            <td class="theater_masks_panel-pricing_cell">{formatPrice(pricingTotal)}</td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                {/if}
              </section>
              <h3 class="theater_masks_panel-gallery_heading">{tr('Tour photos', 'Фото экскурсии')}</h3>
              <SortableList
                items={files}
                label={tr('Tour photos', 'Фото экскурсии')}
                itemLabel={(file) => (typeof file === 'string' ? file : file.name)}
                layout="gallery"
                disabled={saving}
                onReorder={(items) => (files = items)}
              >
                {#snippet children(file, index)}
                  <GalleryImage
                    src={previews.find((preview) => preview.file === file)?.url}
                    alt={typeof file === 'string' ? file : file.name}
                    disabled={saving}
                    accept="image/png,image/jpeg,image/webp"
                    onDelete={() => (files = files.filter((_, i) => i !== index))}
                    onReplace={(replacement) => (files = files.map((item, i) => (i === index ? replacement : item)))}
                  />
                {/snippet}
              </SortableList>
            {:else}
              {#each previews as preview (preview.url)}
                <img
                  class="theater_masks_panel-preview"
                  src={preview.url}
                  alt={typeof preview.file === 'string' ? preview.file : preview.file.name}
                />
              {/each}
            {/if}
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
        <p class="theater_masks_panel-empty">
          {tr('Select a mask or the museum page to edit.', 'Выберите маску или страницу музея для редактирования.')}
        </p>
      {/if}
    </div>
  {/if}
</section>
