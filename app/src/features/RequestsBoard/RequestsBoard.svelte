<script lang="ts">
  import { dndzone, type DndEvent } from 'svelte-dnd-action'
  import StatusBanner from '@/components/StatusBanner/StatusBanner.svelte'
  import type { SiteScope } from '../../lib/cms/scopes'
  import { useLocale } from '../../lib/i18n/context.svelte'
  import { normalizeStage, REQUEST_STAGES } from '../../lib/pocketbase/permissions'
  import { loadRequests, updateRequestStage } from '../../lib/pocketbase/requests'
  import type { RequestStage, SpaceRequestRecord } from '../../lib/pocketbase/types'
  import './RequestsBoard.css'

  type BoardCard = SpaceRequestRecord & { localKey: string }

  let { scope }: { scope: SiteScope } = $props()

  const localeCtx = useLocale()
  let columns = $state<Record<RequestStage, BoardCard[]>>({
    inquiry: [],
    confirmed: [],
    rejected: [],
    preparation: [],
    completed: [],
    cancelled: [],
  })
  let loading = $state(true)
  let error = $state('')

  const toColumns = (records: SpaceRequestRecord[]) => {
    const next: Record<RequestStage, BoardCard[]> = {
      inquiry: [],
      confirmed: [],
      rejected: [],
      preparation: [],
      completed: [],
      cancelled: [],
    }

    for (const record of records) {
      const stage = normalizeStage(record.stage) as RequestStage
      const bucket = REQUEST_STAGES.includes(stage) ? stage : 'inquiry'
      next[bucket] = [...next[bucket], { ...record, localKey: record.id }]
    }

    return next
  }

  const load = async () => {
    loading = true
    error = ''
    try {
      const records = await loadRequests(scope)
      columns = toColumns(records)
    } catch (loadError) {
      error = loadError instanceof Error ? loadError.message : localeCtx.t.common.error
    } finally {
      loading = false
    }
  }

  $effect(() => {
    scope
    void load()
  })

  const handleConsider = (stage: RequestStage) => (event: CustomEvent<DndEvent<BoardCard>>) => {
    columns = { ...columns, [stage]: event.detail.items }
  }

  const handleFinalize = (stage: RequestStage) => async (event: CustomEvent<DndEvent<BoardCard>>) => {
    const previous = structuredClone(columns)
    columns = { ...columns, [stage]: event.detail.items }

    const updates = event.detail.items.filter((item) => normalizeStage(item.stage) !== stage)
    if (!updates.length) return

    try {
      await Promise.all(updates.map((item) => updateRequestStage(scope, item.id, stage)))
      for (const item of updates) {
        item.stage = stage
      }
      columns = toColumns(
        Object.values(columns)
          .flat()
          .map(({ localKey: _localKey, ...record }) => record),
      )
    } catch (updateError) {
      columns = previous
      error = updateError instanceof Error ? updateError.message : localeCtx.t.common.error
    }
  }

  const stageLabel = (stage: RequestStage) => localeCtx.t.requests.stages[stage] ?? stage
</script>

<section class="requests_board">
  <h1 class="requests_board-title">{localeCtx.t.scopes[scope]} · {localeCtx.t.requests.title}</h1>

  {#if loading}
    <p>{localeCtx.t.common.loading}</p>
  {:else}
    {#if error}
      <StatusBanner tone="error">{error}</StatusBanner>
    {/if}

    <div class="requests_board-board">
      {#each REQUEST_STAGES as stage}
        <section class="requests_board-column">
          <h2 class="requests_board-column_title">{stageLabel(stage)}</h2>
          <div
            class="requests_board-list"
            use:dndzone={{
              items: columns[stage],
              type: 'space-requests',
              flipDurationMs: 150,
              dropTargetStyle: {},
            }}
            onconsider={handleConsider(stage)}
            onfinalize={handleFinalize(stage)}
          >
            {#each columns[stage] as card (card.localKey)}
              <article class="requests_board-card">
                <div class="requests_board-card_name">{card.clientName || '—'}</div>
                <div class="requests_board-card_meta">{card.clientPhoneNumber || '—'}</div>
                <div class="requests_board-card_meta">{card.dateRequested || '—'}</div>
                <div class="requests_board-card_meta">
                  {card.expand?.manager?.name || card.expand?.manager?.email || localeCtx.t.requests.unassigned}
                </div>
              </article>
            {/each}
          </div>
        </section>
      {/each}
    </div>
  {/if}
</section>
