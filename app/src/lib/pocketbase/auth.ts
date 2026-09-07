import { ClientResponseError } from 'pocketbase'
import type { AuthUser, StaffRecord, StaffRole, SuperuserRecord } from './types'
import { pb } from './client'

const SUPERUSERS_COLLECTION = '_superusers'

export const normalizeRole = (role: string | undefined | null): StaffRole | null => {
  const value = role?.trim()
  if (value === 'admin' || value === 'moderator' || value === 'manager' || value === 'viewer') {
    return value
  }
  return null
}

export const isSuperuser = (): boolean => pb.authStore.isSuperuser

export const isStaffUser = (user: AuthUser | null | undefined): user is StaffRecord =>
  user != null &&
  // Collection IDs survive renames, including records cached in existing sessions.
  (user.collectionId === 'pbc_829252413' || user.collectionName === '_user_staff')

export const getCurrentUser = (): AuthUser | null => {
  if (!pb.authStore.isValid || !pb.authStore.record) return null
  return pb.authStore.record as AuthUser
}

export const login = async (email: string, password: string): Promise<AuthUser> => {
  try {
    const auth = await pb.collection('_user_staff').authWithPassword(email, password)
    return auth.record as StaffRecord
  } catch (error) {
    if (!(error instanceof ClientResponseError) || error.status !== 400) {
      throw error
    }

    const auth = await pb.collection(SUPERUSERS_COLLECTION).authWithPassword(email, password)
    return auth.record as SuperuserRecord
  }
}

export const logout = () => {
  pb.authStore.clear()
}
