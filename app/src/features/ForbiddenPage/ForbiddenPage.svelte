<script lang="ts">
  import Button from '@/components/Button/Button.svelte'
  import { useLocale } from '../../lib/i18n/context.svelte'
  import { defaultRouteForUser } from '../../lib/pocketbase/permissions'
  import { navigate } from '../../lib/router'
  import './ForbiddenPage.css'

  const localeCtx = useLocale()
</script>

<section class="forbidden_page">
  <h1 class="forbidden_page-title">{localeCtx.t.common.forbiddenTitle}</h1>
  <p class="forbidden_page-body">{localeCtx.t.common.forbiddenBody}</p>
  <Button color="neutral" onclick={() => navigate(defaultRouteForUser())}>
    {localeCtx.t.common.backHome}
  </Button>
</section>
