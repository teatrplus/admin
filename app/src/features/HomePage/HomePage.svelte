<script lang="ts">
  import MasksTheaterIcon from '~icons/fa7-solid/masks-theater'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { getCurrentUser } from '@/lib/pocketbase/auth'
  import './HomePage.css'

  const localeCtx = useLocale()
  const user = $derived(getCurrentUser())
  const displayName = $derived(user?.name?.trim() || user?.email || '—')
  const greeting = $derived(localeCtx.t.home.greeting.replace('{name}', displayName))
</script>

<section class="home_page">
  <div class="home_page-copy">
    <p class="home_page-eyebrow">{localeCtx.t.home.title}</p>
    <h1 class="home_page-title">{greeting}</h1>
    <p class="home_page-body">{localeCtx.t.home.body}</p>
  </div>

  <span class="home_page-deco" aria-hidden="true">
    <MasksTheaterIcon width="512" height="512" />
  </span>
</section>
