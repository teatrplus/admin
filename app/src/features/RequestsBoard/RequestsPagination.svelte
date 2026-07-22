<script lang="ts">
  import Button from '@/components/Button/Button.svelte'
  import { useLocale } from '@/lib/i18n/context.svelte'

  let {
    page,
    totalPages,
    disabled = false,
    onPageChange,
  }: {
    page: number
    totalPages: number
    disabled?: boolean
    onPageChange: (page: number) => void
  } = $props()

  const localeCtx = useLocale()

  const label = $derived(
    localeCtx.t.requests.pageOf
      .replace('{page}', String(page))
      .replace('{total}', String(totalPages)),
  )
</script>

<nav class="requests_pagination" aria-label={label}>
  <Button
    variant="outline"
    color="neutral"
    size="sm"
    disabled={disabled || page <= 1}
    onclick={() => onPageChange(page - 1)}
  >
    {localeCtx.t.requests.prevPage}
  </Button>
  <span class="requests_pagination-label">{label}</span>
  <Button
    variant="outline"
    color="neutral"
    size="sm"
    disabled={disabled || page >= totalPages}
    onclick={() => onPageChange(page + 1)}
  >
    {localeCtx.t.requests.nextPage}
  </Button>
</nav>
