<script lang="ts">
  import { avatarBackground, avatarInitial, avatarSeed } from '@/lib/avatar'
  import './Avatar.css'

  let {
    name,
    email,
    id,
    size = 'base',
    class: className = '',
  }: {
    name?: string | null
    email?: string | null
    id?: string | null
    size?: 'sm' | 'base'
    class?: string
  } = $props()

  const seed = $derived(avatarSeed(name, email, id))
  const initial = $derived(avatarInitial(name, email))
  const background = $derived(avatarBackground(seed))
</script>

<span
  class={['avatar', className].filter(Boolean).join(' ')}
  data-size={size}
  style:--c-avatar-bg={background}
  title={name || email || undefined}
  aria-hidden="true"
>
  {initial}
</span>
