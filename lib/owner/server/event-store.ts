import { createHash } from 'node:crypto'
import { neon } from '@neondatabase/serverless'
import { ownerStateKey } from './postgres'
import type { eventInput } from './event-input'
import type { MetricEvent } from '../metrics'

const sql = () => neon(process.env.OWNER_DATABASE_URL!, { fetchOptions: { cache: 'no-store', signal: AbortSignal.timeout(8000) } })

/** Receipt insertion and counter increment are one atomic statement. Retrying
 * an ID cannot increment again, even across processes or concurrent requests. */
export async function recordEvent(event: NonNullable<ReturnType<typeof eventInput>>) {
  const db = sql(), scope = ownerStateKey(), dimensions = JSON.stringify(event.dimensions)
  const key = createHash('sha256').update(dimensions).digest('hex')
  const rows = await db`WITH pruning AS (
    INSERT INTO playliva_owner.event_sources(scope) VALUES (${scope})
    ON CONFLICT(scope) DO UPDATE SET pruned_at = now()
    WHERE playliva_owner.event_sources.pruned_at < now() - interval '1 day' RETURNING scope
  ), old_receipts AS (
    DELETE FROM playliva_owner.event_receipts WHERE scope IN (SELECT scope FROM pruning) AND received_at < now() - interval '1 day'
  ), old_budgets AS (
    DELETE FROM playliva_owner.event_budget WHERE scope IN (SELECT scope FROM pruning) AND day < (now() AT TIME ZONE 'UTC')::date - 7
  ), budget AS (
    INSERT INTO playliva_owner.event_budget(scope, day) VALUES (${scope}, (now() AT TIME ZONE 'UTC')::date)
    ON CONFLICT(scope, day) DO UPDATE SET attempts = playliva_owner.event_budget.attempts + 1
    WHERE playliva_owner.event_budget.attempts < 100000 RETURNING scope
  ), receipt AS (
    INSERT INTO playliva_owner.event_receipts(scope, id) SELECT scope, ${event.id}::uuid FROM budget
    ON CONFLICT DO NOTHING RETURNING scope
  ), counted AS (
    INSERT INTO playliva_owner.event_daily(scope, day, dimension_key, dimensions)
    SELECT scope, (now() AT TIME ZONE 'UTC')::date, ${key}, ${dimensions}::jsonb FROM receipt
    ON CONFLICT(scope, day, dimension_key) DO UPDATE SET count = playliva_owner.event_daily.count + 1 RETURNING count
  ) SELECT EXISTS(SELECT 1 FROM budget) AS accepted`
  return rows[0]?.accepted === true
}

export async function readEvents(): Promise<{ events: MetricEvent[]; from: string; to: string }> {
  const db = sql(), scope = ownerStateKey()
  const [source, rows] = await Promise.all([
    db`SELECT started_at FROM playliva_owner.event_sources WHERE scope = ${scope}`,
    db`SELECT day::text, dimensions, count FROM playliva_owner.event_daily WHERE scope = ${scope} AND day >= (now() AT TIME ZONE 'UTC')::date - 89 ORDER BY day DESC LIMIT 50001`,
  ])
  if (rows.length > 50000) throw new Error('Event reporting bound exceeded; counts have not been truncated.')
  const today = new Date().toISOString().slice(0, 10), oldest = new Date(Date.now() - 89 * 86400000).toISOString().slice(0, 10)
  const started = source.length ? new Date(source[0].started_at).toISOString().slice(0, 10) : today
  return { events: rows.map(row => ({ ...row.dimensions, date: row.day, count: Number(row.count) })), from: started > oldest ? started : oldest, to: today }
}
