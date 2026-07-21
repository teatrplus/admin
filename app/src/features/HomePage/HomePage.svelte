<script lang="ts">
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { getCurrentUser } from '@/lib/pocketbase/auth'
  import './HomePage.css'
  import RawSvg from '@/components/RawSvg/RawSvg.svelte'
  import schemeRaw from './assets/scheme.svg?raw'

  const localeCtx = useLocale()
  const user = $derived(getCurrentUser())
  const displayName = $derived(user?.name?.trim() || user?.email || '—')
  const greeting = $derived(localeCtx.t.home.greeting.replace('{name}', displayName))
</script>

<section class="home_page">
  <div class="home_page-copy">
    <h1 class="home_page-title">{greeting}</h1>
    <p class="home_page-body">{localeCtx.t.home.body}</p>
  </div>

  <span class="home_page-deco" aria-hidden="true">
    <RawSvg content={schemeRaw} />
  </span>
</section>
