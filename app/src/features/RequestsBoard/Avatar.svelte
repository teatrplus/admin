<script lang="ts">
  import { avatarInitial } from '@/lib/avatar'
  import './Avatar.css'

  let {
    name,
    email,
    size = 'base',
    class: className = '',
  }: {
    name?: string | null
    email?: string | null
    id?: string | null
    size?: 'sm' | 'base'
    class?: string
  } = $props()

  const initial = $derived(avatarInitial(name, email))
</script>

<span
  class={['avatar', className].filter(Boolean).join(' ')}
  data-size={size}
  title={name || email || undefined}
  aria-hidden="true"
>
  {initial}
</span>
