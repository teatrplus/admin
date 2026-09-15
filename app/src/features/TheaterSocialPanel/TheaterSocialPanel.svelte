<script lang="ts">
  import PageActions from '@/components/PageActions/PageActions.svelte'
  import VideoIcon from '~icons/mdi/play'
  import CarouselIcon from '~icons/mdi/image-multiple-outline'
  import InstagramIcon from '~icons/mdi/instagram'
  import PageHeader from '@/components/PageHeader/PageHeader.svelte'
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
  import Button from '@/components/Button/Button.svelte'
  import StatusBanner from '@/components/StatusBanner/StatusBanner.svelte'
  import { formatDateTime } from '@/lib/format'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import {
    getInstagramRefreshStatus,
    getInstagramPosts,
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

  const postsQuery = createQuery(() => ({
    queryKey: ['instagram-posts', job?.finishedAt],
    queryFn: getInstagramPosts,
  }))

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
    job?.status === 'success'
      ? 'success'
      : job?.status === 'failed'
        ? 'error'
        : job?.status === 'running'
          ? 'warning'
          : 'neutral',
  )

  const bannerMessage = $derived.by(() => {
    if (!job || job.status === 'idle') return ''
    if (job.status === 'running') {
      return localeCtx.t.theater_social_panel.running.replace('{time}', formatDateTime(job.startedAt, localeCtx.locale))
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
  <PageHeader
    title={localeCtx.t.theater_social_panel.title}
    eyebrow={localeCtx.t.nav.sections.theater}
    description={localeCtx.t.workspace.socialDescription}
  />

  <PageActions label={localeCtx.t.theater_social_panel.title}>
    <Button type="button" isLoading={startMutation.isPending || isRunning} onclick={() => startMutation.mutate()}>
      {localeCtx.t.theater_social_panel.refresh}
    </Button>
  </PageActions>

  <div class="l_stack" data-gap="6">
    <div class="theater_social_panel-body">
      <span class="theater_social_panel-icon" aria-hidden="true"><InstagramIcon width="24" height="24" /></span>
      <h2 class="theater_social_panel-section_title">Instagram</h2>
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
    </div>
    {#if postsQuery.isPending}
      <p class="theater_social_panel-copy" role="status">{localeCtx.t.theater_social_panel.loadingPosts}</p>
    {:else if postsQuery.isError}
      <StatusBanner tone="error">{localeCtx.t.theater_social_panel.postsError}</StatusBanner>
      <Button variant="outline" onclick={() => postsQuery.refetch()}>{localeCtx.t.theater_social_panel.retry}</Button>
    {:else if !postsQuery.data?.length}
      <p class="theater_social_panel-copy">{localeCtx.t.theater_social_panel.emptyPosts}</p>
    {:else}
      <ul class="theater_social_panel-grid u_reset_list" aria-label={localeCtx.t.theater_social_panel.postsLabel}>
        {#each postsQuery.data as post (post.id)}
          <li class="theater_social_panel-post">
            <a class="theater_social_panel-card" href={post.permalink} target="_blank" rel="noopener noreferrer">
              <span class="theater_social_panel-post_header">
                <InstagramIcon width="20" height="20" aria-hidden="true" />
                <span>Instagram</span>
              </span>
              <span class="theater_social_panel-frame">
                <img
                  class="theater_social_panel-image"
                  src={post.imageUrl}
                  alt={post.caption
                    ? post.caption.length > 140
                      ? `${post.caption.slice(0, 137)}…`
                      : post.caption
                    : localeCtx.t.theater_social_panel.postAlt}
                  loading="lazy"
                  decoding="async"
                  referrerpolicy="no-referrer"
                />
                {#if post.mediaType !== 'image'}
                  <span class="theater_social_panel-badge" data-variant={post.mediaType} aria-hidden="true">
                    {#if post.mediaType === 'video'}<VideoIcon width="20" height="20" />
                    {:else}<CarouselIcon width="20" height="20" />{/if}
                  </span>
                {/if}
              </span>
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</section>
