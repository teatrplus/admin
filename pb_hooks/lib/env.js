/**
 * Hook env lookup.
 *
 * PocketBase does not load `.env`. `$os.getenv` only sees variables the
 * process was started with (systemd, Docker, `export`, `source .env`).
 * Local `./pocketbase serve` therefore misses secrets that only live in
 * the dotenv file next to the binary. Process env still wins when set.
 */

const normalizeEnvValue = (value) => {
  if (value === undefined || value === null) return ''
  const trimmed = String(value).trim()
  if (!trimmed) return ''
  return trimmed.replace(/^["']|["']$/g, '')
}

const parseDotEnv = (text) => {
  const parsed = {}
  const source = String(text || '')
  const lines = source.split('\n')

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
    if (line.charAt(line.length - 1) === '\r') line = line.slice(0, -1)

    const trimmed = line.trim()
    if (!trimmed || trimmed.charAt(0) === '#') continue

    const body = trimmed.indexOf('export ') === 0 ? trimmed.slice(7).trim() : trimmed
    const eq = body.indexOf('=')
    if (eq <= 0) continue

    const key = body.slice(0, eq).trim()
    if (!key) continue

    parsed[key] = normalizeEnvValue(body.slice(eq + 1))
  }

  return parsed
}

const envFilePath = () => {
  try {
    if (typeof __hooks === 'string' && __hooks) {
      return $filepath.join($filepath.dir(__hooks), '.env')
    }
  } catch {
    // fall through
  }
  return '.env'
}

const readDotEnvFile = () => {
  const path = envFilePath()
  try {
    const raw = $os.readFile(path)
    const text = typeof raw === 'string' ? raw : toString(raw)
    return parseDotEnv(text)
  } catch {
    return {}
  }
}

const readEnv = (key, fallback) => {
  const fromProcess = normalizeEnvValue($os.getenv(key))
  if (fromProcess) return fromProcess

  const fromFile = readDotEnvFile()[key]
  if (fromFile) return fromFile

  if (fallback === undefined || fallback === null) return ''
  return fallback
}

module.exports = {
  readEnv,
}
