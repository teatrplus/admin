<script lang="ts">
  import UploadIcon from '~icons/material-symbols/upload-file-outline'
  import { filterImageFiles } from '@/lib/media/images'
  import './MediaDropzone.css'

  let {
    label,
    hint,
    accept = 'image/*',
    multiple = false,
    disabled = false,
    onFiles,
  }: {
    label: string
    hint?: string
    accept?: string
    multiple?: boolean
    disabled?: boolean
    onFiles: (files: File[]) => void
  } = $props()

  let inputEl = $state<HTMLInputElement | null>(null)
  let dragging = $state(false)

  const takeFiles = (list: FileList | null) => {
    if (!list?.length || disabled) return
    const files = filterImageFiles(list)
    if (!files.length) return
    onFiles(multiple ? files : files.slice(0, 1))
  }

  const onInputChange = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement
    takeFiles(input.files)
    input.value = ''
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    dragging = false
    takeFiles(event.dataTransfer?.files ?? null)
  }
</script>

<button
  class="media_dropzone"
  type="button"
  data-dragging={dragging ? 'true' : 'false'}
  {disabled}
  onclick={() => inputEl?.click()}
  ondragenter={(event) => {
    event.preventDefault()
    dragging = true
  }}
  ondragover={(event) => {
    event.preventDefault()
    dragging = true
  }}
  ondragleave={() => {
    dragging = false
  }}
  ondrop={onDrop}
>
  <span class="media_dropzone-icon" aria-hidden="true">
    <UploadIcon width="22" height="22" />
  </span>
  <span class="media_dropzone-label">{label}</span>
  {#if hint}
    <span class="media_dropzone-hint">{hint}</span>
  {/if}
</button>

<input
  bind:this={inputEl}
  class="u_sr_only"
  type="file"
  {accept}
  {multiple}
  {disabled}
  onchange={onInputChange}
/>
