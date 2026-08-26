import { ClientResponseError } from 'pocketbase'
import { pb } from './client'

export type InstagramJobStatus = 'idle' | 'running' | 'success' | 'failed'

export type InstagramRefreshState = {
  ok: boolean
  status: InstagramJobStatus
  count?: number
  snapshotId?: string
  error?: string
  source?: string
  startedAt?: string
  finishedAt?: string
}

export const isRefreshInProgress = (error: unknown): boolean => {
  if (error instanceof ClientResponseError) return error.status === 409
  if (error instanceof Error && error.cause instanceof ClientResponseError) {
    return error.cause.status === 409
  }
  return false
}

export const instagramRefreshErrorMessage = (error: unknown, fallback: string): string => {
  const source =
    error instanceof ClientResponseError
      ? error
      : error instanceof Error && error.cause instanceof ClientResponseError
        ? error.cause
        : error

  if (source instanceof ClientResponseError) {
    const body = source.response as { error?: unknown } | undefined
    if (typeof body?.error === 'string' && body.error) return body.error
    if (source.message) return source.message
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export const getInstagramRefreshStatus = async (): Promise<InstagramRefreshState> => {
  return await pb.send<InstagramRefreshState>('/api/instagram/refresh', { method: 'GET' })
}

export const startInstagramRefresh = async (): Promise<InstagramRefreshState> => {
  return await pb.send<InstagramRefreshState>('/api/instagram/refresh', { method: 'POST' })
}
