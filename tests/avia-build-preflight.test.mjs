import test from 'node:test'
import assert from 'node:assert/strict'
import { aviaBuildPreflight } from '../scripts/avia-build-preflight.mjs'
import { provisionAviaDatabase } from '../scripts/avia-storage-setup.mjs'

test('Avia local/GitHub build skips database provisioning even if a local URL exists', async () => {
  let calls = 0
  assert.equal(await aviaBuildPreflight({ OWNER_DATABASE_URL: 'test-only-placeholder' }, async () => { calls++ }), false)
  assert.equal(calls, 0)
})
test('Avia Vercel build fails closed when the existing database is absent', async () => {
  let calls = 0
  await assert.rejects(aviaBuildPreflight({ VERCEL: '1' }, async () => { calls++ }), /existing durable database/)
  assert.equal(calls, 0)
})
test('Avia Preview and Production preflight use only the configured existing connection', async () => {
  for (const VERCEL_ENV of ['preview', 'production']) {
    const calls = []
    assert.equal(await aviaBuildPreflight({ VERCEL: '1', VERCEL_ENV, OWNER_DATABASE_URL: 'test-only-placeholder' }, async value => { calls.push(value) }), true)
    assert.deepEqual(calls, ['test-only-placeholder'])
  }
})
test('Avia migration issues only idempotent DDL for its isolated table and index', async () => {
  const calls = []
  const connect = value => { assert.equal(value, 'test-only-placeholder'); return { query: async (sql, params) => { calls.push(sql); assert.deepEqual(params, []) } } }
  await provisionAviaDatabase('test-only-placeholder', connect)
  assert.equal(calls.length, 2)
  assert.match(calls[0], /^CREATE TABLE IF NOT EXISTS playliva_owner\.avia_sessions/)
  assert.match(calls[1], /^CREATE INDEX IF NOT EXISTS avia_sessions_updated ON playliva_owner\.avia_sessions/)
  assert.ok(calls.every(sql => !/\b(?:DROP|DELETE|TRUNCATE|INSERT|UPDATE)\b/i.test(sql)))
})
