import { readFile } from 'node:fs/promises'
import { neon } from '@neondatabase/serverless'
import model from '../../lib/owner/model.ts'
import postgres from '../../lib/owner/server/postgres.ts'
if (!process.env.OWNER_DATABASE_URL) throw new Error('OWNER_DATABASE_URL is required.')
const sql = neon(process.env.OWNER_DATABASE_URL)
const migration = await readFile(new URL('./migrations/001-owner-state.sql', import.meta.url), 'utf8')
await sql.transaction(migration.split(';').map(value => value.trim()).filter(Boolean).map(statement => sql.query(statement)))
await sql`INSERT INTO playliva_owner.state(id, document) VALUES (${postgres.ownerStateKey()}, ${JSON.stringify(model.emptyOwnerState())}::jsonb) ON CONFLICT DO NOTHING`
console.log('Owner schema migration 001 applied. Existing state preserved.')
