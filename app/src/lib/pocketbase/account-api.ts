import { getCurrentUser } from './auth'
import { pb } from './client'
import type { StaffRecord } from './types'

export const getAccount = async (): Promise<StaffRecord> => {
  const user = getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  return (await pb.collection('staff').getOne(user.id)) as StaffRecord
}

export const updateAccount = async (formData: FormData): Promise<StaffRecord> => {
  const user = getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  const updated = (await pb.collection('staff').update(user.id, formData)) as StaffRecord
  if (pb.authStore.token) {
    pb.authStore.save(pb.authStore.token, updated)
  }
  return updated
}
