<script lang="ts">
  import { onMount } from 'svelte'
  import { MediaQuery } from 'svelte/reactivity'
  import RefreshIcon from '~icons/material-symbols/refresh'
  import TrashIcon from '~icons/material-symbols/delete-outline'
  import AddIcon from '~icons/material-symbols/add'
  import Button from '@/components/Button/Button.svelte'
  import PageHeader from '@/components/PageHeader/PageHeader.svelte'
  import EditorBackLink from '@/components/EditorBackLink/EditorBackLink.svelte'
  import PageActions from '@/components/PageActions/PageActions.svelte'
  import ContentLocaleTabs from '@/components/ContentLocaleTabs/ContentLocaleTabs.svelte'
  import StatusBanner from '@/components/StatusBanner/StatusBanner.svelte'
  import SortableList from '@/components/SortableList/SortableList.svelte'
  import ContentFields from '@/components/ContentFields/ContentFields.svelte'
  import FormField from '@/components/FormField/FormField.svelte'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { useWorkspace } from '@/lib/workspace/context.svelte'
  import { pushToast } from '@/stores/toastStore.svelte'
  import { pb } from '@/lib/pocketbase/client'
  import { findTheaterPanel } from '@/lib/theater-panels'
  import {
    blankRecord,
    contentDefinitions,
    contentLabel,
    recordLabel,
    getContent,
    saveContent,
    deleteContent,
    reorderContent,
    loadContentChoices,
    type ContentItem,
    type ContentList,
    type ContentRecord,
  } from '@/lib/pocketbase/content'
  import './TheaterPagePanel.css'

  let { pageKey }: { pageKey: string } = $props()
  const panel = $derived(findTheaterPanel(pageKey)!)
  const locale = useLocale()
  const workspace = useWorkspace()
  const wide = new MediaQuery('(min-width: 64rem)')
  let pickerOpen = $state(false)
  const tr = (en: string, ru: string) => (locale.locale === 'ru' ? ru : en)
  const label = (value: string) => contentLabel(value, locale.locale)
  let active = $state('')
  let lists = $state<Record<string, ContentList>>({})
  let draft = $state<ContentItem>()
  let baseline = $state('')
  let choices = $state<Record<string, ContentRecord[]>>({})
  let loading = $state(true)
  let saving = $state(false)
  let error = $state('')
  let language = $state<'ru' | 'en' | 'uz'>('ru')
  let search = $state('')
  let uploads = $state<File[]>([])
  let uploadUrls = $state<Record<string, string>>({})
  let sorting = $state(false)
  let order = $state<ContentItem[]>([])
  let partnerOrderIds = $state<string[] | null>(null)
  const inlineOrder = $derived(panel.entries?.collection === 't_partner')
  const definition = $derived(contentDefinitions[active])
  const entryList = $derived(panel.entries ? lists[panel.entries.collection] : undefined)
  const orderedEntries = $derived(
    inlineOrder && partnerOrderIds
      ? [
          ...partnerOrderIds
            .map((id) => entryList?.items.find((item) => item.record.id === id))
            .filter((item) => item !== undefined),
          ...(entryList?.items.filter((item) => !partnerOrderIds!.includes(item.record.id!)) ?? []),
        ]
      : (entryList?.items ?? []),
  )
  const partnerOrderDirty = $derived(
    inlineOrder &&
      partnerOrderIds !== null &&
      orderedEntries.map((item) => item.record.id).join() !== entryList?.items.map((item) => item.record.id).join(),
  )
  const dirty = $derived(Boolean(draft) && JSON.stringify(draft) !== baseline)
  const orderDirty = $derived(
    partnerOrderDirty ||
      (sorting && order.map((item) => item.record.id).join() !== entryList?.items.map((item) => item.record.id).join()),
  )
  const visible = $derived(
    orderedEntries.filter((item) =>
      recordLabel(item.record, language, choices).toLocaleLowerCase().includes(search.toLocaleLowerCase()),
    ),
  )
  const title = $derived(
    active === panel.page
      ? tr('Page content', 'Содержание страницы')
      : panel.entries?.singleton
        ? label(panel.entries.label)
        : recordLabel(draft?.record || {}, language, choices) || label(panel.entries?.addLabel || panel.label),
  )
  const message = (cause: unknown) =>
    (cause as { response?: { message?: string } })?.response?.message ||
    (cause instanceof Error ? cause.message : locale.t.common.error)
  function clearUploads() {
    Object.values(uploadUrls).forEach(URL.revokeObjectURL)
    uploads = []
    uploadUrls = {}
  }
  function mayLeave(includeOrder = true) {
    return (
      !(dirty || (includeOrder && orderDirty)) ||
      window.confirm(tr('Discard unsaved changes?', 'Отменить несохранённые изменения?'))
    )
  }
  function select(collection: string, item?: ContentItem) {
    if (!mayLeave(!inlineOrder)) return
    clearUploads()
    active = collection
    sorting = false
    pickerOpen = false
    draft = item
      ? JSON.parse(JSON.stringify(item))
      : {
          record: blankRecord(contentDefinitions[collection]!.sections.flatMap((section) => section.fields)),
          revision: '',
        }
    baseline = item ? JSON.stringify(draft) : ''
    const url = new URL(window.location.href)
    url.pathname = panel.shared ? '/theater/general' : `/theater/content/${panel.key}`
    url.search = collection === panel.page ? '' : `?item=${item?.record.id || 'new'}`
    window.history.replaceState({}, '', url)
    error = ''
    workspace.scrollToSection('page-editor-start')
  }
  function addFile(file: File) {
    const key = `@upload:${uploads.length}`
    uploads = [...uploads, file]
    uploadUrls = { ...uploadUrls, [key]: URL.createObjectURL(file) }
    return key
  }
  async function load() {
    loading = true
    error = ''
    try {
      const collections = [panel.page, ...(panel.entries ? [panel.entries.collection] : [])]
      const results = await Promise.all(
        collections.map(async (collection) => ({
          collection,
          list: await getContent(collection),
          choices: await loadContentChoices(contentDefinitions[collection]!),
        })),
      )
      lists = Object.fromEntries(results.map((result) => [result.collection, result.list]))
      partnerOrderIds = null
      choices = Object.assign({}, ...results.map((result) => result.choices))
      const selectedId = new URLSearchParams(window.location.search).get('item')
      const entry = entryList?.items.find((item) => item.record.id === selectedId)
      baseline = JSON.stringify(draft)
      select(entry && panel.entries ? panel.entries.collection : panel.page, entry || lists[panel.page]?.items[0])
    } catch (cause) {
      error = message(cause)
    } finally {
      loading = false
    }
  }
  async function save(event: SubmitEvent) {
    event.preventDefault()
    if (!draft || saving || (!dirty && !partnerOrderDirty)) return
    saving = true
    error = ''
    try {
      if (dirty) {
        const saved = await saveContent(active, draft, uploads)
        baseline = JSON.stringify(draft)
        select(active, saved)
        lists[active] = await getContent(active)
        choices = { ...choices, ...(await loadContentChoices(definition!)) }
      }
      if (partnerOrderDirty && panel.entries && entryList) {
        lists[panel.entries.collection] = await reorderContent(
          panel.entries.collection,
          entryList,
          orderedEntries.map((item) => item.record.id!),
        )
        partnerOrderIds = null
        if (active === panel.entries.collection) {
          const refreshed = lists[active]?.items.find((item) => item.record.id === draft?.record.id)
          if (refreshed) {
            draft = JSON.parse(JSON.stringify(refreshed))
            baseline = JSON.stringify(draft)
          }
        }
      }
      pushToast(tr('Changes saved', 'Изменения сохранены'), 'success')
    } catch (cause) {
      error = message(cause)
    } finally {
      saving = false
    }
  }
  async function remove() {
    if (
      !draft?.record.id ||
      !window.confirm(
        tr(`Delete “${title}”? This cannot be undone.`, `Удалить «${title}»? Это действие нельзя отменить.`),
      )
    )
      return
    saving = true
    error = ''
    try {
      await deleteContent(active, draft)
      lists[active] = await getContent(active)
      baseline = JSON.stringify(draft)
      select(panel.page, lists[panel.page]?.items[0])
      pushToast(tr('Deleted', 'Удалено'), 'success')
    } catch (cause) {
      error = message(cause)
    } finally {
      saving = false
    }
  }
  async function saveOrder() {
    if (!panel.entries || !entryList) return
    saving = true
    error = ''
    try {
      lists[panel.entries.collection] = await reorderContent(
        panel.entries.collection,
        entryList,
        order.map((item) => item.record.id!),
      )
      sorting = false
      if (active === panel.entries.collection) {
        const refreshed = lists[active]?.items.find((item) => item.record.id === draft?.record.id)
        if (refreshed) select(active, refreshed)
      }
      pushToast(tr('Order saved', 'Порядок сохранён'), 'success')
    } catch (cause) {
      error = message(cause)
    } finally {
      saving = false
    }
  }
  function arrange() {
    if (!entryList || !mayLeave()) return
    const current = lists[active]?.items.find((item) => item.record.id === draft?.record.id)
    const saved = current || lists[panel.page]?.items[0]
    if (!saved) return
    clearUploads()
    draft = JSON.parse(JSON.stringify(saved))
    active = current ? active : panel.page
    baseline = JSON.stringify(draft)
    order = [...entryList.items]
    sorting = true
    pickerOpen = false
    workspace.scrollToSection('page-editor-start')
  }
  onMount(() => {
    void load()
    return clearUploads
  })
</script>

<svelte:window
  onbeforeunload={(event) => {
    if (dirty || orderDirty) {
      event.preventDefault()
      event.returnValue = ''
    }
  }}
/>
<section class="theater_page_panel" data-page={panel.key}>
  {#if !panel.shared}<EditorBackLink dirty={dirty || orderDirty} />{/if}
  <PageHeader
    title={label(panel.label)}
    eyebrow={locale.t.nav.sections.theater}
    description={label(panel.description)}
  />
  <PageActions label={label(panel.label)}>
    {#snippet leading()}<ContentLocaleTabs bind:value={language} disabled={saving || loading} />{/snippet}
    {#if panel.entries?.addLabel}<Button
        variant="outline"
        shape={wide.current ? 'rect' : 'square'}
        aria-label={label(panel.entries.addLabel)}
        title={label(panel.entries.addLabel)}
        disabled={saving || loading}
        onclick={() => select(panel.entries!.collection)}
        >{#if wide.current}{label(panel.entries.addLabel)}{:else}<AddIcon />{/if}</Button
      >{/if}
    {#if draft?.record.id && !definition?.singleton && !sorting}<Button
        variant="ghost"
        color="danger"
        shape="square"
        aria-label={tr('Delete', 'Удалить')}
        disabled={saving}
        onclick={remove}><TrashIcon /></Button
      >{/if}
    <Button
      variant="ghost"
      color="neutral"
      shape="square"
      aria-label={tr('Reload', 'Загрузить заново')}
      disabled={saving || loading}
      onclick={() => {
        if (mayLeave()) {
          baseline = JSON.stringify(draft)
          sorting = false
          void load()
        }
      }}><RefreshIcon /></Button
    >
    {#if sorting}<Button disabled={!orderDirty || saving} isLoading={saving} onclick={saveOrder}
        >{tr('Save order', 'Сохранить порядок')}</Button
      >
    {:else}<Button
        type="submit"
        form="theater-page-form"
        formnovalidate={!dirty}
        disabled={(!dirty && !partnerOrderDirty) || loading}
        isLoading={saving}>{locale.t.common.save}</Button
      >{/if}
    {#if dirty || orderDirty}<span class="theater_page_panel-muted" role="status"
        >{tr('Unsaved changes', 'Есть изменения')}</span
      >{/if}
  </PageActions>
  {#if error}<StatusBanner tone="error">{error}</StatusBanner>{/if}
  {#if loading}<p role="status">{tr('Loading…', 'Загрузка…')}</p>
  {:else if draft && definition}
    <div class="theater_page_panel-layout" id="page-editor-start">
      <aside class="theater_page_panel-sidebar">
        {#if panel.entries}
          <details
            class="theater_page_panel-picker"
            bind:open={
              () => wide.current || pickerOpen,
              (value) => {
                if (!wide.current) pickerOpen = value
              }
            }
          >
            <summary class="theater_page_panel-picker_summary"
              >{title}<span class="theater_page_panel-muted">{tr('Choose what to edit', 'Выбрать содержание')} ↓</span
              ></summary
            >
            <div class="theater_page_panel-picker_content">
              <button
                class="theater_page_panel-page u_reset_button"
                data-active={active === panel.page}
                disabled={saving}
                onclick={() => select(panel.page, lists[panel.page]?.items[0])}
                >{tr('Page content', 'Содержание страницы')}<span class="theater_page_panel-muted"
                  >{tr('Headings and introduction', 'Заголовки и вступление')}</span
                ></button
              >
              <div class="theater_page_panel-divider">
                <h2 class="theater_page_panel-label">{label(panel.entries.label)}</h2>
                <span class="theater_page_panel-muted">{entryList?.items.length || 0}</span>
              </div>
              {#if inlineOrder}<p class="theater_page_panel-muted">
                  {search
                    ? tr('Clear the search to reorder partners.', 'Очистите поиск, чтобы изменить порядок партнёров.')
                    : tr('Drag partners to reorder, then save.', 'Перетащите партнёров в нужном порядке и сохраните.')}
                </p>{/if}
              {#if !panel.entries.singleton && (entryList?.items.length || 0) > 4}<FormField
                  label={tr('Search', 'Поиск')}
                  name="page-entry-search"
                  bind:value={search}
                />{/if}
              <div class="theater_page_panel-list">
                {#snippet entry(item: ContentItem)}
                  {#if panel.entries && draft}
                    <button
                      type="button"
                      class="theater_page_panel-entry u_reset_button"
                      data-active={active === panel.entries.collection &&
                        draft.record.id === item.record.id &&
                        !sorting}
                      disabled={saving}
                      onclick={() => select(panel.entries!.collection, item)}
                    >
                      {#if panel.entries.image && item.record[panel.entries.image]}<img
                          class="theater_page_panel-thumbnail"
                          src={pb.files.getURL(item.record as any, item.record[panel.entries.image])}
                          alt=""
                          loading="lazy"
                        />{/if}
                      <span class="theater_page_panel-entry_copy"
                        ><span
                          >{panel.entries.singleton
                            ? label(panel.entries.label)
                            : recordLabel(item.record, language, choices)}</span
                        >{#if 'published' in item.record}<span
                            class="theater_page_panel-status"
                            data-published={item.record.published}
                            >{item.record.published ? tr('Published', 'Опубликовано') : tr('Draft', 'Черновик')}</span
                          >{:else if panel.entries.collection === 't_partner'}<span
                            class="theater_page_panel-status"
                            data-published={!item.record.is_hidden}
                            >{item.record.is_hidden
                              ? tr('Hidden', 'Скрыто')
                              : item.record.is_sponsor
                                ? tr('Sponsor', 'Спонсор')
                                : tr('Partner', 'Партнёр')}</span
                          >{/if}</span
                      >
                    </button>
                  {/if}
                {/snippet}
                {#if inlineOrder}
                  <SortableList
                    items={visible}
                    label={label(panel.entries.label)}
                    itemLabel={(item) => recordLabel(item.record, language, choices)}
                    disabled={saving || Boolean(search)}
                    density="compact"
                    onReorder={(items) => (partnerOrderIds = items.map((item) => item.record.id!))}
                  >
                    {#snippet children(item)}{@render entry(item)}{/snippet}
                  </SortableList>
                {:else}
                  {#each visible as item (item.record.id)}{@render entry(item)}{/each}
                {/if}
                {#if !visible.length}<p class="theater_page_panel-muted">
                    {search
                      ? tr('No matches', 'Ничего не найдено')
                      : tr(
                          'No items yet. Add the first one above.',
                          'Пока пусто. Добавьте первый пункт кнопкой сверху.',
                        )}
                  </p>{/if}
              </div>
              {#if !inlineOrder && contentDefinitions[panel.entries.collection]?.sort === 'sort_order' && (entryList?.items.length || 0) > 1}<Button
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onclick={arrange}>{tr('Arrange on website', 'Порядок на сайте')}</Button
                >{/if}
            </div>
          </details>
        {:else}
          <nav class="theater_page_panel-navigation" aria-label={tr('Page sections', 'Разделы страницы')}>
            {#each definition.sections.filter((section) => section.fields.some((field) => !field.hidden)) as section}<a
                class="theater_page_panel-jump"
                href={`#page-${section.name}`}
                onclick={(event) => {
                  event.preventDefault()
                  workspace.scrollToSection(`page-${section.name}`)
                }}>{label(section.label)}</a
              >{/each}
          </nav>
        {/if}
      </aside>
      <div class="theater_page_panel-editor">
        {#if sorting}
          <div class="theater_page_panel-section">
            <h2>{tr('Order on the website', 'Порядок на сайте')}</h2>
            <p class="theater_page_panel-muted">
              {tr(
                'Drag the handles to rearrange, then save the order.',
                'Перетащите пункты за маркер и сохраните порядок.',
              )}
            </p>
            <SortableList
              items={order}
              label={label(panel.entries!.label)}
              itemLabel={(item) => recordLabel(item.record, language, choices)}
              disabled={saving}
              onReorder={(items) => (order = items)}
              >{#snippet children(item)}<span>{recordLabel(item.record, language, choices)}</span
                >{/snippet}</SortableList
            >
            <Button
              variant="outline"
              onclick={() => {
                if (mayLeave()) sorting = false
              }}>{tr('Back to editing', 'Вернуться к редактированию')}</Button
            >
          </div>
        {:else}
          <div class="theater_page_panel-context">
            <h2 class="theater_page_panel-title">{title}</h2>
            {#if active === panel.page && panel.path}<span class="theater_page_panel-address">{panel.path}</span
              >{:else if draft.record.slug}<span class="theater_page_panel-address"
                >{panel.path}{draft.record.slug}/</span
              >{/if}
          </div>
          {#if active === 't_staff' && draft.record.profile_path === '/mikhail-doloko'}<StatusBanner
              ><a href="/theater/content/director"
                >{tr(
                  'Edit the full artistic director page: biography, awards and collection →',
                  'Полная страница художественного руководителя: биография, награды и коллекция →',
                )}</a
              ></StatusBanner
            >{/if}
          {#if panel.entries}<nav
              class="theater_page_panel-tabs"
              aria-label={tr('Editor sections', 'Разделы редактора')}
            >
              {#each definition.sections.filter( (section) => section.fields.some((field) => !field.hidden) ) as section}<a
                  class="theater_page_panel-jump"
                  href={`#page-${section.name}`}
                  onclick={(event) => {
                    event.preventDefault()
                    workspace.scrollToSection(`page-${section.name}`)
                  }}>{label(section.label)}</a
                >{/each}
            </nav>{/if}
          <form autocomplete="off" id="theater-page-form" onsubmit={save}>
            <fieldset class="theater_page_panel-fields" disabled={saving}>
              {#each definition.sections.filter( (section) => section.fields.some((field) => !field.hidden) ) as section (section.name)}
                <section id={`page-${section.name}`} class="theater_page_panel-section" data-section={section.name}>
                  <div class="theater_page_panel-section_header">
                    <h2 class="theater_page_panel-heading">{label(section.label)}</h2>
                    {#if section.description}<p class="theater_page_panel-muted">{label(section.description)}</p>{/if}
                  </div>
                  <ContentFields
                    fields={section.fields}
                    bind:record={draft.record}
                    {language}
                    path={`page-${section.name}`}
                    {choices}
                    {addFile}
                    {uploadUrls}
                    disabled={saving}
                  />
                </section>
              {/each}
            </fieldset>
          </form>
        {/if}
      </div>
    </div>
  {/if}
</section>
