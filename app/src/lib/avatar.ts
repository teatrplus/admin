/** Stable hue 0–360 from an arbitrary seed string. */
export const hueFromSeed = (seed: string) => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return hash % 360
}

export const avatarInitial = (name?: string | null, email?: string | null) => {
  const source = (name?.trim() || email?.trim() || '?').replace(/^[^a-zA-Zа-яА-ЯёЁ0-9]+/, '')
  return (source.charAt(0) || '?').toUpperCase()
}

export const avatarSeed = (name?: string | null, email?: string | null, id?: string | null) =>
  (email?.trim() || name?.trim() || id || 'unknown').toLowerCase()

export const avatarBackground = (seed: string) => {
  const hue = hueFromSeed(seed)
  return `oklch(0.62 0.14 ${hue})`
}
