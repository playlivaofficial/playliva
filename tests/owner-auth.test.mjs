import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { scryptSync } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import auth from '../lib/owner/server/auth.ts'
import store from '../lib/owner/server/store.ts'

test('30-day sessions survive process restart, slide safely, and preserve credential/throttle/revocation rules', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'playliva-auth-'))
  const saved = { ...process.env }
  process.env.OWNER_LOCAL_ENABLED = '1'; process.env.OWNER_DATA_DIR = directory
  delete process.env.VERCEL; delete process.env.OWNER_DATABASE_URL; delete process.env.OWNER_REDIS_REST_URL
  const password = 'isolated-auth-test-password', salt = 'abcdef0123456789abcdef0123456789'
  const verifier = `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
  process.env.OWNER_PASSWORD_HASH = verifier
  try {
    assert.equal(auth.SESSION_SECONDS, 2592000)
    await assert.rejects(auth.login('incorrect'), /Sign-in failed/)
    const before = Date.now(), token = await auth.login(password), id = auth.hashToken(token)
    const initial = (await store.readOwnerState()).sessions[id].expiresAt
    assert.ok(initial >= before + 2592000000 && initial <= Date.now() + 2592000000)
    assert.equal((await store.readOwnerState()).sessions[token], undefined)
    const child = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', "import auth from './lib/owner/server/auth.ts';if(!await auth.validSession(process.env.OWNER_TEST_SESSION))process.exit(1);console.log('valid')"], { env: { ...process.env, OWNER_TEST_SESSION: token }, encoding: 'utf8', windowsHide: true })
    assert.equal(child.trim(), 'valid')
    assert.deepEqual(await auth.refreshSession(token), { expiresAt: initial, renewed: false })
    await store.updateOwnerState(state => { state.sessions[id].expiresAt = Date.now() + 28 * 86400000 })
    const renewed = await auth.refreshSession(token)
    assert.equal(renewed.renewed, true)
    assert.ok(renewed.expiresAt >= Date.now() + 2591999000)
    assert.equal((await store.readOwnerState()).sessions[id].expiresAt, renewed.expiresAt)
    assert.equal((await auth.refreshSession(token)).renewed, false)
    assert.equal(await auth.passwordConfig(), verifier, 'renewal must never rotate the password')
    await store.updateOwnerState(state => { state.sessions[id].expiresAt = Date.now() + 10000 })
    await Promise.all([auth.refreshSession(token), auth.revokeSession(token)])
    assert.equal(await auth.validSession(token), false, 'concurrent renewal cannot resurrect logout')
    assert.equal(await auth.refreshSession(token), null)
    const expired = await auth.login(password)
    await store.updateOwnerState(state => { state.sessions[auth.hashToken(expired)].expiresAt = Date.now() - 1 })
    assert.equal(await auth.validSession(expired), false)
    assert.equal(await auth.refreshSession(expired), null)
    const stable = await auth.login(password)
    for (let attempt = 0; attempt < 10; attempt++) await assert.rejects(auth.login('wrong'), /Sign-in failed/)
    await assert.rejects(auth.login(password), /Too many attempts/)
    await store.updateOwnerState(state => { state.attempts.resetsAt = Date.now() - 1 })
    await auth.login(password)
    assert.equal(await auth.passwordConfig(), verifier)
    process.env.VERCEL = '1'
    const cookie = auth.sessionCookieOptions(Date.now() + auth.SESSION_SECONDS * 1000)
    assert.ok(cookie.secure && cookie.httpOnly && cookie.sameSite === 'strict' && cookie.path === '/')
    assert.ok(cookie.maxAge >= 2591999 && cookie.expires instanceof Date)
    delete process.env.VERCEL
    process.env.OWNER_PASSWORD_HASH = `${salt}:${scryptSync('intentional-owner-change-fixture', salt, 64).toString('hex')}`
    assert.equal(await auth.validSession(stable), false)
    assert.equal(await auth.refreshSession(stable), null)
    delete process.env.OWNER_PASSWORD_HASH; process.env.VERCEL = '1'
    assert.equal(await auth.passwordConfig(), null, 'production never generates or reads a local fallback password')
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key]
    Object.assign(process.env, saved)
  }
})

test('retired production bootstrap writes no credentials and is absent from build/deploy automation', async () => {
  const cwd = await mkdtemp(resolve(tmpdir(), 'playliva-auth-bootstrap-'))
  const script = resolve('scripts/owner/prepare-production-access.mjs')
  const run = spawnSync(process.execPath, [script], { cwd, encoding: 'utf8', windowsHide: true })
  assert.equal(run.status, 1)
  assert.deepEqual(await readdir(cwd), [])
  const workflows = (await readdir('.github/workflows')).map(file => `.github/workflows/${file}`)
  for (const file of ['package.json', ...workflows]) {
    const source = await readFile(file, 'utf8')
    assert.ok(!source.includes('prepare-production-access'))
  }
})
