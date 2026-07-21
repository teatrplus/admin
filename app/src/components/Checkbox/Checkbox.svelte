<script lang="ts">
  import { Checkbox as CheckboxPrimitive, Label, useId } from 'bits-ui'
  import CheckIcon from '~icons/material-symbols/check'
  import IndeterminateIcon from '~icons/material-symbols/check-indeterminate-small'
  import './Checkbox.css'

  let {
    label,
    name,
    value,
    checked = $bindable(false),
    indeterminate = false,
    disabled = false,
    required = false,
    id = useId(),
    class: className = '',
    onCheckedChange,
  }: {
    label: string
    name?: string
    value?: string
    checked?: boolean
    indeterminate?: boolean
    disabled?: boolean
    required?: boolean
    id?: string
    class?: string
    onCheckedChange?: (checked: boolean) => void
  } = $props()
</script>

<div class={['checkbox', className].filter(Boolean).join(' ')}>
  <CheckboxPrimitive.Root
    {id}
    class="checkbox-control u_pressable"
    bind:checked
    {indeterminate}
    {name}
    {value}
    {disabled}
    {required}
    onCheckedChange={(next) => {
      onCheckedChange?.(Boolean(next))
    }}
  >
    {#snippet children({ checked: isChecked, indeterminate: isIndeterminate })}
      {#if isIndeterminate}
        <IndeterminateIcon width="14" height="14" aria-hidden="true" />
      {:else if isChecked}
        <CheckIcon width="14" height="14" aria-hidden="true" />
      {/if}
    {/snippet}
  </CheckboxPrimitive.Root>

  <Label.Root class="checkbox-label" for={id}>{label}</Label.Root>
</div>
