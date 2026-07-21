<script lang="ts">
  import FormField from '@/components/FormField/FormField.svelte'
  import type { ContentLocale } from '@/lib/pocketbase/landing'

  let {
    locale,
    label,
    nameBase,
    ru = $bindable(''),
    en = $bindable(''),
    uz = $bindable(''),
    errorRu,
    errorEn,
    errorUz,
    multiline = false,
    required = false,
  }: {
    locale: ContentLocale
    label: string
    nameBase: string
    ru?: string
    en?: string
    uz?: string
    errorRu?: string
    errorEn?: string
    errorUz?: string
    multiline?: boolean
    required?: boolean
  } = $props()
</script>

{#if locale === 'ru'}
  <FormField
    label={label}
    name={`${nameBase}-ru`}
    bind:value={ru}
    error={errorRu}
    {multiline}
    {required}
  />
{:else if locale === 'en'}
  <FormField
    label={label}
    name={`${nameBase}-en`}
    bind:value={en}
    error={errorEn}
    {multiline}
    {required}
  />
{:else}
  <FormField
    label={label}
    name={`${nameBase}-uz`}
    bind:value={uz}
    error={errorUz}
    {multiline}
    {required}
  />
{/if}
