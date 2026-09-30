import { googleAccessToken } from './google'
import { SEARCH_PROPERTY, canonicalPage, googleDay, shiftDay, type SearchFact, type SearchRun, type Grain } from '../search-model'
import { searchStore, type SearchStore } from './search-store'

export const SEARCH_ROW_LIMIT = 25000
type ApiRow = { keys: string[]; clicks: number; impressions: number; position: number }
type Query = (body: Record<string, unknown>) => Promise<{ rows?: ApiRow[] }>
/** Three attempts maximum; never retry authorization, permission or malformed requests. */
export async function readSearch(url: string, token: string, body: unknown, request = fetch, wait = (ms: number) => new Promise(resolve=>setTimeout(resolve,ms))) {
  for(let attempt=0; attempt<3; attempt++) {
    let response: Response
    try { response=await request(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(10000)}) }
    catch { if(attempt===2) throw new Error('Search request timed out; previous evidence preserved.'); await wait(500*(attempt+1)); continue }
    if(response.ok) return response.json()
    if(![429,500,502,503,504].includes(response.status)||attempt===2) throw new Error(`Search API HTTP ${response.status}; previous evidence preserved.`)
    await wait(500*(attempt+1))
  }
  throw new Error('Search API unavailable.')
}
export function normalizeSearchRows(rows: ApiRow[], grain: Grain): SearchFact[] {
  const merged = new Map<string, SearchFact>()
  for(const row of rows) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(row.keys?.[0]??'') || ![row.clicks,row.impressions,row.position].every(n=>Number.isFinite(n)&&n>=0) || row.clicks>row.impressions) throw new Error('Search API returned invalid reporting rows.')
    const page=grain==='total'?'':canonicalPage(row.keys[1])
    if(page===null) continue
    const offset=grain==='query'?1:0
    const fact:SearchFact={grain,date:row.keys[0],page,query:grain==='query'?row.keys[2]:'',country:grain==='total'?'':row.keys[2+offset].toLowerCase(),device:grain==='total'?'':row.keys[3+offset].toLowerCase(),clicks:row.clicks,impressions:row.impressions,position:row.position}
    const key=JSON.stringify([grain,fact.date,page,fact.query,fact.country,fact.device]), old=merged.get(key)
    if(old) { const total=old.impressions+fact.impressions; old.position=total?(old.position*old.impressions+fact.position*fact.impressions)/total:0;old.clicks+=fact.clicks;old.impressions=total }
    else merged.set(key,fact)
  }
  return [...merged.values()]
}
export async function ingestSearch(store: SearchStore = searchStore, query?: Query, now = new Date()) {
  const run:SearchRun={day:googleDay(now),status:'running',startedAt:now.toISOString()}
  if(!await store.claim(run)) return { skipped:true, reason:'This Google-calendar day has already been attempted.' }
  try {
    if(!query) {
      if(process.env.OWNER_SEARCH_PROPERTY && process.env.OWNER_SEARCH_PROPERTY!==SEARCH_PROPERTY) throw new Error('Search property must remain sc-domain:playliva.com.')
      const token=await googleAccessToken('search')
      query=body=>readSearch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SEARCH_PROPERTY)}/searchAnalytics/query`,token,body)
    }
    const state=await store.state()
    // Date-only final report avoids treating absence of a low-volume query as zero.
    const probe=await query({startDate:shiftDay(run.day,-14),endDate:run.day,dimensions:['date'],dataState:'final',rowLimit:SEARCH_ROW_LIMIT})
    const newest=probe.rows?.map(row=>row.keys[0]).sort().at(-1)
    if(!newest) throw new Error('Search has no recent final data; previous evidence preserved.')
    if(newest<shiftDay(run.day,-7)) throw new Error('Search final data is stale; previous evidence preserved.')
    if(state.newest && newest<state.newest) throw new Error('Search final data regressed; previous evidence preserved.')
    const from=state.newest ? shiftDay(state.newest,-6) : shiftDay(newest,-55)
    if(from>newest) throw new Error('Search final data regressed; previous evidence preserved.')
    const facts:SearchFact[]=[]
    for(const grain of ['total','page','query'] as const) {
      const dimensions=grain==='total'?['date']:grain==='page'?['date','page','country','device']:['date','page','query','country','device']
      const response=await query({startDate:from,endDate:newest,dimensions,dataState:'final',rowLimit:SEARCH_ROW_LIMIT,type:'web'})
      // Fail closed at the cap rather than silently replacing complete history with partial data.
      if((response.rows?.length??0)>=SEARCH_ROW_LIMIT) throw new Error('Search row cap reached; previous evidence preserved.')
      facts.push(...normalizeSearchRows(response.rows??[],grain))
    }
    const completed:SearchRun={...run,status:'success',from,to:newest,finishedAt:now.toISOString(),rows:facts.length}
    await store.persist(completed,facts)
    return {skipped:false,run:completed}
  } catch(error) {
    const message=error instanceof Error&&/^Search /.test(error.message)?error.message:'Search authorization or storage is unavailable; previous evidence preserved.'
    await store.fail({...run,status:'failed',finishedAt:new Date().toISOString(),error:message})
    return {skipped:false,error:message}
  }
}
