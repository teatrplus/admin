<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLButtonAttributes } from 'svelte/elements'
  import './Button.css'

  type Variant = 'solid' | 'outline' | 'ghost' | 'link' | 'unstyled'
  type Color = 'primary' | 'contrast' | 'neutral' | 'danger'
  type Size = 'sm' | 'base' | 'lg'
  type Shape = 'rect' | 'square' | 'circle'

  type Props = Omit<HTMLButtonAttributes, 'children'> & {
    variant?: Variant
    color?: Color
    size?: Size
    shape?: Shape
    isLoading?: boolean
    leftIcon?: Snippet
    rightIcon?: Snippet
    children?: Snippet
  }

  let {
    class: className = '',
    children,
    variant = 'solid',
    color = 'primary',
    size = 'base',
    shape = 'rect',
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled = false,
    type = 'button',
    onclick,
    ...rest
  }: Props = $props()

  const isEffectivelyDisabled = $derived(Boolean(disabled) || isLoading)
  const isUnstyled = $derived(variant === 'unstyled')
  const isIconButton = $derived(!isUnstyled && (shape === 'square' || shape === 'circle'))

  const rootClass = $derived(
    [isUnstyled ? 'u_reset_button' : 'button u_pressable', className].filter(Boolean).join(' '),
  )

  const handleClick = (event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => {
    if (isEffectivelyDisabled) {
      event.preventDefault()
      return
    }
    onclick?.(event)
  }
</script>

<button
  {...rest}
  {type}
  class={rootClass}
  aria-disabled={isEffectivelyDisabled ? 'true' : undefined}
  data-loading={!isUnstyled && isLoading ? 'true' : undefined}
  data-shape={isUnstyled ? undefined : shape}
  data-size={isUnstyled ? undefined : size}
  data-variant={isUnstyled ? undefined : variant}
  data-color={isUnstyled ? undefined : color}
  onclick={handleClick}
>
  {#if isIconButton}
    {#if isLoading}
      <span class="g_spinner" aria-hidden="true"></span>
    {:else}
      <span class="button-icon_slot" data-solo="true">
        {@render children?.()}
      </span>
    {/if}
  {:else if isUnstyled}
    {@render children?.()}
  {:else}
    {#if isLoading}
      <span class="g_spinner" aria-hidden="true"></span>
    {/if}

    {#if leftIcon && !isLoading}
      <span class="button-icon_slot">{@render leftIcon()}</span>
    {/if}

    <span class="button-label">{@render children?.()}</span>

    {#if rightIcon}
      <span class="button-icon_slot">{@render rightIcon()}</span>
    {/if}
  {/if}
</button>
