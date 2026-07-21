<script lang="ts">
  import { Label } from 'bits-ui'
  import './AppSelect.css'

  export type SelectOption = {
    value: string
    label: string
  }

  let {
    label,
    name,
    value = $bindable(''),
    options,
    error,
    disabled = false,
  }: {
    label: string
    name: string
    value?: string
    options: SelectOption[]
    error?: string
    disabled?: boolean
  } = $props()
</script>

<div class="app_select">
  <Label.Root class="app_select-label" for={name}>{label}</Label.Root>
  <select
    class="app_select-control"
    id={name}
    {name}
    bind:value
    {disabled}
    data-invalid={error ? 'true' : 'false'}
  >
    <option value="">—</option>
    {#each options as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
  {#if error}
    <p class="app_select-error">{error}</p>
  {/if}
</div>
