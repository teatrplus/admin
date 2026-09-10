<script lang="ts">
  import { onMount } from 'svelte'
  import Button from '@/components/Button/Button.svelte'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { onCmsSave } from '@/lib/pocketbase/client'
  import { canAccessLanding } from '@/lib/pocketbase/permissions'
  import {
    publication,
    publishChanges,
    refreshPublication,
    type PublishSite,
  } from '@/lib/pocketbase/publication.svelte'
  import { pushToast } from '@/stores/toastStore.svelte'
  import './PublishButton.css'

  const locale = useLocale()
  const canPublish = canAccessLanding('space') || canAccessLanding('theater')
  const pending = $derived(publication.sites.filter((site) => site.pending))
  const busy = $derived(publication.publishing || pending.some((site) => site.publishing))
  const siteNames = (sites: PublishSite[]) => sites.map((site) => locale.t.publication[site]).join(', ')

  onMount(() => {
    if (!canPublish) return
    let timer: ReturnType<typeof setTimeout>
    const refreshSoon = () => {
      clearTimeout(timer)
      timer = setTimeout(() => void refreshPublication(), 150)
    }
    const unsubscribe = onCmsSave(refreshSoon)
    const interval = setInterval(() => void refreshPublication(), 15000)
    window.addEventListener('focus', refreshSoon)
    void refreshPublication()
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
      unsubscribe()
      window.removeEventListener('focus', refreshSoon)
    }
  })

  const publish = async () => {
    try {
      const result = await publishChanges()
      if (!result) return
      if (result.accepted.length) pushToast(`${siteNames(result.accepted)}: ${locale.t.publication.started}`, 'success')
      if (result.failed.length) pushToast(`${siteNames(result.failed)}: ${locale.t.publication.failed}`, 'error')
    } catch {
      pushToast(locale.t.publication.failed, 'error')
      void refreshPublication()
    }
  }
</script>

{#if canPublish && (pending.length || publication.publishing)}
  <Button
    class="publish_button"
    size="sm"
    isLoading={busy}
    title={`${locale.t.publication.pending}: ${siteNames(pending.map((site) => site.site))}`}
    onclick={publish}>{busy ? locale.t.publication.publishing : locale.t.publication.publish}</Button
  >
{:else if canPublish && publication.error}
  <Button class="publish_button" size="sm" variant="ghost" onclick={refreshPublication}>
    {locale.t.publication.retryStatus}
  </Button>
{/if}
