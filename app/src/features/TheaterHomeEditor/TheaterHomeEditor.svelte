<script lang="ts">
  import { onMount } from 'svelte'
  import type { RecordModel } from 'pocketbase'
  import Button from '@/components/Button/Button.svelte'
  import FormField from '@/components/FormField/FormField.svelte'
  import Select from '@/components/Select/Select.svelte'
  import MediaDropzone from '@/components/MediaDropzone/MediaDropzone.svelte'
  import StatusBanner from '@/components/StatusBanner/StatusBanner.svelte'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { pb } from '@/lib/pocketbase/client'
  import {
    blankCopy,
    getHomeContent,
    getHomeChoices,
    homeDraft,
    homeLocales,
    imageFields,
    saveHomeContent,
    type HomeContent,
    type HomeDraft,
    type HomeImageField,
  } from '@/lib/pocketbase/home'
  import { pushToast } from '@/stores/toastStore.svelte'
  import './TheaterHomeEditor.css'

  const localeCtx = useLocale()
  const tr = (en: string, ru: string) => (localeCtx.locale === 'ru' ? ru : en)
  let data = $state<HomeContent>()
  let draft = $state<HomeDraft>()
  let plays = $state<RecordModel[]>([])
  let masks = $state<RecordModel[]>([])
  let loading = $state(true)
  let saving = $state(false)
  let error = $state('')
  let baseline = $state('')
  let language = $state<(typeof homeLocales)[number]>('ru')
  let selectedPlay = $state('')
  let images = $state<Record<HomeImageField, File | string | null>>({ instagram_avatar: null, bottom_image: null })
  let previews = $state<Record<string, string>>({})
  const dirty = $derived(
    Boolean(draft) &&
      (JSON.stringify(draft) !== baseline ||
        imageFields.some((field) => images[field] instanceof File || images[field] !== (data?.page[field] || null))),
  )
  const playOptions = $derived(
    plays
      .filter((play) => !draft?.featured_plays.includes(play.id))
      .map((play) => ({ value: play.id, label: play[`title_${language}`] || play.title_ru })),
  )
  const maskOptions = $derived([
    { value: '', label: tr('No mask', 'Без маски') },
    ...masks.map((mask) => ({ value: mask.id, label: mask[`name_${language}`] || mask.name_ru })),
  ])
  const sectionLabels: Record<string, [string, string]> = {
    about_block: ['About the theater', 'О театре'],
    instagram_block: ['Instagram', 'Instagram'],
    cta_block: ['Ticket invitation', 'Приглашение в театр'],
    bottom_block: ['Quote and portrait', 'Цитата и портрет'],
  }
  const buttonFor: Record<string, string> = {
    instagram_block: 'instagram_button',
    cta_block: 'cta_button',
    bottom_block: 'bottom_button',
  }
  const label = (field: string, section: string) => {
    if (section === 'bottom_block')
      return field === 'title'
        ? tr('Quote', 'Цитата')
        : field === 'lede'
          ? tr('Author', 'Автор')
          : tr('Role', 'Должность')
    return field === 'title'
      ? tr('Title', 'Заголовок')
      : field === 'lede'
        ? tr('Introduction', 'Вступление')
        : tr('Description', 'Описание')
  }
  function accept(content: HomeContent) {
    data = content
    draft = homeDraft(content)
    baseline = JSON.stringify(draft)
    images = {
      instagram_avatar: content.page.instagram_avatar || null,
      bottom_image: content.page.bottom_image || null,
    }
  }
  async function load() {
    loading = true
    error = ''
    try {
      const [content, choices] = await Promise.all([getHomeContent(), getHomeChoices()])
      accept(content)
      plays = choices.plays
      masks = choices.masks
    } catch (cause) {
      error = cause instanceof Error ? cause.message : localeCtx.t.common.error
    } finally {
      loading = false
    }
  }
  onMount(() => {
    void load()
  })
  $effect(() => {
    const next: Record<string, string> = {}
    const urls: string[] = []
    for (const field of imageFields) {
      const file = images[field]
      if (file instanceof File) {
        next[field] = URL.createObjectURL(file)
        urls.push(next[field]!)
      } else if (file && data) next[field] = pb.files.getURL(data.page, file)
    }
    previews = next
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  })
  async function save(event: SubmitEvent) {
    event.preventDefault()
    if (!draft || saving) return
    saving = true
    error = ''
    try {
      accept(await saveHomeContent(draft, images))
      pushToast(
        tr('Saved. Rebuild the website to publish changes.', 'Сохранено. Пересоберите сайт для публикации изменений.'),
        'success',
      )
    } catch (cause) {
      error =
        (cause as { response?: { message?: string } })?.response?.message ||
        (cause instanceof Error ? cause.message : localeCtx.t.common.error)
    } finally {
      saving = false
    }
  }
  function move(kind: 'featured_plays' | 'stats', index: number, offset: number) {
    if (!draft) return
    const list = draft[kind]
    const target = index + offset
    if (target < 0 || target >= list.length) return
    ;[list[index], list[target]] = [list[target]!, list[index]!]
  }
  function reset() {
    if (
      dirty &&
      !window.confirm(tr('Discard unsaved changes and reload?', 'Отменить несохранённые изменения и загрузить заново?'))
    )
      return
    void load()
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

<section class="theater_home_editor">
  <header>
    <p class="theater_home_editor-hint">{localeCtx.t.nav.sections.theater}</p>
    <h1 class="theater_home_editor-title">{localeCtx.t.nav.homepage}</h1>
    <p class="theater_home_editor-hint">
      {tr(
        'Edit the homepage in one place. Save, then rebuild the website to publish.',
        'Редактируйте главную страницу в одном месте. Сохраните и пересоберите сайт для публикации.',
      )}
    </p>
  </header>
  {#if error}<StatusBanner tone="error">{error}</StatusBanner>{/if}
  {#if loading}<p role="status">{tr('Loading…', 'Загрузка…')}</p>
  {:else if !draft}<Button onclick={load}>{tr('Retry', 'Повторить')}</Button>
  {:else}
    <form class="theater_home_editor-form" onsubmit={save}>
      <div class="theater_home_editor-actions">
        {#each homeLocales as code}<Button
            variant={language === code ? 'solid' : 'outline'}
            aria-pressed={language === code}
            onclick={() => (language = code)}>{code.toUpperCase()}</Button
          >{/each}
        <Button type="submit" isLoading={saving} disabled={!dirty}
          >{tr('Save all changes', 'Сохранить все изменения')}</Button
        >
        <Button variant="outline" disabled={saving} onclick={reset}>{tr('Reload', 'Загрузить заново')}</Button>
        {#if dirty}<span class="theater_home_editor-hint" role="status"
            >{tr('Unsaved changes', 'Есть несохранённые изменения')}</span
          >{/if}
      </div>
      <fieldset class="theater_home_editor-fields" disabled={saving}>
        <section class="theater_home_editor-section">
          <h2 class="theater_home_editor-heading">{tr('Featured plays', 'Спектакли на главной')}</h2>
          <p class="theater_home_editor-hint">
            {tr('Up to 10 plays, shown in this order.', 'До 10 спектаклей, в указанном порядке.')}
          </p>
          {#each draft.featured_plays as id, index (id)}
            <div class="theater_home_editor-row">
              <span>{plays.find((play) => play.id === id)?.[`title_${language}`] || id}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={saving || index === 0}
                onclick={() => move('featured_plays', index, -1)}
                aria-label={tr('Move play earlier', 'Переместить спектакль выше')}>↑</Button
              >
              <Button
                variant="outline"
                size="sm"
                disabled={saving || index === draft!.featured_plays.length - 1}
                onclick={() => move('featured_plays', index, 1)}
                aria-label={tr('Move play later', 'Переместить спектакль ниже')}>↓</Button
              >
              <Button
                variant="outline"
                size="sm"
                onclick={() => (draft!.featured_plays = draft!.featured_plays.filter((value) => value !== id))}
                >{tr('Remove', 'Убрать')}</Button
              >
            </div>
          {/each}
          <Select
            label={tr('Add a play', 'Добавить спектакль')}
            name="featured-play"
            options={playOptions}
            bind:value={selectedPlay}
            disabled={saving || draft.featured_plays.length >= 10}
          />
          <Button
            variant="outline"
            disabled={saving || !selectedPlay || draft.featured_plays.length >= 10}
            onclick={() => {
              draft!.featured_plays = [...draft!.featured_plays, selectedPlay]
              selectedPlay = ''
            }}>{tr('Add play', 'Добавить спектакль')}</Button
          >
        </section>
        {#each Object.keys(sectionLabels) as section}
          <section class="theater_home_editor-section">
            <h2 class="theater_home_editor-heading">{sectionLabels[section]![localeCtx.locale === 'ru' ? 1 : 0]}</h2>
            {#each ['title', 'lede', 'description'] as field}
              <FormField
                label={label(field, section)}
                name={`${section}-${field}-${language}`}
                bind:value={draft.copies[section]![`${field}_${language}`]}
                multiline={field !== 'title'}
              />
            {/each}
            {#if section === 'about_block'}
              <Select
                label={tr('About mask', 'Маска в разделе «О театре»')}
                name="about-mask"
                options={maskOptions}
                bind:value={draft.about_mask}
                disabled={saving}
              />
              <h3>{tr('Statistics', 'Статистика')}</h3>
              {#each draft.stats as stat, index}
                <div class="theater_home_editor-stat">
                  <div class="theater_home_editor-actions">
                    <span>{tr('Statistic', 'Показатель')} {index + 1}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={index === 0}
                      onclick={() => move('stats', index, -1)}
                      aria-label={tr('Move statistic earlier', 'Переместить показатель выше')}>↑</Button
                    >
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={index === draft!.stats.length - 1}
                      onclick={() => move('stats', index, 1)}
                      aria-label={tr('Move statistic later', 'Переместить показатель ниже')}>↓</Button
                    >
                    <Button
                      variant="outline"
                      size="sm"
                      onclick={() => (draft!.stats = draft!.stats.filter((_, i) => i !== index))}
                      >{tr('Remove', 'Убрать')}</Button
                    >
                  </div>
                  <FormField
                    label={tr('Value', 'Значение')}
                    name={`stat-${index}-title-${language}`}
                    bind:value={stat[`title_${language}`]}
                  />
                  <FormField
                    label={tr('Short label', 'Краткая подпись')}
                    name={`stat-${index}-lede-${language}`}
                    bind:value={stat[`lede_${language}`]}
                  />
                  <FormField
                    label={tr('Description', 'Описание')}
                    name={`stat-${index}-description-${language}`}
                    bind:value={stat[`description_${language}`]}
                  />
                </div>
              {/each}
              <Button
                variant="outline"
                disabled={draft.stats.length >= 10}
                onclick={() => (draft!.stats = [...draft!.stats, blankCopy()])}
                >{tr('Add statistic', 'Добавить показатель')}</Button
              >
            {/if}
            {#if buttonFor[section]}
              <FormField
                label={tr('Button label', 'Текст кнопки')}
                name={`${section}-button-${language}`}
                bind:value={draft.buttons[buttonFor[section]!]![`label_${language}`]}
              />
              {#if section === 'instagram_block'}
                <FormField
                  label={tr('Instagram profile URL', 'Ссылка на профиль Instagram')}
                  name="instagram-url"
                  type="url"
                  bind:value={draft.instagram_url}
                  required
                  hint={tr(
                    'Used for the profile name, button and post refresh.',
                    'Используется для имени профиля, кнопки и обновления публикаций.',
                  )}
                />
              {:else}
                <FormField
                  label={tr('Button URL', 'Ссылка кнопки')}
                  name={`${section}-button-url`}
                  type="url"
                  bind:value={draft.buttons[buttonFor[section]!]!.url}
                />
              {/if}
            {/if}
            {#if section === 'instagram_block' || section === 'bottom_block'}
              {@const field = section === 'instagram_block' ? 'instagram_avatar' : 'bottom_image'}
              {#if previews[field]}<img
                  class="theater_home_editor-preview"
                  src={previews[field]}
                  alt={tr('Current image', 'Текущее изображение')}
                />{/if}
              <MediaDropzone
                label={section === 'instagram_block'
                  ? tr('Choose avatar', 'Выбрать аватар')
                  : tr('Choose portrait', 'Выбрать портрет')}
                hint={tr('PNG, JPEG or WebP, up to 10 MB.', 'PNG, JPEG или WebP, до 10 МБ.')}
                accept="image/png,image/jpeg,image/webp"
                disabled={saving}
                onFiles={(files) => {
                  if (files[0]) images[field] = files[0]
                }}
              />
              {#if images[field]}<Button variant="outline" onclick={() => (images[field] = null)}
                  >{tr('Remove image', 'Удалить изображение')}</Button
                >{/if}
            {/if}
          </section>
        {/each}
      </fieldset>
      <Button type="submit" isLoading={saving} disabled={!dirty}
        >{tr('Save all changes', 'Сохранить все изменения')}</Button
      >
    </form>
  {/if}
</section>
