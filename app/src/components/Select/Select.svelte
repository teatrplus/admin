<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Label, Select as SelectPrimitive, useId } from 'bits-ui'
  import CheckIcon from '~icons/material-symbols/check'
  import ExpandIcon from '~icons/material-symbols/expand-more'
  import './Select.css'

  export type SelectOption = {
    value: string
    label: string
    disabled?: boolean
  }

  let {
    label,
    name,
    value = $bindable(''),
    options,
    placeholder = '—',
    error,
    disabled = false,
    required = false,
    size = 'base',
    id = useId(),
    class: className = '',
    'aria-label': ariaLabel,
    onValueChange,
    leadingIcon,
  }: {
    label?: string
    name?: string
    value?: string
    options: SelectOption[]
    placeholder?: string
    error?: string
    disabled?: boolean
    required?: boolean
    size?: 'sm' | 'base'
    id?: string
    class?: string
    'aria-label'?: string
    onValueChange?: (value: string) => void
    leadingIcon?: Snippet
  } = $props()

  const items = $derived(options.map(({ value, label, disabled }) => ({ value, label, disabled })))
</script>

<div class={['select', className].filter(Boolean).join(' ')} data-size={size}>
  {#if label}
    <Label.Root class="select-label" for={id}>
      {label}{#if required}<span class="select-required" aria-hidden="true">*</span>{/if}
    </Label.Root>
  {/if}

  <SelectPrimitive.Root
    type="single"
    bind:value={value as never}
    {items}
    {name}
    {disabled}
    {required}
    onValueChange={(next) => {
      onValueChange?.(String(next ?? ''))
    }}
  >
    <SelectPrimitive.Trigger
      id={id}
      class="select-trigger"
      aria-label={ariaLabel ?? label}
      data-invalid={error ? 'true' : 'false'}
    >
      {#if leadingIcon}
        <span class="select-leading" aria-hidden="true">{@render leadingIcon()}</span>
      {/if}
      <SelectPrimitive.Value class="select-value" {placeholder} />
      <span class="select-chevron" aria-hidden="true">
        <ExpandIcon width="18" height="18" />
      </span>
    </SelectPrimitive.Trigger>

    <SelectPrimitive.Portal>
      <SelectPrimitive.Content class="select-content" sideOffset={6} align="start">
        <SelectPrimitive.Viewport class="select-viewport">
          {#each options as option (option.value)}
            <SelectPrimitive.Item
              class="select-item"
              value={option.value}
              label={option.label}
              disabled={option.disabled}
            >
              {#snippet children({ selected })}
                <span class="select-item_label">{option.label}</span>
                {#if selected}
                  <span class="select-item_check" aria-hidden="true">
                    <CheckIcon width="16" height="16" />
                  </span>
                {/if}
              {/snippet}
            </SelectPrimitive.Item>
          {/each}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>

  {#if error}
    <p class="select-error">{error}</p>
  {/if}
</div>
