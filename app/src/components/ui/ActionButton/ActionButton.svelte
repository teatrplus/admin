<script lang="ts">
  import type { Snippet } from 'svelte'
  import './ActionButton.css'

  type Variant = 'primary' | 'neutral' | 'danger' | 'ghost'
  type Size = 'md' | 'sm'

  let {
    type = 'button',
    variant = 'primary',
    size = 'md',
    disabled = false,
    onclick,
    children,
  }: {
    type?: 'button' | 'submit' | 'reset'
    variant?: Variant
    size?: Size
    disabled?: boolean
    onclick?: (event: MouseEvent) => void
    children: Snippet
  } = $props()
</script>

<button class="action_button" {type} data-variant={variant} data-size={size} {disabled} {onclick}>
  {@render children()}
</button>
