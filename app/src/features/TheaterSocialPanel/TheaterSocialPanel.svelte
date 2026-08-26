<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
  import Button from '@/components/Button/Button.svelte'
  import StatusBanner from '@/components/StatusBanner/StatusBanner.svelte'
  import { formatDateTime } from '@/lib/format'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import {
    getInstagramRefreshStatus,
    instagramRefreshErrorMessage,
    isRefreshInProgress,
    startInstagramRefresh,
  } from '@/lib/pocketbase/instagram-api'
  import { pushToast } from '@/stores/toastStore.svelte'
  import './TheaterSocialPanel.css'

  const localeCtx = useLocale()
  const queryClient = useQueryClient()

  let pollMs = $state<number | false>(false)

  const statusQuery = createQuery(() => ({
    queryKey: ['instagram-refresh'],
    queryFn: getInstagramRefreshStatus,
    refetchInterval: pollMs,
  }))

  const job = $derived(statusQuery.data)
  const isRunning = $derived(job?.status === 'running')

  let seenRunning = $state(false)

  $effect(() => {
    pollMs = job?.status === 'running' ? 4000 : false
  })

  $effect(() => {
    const status = job?.status
    if (status === 'running') {
      seenRunning = true
      return
    }
    if (!seenRunning) return

    if (status === 'success') {
      const count = String(job?.count ?? 0)
      pushToast(localeCtx.t.theater_social_panel.success.replace('{count}', count), 'success')
      seenRunning = false
      return
    }

    if (status === 'failed') {
      pushToast(
        localeCtx.t.theater_social_panel.failed.replace('{error}', job?.error || localeCtx.t.common.error),
        'error',
      )
      seenRunning = false
    }
  })

  const startMutation = createMutation(() => ({
    mutationFn: startInstagramRefresh,
    onSuccess: async (data) => {
      queryClient.setQueryData(['instagram-refresh'], data)
      pushToast(localeCtx.t.theater_social_panel.started, 'info')
      await queryClient.invalidateQueries({ queryKey: ['instagram-refresh'] })
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: ['instagram-refresh'] })
      if (isRefreshInProgress(error)) {
        pushToast(localeCtx.t.theater_social_panel.inProgress, 'warning')
        return
      }
      pushToast(instagramRefreshErrorMessage(error, localeCtx.t.common.error), 'error')
    },
  }))

  const bannerTone = $derived(
    job?.status === 'success' ? 'success' : job?.status === 'failed' ? 'error' : job?.status === 'running' ? 'warning' : 'neutral',
  )

  const bannerMessage = $derived.by(() => {
    if (!job || job.status === 'idle') return ''
    if (job.status === 'running') {
      return localeCtx.t.theater_social_panel.running.replace(
        '{time}',
        formatDateTime(job.startedAt, localeCtx.locale),
      )
    }
    if (job.status === 'success') {
      return localeCtx.t.theater_social_panel.successAt
        .replace('{time}', formatDateTime(job.finishedAt, localeCtx.locale))
        .replace('{count}', String(job.count ?? 0))
    }
    return localeCtx.t.theater_social_panel.failed.replace('{error}', job.error || localeCtx.t.common.error)
  })
</script>

<section class="theater_social_panel">
  <header class="theater_social_panel-toolbar">
    <div class="l_container">
      <div class="theater_social_panel-heading">
        <p class="theater_social_panel-eyebrow">{localeCtx.t.nav.sections.theater}</p>
        <h1 class="theater_social_panel-title">{localeCtx.t.theater_social_panel.title}</h1>
      </div>
    </div>
  </header>

  <div class="l_container">
    <div class="theater_social_panel-body">
      <p class="theater_social_panel-copy">{localeCtx.t.theater_social_panel.body}</p>

      {#if statusQuery.isError}
        <div class="theater_social_panel-banner" aria-live="polite">
          <StatusBanner tone="error">
            {instagramRefreshErrorMessage(statusQuery.error, localeCtx.t.common.error)}
          </StatusBanner>
        </div>
      {:else if bannerMessage}
        <div class="theater_social_panel-banner" aria-live="polite">
          <StatusBanner tone={bannerTone}>
            {#if isRunning}
              <span class="theater_social_panel-status">
                <span class="g_spinner" aria-hidden="true"></span>
                <span>{bannerMessage}</span>
              </span>
            {:else}
              {bannerMessage}
            {/if}
          </StatusBanner>
        </div>
      {/if}

      <Button
        type="button"
        isLoading={startMutation.isPending || isRunning}
        onclick={() => startMutation.mutate()}
      >
        {localeCtx.t.theater_social_panel.refresh}
      </Button>
    </div>
  </div>
</section>
