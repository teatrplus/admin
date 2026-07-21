<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
  import { dndzone, type DndEvent } from 'svelte-dnd-action'
  import type { SiteScope } from '@/lib/cms/scopes'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { normalizeStage, REQUEST_STAGES } from '@/lib/pocketbase/permissions'
  import { loadRequests, updateRequestStage } from '@/lib/pocketbase/requests'
  import type { RequestStage, SpaceRequestRecord } from '@/lib/pocketbase/types'
  import { pushToast } from '@/stores/toastStore.svelte'
  import './RequestsBoard.css'

  type BoardCard = SpaceRequestRecord & { localKey: string }

  let { scope }: { scope: SiteScope } = $props()

  const localeCtx = useLocale()
  const queryClient = useQueryClient()

  let columns = $state<Record<RequestStage, BoardCard[]>>({
    inquiry: [],
    confirmed: [],
    rejected: [],
    preparation: [],
    completed: [],
    cancelled: [],
  })
  let hydratedScope = $state<SiteScope | null>(null)

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

  const requestsQuery = createQuery(() => ({
    queryKey: ['requests', scope],
    queryFn: () => loadRequests(scope),
  }))

  $effect(() => {
    const currentScope = scope
    if (!requestsQuery.isSuccess || !requestsQuery.data) return
    if (hydratedScope === currentScope) return
    columns = toColumns(requestsQuery.data)
    hydratedScope = currentScope
  })

  const stageMutation = createMutation(() => ({
    mutationFn: async ({ id, stage }: { id: string; stage: RequestStage }) =>
      updateRequestStage(scope, id, stage),
  }))

  const handleConsider = (stage: RequestStage) => (event: CustomEvent<DndEvent<BoardCard>>) => {
    columns = { ...columns, [stage]: event.detail.items }
  }

  const handleFinalize = (stage: RequestStage) => async (event: CustomEvent<DndEvent<BoardCard>>) => {
    const previous = structuredClone(columns)
    columns = { ...columns, [stage]: event.detail.items }

    const updates = event.detail.items.filter((item) => normalizeStage(item.stage) !== stage)
    if (!updates.length) return

    try {
      await Promise.all(updates.map((item) => stageMutation.mutateAsync({ id: item.id, stage })))
      for (const item of updates) item.stage = stage
      columns = toColumns(
        Object.values(columns)
          .flat()
          .map(({ localKey: _localKey, ...record }) => record),
      )
      queryClient.setQueryData(['requests', scope], () =>
        Object.values(columns)
          .flat()
          .map(({ localKey: _localKey, ...record }) => record),
      )
    } catch (updateError) {
      columns = previous
      pushToast(updateError instanceof Error ? updateError.message : localeCtx.t.common.error, 'error')
    }
  }

  const stageLabel = (stage: RequestStage) => localeCtx.t.requests.stages[stage] ?? stage
</script>

<section class="requests_board">
  <header class="requests_board-toolbar">
    <div class="l_container">
      <div class="requests_board-heading">
        <p class="requests_board-eyebrow">{localeCtx.t.scopes[scope]}</p>
        <h1 class="requests_board-title">{localeCtx.t.requests.title}</h1>
      </div>
    </div>
  </header>

  <div class="l_container">
    {#if requestsQuery.isPending}
      <p class="requests_board-status">{localeCtx.t.common.loading}</p>
    {:else if requestsQuery.isError}
      <p class="requests_board-status" data-tone="error">
        {requestsQuery.error instanceof Error ? requestsQuery.error.message : localeCtx.t.common.error}
      </p>
    {:else}
      <div class="requests_board-board">
        {#each REQUEST_STAGES as stage}
          <section class="requests_board-column">
            <div class="requests_board-column_header">
              <h2 class="requests_board-column_title">{stageLabel(stage)}</h2>
              <span class="requests_board-column_count">{columns[stage].length}</span>
            </div>
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
                  <p class="requests_board-card_name">{card.clientName || '—'}</p>
                  <dl class="requests_board-card_meta">
                    <div>
                      <dt>{localeCtx.t.requests.clientPhone}</dt>
                      <dd>{card.clientPhoneNumber || '—'}</dd>
                    </div>
                    <div>
                      <dt>{localeCtx.t.requests.dateRequested}</dt>
                      <dd>{card.dateRequested || '—'}</dd>
                    </div>
                    <div>
                      <dt>{localeCtx.t.requests.manager}</dt>
                      <dd>
                        {card.expand?.manager?.name ||
                          card.expand?.manager?.email ||
                          localeCtx.t.requests.unassigned}
                      </dd>
                    </div>
                  </dl>
                </article>
              {/each}
            </div>
          </section>
        {/each}
      </div>
    {/if}
  </div>
</section>
