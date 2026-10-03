import { randomBytes, randomUUID, createHash } from 'node:crypto'
import { mkdir, open, readFile, rename, writeFile, unlink } from 'node:fs/promises'
import { resolve } from 'node:path'
import { neon } from '@neondatabase/serverless'
import { actAvia, newAviaRound, publicAvia, type AviaAction, type AviaState } from './engine'

export const AVIA_COOKIE = 'playliva_avia_guest'
export const newGuest = () => randomBytes(32).toString('hex')
export const validGuest = (token: unknown): token is string => typeof token === 'string' && /^[a-f0-9]{64}$/.test(token)
export function allowedAviaOrigin(request: Request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false
  const raw = request.headers.get('origin'); if (!raw) return false
  try {
    const source = new URL(raw), target = new URL(request.url)
    if (!process.env.VERCEL) return ['localhost', '127.0.0.1', '[::1]'].includes(target.hostname) &&
      ['localhost', '127.0.0.1', '[::1]'].includes(source.hostname) && source.protocol === 'http:' && source.host === request.headers.get('host')
    const expected = process.env.VERCEL_ENV === 'preview' ? `https://${process.env.VERCEL_URL}` : 'https://www.playliva.com'
    return raw === expected
  } catch { return false }
}
const key = (token: string) => createHash('sha256').update(token).digest('hex')
const scope = () => process.env.VERCEL_ENV === 'preview' ? 'preview' : 'production'
export const AVIA_SCHEMA = `CREATE TABLE IF NOT EXISTS playliva_owner.avia_sessions (
  scope text NOT NULL, id text NOT NULL, revision bigint NOT NULL DEFAULT 0,
  document jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(scope,id)
)`

function transition(current: AviaState, action: AviaAction, at: number) {
  const error = actAvia(current, action, at)
  const state = !error && action.type === 'next' ? newAviaRound(at, randomUUID(), undefined, current) : current
  return { state, error, view: publicAvia(state, at) }
}
/** Guest round documents are isolated from owner data. Production never falls back to process memory. */
export async function aviaRequest(token: string, action: AviaAction) {
  if (!validGuest(token)) throw new Error('Invalid guest')
  const id = key(token)
  if (process.env.VERCEL) {
    if (!process.env.OWNER_DATABASE_URL) throw new Error('Avia durable storage unavailable')
    const sql = neon(process.env.OWNER_DATABASE_URL, { fetchOptions: { cache: 'no-store', signal: AbortSignal.timeout(8000) } })
    // Schema is provisioned by the release migration, never by an anonymous request.
    for (let attempt = 0; attempt < 8; attempt++) {
      const rows = await sql`SELECT revision,document,extract(epoch from clock_timestamp()) * 1000 AS now FROM playliva_owner.avia_sessions WHERE scope=${scope()} AND id=${id}`
      if (!rows.length) {
        const clock = await sql`SELECT extract(epoch from clock_timestamp()) * 1000 AS now`
        const initial = newAviaRound(Number(clock[0].now), randomUUID())
        await sql`INSERT INTO playliva_owner.avia_sessions(scope,id,document) VALUES (${scope()},${id},${JSON.stringify(initial)}::jsonb) ON CONFLICT DO NOTHING`
        continue
      }
      const row = rows[0], before = JSON.stringify(row.document), next = transition(row.document as AviaState, action, Number(row.now))
      if (before === JSON.stringify(next.state)) return { ...next, guestId: id }
      const saved = await sql`UPDATE playliva_owner.avia_sessions SET document=${JSON.stringify(next.state)}::jsonb,revision=revision+1,updated_at=now() WHERE scope=${scope()} AND id=${id} AND revision=${row.revision} RETURNING revision`
      if (saved.length) return { ...next, guestId: id }
    }
    throw new Error('Avia concurrent update; retry')
  }
  // Workstation-only durable adapter. Never reads production credentials/data.
  const directory = resolve('.local/avia'), path = resolve(directory, `${id}.json`)
  await mkdir(directory, { recursive: true })
  let lock
  for (let attempt = 0; attempt < 80; attempt++) {
    try { lock = await open(`${path}.lock`, 'wx', 0o600); break }
    catch (error) { if (!['EEXIST', 'EPERM', 'EACCES'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error; await new Promise(r => setTimeout(r, 25)) }
  }
  if (!lock) throw new Error('Avia session busy')
  try {
    let current: AviaState
    try { current = JSON.parse(await readFile(path, 'utf8')) }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; current = newAviaRound(Date.now(), randomUUID()) }
    const next = transition(current, action, Date.now()), temporary = `${path}.${randomUUID()}.tmp`
    await writeFile(temporary, JSON.stringify(next.state), { mode: 0o600 })
    await rename(temporary, path)
    return { ...next, guestId: id }
  } finally { await lock.close(); await unlink(`${path}.lock`) }
}
