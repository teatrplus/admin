<script lang="ts">
  import { useLocale } from '@/lib/i18n/context.svelte'
  import './BrandTitle.css'

  let { class: className = '' }: { class?: string } = $props()

  const localeCtx = useLocale()
</script>

<span class="brand_title {className}">
  <span class="brand_title-lead">{localeCtx.t.common.brand.beforePlus}</span>{localeCtx.t.common.brand.afterPlus}
</span>
