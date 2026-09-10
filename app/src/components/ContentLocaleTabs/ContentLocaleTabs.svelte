<script lang="ts">
  import { useLocale } from '@/lib/i18n/context.svelte'
  import './ContentLocaleTabs.css'

  let { value = $bindable('ru'), disabled = false }: { value?: 'ru' | 'en' | 'uz'; disabled?: boolean } = $props()
  const localeCtx = useLocale()
  const locales = ['ru', 'en', 'uz'] as const
</script>

<div class="content_locale_tabs" role="group" aria-label={localeCtx.t.landing.contentLocale}>
  {#each locales as code}
    <button
      class="content_locale_tabs-option"
      type="button"
      aria-pressed={value === code}
      {disabled}
      onclick={() => (value = code)}
    >
      {code.toUpperCase()}
    </button>
  {/each}
</div>
