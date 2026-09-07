import { pb } from './client'
import type { StaffRecord } from './types'

export const listStaff = async () => {
  return (await pb.collection('_user_staff').getFullList({ sort: '-updated' })) as StaffRecord[]
}

export const createStaff = async (formData: FormData) => {
  return (await pb.collection('_user_staff').create(formData)) as StaffRecord
}

export const updateStaff = async (id: string, formData: FormData) => {
  return (await pb.collection('_user_staff').update(id, formData)) as StaffRecord
}

export const deleteStaff = async (id: string) => {
  await pb.collection('_user_staff').delete(id)
}
