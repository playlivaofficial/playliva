import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { readLocalText } from './local-files'
import { resolve } from 'node:path'
import { localEnabled, ownerDirectory, persistenceMode, readOwnerState, updateOwnerState } from './store'

const scrypt = promisify(nodeScrypt)
export const SESSION_SECONDS = 30 * 24 * 60 * 60
export const SESSION_REFRESH_SECONDS = 24 * 60 * 60
export const ownerCookie = () => localEnabled() ? 'playliva_owner_local' : '__Host-playliva_owner'
export const sessionCookieOptions = (expiresAt: number) => ({ httpOnly: true, secure: !localEnabled(), sameSite: 'strict' as const, path: '/', expires: new Date(expiresAt), maxAge: Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) })
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
export async function passwordConfig(): Promise<string | null> {
  if (process.env.OWNER_PASSWORD_HASH) return process.env.OWNER_PASSWORD_HASH
  if (!localEnabled()) return null
  try { return JSON.parse(await readLocalText(resolve(ownerDirectory(), 'auth.json'))).passwordHash ?? null } catch { return null }
}
export async function authReady() { return Boolean(await passwordConfig()) && persistenceMode() !== 'not_connected' }
export async function verifyPassword(password: string, encoded: string) {
  const [salt, expected] = encoded.split(':')
  if (!/^[a-f0-9]{32}$/.test(salt ?? '') || !/^[a-f0-9]{128}$/.test(expected ?? '') || password.length > 512) return false
  const actual = await scrypt(password, salt, 64) as Buffer
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'))
}
export async function authorizedSession(token?: string) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null
  try {
    const config = await passwordConfig()
    if (!config) return null
    const session = (await readOwnerState()).sessions[hashToken(token)]
    return session && session.expiresAt > Date.now() && session.fingerprint === hashToken(config) ? session : null
  } catch { return null }
}
export async function validSession(token?: string) { return Boolean(await authorizedSession(token)) }
/** Renew only an existing, unexpired session. CAS rechecks prevent logout resurrection. */
export async function refreshSession(token?: string): Promise<{ expiresAt: number; renewed: boolean } | null> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null
  const config = await passwordConfig()
  if (!config) return null
  const id = hashToken(token), fingerprint = hashToken(config)
  const current = (await readOwnerState()).sessions[id]
  if (!current || current.expiresAt <= Date.now() || current.fingerprint !== fingerprint) return null
  const due = (expiresAt: number) => expiresAt <= Date.now() + (SESSION_SECONDS - SESSION_REFRESH_SECONDS) * 1000
  if (!due(current.expiresAt)) return { expiresAt: current.expiresAt, renewed: false }
  return updateOwnerState(state => {
    const session = state.sessions[id]
    if (!session || session.expiresAt <= Date.now() || session.fingerprint !== fingerprint) return null
    if (!due(session.expiresAt)) return { expiresAt: session.expiresAt, renewed: false }
    session.expiresAt = Date.now() + SESSION_SECONDS * 1000
    return { expiresAt: session.expiresAt, renewed: true }
  })
}
export async function revokeSession(token?: string) {
  if (token && /^[a-f0-9]{64}$/.test(token)) await updateOwnerState(state => { delete state.sessions[hashToken(token)] })
}
export async function login(password: string) {
  const config = await passwordConfig()
  if (!config || persistenceMode() === 'not_connected') throw new Error('Owner access is not configured.')
  const allowed = await updateOwnerState(state => {
    if (state.attempts.resetsAt <= Date.now()) state.attempts = { count: 0, resetsAt: Date.now() + 900000 }
    state.attempts.count++
    return state.attempts.count <= 10
  })
  if (!allowed) throw new Error('Too many attempts. Try again in 15 minutes.')
  if (!await verifyPassword(password, config)) throw new Error('Sign-in failed.')
  const token = randomBytes(32).toString('hex')
  await updateOwnerState(state => {
    for (const [id, session] of Object.entries(state.sessions)) if (session.expiresAt <= Date.now()) delete state.sessions[id]
    state.sessions[hashToken(token)] = { expiresAt: Date.now() + SESSION_SECONDS * 1000, fingerprint: hashToken(config) }
    state.attempts = { count: 0, resetsAt: 0 }
  })
  return token
}
export function allowedOrigin(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin || request.headers.get('sec-fetch-site') === 'cross-site') return false
  if (localEnabled()) {
    const url = new URL(request.url)
    let source: URL
    try { source = new URL(origin) } catch { return false }
    // Next may normalize its internal request URL to localhost. The browser's
    // Origin must still match the actual loopback Host, including its port.
    return ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) &&
      ['127.0.0.1', 'localhost', '[::1]'].includes(source.hostname) &&
      source.protocol === 'http:' && source.host === (request.headers.get('host') || url.host)
  }
  const expected = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.OWNER_ORIGIN || 'https://www.playliva.com'
  return origin === expected && origin.startsWith('https://')
}
