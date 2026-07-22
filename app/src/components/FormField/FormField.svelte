<script lang="ts">
  import { Label } from 'bits-ui'
  import type { Snippet } from 'svelte'
  import './FormField.css'

  let {
    label,
    name,
    value = $bindable(''),
    type = 'text',
    error,
    hint,
    required = false,
    multiline = false,
    disabled = false,
    oninput,
    input,
  }: {
    label: string
    name: string
    value?: string
    type?: string
    error?: string
    hint?: string
    required?: boolean
    multiline?: boolean
    disabled?: boolean
    oninput?: (event: Event & { currentTarget: HTMLInputElement }) => void
    input?: Snippet
  } = $props()
</script>

<div class="form_field">
  <Label.Root class="form_field-label" for={name}>
    {label}{#if required}<span class="form_field-required" aria-hidden="true">*</span>{/if}
  </Label.Root>
  {#if input}
    {@render input()}
  {:else if multiline}
    <textarea
      class="form_field-control form_field-textarea"
      id={name}
      {name}
      bind:value
      data-invalid={error ? 'true' : 'false'}
      {required}
      {disabled}
    ></textarea>
  {:else}
    <input
      class="form_field-control"
      id={name}
      {name}
      {type}
      bind:value
      data-invalid={error ? 'true' : 'false'}
      {required}
      {disabled}
      {oninput}
    />
  {/if}
  {#if error}
    <p class="form_field-error">{error}</p>
  {:else if hint}
    <p class="form_field-hint">{hint}</p>
  {/if}
</div>
