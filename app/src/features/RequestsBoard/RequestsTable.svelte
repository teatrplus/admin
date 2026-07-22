<script lang="ts">
  import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
  import { DropdownMenu } from 'bits-ui'
  import ArchiveIcon from '~icons/material-symbols/archive-outline'
  import MoreVertIcon from '~icons/material-symbols/more-vert'
  import UnarchiveIcon from '~icons/material-symbols/unarchive-outline'
  import Select from '@/components/Select/Select.svelte'
  import type { SiteScope } from '@/lib/cms/scopes'
  import { toDateInputValue } from '@/lib/format'
  import { useLocale } from '@/lib/i18n/context.svelte'
  import { listManagers } from '@/lib/pocketbase/landing'
  import { normalizeStage, REQUEST_STAGES } from '@/lib/pocketbase/permissions'
  import {
    archiveRequest,
    loadRequestsPage,
    REQUESTS_PER_PAGE,
    requestsScopeQueryFilter,
    requestsTableQueryKey,
    unarchiveRequest,
    updateRequestDate,
    updateRequestManager,
    updateRequestStage,
    type RequestsPageResult,
  } from '@/lib/pocketbase/requests'
  import type { RequestStage, SpaceRequestRecord, StaffRecord } from '@/lib/pocketbase/types'
  import { pushToast } from '@/stores/toastStore.svelte'
  import RequestsPagination from './RequestsPagination.svelte'

  let { scope }: { scope: SiteScope } = $props()

  const localeCtx = useLocale()
  const queryClient = useQueryClient()

  let activePage = $state(1)
  let archivedPage = $state(1)

  const ARCHIVE_STAGES: readonly RequestStage[] = ['rejected', 'completed', 'cancelled']
  const canArchive = (stage: RequestStage) => ARCHIVE_STAGES.includes(stage)

  const activeQuery = createQuery(() => ({
    queryKey: requestsTableQueryKey(scope, 'active', activePage, REQUESTS_PER_PAGE),
    queryFn: () =>
      loadRequestsPage(scope, {
        page: activePage,
        perPage: REQUESTS_PER_PAGE,
        archived: false,
      }),
  }))

  const archivedQuery = createQuery(() => ({
    queryKey: requestsTableQueryKey(scope, 'archived', archivedPage, REQUESTS_PER_PAGE),
    queryFn: () =>
      loadRequestsPage(scope, {
        page: archivedPage,
        perPage: REQUESTS_PER_PAGE,
        archived: true,
      }),
  }))

  const managersQuery = createQuery(() => ({
    queryKey: ['managers'],
    queryFn: () => listManagers() as Promise<StaffRecord[]>,
  }))

  const managers = $derived.by(() => {
    const byId = new Map<string, StaffRecord>()
    for (const manager of managersQuery.data ?? []) byId.set(manager.id, manager)
    for (const record of [...(activeQuery.data?.items ?? []), ...(archivedQuery.data?.items ?? [])]) {
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

  const managerOptions = $derived([
    { value: '', label: localeCtx.t.requests.unassigned },
    ...managers.map((manager) => ({
      value: manager.id,
      label: managerLabel(manager),
    })),
  ])

  const stageOptions = $derived(
    REQUEST_STAGES.map((stage) => ({
      value: stage,
      label: localeCtx.t.requests.stages[stage] ?? stage,
    })),
  )

  const invalidateScope = async () => {
    await queryClient.invalidateQueries(requestsScopeQueryFilter(scope))
  }

  const patchTablePage = (
    bucket: 'active' | 'archived',
    page: number,
    updater: (current: RequestsPageResult) => RequestsPageResult,
  ) => {
    queryClient.setQueryData<RequestsPageResult>(
      requestsTableQueryKey(scope, bucket, page, REQUESTS_PER_PAGE),
      (current) => (current ? updater(current) : current),
    )
  }

  const patchRow = (id: string, patch: Partial<SpaceRequestRecord>) => {
    const apply = (current: RequestsPageResult) => ({
      ...current,
      items: current.items.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    })
    patchTablePage('active', activePage, apply)
    patchTablePage('archived', archivedPage, apply)
  }

  const dateMutation = createMutation(() => ({
    mutationFn: ({ id, dateRequested }: { id: string; dateRequested: string }) =>
      updateRequestDate(scope, id, dateRequested),
    onMutate: async ({ id, dateRequested }) => {
      await queryClient.cancelQueries(requestsScopeQueryFilter(scope))
      patchRow(id, { dateRequested })
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : localeCtx.t.common.error, 'error')
    },
    onSuccess: () => {
      pushToast(localeCtx.t.requests.dateUpdated, 'success')
    },
    onSettled: async () => {
      await invalidateScope()
    },
  }))

  const stageMutation = createMutation(() => ({
    mutationFn: ({ id, stage }: { id: string; stage: RequestStage }) =>
      updateRequestStage(scope, id, stage),
    onMutate: async ({ id, stage }) => {
      await queryClient.cancelQueries(requestsScopeQueryFilter(scope))
      patchRow(id, { stage })
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : localeCtx.t.common.error, 'error')
    },
    onSettled: async () => {
      await invalidateScope()
    },
  }))

  const managerMutation = createMutation(() => ({
    mutationFn: ({ id, managerId }: { id: string; managerId: string }) =>
      updateRequestManager(scope, id, managerId),
    onMutate: async ({ id, managerId }) => {
      await queryClient.cancelQueries(requestsScopeQueryFilter(scope))
      const manager = managerId ? findManager(managerId) : null
      patchRow(id, {
        manager: managerId,
        expand: {
          manager: manager ?? undefined,
        },
      })
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : localeCtx.t.common.error, 'error')
    },
    onSettled: async () => {
      await invalidateScope()
    },
  }))

  const archiveMutation = createMutation(() => ({
    mutationFn: (id: string) => archiveRequest(scope, id),
    onSuccess: async () => {
      pushToast(localeCtx.t.requests.archived, 'success')
      await invalidateScope()
      if ((activeQuery.data?.items.length ?? 0) <= 1 && activePage > 1) {
        activePage -= 1
      }
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : localeCtx.t.common.error, 'error')
    },
  }))

  const unarchiveMutation = createMutation(() => ({
    mutationFn: (id: string) => unarchiveRequest(scope, id),
    onSuccess: async () => {
      pushToast(localeCtx.t.requests.unarchived, 'success')
      await invalidateScope()
      if ((archivedQuery.data?.items.length ?? 0) <= 1 && archivedPage > 1) {
        archivedPage -= 1
      }
    },
    onError: (error) => {
      pushToast(error instanceof Error ? error.message : localeCtx.t.common.error, 'error')
    },
  }))

  const onDateChange = (row: SpaceRequestRecord, next: string) => {
    const current = toDateInputValue(row.dateRequested)
    if (!next || next === current) return
    dateMutation.mutate({ id: row.id, dateRequested: next })
  }

  const onStageChange = (row: SpaceRequestRecord, next: string) => {
    const stage = next as RequestStage
    if (!REQUEST_STAGES.includes(stage)) return
    if (normalizeStage(row.stage) === stage) return
    stageMutation.mutate({ id: row.id, stage })
  }

  const onManagerChange = (row: SpaceRequestRecord, managerId: string) => {
    if ((row.manager || '') === managerId) return
    managerMutation.mutate({ id: row.id, managerId })
  }

  const onArchive = (row: SpaceRequestRecord) => {
    const stage = normalizeStage(row.stage) as RequestStage
    if (!canArchive(stage)) {
      pushToast(localeCtx.t.requests.archiveBlocked, 'warning')
      return
    }
    archiveMutation.mutate(row.id)
  }

  const onUnarchive = (row: SpaceRequestRecord) => {
    unarchiveMutation.mutate(row.id)
  }
</script>

{#snippet rowMenu(row: SpaceRequestRecord, mode: 'archive' | 'unarchive')}
  {@const stage = normalizeStage(row.stage) as RequestStage}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger
      class="requests_board-menu_trigger"
      aria-label={localeCtx.t.requests.actions}
    >
      <MoreVertIcon width="18" height="18" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Portal>
      <DropdownMenu.Content class="requests_board-menu_content" sideOffset={6} align="end">
        {#if mode === 'archive'}
          <DropdownMenu.Item
            class="requests_board-menu_item"
            textValue={localeCtx.t.requests.archive}
            data-disabled={!canArchive(stage) ? 'true' : undefined}
            aria-disabled={!canArchive(stage) ? 'true' : undefined}
            onSelect={() => onArchive(row)}
          >
            <span class="requests_board-menu_item_icon" aria-hidden="true">
              <ArchiveIcon width="16" height="16" />
            </span>
            <span class="requests_board-menu_item_label">
              {localeCtx.t.requests.archive}
            </span>
          </DropdownMenu.Item>
        {:else}
          <DropdownMenu.Item
            class="requests_board-menu_item"
            textValue={localeCtx.t.requests.unarchive}
            onSelect={() => onUnarchive(row)}
          >
            <span class="requests_board-menu_item_icon" aria-hidden="true">
              <UnarchiveIcon width="16" height="16" />
            </span>
            <span class="requests_board-menu_item_label">
              {localeCtx.t.requests.unarchive}
            </span>
          </DropdownMenu.Item>
        {/if}
      </DropdownMenu.Content>
    </DropdownMenu.Portal>
  </DropdownMenu.Root>
{/snippet}

{#snippet rowControls(row: SpaceRequestRecord, mode: 'archive' | 'unarchive')}
  {@const stage = normalizeStage(row.stage) as RequestStage}
  <td>{row.clientName || '—'}</td>
  <td>{row.clientPhoneNumber || '—'}</td>
  <td>
    <input
      class="requests_table-date"
      type="date"
      value={toDateInputValue(row.dateRequested)}
      aria-label={localeCtx.t.requests.dateRequested}
      onchange={(event) => onDateChange(row, event.currentTarget.value)}
    />
  </td>
  <td>
    <Select
      class="requests_table-field"
      size="sm"
      aria-label={localeCtx.t.requests.manager}
      value={String(row.manager || '')}
      placeholder={localeCtx.t.requests.unassigned}
      options={managerOptions}
      onValueChange={(next) => onManagerChange(row, next)}
    />
  </td>
  <td>
    <Select
      class="requests_table-field"
      size="sm"
      aria-label={localeCtx.t.requests.stage}
      value={REQUEST_STAGES.includes(stage) ? stage : 'inquiry'}
      options={stageOptions}
      onValueChange={(next) => onStageChange(row, next)}
    />
  </td>
  <td class="requests_table-actions_cell">
    {@render rowMenu(row, mode)}
  </td>
{/snippet}

<div class="requests_table">
  <section class="requests_table-section">
    {#if activeQuery.isPending}
      <p class="requests_board-status">{localeCtx.t.common.loading}</p>
    {:else if activeQuery.isError}
      <p class="requests_board-status" data-tone="error">
        {activeQuery.error instanceof Error ? activeQuery.error.message : localeCtx.t.common.error}
      </p>
    {:else if !(activeQuery.data?.items.length)}
      <p class="requests_board-status">{localeCtx.t.requests.empty}</p>
    {:else}
      <div class="requests_table-scroll">
        <table class="requests_table-table">
          <thead>
            <tr>
              <th>{localeCtx.t.requests.clientName}</th>
              <th>{localeCtx.t.requests.clientPhone}</th>
              <th>{localeCtx.t.requests.dateRequested}</th>
              <th>{localeCtx.t.requests.manager}</th>
              <th>{localeCtx.t.requests.stage}</th>
              <th>
                <span class="u_sr_only">{localeCtx.t.requests.actions}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {#each activeQuery.data.items as row (row.id)}
              <tr>
                {@render rowControls(row, 'archive')}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if (activeQuery.data?.totalItems ?? 0) > 0}
        <RequestsPagination
          page={activePage}
          totalPages={activeQuery.data?.totalPages ?? 1}
          disabled={activeQuery.isFetching}
          onPageChange={(next) => {
            activePage = next
          }}
        />
      {/if}
    {/if}
  </section>

  <section class="requests_table-section" data-archived="true">
    <h2 class="requests_table-section_title">{localeCtx.t.requests.archivedSection}</h2>

    {#if archivedQuery.isPending}
      <p class="requests_board-status">{localeCtx.t.common.loading}</p>
    {:else if archivedQuery.isError}
      <p class="requests_board-status" data-tone="error">
        {archivedQuery.error instanceof Error
          ? archivedQuery.error.message
          : localeCtx.t.common.error}
      </p>
    {:else if !(archivedQuery.data?.items.length)}
      <p class="requests_board-status">{localeCtx.t.requests.emptyArchived}</p>
    {:else}
      <div class="requests_table-scroll">
        <table class="requests_table-table">
          <thead>
            <tr>
              <th>{localeCtx.t.requests.clientName}</th>
              <th>{localeCtx.t.requests.clientPhone}</th>
              <th>{localeCtx.t.requests.dateRequested}</th>
              <th>{localeCtx.t.requests.manager}</th>
              <th>{localeCtx.t.requests.stage}</th>
              <th>
                <span class="u_sr_only">{localeCtx.t.requests.actions}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {#each archivedQuery.data.items as row (row.id)}
              <tr data-archived="true">
                {@render rowControls(row, 'unarchive')}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if (archivedQuery.data?.totalItems ?? 0) > 0}
        <RequestsPagination
          page={archivedPage}
          totalPages={archivedQuery.data?.totalPages ?? 1}
          disabled={archivedQuery.isFetching}
          onPageChange={(next) => {
            archivedPage = next
          }}
        />
      {/if}
    {/if}
  </section>
</div>
