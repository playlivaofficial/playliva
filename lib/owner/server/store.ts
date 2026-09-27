import { mkdir, writeFile, rename, open, unlink } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { emptyOwnerState, type OwnerState } from '../model'
import { readLocalText } from './local-files'
import { emptyAutomation } from '../automation-model'
import { postgresConfigured, readPostgresState, swapPostgresState } from './postgres'

// Node built-ins enforce a server boundary even for workstation CLI consumers.
// Next page/API entry points also import the server-only boundary module.
export const localEnabled = () => process.env.OWNER_LOCAL_ENABLED === '1' && !process.env.VERCEL
export const ownerDirectory = () => resolve(process.env.OWNER_DATA_DIR || 'social/output/owner-growth')
const redisConfigured = () => Boolean(process.env.OWNER_REDIS_REST_URL && process.env.OWNER_REDIS_REST_TOKEN)
export const persistenceMode = () => postgresConfigured() ? 'durable_postgres' : redisConfigured() ? 'durable_redis' : localEnabled() ? 'local_filesystem' : 'not_connected'
const key = 'playliva:owner:growth:v1'

async function redis(command: (string | number)[]) {
  const endpoint = new URL(process.env.OWNER_REDIS_REST_URL!)
  if (endpoint.protocol !== 'https:') throw new Error('Owner store requires HTTPS.')
  const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${process.env.OWNER_REDIS_REST_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command), cache: 'no-store', signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new Error('Owner persistence unavailable.')
  const body = await response.json()
  if (body.error) throw new Error('Owner persistence unavailable.')
  return body.result
}
function parseState(raw: string | null): OwnerState {
  if (!raw) return emptyOwnerState()
  const state = JSON.parse(raw)
  if (![1, 2].includes(state.version) || !state.creatives || !state.sessions || !Array.isArray(state.activity) || !Array.isArray(state.jobs) || !state.content || !state.attempts) throw new Error('Owner state needs recovery; no data was overwritten.')
  if (state.version === 1) { state.version = 2; state.automation = emptyAutomation() }
  if (state.automation?.version !== 1 || !Array.isArray(state.automation.batches) || !state.automation.jobs) throw new Error('Owner automation state needs recovery.')
  return state
}
export async function readOwnerState(): Promise<OwnerState> {
  if (postgresConfigured()) return parseState((await readPostgresState()).value)
  if (redisConfigured()) return parseState(await redis(['GET', key]))
  if (!localEnabled()) throw new Error('Owner persistence is not connected.')
  try { return parseState(await readLocalText(resolve(ownerDirectory(), 'state.json'))) }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return emptyOwnerState(); throw error }
}

/** Atomic compare-and-swap in production; exclusive writer lock and atomic rename locally. */
export async function updateOwnerState<T>(update: (state: OwnerState) => T): Promise<T> {
  if (postgresConfigured()) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const current = await readPostgresState(), state = parseState(current.value), result = update(state)
      if (await swapPostgresState(current.revision, JSON.stringify(state))) return result
      await new Promise(resolveDelay => setTimeout(resolveDelay, 20 + Math.random() * 80))
    }
    throw new Error('Owner state changed concurrently. Please retry.')
  }
  if (redisConfigured()) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const raw: string | null = await redis(['GET', key]), state = parseState(raw), result = update(state)
      const swapped = await redis(['EVAL', "if redis.call('GET',KEYS[1]) == ARGV[1] or (redis.call('EXISTS',KEYS[1]) == 0 and ARGV[1] == '') then redis.call('SET',KEYS[1],ARGV[2]); return 1 else return 0 end", 1, key, raw ?? '', JSON.stringify(state)])
      if (swapped === 1) return result
    }
    throw new Error('Owner state changed concurrently. Please retry.')
  }
  if (!localEnabled()) throw new Error('Durable owner persistence is not connected.')
  const path = resolve(ownerDirectory(), 'state.json'), lockPath = `${path}.lock`
  await mkdir(dirname(path), { recursive: true })
  let lock
  for (let attempt = 0; attempt < 40; attempt++) {
    try { lock = await open(lockPath, 'wx', 0o600); break }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; await new Promise(resolveDelay => setTimeout(resolveDelay, 50)) }
  }
  if (!lock) throw new Error('Owner state is busy. Please retry; a stopped writer may need lock recovery.')
  const temp = `${path}.${randomUUID()}.tmp`
  try {
    const state = await readOwnerState(), result = update(state)
    await writeFile(temp, JSON.stringify(state, null, 2) + '\n', { mode: 0o600 })
    await rename(temp, path)
    return result
  } finally { await lock.close(); await unlink(lockPath) }
}
export function logActivity(state: OwnerState, action: string, target: string, detail: string) {
  state.activity.push({ id: randomUUID(), at: new Date().toISOString(), action, target, detail })
}
