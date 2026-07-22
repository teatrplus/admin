<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
  import { flip } from 'svelte/animate'
  import { dndzone, type DndEvent } from 'svelte-dnd-action'
  import { DropdownMenu, Select as SelectPrimitive } from 'bits-ui'
  import ArchiveIcon from '~icons/material-symbols/archive-outline'
  import CheckIcon from '~icons/material-symbols/check'
  import ExpandIcon from '~icons/material-symbols/expand-more'
  import MoreVertIcon from '~icons/material-symbols/more-vert'
  import type { SiteScope } from '@/lib/cms/scopes'
  import { toDateInputValue } from '@/lib/format'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { listManagers } from '@/lib/pocketbase/landing'
  import { normalizeStage, REQUEST_STAGES } from '@/lib/pocketbase/permissions'
  import {
    archiveRequest,
    indexForColumnPosition,
    loadRequests,
    patchRequestInList,
    removeRequestFromList,
    requestsBoardQueryKey,
    requestsScopeQueryFilter,
    updateRequestDate,
    updateRequestManager,
    updateRequestPlacement,
  } from '@/lib/pocketbase/requests'
  import type { RequestStage, SpaceRequestRecord, StaffRecord } from '@/lib/pocketbase/types'
  import { pushToast } from '@/stores/toastStore.svelte'
  import Avatar from './Avatar.svelte'
  import RequestsTable from './RequestsTable.svelte'
  import './RequestsBoard.css'

  type BoardCard = SpaceRequestRecord & { id: string }
  type BoardView = 'board' | 'table'

  const flipDurationMs = 180
  const ARCHIVE_STAGES: readonly RequestStage[] = ['rejected', 'completed', 'cancelled']

  let { scope }: { scope: SiteScope } = $props()

  const localeCtx = useLocale()
  const queryClient = useQueryClient()
  const queryKey = $derived(requestsBoardQueryKey(scope))

  let view = $state<BoardView>('board')
  /** Local board state for DnD; kept in sync from query when idle. */
  let columns = $state<Record<RequestStage, BoardCard[]>>(emptyColumns())
  let dragging = $state(false)

  function emptyColumns(): Record<RequestStage, BoardCard[]> {
    return {
      inquiry: [],
      confirmed: [],
      rejected: [],
      preparation: [],
      completed: [],
      cancelled: [],
    }
  }

  const sortByColumnIndex = (cards: BoardCard[]) =>
    [...cards].sort((a, b) => (b.columnIndex ?? 0) - (a.columnIndex ?? 0))

  const toColumns = (records: SpaceRequestRecord[]) => {
    const next = emptyColumns()
    for (const record of records) {
      if (record.isArchived) continue
      const stage = normalizeStage(record.stage) as RequestStage
      const bucket = REQUEST_STAGES.includes(stage) ? stage : 'inquiry'
      next[bucket] = [...next[bucket], { ...record, id: record.id }]
    }
    for (const stage of REQUEST_STAGES) {
      next[stage] = sortByColumnIndex(next[stage])
    }
    return next
  }

  const flattenColumns = (board: Record<RequestStage, BoardCard[]>) =>
    Object.values(board).flat() as SpaceRequestRecord[]

  /** Top of list = highest columnIndex. */
  const withColumnIndexes = (stage: RequestStage, items: BoardCard[]): BoardCard[] =>
    items.map((item, positionFromTop) => ({
      ...item,
      stage,
      columnIndex: indexForColumnPosition(positionFromTop, items.length),
    }))

  const requestsQuery = createQuery(() => ({
    queryKey: queryKey,
    queryFn: () => loadRequests(scope),
    enabled: view === 'board',
  }))

  const managersQuery = createQuery(() => ({
    queryKey: ['managers'],
    queryFn: () => listManagers() as Promise<StaffRecord[]>,
  }))

  // Query cache is source of truth. Resync board when not mid-drag.
  $effect(() => {
    if (view !== 'board' || dragging) return
    if (!requestsQuery.isSuccess || !requestsQuery.data) return
    columns = toColumns(requestsQuery.data)
  })

  const managers = $derived.by(() => {
    const byId = new Map<string, StaffRecord>()
    for (const manager of managersQuery.data ?? []) byId.set(manager.id, manager)
    for (const record of requestsQuery.data ?? []) {
      const assigned = record.expand?.manager
      if (assigned) byId.set(assigned.id, assigned)
    }
    return [...byId.values()].sort((a, b) =>
      (a.name || a.email).localeCompare(b.name || b.email),
    )
  })

  const managerLabel = (manager?: StaffRecord | null) =>
    manager?.name || manager?.email || localeCtx.t.requests.unassigned

  const findManager = (id: string) => managers.find((manager) => manager.id === id)

  const setCache = (list: SpaceRequestRecord[]) => {
    queryClient.setQueryData<SpaceRequestRecord[]>(queryKey, list)
  }

  const invalidateScope = async () => {
    await queryClient.invalidateQueries(requestsScopeQueryFilter(scope))
  }

  const placementMutation = createMutation(() => ({
    mutationFn: ({
      id,
      stage,
      columnIndex,
    }: {
      id: string
      stage: RequestStage
      columnIndex: number
    }) => updateRequestPlacement(scope, id, { stage, columnIndex }),
    onMutate: async ({ id, stage, columnIndex }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<SpaceRequestRecord[]>(queryKey)
      const optimistic = (previous ?? []).map((record) =>
        record.id === id ? { ...record, stage, columnIndex } : record,
      )
      setCache(optimistic)
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) setCache(context.previous)
      pushToast(error instanceof Error ? error.message : localeCtx.t.common.error, 'error')
    },
    onSuccess: (updated) => {
      setCache(patchRequestInList(queryClient.getQueryData(queryKey), updated))
    },
    onSettled: async () => {
      await invalidateScope()
    },
  }))

  const managerMutation = createMutation(() => ({
    mutationFn: ({ id, managerId }: { id: string; managerId: string }) =>
      updateRequestManager(scope, id, managerId),
    onMutate: async ({ id, managerId }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<SpaceRequestRecord[]>(queryKey)
      const manager = managerId ? findManager(managerId) : null
      const optimistic = (previous ?? []).map((record) =>
        record.id === id
          ? {
              ...record,
              manager: managerId,
              expand: {
                ...record.expand,
                manager: manager ?? undefined,
              },
            }
          : record,
      )
      setCache(optimistic)
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) setCache(context.previous)
      pushToast(error instanceof Error ? error.message : localeCtx.t.common.error, 'error')
    },
    onSuccess: (updated) => {
      setCache(patchRequestInList(queryClient.getQueryData(queryKey), updated))
    },
    onSettled: async () => {
      await invalidateScope()
    },
  }))

  const dateMutation = createMutation(() => ({
    mutationFn: ({ id, dateRequested }: { id: string; dateRequested: string }) =>
      updateRequestDate(scope, id, dateRequested),
    onMutate: async ({ id, dateRequested }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<SpaceRequestRecord[]>(queryKey)
      setCache(
        (previous ?? []).map((record) =>
          record.id === id ? { ...record, dateRequested } : record,
        ),
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) setCache(context.previous)
      pushToast(error instanceof Error ? error.message : localeCtx.t.common.error, 'error')
    },
    onSuccess: (updated) => {
      setCache(patchRequestInList(queryClient.getQueryData(queryKey), updated))
      pushToast(localeCtx.t.requests.dateUpdated, 'success')
    },
    onSettled: async () => {
      await invalidateScope()
    },
  }))

  const archiveMutation = createMutation(() => ({
    mutationFn: (id: string) => archiveRequest(scope, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<SpaceRequestRecord[]>(queryKey)
      setCache(removeRequestFromList(previous, id))
      return { previous }
    },
    onError: (error, _id, context) => {
      if (context?.previous) setCache(context.previous)
      pushToast(error instanceof Error ? error.message : localeCtx.t.common.error, 'error')
    },
    onSuccess: () => {
      pushToast(localeCtx.t.requests.archived, 'success')
    },
    onSettled: async () => {
      await invalidateScope()
    },
  }))

  const handleConsider = (stage: RequestStage) => (event: CustomEvent<DndEvent<BoardCard>>) => {
    dragging = true
    columns = { ...columns, [stage]: event.detail.items }
  }

  const handleFinalize = (stage: RequestStage) => (event: CustomEvent<DndEvent<BoardCard>>) => {
    const ordered = withColumnIndexes(stage, event.detail.items)
    columns = { ...columns, [stage]: ordered }

    const previous = queryClient.getQueryData<SpaceRequestRecord[]>(queryKey) ?? []
    const byId = new Map(previous.map((record) => [record.id, record]))

    const dirty = ordered.filter((item) => {
      const before = byId.get(item.id)
      if (!before) return true
      return (
        normalizeStage(before.stage) !== stage ||
        (before.columnIndex ?? 0) !== (item.columnIndex ?? 0)
      )
    })

    if (!dirty.length) {
      dragging = false
      return
    }

    setCache(flattenColumns(columns))

    void Promise.all(
      dirty.map((item) =>
        placementMutation.mutateAsync({
          id: item.id,
          stage,
          columnIndex: item.columnIndex ?? 0,
        }),
      ),
    ).finally(() => {
      dragging = false
    })
  }

  const canArchive = (stage: RequestStage) => ARCHIVE_STAGES.includes(stage)

  const assignManager = (card: BoardCard, managerId: string) => {
    if ((card.manager || '') === managerId) return
    managerMutation.mutate({ id: card.id, managerId })
  }

  const assignDate = (card: BoardCard, dateRequested: string) => {
    const current = toDateInputValue(card.dateRequested)
    if (!dateRequested || dateRequested === current) return
    dateMutation.mutate({ id: card.id, dateRequested })
  }

  const archiveCard = (card: BoardCard, stage: RequestStage) => {
    if (!canArchive(stage)) {
      pushToast(localeCtx.t.requests.archiveBlocked, 'warning')
      return
    }
    archiveMutation.mutate(card.id)
  }

  const stageLabel = (stage: RequestStage) => localeCtx.t.requests.stages[stage] ?? stage

  const stopCardDrag = (event: Event) => {
    event.stopPropagation()
  }
</script>

<section class="requests_board">
  <header class="requests_board-toolbar">
    <div class="l_container">
      <div class="requests_board-toolbar_row">
        <div class="requests_board-heading">
          <p class="requests_board-eyebrow">{localeCtx.t.scopes[scope]}</p>
          <h1 class="requests_board-title">{localeCtx.t.requests.title}</h1>
        </div>

        <div class="requests_board-view_switch" role="group" aria-label={localeCtx.t.requests.title}>
          <button
            type="button"
            class="requests_board-view_btn"
            data-active={view === 'board' ? 'true' : undefined}
            aria-pressed={view === 'board'}
            onclick={() => {
              view = 'board'
            }}
          >
            {localeCtx.t.requests.viewBoard}
          </button>
          <button
            type="button"
            class="requests_board-view_btn"
            data-active={view === 'table' ? 'true' : undefined}
            aria-pressed={view === 'table'}
            onclick={() => {
              view = 'table'
            }}
          >
            {localeCtx.t.requests.viewTable}
          </button>
        </div>
      </div>
    </div>
  </header>

  <div class="l_container" data-size="fluid">
    {#if view === 'table'}
      <RequestsTable {scope} />
    {:else if requestsQuery.isPending}
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
                flipDurationMs,
                dropTargetStyle: {
                  outline: '1px dashed var(--border-focus)',
                  outlineOffset: '-2px',
                },
              }}
              onconsider={handleConsider(stage)}
              onfinalize={handleFinalize(stage)}
            >
              {#each columns[stage] as card (card.id)}
                <article class="requests_board-card" animate:flip={{ duration: flipDurationMs }}>
                  <div class="requests_board-card_header">
                    <p class="requests_board-card_name">{card.clientName || '—'}</p>
                    <!-- svelte-ignore a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions -->
                    <div
                      class="requests_board-card_menu"
                      onpointerdown={stopCardDrag}
                      onmousedown={stopCardDrag}
                      ontouchstart={stopCardDrag}
                    >
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger
                          class="requests_board-menu_trigger"
                          aria-label={localeCtx.t.requests.actions}
                        >
                          <MoreVertIcon width="18" height="18" />
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            class="requests_board-menu_content"
                            sideOffset={6}
                            align="end"
                          >
                            <DropdownMenu.Item
                              class="requests_board-menu_item"
                              textValue={localeCtx.t.requests.archive}
                              data-disabled={!canArchive(stage) ? 'true' : undefined}
                              aria-disabled={!canArchive(stage) ? 'true' : undefined}
                              onSelect={() => archiveCard(card, stage)}
                            >
                              <span class="requests_board-menu_item_icon" aria-hidden="true">
                                <ArchiveIcon width="16" height="16" />
                              </span>
                              <span class="requests_board-menu_item_label">
                                {localeCtx.t.requests.archive}
                              </span>
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                  </div>

                  <dl class="requests_board-card_meta">
                    <div>
                      <dt>{localeCtx.t.requests.clientPhone}</dt>
                      <dd>{card.clientPhoneNumber || '—'}</dd>
                    </div>
                    <div>
                      <dt>{localeCtx.t.requests.dateRequested}</dt>
                      <dd>
                        <!-- svelte-ignore a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions -->
                        <div
                          class="requests_board-date_wrap"
                          onpointerdown={stopCardDrag}
                          onmousedown={stopCardDrag}
                          ontouchstart={stopCardDrag}
                        >
                          <input
                            class="requests_board-date"
                            type="date"
                            value={toDateInputValue(card.dateRequested)}
                            aria-label={localeCtx.t.requests.dateRequested}
                            onchange={(event) => assignDate(card, event.currentTarget.value)}
                          />
                        </div>
                      </dd>
                    </div>
                  </dl>

                  <!-- svelte-ignore a11y_no_static_element_interactions a11y_no_noninteractive_element_interactions -->
                  <div
                    class="requests_board-manager"
                    onpointerdown={stopCardDrag}
                    onmousedown={stopCardDrag}
                    ontouchstart={stopCardDrag}
                  >
                    <span class="requests_board-manager_label">{localeCtx.t.requests.manager}</span>
                    <SelectPrimitive.Root
                      type="single"
                      value={String(card.manager || '')}
                      items={[
                        { value: '', label: localeCtx.t.requests.unassigned },
                        ...managers.map((manager) => ({
                          value: manager.id,
                          label: managerLabel(manager),
                        })),
                      ]}
                      onValueChange={(next) => {
                        assignManager(card, String(next ?? ''))
                      }}
                    >
                      <SelectPrimitive.Trigger
                        class="requests_board-manager_trigger"
                        aria-label={localeCtx.t.requests.manager}
                      >
                        {@const assigned =
                          card.expand?.manager ||
                          (card.manager ? findManager(String(card.manager)) : null)}
                        {#if assigned}
                          <Avatar name={assigned.name} email={assigned.email} id={assigned.id} size="sm" />
                          <span class="requests_board-manager_value">{managerLabel(assigned)}</span>
                        {:else}
                          <span class="requests_board-manager_empty" aria-hidden="true">?</span>
                          <span class="requests_board-manager_value" data-placeholder="true">
                            {localeCtx.t.requests.unassigned}
                          </span>
                        {/if}
                        <span class="requests_board-manager_chevron" aria-hidden="true">
                          <ExpandIcon width="16" height="16" />
                        </span>
                      </SelectPrimitive.Trigger>

                      <SelectPrimitive.Portal>
                        <SelectPrimitive.Content
                          class="requests_board-manager_content"
                          sideOffset={6}
                          align="start"
                        >
                          <SelectPrimitive.Viewport class="requests_board-manager_viewport">
                            <SelectPrimitive.Item
                              class="requests_board-manager_item"
                              value=""
                              label={localeCtx.t.requests.unassigned}
                            >
                              {#snippet children({ selected })}
                                <span class="requests_board-manager_empty" aria-hidden="true">?</span>
                                <span class="requests_board-manager_item_label">
                                  {localeCtx.t.requests.unassigned}
                                </span>
                                {#if selected}
                                  <span class="requests_board-manager_check" aria-hidden="true">
                                    <CheckIcon width="16" height="16" />
                                  </span>
                                {/if}
                              {/snippet}
                            </SelectPrimitive.Item>
                            {#each managers as manager (manager.id)}
                              <SelectPrimitive.Item
                                class="requests_board-manager_item"
                                value={manager.id}
                                label={managerLabel(manager)}
                              >
                                {#snippet children({ selected })}
                                  <Avatar
                                    name={manager.name}
                                    email={manager.email}
                                    id={manager.id}
                                    size="sm"
                                  />
                                  <span class="requests_board-manager_item_label">
                                    {managerLabel(manager)}
                                  </span>
                                  {#if selected}
                                    <span class="requests_board-manager_check" aria-hidden="true">
                                      <CheckIcon width="16" height="16" />
                                    </span>
                                  {/if}
                                {/snippet}
                              </SelectPrimitive.Item>
                            {/each}
                          </SelectPrimitive.Viewport>
                        </SelectPrimitive.Content>
                      </SelectPrimitive.Portal>
                    </SelectPrimitive.Root>
                  </div>
                </article>
              {/each}
            </div>
          </section>
        {/each}
      </div>
    {/if}
  </div>
</section>
