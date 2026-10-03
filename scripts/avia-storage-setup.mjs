// Idempotent release migration. Never invoked by a public game request.
import { neon } from '@neondatabase/serverless'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import server from '../lib/originals/avia/server.ts'
export async function provisionAviaDatabase(url, connect = neon) {
  if (!url) throw Error('The existing database environment is required; no credentials are printed.')
  const sql = connect(url)
  await sql.query(server.AVIA_SCHEMA, [])
  await sql.query('CREATE INDEX IF NOT EXISTS avia_sessions_updated ON playliva_owner.avia_sessions(updated_at)', [])
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  if (process.argv[2] !== '--apply') throw Error('Run only after release approval with --apply and the intended database environment.')
  try {
    await provisionAviaDatabase(process.env.OWNER_DATABASE_URL)
    console.log('Avia isolated session table is ready. Existing owner/SEO/video data was not modified.')
  } catch {
    console.error('Avia storage provisioning failed; check the existing database configuration. No credentials are printed.')
    process.exitCode = 1
  }
}
