import { getCurrentUser, isSuperuser } from './auth'
import { pb } from './client'
import type { AuthUser, StaffRecord, SuperuserRecord } from './types'

const SUPERUSERS_COLLECTION = '_superusers'

export const getAccount = async (): Promise<AuthUser> => {
  const user = getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  if (isSuperuser()) {
    return (await pb.collection(SUPERUSERS_COLLECTION).getOne(user.id)) as SuperuserRecord
  }

  return (await pb.collection('staff').getOne(user.id)) as StaffRecord
}

export const updateAccount = async (formData: FormData): Promise<AuthUser> => {
  const user = getCurrentUser()
  if (!user) throw new Error('Not authenticated')

  if (isSuperuser()) {
    const updated = (await pb.collection(SUPERUSERS_COLLECTION).update(user.id, formData)) as SuperuserRecord
    if (pb.authStore.token) {
      pb.authStore.save(pb.authStore.token, updated)
    }
    return updated
  }

  const updated = (await pb.collection('staff').update(user.id, formData)) as StaffRecord
  if (pb.authStore.token) {
    pb.authStore.save(pb.authStore.token, updated)
  }
  return updated
}
