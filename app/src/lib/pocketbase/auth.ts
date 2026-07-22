import type { StaffRecord, StaffRole } from './types'
import { pb } from './client'

export const normalizeRole = (role: string | undefined | null): StaffRole | null => {
  const value = role?.trim()
  if (value === 'admin' || value === 'moderator' || value === 'manager') {
    return value
  }
  return null
}

export const getCurrentUser = (): StaffRecord | null => {
  if (!pb.authStore.isValid || !pb.authStore.record) return null
  return pb.authStore.record as StaffRecord
}

export const login = async (email: string, password: string) => {
  const auth = await pb.collection('staff').authWithPassword(email, password)
  return auth.record as StaffRecord
}

export const logout = () => {
  pb.authStore.clear()
}
