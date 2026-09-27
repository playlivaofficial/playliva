import { neon } from '@neondatabase/serverless'

export const postgresConfigured = () => Boolean(process.env.OWNER_DATABASE_URL)
const sql = () => neon(process.env.OWNER_DATABASE_URL!, { fetchOptions: { cache: 'no-store', signal: AbortSignal.timeout(12000) } })
export function ownerStateKey() {
  const key = process.env.OWNER_STATE_KEY || 'owner'
  if (!/^owner(?:-[a-z0-9-]{1,60})?$/.test(key) || (process.env.VERCEL_ENV === 'preview' && !key.startsWith('owner-preview-'))) throw new Error('Owner preview storage must be isolated.')
  return key
}
export async function readPostgresState(): Promise<{ revision: number; value: string | null }> {
  const rows = await sql()`SELECT revision, document FROM playliva_owner.state WHERE id = ${ownerStateKey()}`
  if (!rows.length) throw new Error('Owner database migration has not been applied.')
  return { revision: Number(rows[0].revision), value: JSON.stringify(rows[0].document) }
}
export async function swapPostgresState(revision: number, document: string) {
  const rows = await sql()`UPDATE playliva_owner.state SET document = ${document}::jsonb, revision = revision + 1, updated_at = now() WHERE id = ${ownerStateKey()} AND revision = ${revision} RETURNING revision`
  return rows.length === 1
}
