<script lang="ts">
  import EditIcon from '~icons/material-symbols/edit-outline'
  import TrashIcon from '~icons/material-symbols/delete-outline'
  import Button from '@/components/Button/Button.svelte'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import './GalleryImage.css'

  let {
    src,
    alt = '',
    placeholder = '',
    invalid = false,
    disabled = false,
    canDelete = true,
    accept = 'image/*',
    onDelete,
    onReplace,
  }: {
    src?: string
    alt?: string
    placeholder?: string
    invalid?: boolean
    disabled?: boolean
    canDelete?: boolean
    accept?: string
    onDelete: () => void
    onReplace?: (file: File) => void
  } = $props()

  const locale = useLocale()
  let input = $state<HTMLInputElement>()
  const stopDrag = (event: Event) => event.stopPropagation()
</script>

<div class="gallery_image" data-invalid={invalid ? 'true' : undefined}>
  {#if src}
    <img class="gallery_image-image" {src} {alt} />
  {:else}
    <span class="gallery_image-placeholder">{placeholder}</span>
  {/if}
  <div class="gallery_image-controls">
    {#if onReplace}
      <Button
        class="gallery_image-replace"
        type="button"
        variant="outline"
        color="neutral"
        size="sm"
        shape="square"
        title={locale.t.landing.replaceImage}
        aria-label={locale.t.landing.replaceImage}
        {disabled}
        onpointerdown={stopDrag}
        onmousedown={stopDrag}
        ontouchstart={stopDrag}
        onclick={() => input?.click()}><EditIcon /></Button
      >
    {/if}
    <Button
      class="gallery_image-delete"
      type="button"
      size="sm"
      color="danger"
      shape="square"
      title={locale.t.landing.deleteImage}
      aria-label={locale.t.landing.deleteImage}
      disabled={disabled || !canDelete}
      onpointerdown={stopDrag}
      onmousedown={stopDrag}
      ontouchstart={stopDrag}
      onclick={onDelete}><TrashIcon /></Button
    >
  </div>
  {#if onReplace}
    <input
      bind:this={input}
      hidden
      type="file"
      {accept}
      {disabled}
      aria-label={locale.t.landing.replaceImage}
      onchange={(event) => {
        const file = event.currentTarget.files?.[0]
        if (file) onReplace?.(file)
        event.currentTarget.value = ''
      }}
    />
  {/if}
</div>
