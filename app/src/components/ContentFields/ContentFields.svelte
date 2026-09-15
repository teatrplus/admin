<script lang="ts">
  import TrashIcon from '~icons/material-symbols/delete-outline'
  import Button from '@/components/Button/Button.svelte'
  import Checkbox from '@/components/Checkbox/Checkbox.svelte'
  import FormField from '@/components/FormField/FormField.svelte'
  import Select from '@/components/Select/Select.svelte'
  import GalleryImage from '@/components/GalleryImage/GalleryImage.svelte'
  import MediaDropzone from '@/components/MediaDropzone/MediaDropzone.svelte'
  import SortableList from '@/components/SortableList/SortableList.svelte'
  import ContentFields from './ContentFields.svelte'
  import { pb } from '@/lib/pocketbase/client'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import {
    blankRecord,
    contentFields,
    contentLabel,
    recordLabel,
    type ContentField,
    type ContentRecord,
  } from '@/lib/pocketbase/content'
  import './ContentFields.css'

  let {
    fields,
    record = $bindable(),
    language,
    path,
    choices,
    addFile,
    uploadUrls,
    disabled = false,
    compact = false,
  }: {
    fields: ContentField[]
    record: ContentRecord
    language: string
    path: string
    choices: Record<string, ContentRecord[]>
    addFile: (file: File) => string
    uploadUrls: Record<string, string>
    disabled?: boolean
    compact?: boolean
  } = $props()
  const locale = useLocale()
  const label = (value: string) => contentLabel(value, locale.locale)
  const tr = (en: string, ru: string) => (locale.locale === 'ru' ? ru : en)
  const localDate = (value: string) => {
    const date = new Date(value)
    return Number.isFinite(date.getTime())
      ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : ''
  }
  const mediaUrl = (filename: string) =>
    filename.startsWith('@upload:') ? uploadUrls[filename] : pb.files.getURL(record as any, filename)
  let selected = $state<Record<string, string>>({})
  const referenceLabel = (field: ContentField, id: string) => {
    const item = choices[field.collection!]?.find((item) => item.id === id)
    return item ? recordLabel(item, language, choices) : tr('Unavailable item', 'Недоступный пункт')
  }
</script>

<div class="content_fields" data-layout={compact ? 'stack' : 'grid'}>
  {#each fields.filter((field) => !field.hidden && (!field.showWhen || field.showWhen.values.includes(record[field.showWhen.field] || ''))) as field (field.name)}
    {@const name = `${path}-${field.name}`}
    <div
      class="content_fields-field"
      data-wide={field.multiline || ['owned', 'children', 'membership', 'bool'].includes(field.type) || field.many}
    >
      {#if field.type === 'owned' || field.type === 'children'}
        <div class="content_fields-group">
          <h3 class="content_fields-heading">{label(field.label)}{field.required ? ' *' : ''}</h3>
          {#if field.many && field.gallery}
            <SortableList
              items={(record[field.name] || []) as ContentRecord[]}
              label={label(field.label)}
              itemLabel={(item, index) => recordLabel(item, language, choices) || `${index + 1}`}
              layout="gallery"
              {disabled}
              onReorder={(items) => (record[field.name] = items)}
            >
              {#snippet children(item, index)}
                <div class="content_fields-photo">
                  <GalleryImage
                    src={item.image?.startsWith('@upload:')
                      ? uploadUrls[item.image]
                      : pb.files.getURL(item as any, item.image || '')}
                    {disabled}
                    onReplace={(file) => {
                      item.image = addFile(file)
                    }}
                    onDelete={() =>
                      (record[field.name] = record[field.name].filter(
                        (candidate: ContentRecord) => candidate !== item,
                      ))}
                  />
                  <details class="content_fields-caption">
                    <summary class="content_fields-summary"
                      >{tr('Caption and description', 'Подпись и описание')}</summary
                    >
                    <ContentFields
                      compact
                      fields={contentFields(field).filter((child) => child.name !== 'image')}
                      bind:record={
                        () => item,
                        (updated) => {
                          record[field.name] = record[field.name].map((current: ContentRecord) =>
                            current === item ? updated : current,
                          )
                        }
                      }
                      {language}
                      path={`${name}-${index}`}
                      {choices}
                      {addFile}
                      {uploadUrls}
                      {disabled}
                    />
                  </details>
                </div>
              {/snippet}
            </SortableList>
            <MediaDropzone
              label={tr('Add photos', 'Добавить фотографии')}
              multiple
              {disabled}
              onFiles={(files) =>
                (record[field.name] = [
                  ...(record[field.name] || []),
                  ...files.map((file) => ({ ...blankRecord(contentFields(field)), image: addFile(file) })),
                ])}
            />
          {:else if field.many}
            <SortableList
              items={(record[field.name] || []) as ContentRecord[]}
              label={label(field.label)}
              itemLabel={(item, index) => recordLabel(item, language, choices) || `${index + 1}`}
              {disabled}
              onReorder={(items) => (record[field.name] = items)}
            >
              {#snippet children(item, index)}
                <details class="content_fields-item" open={!item.id}>
                  <summary class="content_fields-summary"
                    >{recordLabel(item, language, choices) || `${label(field.label)} ${index + 1}`}</summary
                  >
                  <div class="content_fields-row">
                    <span class="content_fields-hint">{index + 1}</span>
                    <Button
                      shape="square"
                      color="danger"
                      variant="ghost"
                      size="sm"
                      aria-label={tr('Remove item', 'Удалить пункт')}
                      onclick={() =>
                        (record[field.name] = record[field.name].filter(
                          (candidate: ContentRecord) => candidate !== item,
                        ))}
                      {disabled}><TrashIcon /></Button
                    >
                  </div>
                  <ContentFields
                    fields={contentFields(field)}
                    bind:record={
                      () => item,
                      (updated) => {
                        record[field.name] = record[field.name].map((current: ContentRecord) =>
                          current === item ? updated : current,
                        )
                      }
                    }
                    {language}
                    path={`${name}-${index}`}
                    {choices}
                    {addFile}
                    {uploadUrls}
                    {disabled}
                  />
                </details>
              {/snippet}
            </SortableList>
            <Button
              variant="outline"
              {disabled}
              onclick={() => (record[field.name] = [...(record[field.name] || []), blankRecord(contentFields(field))])}
              >{field.addLabel ? label(field.addLabel) : tr('Add item', 'Добавить пункт')}</Button
            >
          {:else if record[field.name]}
            <ContentFields
              fields={contentFields(field)}
              bind:record={record[field.name]}
              {language}
              path={name}
              {choices}
              {addFile}
              {uploadUrls}
              {disabled}
            />
          {:else}
            <Button
              variant="outline"
              {disabled}
              onclick={() => (record[field.name] = blankRecord(contentFields(field)))}
              >{tr('Add content', 'Добавить содержание')}</Button
            >
          {/if}
        </div>
      {:else if field.type === 'file'}
        <div class="content_fields-group">
          <h3 class="content_fields-heading">{label(field.label)}</h3>
          {#if field.video}
            {#if record[field.name]}<video
                class="content_fields-video"
                src={mediaUrl(record[field.name])}
                controls
                preload="metadata"><track kind="captions" /></video
              >{/if}
            <FormField label={tr('Video file', 'Видеофайл')} {name}>
              {#snippet input()}<input
                  class="content_fields-file"
                  id={name}
                  type="file"
                  accept="video/mp4,video/webm"
                  {disabled}
                  onchange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    if (file) record[field.name] = addFile(file)
                    event.currentTarget.value = ''
                  }}
                />{/snippet}
            </FormField>
            {#if record[field.name]}<Button
                variant="outline"
                color="danger"
                {disabled}
                onclick={() => (record[field.name] = '')}>{tr('Remove video', 'Удалить видео')}</Button
              >{/if}
          {:else if field.many}
            <SortableList
              items={(record[field.name] || []) as string[]}
              label={label(field.label)}
              itemLabel={(_, index) => `${label(field.label)} ${index + 1}`}
              layout="gallery"
              {disabled}
              onReorder={(items) => (record[field.name] = items)}
            >
              {#snippet children(filename, index)}
                <GalleryImage
                  src={mediaUrl(filename)}
                  {disabled}
                  onDelete={() => (record[field.name] = record[field.name].filter((item: string) => item !== filename))}
                  onReplace={(file) =>
                    (record[field.name] = record[field.name].map((item: string, i: number) =>
                      i === index ? addFile(file) : item,
                    ))}
                />
              {/snippet}
            </SortableList>
            <MediaDropzone
              label={tr('Add photos', 'Добавить фотографии')}
              multiple
              {disabled}
              onFiles={(files) => (record[field.name] = [...(record[field.name] || []), ...files.map(addFile)])}
            />
          {:else}
            {#if record[field.name]}<div class="content_fields-preview">
                <GalleryImage
                  src={mediaUrl(record[field.name])}
                  {disabled}
                  canDelete={!field.required}
                  onDelete={() => (record[field.name] = '')}
                  onReplace={(file) => (record[field.name] = addFile(file))}
                />
              </div>
            {:else}<MediaDropzone
                label={tr('Choose an image', 'Выбрать изображение')}
                {disabled}
                onFiles={(files) => {
                  if (files[0]) record[field.name] = addFile(files[0])
                }}
              />{/if}
          {/if}
        </div>
      {:else if (field.type === 'relation' || field.type === 'membership') && field.many}
        <div class="content_fields-group">
          <h3 class="content_fields-heading">{label(field.label)}</h3>
          <SortableList
            items={(record[field.name] || []) as string[]}
            label={label(field.label)}
            itemLabel={(id) => referenceLabel(field, id)}
            {disabled}
            density="compact"
            onReorder={(items) => (record[field.name] = items)}
          >
            {#snippet children(id)}<div class="content_fields-row">
                <span>{referenceLabel(field, id)}</span><Button
                  shape="square"
                  variant="ghost"
                  color="danger"
                  size="sm"
                  {disabled}
                  aria-label={tr('Remove', 'Убрать')}
                  onclick={() => (record[field.name] = record[field.name].filter((value: string) => value !== id))}
                  ><TrashIcon /></Button
                >
              </div>{/snippet}
          </SortableList>
          <Select
            label={tr('Add selection', 'Добавить')}
            {name}
            bind:value={() => selected[field.name] || '', (value) => (selected[field.name] = value)}
            options={(choices[field.collection!] || [])
              .filter((item) => !(record[field.name] || []).includes(item.id))
              .map((item) => ({ value: item.id!, label: recordLabel(item, language, choices) }))}
            {disabled}
            onValueChange={(id) => {
              if (id) {
                record[field.name] = [...(record[field.name] || []), id]
                selected[field.name] = ''
              }
            }}
          />
        </div>
      {:else if field.type === 'relation' || field.type === 'select'}
        {#if field.many}
          <div class="content_fields-group">
            <h3 class="content_fields-heading">{label(field.label)}</h3>
            {#each field.options || [] as option}<Checkbox
                label={label(field.optionLabels?.[option] || option)}
                checked={(record[field.name] || []).includes(option)}
                onCheckedChange={(checked) =>
                  (record[field.name] = checked
                    ? [...(record[field.name] || []), option]
                    : record[field.name].filter((item: string) => item !== option))}
                {disabled}
              />{/each}
          </div>
        {:else}
          <Select
            label={label(field.label)}
            {name}
            bind:value={() => record[field.name] ?? '', (value) => (record[field.name] = value)}
            options={[
              { value: '', label: '—' },
              ...(field.type === 'relation'
                ? (choices[field.collection!] || []).map((item) => ({
                    value: item.id!,
                    label: recordLabel(item, language, choices),
                  }))
                : (field.options || []).map((value) => ({
                    value,
                    label: label(field.optionLabels?.[value] || value),
                  }))),
            ]}
            {disabled}
            required={field.required}
          />
        {/if}
      {:else if field.type === 'bool'}
        <Checkbox label={label(field.label)} bind:checked={record[field.name]} {disabled} />
      {:else}
        {@const key = field.type === 'localized' ? `${field.name}_${language}` : field.name}
        {#if field.type === 'date'}
          <FormField label={label(field.label)} {name} required={field.required}>
            {#snippet input()}<input
                class="content_fields-date"
                id={name}
                type="datetime-local"
                autocomplete="off"
                value={record[key] ? localDate(record[key]) : ''}
                required={field.required}
                {disabled}
                oninput={(event) =>
                  (record[key] = event.currentTarget.value ? new Date(event.currentTarget.value).toISOString() : '')}
              />{/snippet}
          </FormField>
        {:else}
          <FormField
            label={label(field.label)}
            {name}
            bind:value={() => record[key] ?? '', (value) => (record[key] = value)}
            type={field.type === 'number'
              ? 'number'
              : field.type === 'email'
                ? 'email'
                : field.type === 'url'
                  ? 'url'
                  : 'text'}
            multiline={field.multiline}
            required={field.required}
            disabled={disabled || Boolean(field.immutable && record.id)}
            hint={field.immutable && record.id
              ? tr(
                  'This address stays fixed so existing links keep working.',
                  'Адрес сохраняется, чтобы существующие ссылки продолжали работать.',
                )
              : undefined}
          />
        {/if}
      {/if}
      {#if field.hint}<p class="content_fields-hint">{label(field.hint)}</p>{/if}
    </div>
  {/each}
</div>
