import { pb } from './client'

export type PublishSite = 'landing' | 'theater'
type SiteStatus = { site: PublishSite; pending: boolean; publishing: boolean }
type PublishResult = { sites: SiteStatus[]; accepted: PublishSite[]; failed: PublishSite[] }

// The shell is remounted on navigation. Keep an in-flight publish alive across routes.
export const publication = $state({
  sites: [] as SiteStatus[],
  publishing: false,
  error: false,
})

let generation = 0
const authIdentity = () =>
  pb.authStore.isValid ? `${pb.authStore.record?.collectionId}/${pb.authStore.record?.id}` : ''
let identity = authIdentity()

pb.authStore.onChange(() => {
  const nextIdentity = authIdentity()
  if (nextIdentity === identity) return
  identity = nextIdentity
  generation++
  publication.sites = []
  publication.publishing = false
  publication.error = false
})

export const refreshPublication = async () => {
  if (!pb.authStore.isValid || publication.publishing) return
  const requestGeneration = ++generation
  try {
    const result = await pb.send<{ sites: SiteStatus[] }>('/api/publication', { method: 'GET' })
    if (requestGeneration !== generation) return
    publication.sites = result.sites
    publication.error = false
  } catch {
    if (requestGeneration === generation) publication.error = true
  }
}

export const publishChanges = async (): Promise<PublishResult | null> => {
  if (publication.publishing) return null
  const requestGeneration = ++generation
  publication.publishing = true
  try {
    const result = await pb.send<PublishResult>('/api/publication', { method: 'POST' })
    if (requestGeneration !== generation) return null
    publication.sites = result.sites
    publication.error = false
    return result
  } finally {
    if (requestGeneration === generation) publication.publishing = false
  }
}
