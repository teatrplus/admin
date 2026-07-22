import { scopedCollection, type SiteScope } from '../cms/scopes'
import { pb } from './client'
import { normalizeStage } from './permissions'
import type { RequestStage, SpaceRequestRecord } from './types'

const requestExpand = 'manager'

export const REQUESTS_PER_PAGE = 20

export type RequestsPageResult = {
  items: SpaceRequestRecord[]
  page: number
  perPage: number
  totalItems: number
  totalPages: number
}

export const requestsBoardQueryKey = (scope: SiteScope) => ['requests', scope, 'board'] as const

export const requestsTableQueryKey = (
  scope: SiteScope,
  bucket: 'active' | 'archived',
  page: number,
  perPage: number,
) => ['requests', scope, 'table', bucket, page, perPage] as const

/** Invalidate board + every table page for a scope. */
export const requestsScopeQueryFilter = (scope: SiteScope) => ({
  queryKey: ['requests', scope] as const,
})

export const loadRequests = async (scope: SiteScope) => {
  const collection = scopedCollection.request(scope)
  return (await pb.collection(collection).getFullList({
    // Kanban is the active board only — archived tickets stay out of the list.
    filter: 'isArchived != true',
    // Higher columnIndex = top of column; created as stable tiebreaker.
    sort: '-columnIndex,created',
    expand: requestExpand,
  })) as SpaceRequestRecord[]
}

export const loadRequestsPage = async (
  scope: SiteScope,
  options: { page: number; perPage: number; archived: boolean },
): Promise<RequestsPageResult> => {
  const collection = scopedCollection.request(scope)
  const result = await pb.collection(collection).getList(options.page, options.perPage, {
    filter: options.archived ? 'isArchived = true' : 'isArchived != true',
    sort: options.archived ? '-updated' : '-columnIndex,created',
    expand: requestExpand,
  })

  return {
    items: result.items as SpaceRequestRecord[],
    page: result.page,
    perPage: result.perPage,
    totalItems: result.totalItems,
    totalPages: Math.max(1, result.totalPages),
  }
}

export const updateRequestPlacement = async (
  scope: SiteScope,
  id: string,
  patch: { stage: RequestStage; columnIndex: number },
) => {
  const collection = scopedCollection.request(scope)
  return (await pb.collection(collection).update(
    id,
    {
      stage: normalizeStage(patch.stage),
      columnIndex: patch.columnIndex,
    },
    { expand: requestExpand },
  )) as SpaceRequestRecord
}

/** Stage-only update for table edits (column order is owned by the board). */
export const updateRequestStage = async (scope: SiteScope, id: string, stage: RequestStage) => {
  const collection = scopedCollection.request(scope)
  return (await pb.collection(collection).update(
    id,
    { stage: normalizeStage(stage) },
    { expand: requestExpand },
  )) as SpaceRequestRecord
}

/** Clear relation with `null` — empty string does not reliably unset PocketBase relations. */
export const updateRequestManager = async (scope: SiteScope, id: string, managerId: string) => {
  const collection = scopedCollection.request(scope)
  return (await pb.collection(collection).update(
    id,
    { manager: managerId ? managerId : null },
    { expand: requestExpand },
  )) as SpaceRequestRecord
}

export const updateRequestDate = async (scope: SiteScope, id: string, dateRequested: string) => {
  const collection = scopedCollection.request(scope)
  return (await pb.collection(collection).update(
    id,
    { dateRequested },
    { expand: requestExpand },
  )) as SpaceRequestRecord
}

export const archiveRequest = async (scope: SiteScope, id: string) => {
  const collection = scopedCollection.request(scope)
  return (await pb.collection(collection).update(
    id,
    { isArchived: true },
    { expand: requestExpand },
  )) as SpaceRequestRecord
}

export const unarchiveRequest = async (scope: SiteScope, id: string) => {
  const collection = scopedCollection.request(scope)
  return (await pb.collection(collection).update(
    id,
    { isArchived: false },
    { expand: requestExpand },
  )) as SpaceRequestRecord
}

export const patchRequestInList = (
  list: SpaceRequestRecord[] | undefined,
  updated: SpaceRequestRecord,
) => (list ?? []).map((record) => (record.id === updated.id ? { ...record, ...updated } : record))

export const removeRequestFromList = (list: SpaceRequestRecord[] | undefined, id: string) =>
  (list ?? []).filter((record) => record.id !== id)

/** Visual top of a column gets the highest index. */
export const indexForColumnPosition = (positionFromTop: number, columnLength: number) =>
  Math.max(0, columnLength - 1 - positionFromTop)
