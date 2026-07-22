import { pb } from './client'
import type { StaffRecord } from './types'

export const listStaff = async () => {
  return (await pb.collection('staff').getFullList({ sort: '-created' })) as StaffRecord[]
}

export const createStaff = async (formData: FormData) => {
  return (await pb.collection('staff').create(formData)) as StaffRecord
}

export const updateStaff = async (id: string, formData: FormData) => {
  return (await pb.collection('staff').update(id, formData)) as StaffRecord
}

export const deleteStaff = async (id: string) => {
  await pb.collection('staff').delete(id)
}
