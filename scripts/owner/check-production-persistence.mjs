import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { neon } from '@neondatabase/serverless'
import model from '../../lib/owner/model.ts'
import store from '../../lib/owner/server/store.ts'

if (!process.env.OWNER_DATABASE_URL) throw new Error('Production persistence configuration required.')
const mode = process.argv[2]
if (mode === 'write') {
  await store.updateOwnerState(state => { state.content.persistenceProbe = { marker: process.env.OWNER_TEST_MARKER } })
} else if (mode === 'read') {
  assert.equal((await store.readOwnerState()).content.persistenceProbe.marker, process.env.OWNER_TEST_MARKER)
} else {
  const id = `owner-smoke-${randomUUID()}`, marker = randomUUID(), sql = neon(process.env.OWNER_DATABASE_URL)
  await sql`INSERT INTO playliva_owner.state(id,document) VALUES (${id},${JSON.stringify(model.emptyOwnerState())}::jsonb)`
  try {
    for (const childMode of ['write', 'read']) await promisify(execFile)(process.execPath, ['--import', 'tsx', fileURLToPath(import.meta.url), childMode], {
      windowsHide: true, env: { ...process.env, OWNER_STATE_KEY: id, OWNER_TEST_MARKER: marker, VERCEL_ENV: 'production' }, timeout: 60000,
    })
    const rows = await sql`SELECT revision FROM playliva_owner.state WHERE id=${id}`
    assert.equal(Number(rows[0].revision), 1)
  } finally {
    // Exactly this disposable probe record; never the production owner document.
    await sql`DELETE FROM playliva_owner.state WHERE id=${id}`
  }
  assert.equal((await sql`SELECT id FROM playliva_owner.state WHERE id=${id}`).length, 0)
  console.log(JSON.stringify({ created: true, written: true, readInNewProcess: true, revisionVerified: true, testRecordRemoved: true }))
}
