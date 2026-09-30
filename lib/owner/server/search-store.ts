import { neon } from '@neondatabase/serverless'
import { ownerStateKey } from './postgres'
import { emptySeoState, type SearchFact, type SearchRun, type SeoState } from '../search-model'
import { SEARCH_SCHEMA } from './search-schema'

const database = () => {
  if (!process.env.OWNER_DATABASE_URL) throw new Error('Search persistence is not connected.')
  return neon(process.env.OWNER_DATABASE_URL, { fetchOptions: { cache: 'no-store', signal: AbortSignal.timeout(12000) } })
}
export interface SearchStore {
  state(): Promise<SeoState>; facts(from: string): Promise<SearchFact[]>; runs(): Promise<SearchRun[]>;
  claim(run: SearchRun): Promise<boolean>; fail(run: SearchRun): Promise<void>;
  persist(run: SearchRun, rows: SearchFact[]): Promise<void>; save(state: SeoState): Promise<boolean>;
}
export async function ensureSearchSchema() {
  const sql=database()
  if((await sql`SELECT version FROM playliva_owner.schema_migrations WHERE version=3`).length) return
  await sql.transaction(SEARCH_SCHEMA.map(statement=>sql.query(statement)))
}
export const searchStore: SearchStore = {
  async state() {
    const sql = database(), rows = await sql`SELECT revision, document FROM playliva_owner.seo_state WHERE scope=${ownerStateKey()}`
    return rows[0] ? { ...rows[0].document as SeoState, revision: Number(rows[0].revision) } : emptySeoState()
  },
  async facts(from) {
    const rows = await database()`SELECT fact FROM playliva_owner.search_daily WHERE scope=${ownerStateKey()} AND day>=${from}::date ORDER BY day, grain, dimension_key LIMIT 100001`
    if (rows.length > 100000) throw new Error('Search reporting safety row limit reached.')
    return rows.map(row => row.fact as SearchFact)
  },
  async runs() { const rows = await database()`SELECT document FROM playliva_owner.search_runs WHERE scope=${ownerStateKey()} ORDER BY day DESC LIMIT 10`; return rows.map(row=>row.document as SearchRun) },
  async claim(run) {
    const sql=database(), scope=ownerStateKey()
    await sql`INSERT INTO playliva_owner.seo_state(scope,document) VALUES(${scope},${JSON.stringify(emptySeoState())}::jsonb) ON CONFLICT DO NOTHING`
    const rows=await sql`INSERT INTO playliva_owner.search_runs(scope,day,document) VALUES(${scope},${run.day}::date,${JSON.stringify(run)}::jsonb) ON CONFLICT DO NOTHING RETURNING day`
    return rows.length === 1
  },
  async fail(run) { await database()`UPDATE playliva_owner.search_runs SET document=${JSON.stringify(run)}::jsonb WHERE scope=${ownerStateKey()} AND day=${run.day}::date` },
  async persist(run, rows) {
    const sql=database(), scope=ownerStateKey()
    // Replace only the fully fetched overlap, in one atomic transaction. Older history is untouched.
    await sql.transaction([
      sql`DELETE FROM playliva_owner.search_daily WHERE scope=${scope} AND day BETWEEN ${run.from}::date AND ${run.to}::date`,
      sql`INSERT INTO playliva_owner.search_daily(scope,day,grain,dimension_key,fact)
        SELECT ${scope}, (r->>'date')::date, r->>'grain', jsonb_build_array(r->>'page',r->>'query',r->>'country',r->>'device')::text, r
        FROM jsonb_array_elements(${JSON.stringify(rows)}::jsonb) AS r`,
      sql`UPDATE playliva_owner.search_runs SET document=${JSON.stringify(run)}::jsonb WHERE scope=${scope} AND day=${run.day}::date`,
      sql`UPDATE playliva_owner.seo_state SET revision=revision+1, document=document || jsonb_build_object('lastSuccess',${run.finishedAt}::text,'newest',${run.to}::text,'coverageFrom',LEAST(COALESCE(document->>'coverageFrom',${run.from}::text),${run.from}::text)) WHERE scope=${scope}`,
    ])
  },
  async save(state) {
    const rows=await database()`UPDATE playliva_owner.seo_state SET document=${JSON.stringify(state)}::jsonb,revision=revision+1 WHERE scope=${ownerStateKey()} AND revision=${state.revision} RETURNING revision`
    return rows.length === 1
  },
}
