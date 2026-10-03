import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import model from '../lib/owner/search-model.ts'
import ingestion from '../lib/owner/server/search-ingestion.ts'
import autopilot from '../lib/owner/server/search-autopilot.ts'
import schema from '../lib/owner/server/search-schema.ts'
import video from '../lib/owner/video-production.ts'
import report from '../lib/owner/server/search-report.ts'
import persistence from '../lib/owner/server/search-store.ts'
import ownerModel from '../lib/owner/model.ts'
const {shiftDay,signals,emptySeoState,measureExperiment,canonicalPage}=model
const page='https://www.playliva.com/pt-br/games/aviator', end='2026-09-27', now=new Date('2026-09-30T12:00:00Z'), inventory=new Set([page])
const fixture=(current={impressions:100,clicks:1},previous={impressions:100,clicks:5})=>Array.from({length:56},(_,i)=>({grain:'page',date:shiftDay(end,-55+i),page,query:'',country:'bra',device:'mobile',position:8,...(i>=28?current:previous)}))
const declining=()=>fixture().map((r,i)=>({...r,clicks:i<28?5:i<42?3:i<49?1:0}));
const ready=()=>({...emptySeoState(),enabled:true,newest:end,coverageFrom:shiftDay(end,-55),lastSuccess:now.toISOString()})
function memoryStore(){
  let state=emptySeoState(), facts=[], runs=[]
  return {state:async()=>structuredClone(state),facts:async(from)=>structuredClone(facts.filter(r=>r.date>=from)),runs:async()=>runs,
    claim:async run=>{if(runs.some(r=>r.day===run.day))return false;runs.push(run);return true},fail:async run=>{runs=runs.map(r=>r.day===run.day?run:r)},
    persist:async(run,rows)=>{facts=[...facts.filter(r=>r.date<run.from||r.date>run.to),...rows];runs=runs.map(r=>r.day===run.day?run:r);state={...state,lastSuccess:run.finishedAt,newest:run.to,coverageFrom:state.coverageFrom??run.from,revision:state.revision+1}},
    save:async next=>{if(next.revision!==state.revision)return false;state={...next,revision:state.revision+1};return true},seed:(next,rows)=>{state=next;facts=rows}}
}
const api=async body=>({rows:[{keys:body.dimensions.length===1?[end]:body.dimensions.includes('query')?[end,page,'aviator','bra','mobile']:[end,page,'bra','mobile'],clicks:1,impressions:100,position:8}]})

test('Search sync persists normalized grains, is daily idempotent and replaces only overlap',async()=>{
  const store=memoryStore();let calls=0;const query=async body=>{calls++;return api(body)}
  const a=await ingestion.ingestSearch(store,query,now);assert.equal(a.run.status,'success');assert.equal(calls,4)
  assert.equal((await store.facts('2020-01-01')).length,3)
  assert.equal((await ingestion.ingestSearch(store,query,now)).skipped,true);assert.equal(calls,4)
  await ingestion.ingestSearch(store,query,new Date('2026-10-01T12:00:00Z'));assert.equal((await store.facts('2020-01-01')).length,3)
})
test('Search failure/stale data/capped data preserve previous facts and do not retry the same day',async()=>{
  for(const query of [async()=>{throw Error('private provider error must not leak')},async()=>({rows:[{keys:['2026-08-01']}]}),async body=>body.dimensions.length===1?api(body):({rows:Array(25000).fill({})})]) {
    const store=memoryStore();store.seed(ready(),fixture());const before=await store.facts('2020-01-01')
    const result=await ingestion.ingestSearch(store,query,now);assert.ok(result.error);assert.doesNotMatch(result.error,/private provider/)
    assert.deepEqual(await store.facts('2020-01-01'),before);assert.equal((await ingestion.ingestSearch(store,query,now)).skipped,true)
  }
})
test('no Google data never invents metrics or destroys stored evidence',async()=>{
  const store=memoryStore();const result=await ingestion.ingestSearch(store,async()=>({}),now)
  assert.match(result.error,/no recent final data/);assert.equal((await store.state()).lastSuccess,null)
})
test('transient Google errors retry at most twice; authorization errors never retry',async()=>{
  let calls=0,waits=0
  const fetcher=async()=>{calls++;return calls<3?new Response('',{status:503}):Response.json({rows:[]})}
  assert.deepEqual(await ingestion.readSearch('https://example.invalid','fixture',{},fetcher,async()=>{waits++}),{rows:[]});assert.equal(calls,3);assert.equal(waits,2)
  calls=0;await assert.rejects(()=>ingestion.readSearch('https://example.invalid','fixture',{},async()=>{calls++;return new Response('',{status:401})}),/401/);assert.equal(calls,1)
})
test('canonical normalization merges only known tracking/host/trailing variants and preserves locale',()=>{
  assert.equal(canonicalPage('http://playliva.com/pt-br/games/aviator/?utm_source=a#top'),page)
  assert.equal(canonicalPage('https://evil.example/pt-br/games/aviator'),null)
  assert.equal(canonicalPage(page+'?category=slots'),null)
  assert.notEqual(canonicalPage(page.replace('/pt-br/','/en/')),page)
  const rows=ingestion.normalizeSearchRows([{keys:[end,page,'bra','mobile'],clicks:1,impressions:10,position:5},{keys:[end,page+'/?utm_source=x','bra','mobile'],clicks:2,impressions:20,position:8}],'page')
  assert.equal(rows.length,1);assert.equal(rows[0].clicks,3);assert.equal(rows[0].position,7)
})
test('winner requires meaningful persistent 7D and 14D growth; tiny data is never a winner',()=>{
  const growing=Array.from({length:56},(_,i)=>({ ...fixture()[i],impressions:i<28?50:i<35?70:i<42?90:i<49?120:180,clicks:i<28?3:i<35?5:i<42?6:i<49?8:12 }))
  assert.ok(signals(growing,end,inventory).some(s=>s.kind==='winner'))
  assert.equal(signals(fixture({impressions:1,clicks:0},{impressions:1,clicks:0}),end,inventory).length,0)
  assert.equal(signals(fixture({impressions:100,clicks:1}),end,inventory).some(s=>s.kind==='winner'),false)
})
test('striking distance and low CTR include windows and isolate BR/PT-BR/indexable pages',()=>{
  const facts=fixture(), observed=signals(facts,end,inventory)
  assert.ok(observed.some(s=>s.kind==='within-reach'));assert.ok(observed.some(s=>s.kind==='low-ctr'))
  assert.equal(observed[0].windows.length,3)
  assert.equal(signals(facts.map(r=>({...r,country:'usa'})),end,inventory).length,0)
  assert.equal(signals(facts,end,new Set()).length,0)
  assert.equal(signals(facts.map(r=>({...r,page:r.page.replace('/pt-br/','/en/')})),end,inventory).length,0)
  assert.deepEqual(signals([...facts,...facts.map(r=>({...r,grain:'query',query:''}))],end,inventory),observed)
})
test('conservative editor creates one real title experiment with complete reversible evidence',()=>{
  const next=autopilot.evaluateSearch(ready(),declining(),inventory,()=>({previous:'Aviator — Guia',next:'Aviator: como funciona e onde jogar'}),now)
  assert.equal(next.experiments.length,1);const e=next.experiments[0]
  assert.equal(e.status,'measuring');assert.equal(e.action,'title');assert.ok(e.previous&&e.next&&e.baseline&&e.evidence&&e.startedAt)
  assert.equal(e.startDate,'2026-10-01');assert.equal(next.audit.length,1)
  assert.equal(autopilot.evaluateSearch(next,fixture(),inventory,()=>({previous:'Other',next:'Next'}),now).experiments.length,1)
})
test('disabled, stale, insufficient history and page cooldown all prevent new edits',()=>{
  const signal=signals(declining(),end,inventory).find(s=>s.kind==='low-ctr')
  assert.ok(model.eligibleExperiment(signal,ready(),now,'old','new'))
  for(const s of [{...ready(),enabled:false},{...ready(),lastSuccess:'2026-09-01T00:00:00Z'},{...ready(),coverageFrom:end},{...ready(),experiments:[{page,status:'rolled_back',endedAt:now.toISOString(),startedAt:now.toISOString()}]}]) assert.equal(model.eligibleExperiment(signal,s,now,'old','new'),false)
})
test('measure at full 7/14/28 days; sustained negatives rollback, noise is inconclusive',()=>{
  const e={id:'fixture',page,status:'measuring',startDate:'2026-09-01',baseline:{to:'2026-08-31'},measurements:[]}
  const facts=Array.from({length:56},(_,i)=>({...fixture()[0],date:shiftDay('2026-08-04',i),impressions:200,clicks:i<28?10:1}))
  assert.equal(measureExperiment(e,facts,'2026-09-06',now).status,'measuring')
  assert.equal(measureExperiment(e,facts,'2026-09-07',now).status,'measuring')
  const loss=measureExperiment(e,facts,'2026-09-14',now);assert.equal(loss.status,'rolled_back');assert.equal(loss.measurements.length,2)
  const noise=facts.map(r=>({...r,impressions:10,clicks:0}));assert.equal(measureExperiment(e,noise,'2026-09-28',now).status,'inconclusive')
  const gain=facts.map(r=>({...r,clicks:r.date<'2026-09-01'?10:15}));assert.equal(measureExperiment(e,gain,'2026-09-28',now).status,'winner')
  const lagged={...e,startDate:'2026-09-04'}
  assert.deepEqual(measureExperiment(lagged,facts,'2026-09-10',now).measurements[0].previous,model.windowMeasure(facts,'2026-08-31',7))
})
test('owner kill switch restores active titles and retains audit/history',async()=>{
  const store=memoryStore();store.seed({...ready(),experiments:[{id:'a',page,status:'measuring',previous:'old',next:'new'}]},fixture())
  assert.deepEqual(await autopilot.setAutopilot(false,store,now),['/pt-br/games/aviator'])
  const state=await store.state();assert.equal(state.enabled,false);assert.equal(state.experiments[0].status,'rolled_back');assert.equal(state.experiments[0].previous,'old');assert.equal(state.audit.length,2)
})
test('additive migration matches runtime bootstrap; SEO scheduling cannot wake video production',async()=>{
  const migration=(await readFile('scripts/owner/migrations/003-search-console.sql','utf8')).replace(/\r\n/g,'\n').replace(/^--.*$/gm,'').split(';').map(s=>s.trim()).filter(Boolean)
  assert.deepEqual(migration,schema.SEARCH_SCHEMA)
  assert.equal(video.VIDEO_PRODUCTION_ENABLED,false)
  const config=JSON.parse(await readFile('vercel.json','utf8'));assert.deepEqual(config.crons,[{path:'/api/cron/seo',schedule:'17 9 * * *'}])
  const route=await readFile('app/api/cron/seo/route.ts','utf8');assert.doesNotMatch(route,/social|render|video|youtube/i);assert.match(route,/timingSafeEqual/);assert.match(route,/VERCEL_ENV!==\x27production\x27/)
})

test('persisted dashboard anchors periods to final Google dates and never invents zero from omitted dimensions',async()=>{
  const original={...persistence.searchStore}, previous=process.env.OWNER_DATABASE_URL
  process.env.OWNER_DATABASE_URL='fixture-not-used'
  Object.assign(persistence.searchStore,{state:async()=>ready(),runs:async()=>[],facts:async()=>[{...fixture()[0],date:end,grain:'total',page:'',query:'',country:'',device:'',clicks:2,impressions:99,position:48.4}]})
  try {
    const result=await report.searchSource(ownerModel.readFilters(new URLSearchParams('period=28&locale=pt-br&geo=br'),now))
    assert.equal(result.data.intelligence.from,'2026-08-31');assert.equal(result.data.intelligence.to,end)
    assert.equal(result.state,'no_data');assert.equal(result.data.clicks,null);assert.equal(result.data.impressions,null);assert.equal(result.data.ctr,null)
    assert.match(result.detail,/unknown, not zero/)
    const all=await report.searchSource(ownerModel.readFilters(new URLSearchParams('period=28'),now))
    assert.equal(all.data.clicks,2);assert.equal(all.data.impressions,99);assert.equal(all.state,'connected')
  }finally{Object.assign(persistence.searchStore,original);if(previous===undefined)delete process.env.OWNER_DATABASE_URL;else process.env.OWNER_DATABASE_URL=previous}
})
