import { commercialFixture } from './fixtures/promo-commercial.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import sharp from 'sharp'
import engine from '../lib/originals/rio-drift/engine.ts'
import records from '../lib/originals/rio-drift/records.ts'
import audio from '../lib/originals/rio-drift/audio.ts'
import catalog from '../lib/discovery/catalog.ts'
import query from '../lib/discovery/query.ts'
import help from '../lib/originals/game-help.ts'
import copy from '../lib/originals/rio-drift/copy.ts'
import definition from '../lib/originals/rio-drift/definition.ts'
import real from '../lib/originals/play-real.ts'
import engagement from '../lib/affiliates/betsson-engagement.ts'
import promo from '../lib/affiliates/betsson-promo.ts'
import owner from '../lib/owner/server/catalog.ts'
import automation from '../lib/owner/server/automation.ts'
import policy from '../lib/owner/video-production.ts'
import sitemap from '../app/sitemap.ts'
import search from '../lib/owner/search-model.ts'
import autopilot from '../lib/owner/server/search-autopilot.ts'
import analytics from '../lib/originals/analytics.ts'
import consent from '../lib/consent.ts'
import { JSDOM } from 'jsdom'

const memory = () => { const values = new Map(); return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)} }
// Test driver uses public physics, not a runtime auto-drive or outcome override.
function steering(s) {
  const r=engine.trackAt(s.distance),o=engine.trafficAt(s.obstacle),ahead=o.distance-s.distance
  const aim=ahead>0&&ahead<130?(o.x<=0?.44:-.44):0
  return engine.normalizedSteer(r.curve*.67*(s.speed/28)/.7+(aim-s.x)*1.9-s.lateral*.3)
}
function finish(id='run-1') {
  const s=engine.newDriftRun(id)
  for(let n=0;n<1000&&s.phase!=='result';n++)engine.stepDrift(s,1)
  assert.equal(s.phase,'result');return s
}
test('automatic acceleration, smooth traction and opposite/invalid input handling',()=>{
  assert.equal(engine.newDriftRun().phase,'ready')
  assert.equal(engine.steeringInput(true,true),0)
  for(const value of [NaN,Infinity,-Infinity])assert.equal(engine.normalizedSteer(value),0)
  assert.equal(engine.normalizedSteer(8),1)
  const s=engine.newDriftRun('physics')
  for(let i=0;i<120;i++)engine.stepDrift(s,.3)
  assert.ok(s.speed>18&&s.distance>10&&s.lateral>0&&s.angle>0)
  const lateral=s.lateral
  for(let i=0;i<80;i++)engine.stepDrift(s,0)
  assert.ok(s.lateral<lateral*.1)
  const before=structuredClone(s)
  for(const dt of [0,-1,NaN,Infinity,.2])engine.stepDrift(s,1,dt)
  assert.deepEqual(s,before)
})
test('30/60/120fps produce the same collision, score and drift distance with fixed steps',()=>{
  const results=[30,60,120].map(fps=>{
    const s=engine.newDriftRun('cadence');let carry=0
    for(let frame=0;frame<fps*8;frame++)carry=engine.advanceDrift(s,1,1/fps,carry)
    return s
  })
  for(const s of results){assert.equal(s.phase,'result');assert.equal(s.reason,'edge')}
  assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2])
  const s=engine.newDriftRun('bounded');engine.advanceDrift(s,0,500,Infinity)
  assert.ok(s.time<=.11);assert.ok(Number.isFinite(s.x))
})
test('every authored corner/district is controllable; clean drift rewards exceed straight distance',()=>{
  const s=engine.newDriftRun('skilled'),districts=new Set(),seen=new Set()
  for(let i=0;i<120*120;i++){
    const r=engine.trackAt(s.distance);districts.add(r.district);seen.add(r.hairpin)
    engine.stepDrift(s,steering(s))
    assert.equal(s.phase,'running',`drivable at ${s.distance}`)
    assert.ok(Math.abs(s.x)<r.halfWidth)
  }
  assert.deepEqual([...districts].sort(),['city','coast','tunnel'])
  assert.equal(seen.size,2);assert.equal(s.bestCombo,5)
  assert.ok(s.cleanCorners>=3);assert.ok(s.nearMisses>=1)
  assert.ok(s.score>s.distance*1.4*2);assert.ok(s.driftTime>40)
})
test('losing the clean line breaks combo; road and traffic impacts settle after the reaction',()=>{
  const s=engine.newDriftRun('combo');s.distance=420;s.combo=4;s.comboTime=5;s.x=.94
  engine.stepDrift(s,0);assert.equal(s.combo,1);assert.equal(s.comboTime,0)
  const traffic=engine.newDriftRun('traffic');traffic.distance=538;traffic.speed=27;traffic.x=-.42
  engine.stepDrift(traffic,0);assert.equal(traffic.phase,'impact');assert.equal(traffic.reason,'traffic')
  const score=traffic.score
  for(let i=0;i<90;i++)engine.stepDrift(traffic,1)
  assert.equal(traffic.phase,'impact');assert.equal(traffic.score,score)
  for(let i=0;i<10;i++)engine.stepDrift(traffic,1)
  assert.equal(traffic.phase,'result');assert.equal(traffic.drifting,false)
})
test('every obstacle has a readable escape lane, including maximum track narrowing',()=>{
  for(let i=0;i<100;i++){
    const o=engine.trafficAt(i),r=engine.trackAt(o.distance)
    assert.ok(r.halfWidth-Math.abs(o.x)>.23)
    assert.ok(Math.abs((o.x<=0?.44:-.44)-o.x)>.23)
    assert.ok(['taxi','van','cones'].includes(o.kind))
  }
})
test('records settle once, reload correctly, merge another tab and do not save abandoned runs',()=>{
  const storage=memory(),store=records.createDriftRecordStore(()=>storage),s=finish()
  assert.equal(store.complete(engine.newDriftRun('abandoned')).record.runs,0)
  assert.equal(store.complete(s).best,true);const saved=store.getSnapshot()
  assert.equal(saved.record.runs,1);assert.equal(store.complete(s).best,false)
  assert.equal(store.getSnapshot().record.runs,1)
  const reload=records.createDriftRecordStore(()=>storage);reload.subscribe(()=>{})
  assert.deepEqual(reload.getSnapshot().record,saved.record)
  const better=finish('run-2');better.score+=500;better.bestCombo=5
  const tab=records.createDriftRecordStore(()=>storage);tab.complete(better)
  const lower=finish('run-3');store.complete(lower)
  assert.equal(store.getSnapshot().record.score,engine.scoreFor(better))
  assert.equal(store.getSnapshot().record.runs,3)
})
test('corrupt/blocked storage fails safely, retaining a playable session record',()=>{
  for(const raw of ['broken',JSON.stringify({version:1,score:-1}),JSON.stringify({...records.emptyRecord(),combo:6}), 'x'.repeat(501)])assert.deepEqual(records.readRecord({getItem:()=>raw}),records.emptyRecord())
  const store=records.createDriftRecordStore(()=>{throw Error('denied')})
  assert.equal(store.complete(finish()).saved,false);assert.ok(store.getSnapshot().record.score>0)
  assert.equal(store.complete(finish('other')).record.runs,2)
})
test('shared offer appears at settled runs 3/6/9 only, never driving or reacting; dismissal preserves cadence',()=>{
  const opened=[],timers=[],held=[]
  const t=engagement.createEngagementTrigger({cycleMultiple:3,delayMs:650,open:m=>opened.push(m),close(){},hold:on=>held.push(on),schedule:fn=>{timers.push(fn);return timers.length},cancel:id=>{timers[id-1]=()=>{}}})
  t.observe(false)
  for(let cycle=1;cycle<=9;cycle++){
    const s=engine.newDriftRun('cycle-'+cycle);t.observe(true)
    for(let i=0;i<500&&s.phase==='running';i++)engine.stepDrift(s,1)
    assert.equal(s.phase,'impact');t.observe(true);assert.equal(t.isOpen,false)
    while(s.phase!=='result')engine.stepDrift(s,0)
    t.observe(false);t.observe(false)
    assert.equal(t.isOpen,false);assert.equal(held.at(-1),cycle%3===0)
    timers.splice(0).forEach(fn=>fn());assert.equal(t.isOpen,cycle%3===0)
    if(t.isOpen)t.dismiss()
  }
  assert.deepEqual(opened.map(m=>m.completedCycleNumber),[3,6,9])
  assert.deepEqual(opened.map(m=>m.exposureNumber),[1,2,3])
  t.dispose()
})
test('Target GEO eligibility is inherited; no operator-equivalent arcade claim or non-BR commercial leakage',()=>{
  const place=promo.BETSSON_PROMO_PLACEMENTS.originalsEngagement
  assert.equal(promo.getBetssonPromo('BR','pt-BR',place,{pageSlug:'rio-drift'}),null)
  for(const geo of ['MX','CO','PE']){const snapshot=commercialFixture(geo);assert.ok(promo.getBetssonPromo(geo,`es-${geo}`,place,{pageSlug:'rio-drift',snapshot}));assert.deepEqual(real.getOriginalOperatorCtas(definition.RIO_DRIFT,geo,`es-${geo}`,snapshot),[])}
  for(const geo of ['GE','US','MX','PT'])for(const locale of ['pt-BR','en','es-MX'])assert.equal(promo.getBetssonPromo(geo,locale,place,{pageSlug:'rio-drift'}),null)
  assert.deepEqual(real.getOriginalOperatorCtas(definition.RIO_DRIFT,'BR','pt-BR'),[])
})
test('all locales have useful rules, one search entry, arcade links, localized sitemap and owner inventory',async()=>{
  for(const locale of ['pt-BR','en','es-MX']){
    const entries=catalog.discoveryEntries(locale),entry=entries.find(g=>g.slug==='rio-drift')
    assert.equal(entries.filter(g=>g.slug==='rio-drift').length,1)
    assert.equal(entry.category,'arcade');assert.equal(entry.format,'racing')
    for(const q of ['Rio Drift','Rio','Drift','Racing','Skill'])assert.equal(query.queryDirectory(entries,{q}).items[0].slug,'rio-drift')
    assert.equal(catalog.relatedDiscovery(entry,entries,'provider').length,0)
    assert.ok(copy.driftCopy(locale).paragraphs.join(' ').length>1000)
    const rules=await help.loadGameHelp('rio-drift',locale)
    assert.ok(rules.sections.flatMap(s=>s.items).length>=8)
    for(const path of ['/play/rio-drift','/arcade'])assert.equal(sitemap.default().filter(r=>r.url.endsWith(`/${locale.toLowerCase()}${path}`)).length,1)
  }
  assert.equal(owner.ownerGames.filter(g=>g.slug==='rio-drift').length,1)
  assert.equal(owner.publishedInventory().filter(g=>g.route.endsWith('/play/rio-drift')).length,3)
})
test('automatic video production stays off and the dormant daily catalog remains exactly twelve',()=>{
  assert.equal(automation.generationGames().length,12)
  assert.ok(!automation.generationGames().some(g=>g.slug==='rio-drift'))
  assert.throws(()=>policy.videoProductionPolicy.assertEnabled(),/disabled/i)
})
test('Rio-specific Autopilot uses the existing evidence, country, history, cooldown and rollback gates',()=>{
  const page='https://www.playliva.com/pt-br/play/rio-drift',end='2026-09-27',now=new Date('2026-09-30T12:00:00Z')
  const state={...search.emptySeoState(),enabled:true,newest:end,coverageFrom:search.shiftDay(end,-55),lastSuccess:now.toISOString()}
  const inventory=new Set([page]),facts=Array.from({length:56},(_,i)=>({grain:'page',date:search.shiftDay(end,-55+i),page,query:'',country:'bra',device:'mobile',position:8,impressions:100,clicks:i<28?5:i<42?3:i<49?1:0}))
  const target=autopilot.searchTarget(page)
  assert.ok(target.previous.includes('Rio Drift'));assert.ok(target.next.includes('drift grátis'))
  assert.doesNotMatch(target.next,/onde jogar|casino|aposta/i)
  assert.equal(autopilot.evaluateSearch(state,[],inventory,undefined,now).experiments.length,0)
  const result=autopilot.evaluateSearch(state,facts,inventory,undefined,now)
  assert.equal(result.experiments.length,1);assert.equal(result.experiments[0].measurements.length,0)
  assert.equal(autopilot.evaluateSearch(result,facts,inventory,undefined,now).experiments.length,1)
  for(const s of [{...state,enabled:false},{...state,coverageFrom:end},{...state,lastSuccess:'2026-09-01'}, {...state,experiments:[{page,status:'rolled_back',endedAt:now.toISOString()}]}])assert.equal(autopilot.evaluateSearch(s,facts,inventory,undefined,now).experiments.filter(e=>e.status==='measuring').length,0)
  for(const url of [page.replace('pt-br','en'),page.replace('rio-drift','avia-de-janeiro'),page+'?q=x'])assert.equal(search.isSearchTitleTarget(url),false)
})
test('run and best-score analytics respect consent; scores stay coarse and never include records or balance',()=>{
  const dom=new JSDOM('',{url:'https://www.playliva.com/pt-br/play/rio-drift'}),old=new Map()
  for(const key of ['window','document','location','Event']){old.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,value:dom.window[key]})}
  try{
    dom.window.dataLayer=[]
    const c={originalId:'rio-drift',originalSlug:'rio-drift',category:'arcade',country:'BR',locale:'pt-BR',roundId:'rio-run-1',scoreBucket:'1k-5k'}
    consent.saveConsent({necessary:true,analytics:false,marketing:false});analytics.trackFreePlay('demo_round_complete',c);assert.equal(dom.window.dataLayer.length,0)
    consent.saveConsent({necessary:true,analytics:true,marketing:false});analytics.trackFreePlay('demo_round_complete',c);analytics.trackFreePlay('demo_best_score',c)
    assert.equal(dom.window.dataLayer.length,2)
    assert.equal(dom.window.dataLayer[1].scoreBucket,'1k-5k');assert.equal(dom.window.dataLayer[1].category,'arcade')
    for(const row of dom.window.dataLayer)for(const key of ['score','balance','best','history','records'])assert.equal(row[key],undefined)
    consent.saveConsent({necessary:true,analytics:false,marketing:false});analytics.trackFreePlay('demo_best_score',c);assert.equal(dom.window.dataLayer.length,2)
  }finally{for(const [key,descriptor] of old)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];dom.window.close()}
})
test('audio updates intensity without restarting schedulers every frame and disposes safely',()=>{
  const calls=[],synth={music:null,setMix(){},setEnabled:on=>calls.push(['enabled',on]),setVisible:on=>calls.push(['visible',on]),unlock(){},startLoop:()=>calls.push(['loop']),stopLoop:()=>calls.push(['stop']),musicLevel:()=>calls.push(['level']),ready:()=>null,dispose:()=>calls.push(['dispose'])}
  const a=audio.createDriftAudio(synth),s=engine.newDriftRun('audio')
  a.setEnabled(true);a.unlock();a.drive(s,false);const count=calls.length
  for(let i=0;i<120;i++)a.drive(s,false)
  assert.equal(calls.length,count)
  a.drive(s,true);assert.equal(calls.length,count+2)
  a.setVisible(false);assert.equal(calls.at(-1)[0],'stop')
  a.setEnabled(false);a.cue('crash');a.dispose();assert.equal(calls.at(-1)[0],'dispose')
})
test('real shared synthesis stays gesture-lazy, owns one context/loop and cleans up mute/hide/unmount',()=>{
  const old=Object.getOwnPropertyDescriptor(globalThis,'window'),contexts=[];let timers=0
  const param=value=>({value,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}})
  const node=extra=>({connect(){},disconnect(){},...extra})
  function makeContext(){
    const context={currentTime:0,state:'running',sampleRate:44100,destination:node({}),closed:false,
      createGain:()=>node({gain:param(1)}),createOscillator:()=>node({frequency:param(440),detune:param(0),start(){},stop(){},onended:null}),
      createBufferSource:()=>node({start(){},stop(){},onended:null}),createBuffer:(_channels,frames)=>({getChannelData:()=>new Float32Array(frames)}),
      createBiquadFilter:()=>node({frequency:param(1000),Q:param(1)}),createDynamicsCompressor:()=>node({threshold:param(0),knee:param(0),ratio:param(1),attack:param(0),release:param(0)}),
      resume(){this.state='running';return Promise.resolve()},suspend(){this.state='suspended';return Promise.resolve()},close(){this.closed=true;return Promise.resolve()}}
    contexts.push(context);return context
  }
  Object.defineProperty(globalThis,'window',{configurable:true,value:{AudioContext:function(){return makeContext()},setInterval(){timers++;return timers},clearInterval(){timers=Math.max(0,timers-1)},setTimeout(fn){fn();return 0}}})
  try{
    const a=audio.createDriftAudio(),s=engine.newDriftRun('real-audio')
    a.setMix({music:true,sfx:true});a.setEnabled(true);a.drive(s,false)
    assert.equal(contexts.length,0);a.unlock();a.unlock();assert.equal(contexts.length,1);assert.equal(timers,1)
    for(const cue of ['start','combo','near','crash','finish','ui'])a.cue(cue)
    for(let i=0;i<100;i++){a.drive(s,false);a.setMix({music:i%2===0,sfx:true})}
    assert.equal(timers,1);assert.equal(contexts.length,1)
    a.setVisible(false);assert.equal(timers,0);a.setVisible(true);assert.equal(timers,1)
    a.setEnabled(false);assert.equal(timers,0);a.setEnabled(true);assert.equal(timers,1)
    a.dispose();assert.equal(timers,0);assert.equal(contexts[0].closed,true)
  }finally{if(old)Object.defineProperty(globalThis,'window',old);else delete globalThis.window}
})
test('original raster covers are small and correctly sized; engine, credits and wallet remain separate',async()=>{
  for(const [file,height] of [['poster.webp',675],['share.webp',630]]){
    const path='public/originals/rio-drift/'+file,m=await sharp(path).metadata()
    assert.equal(m.width,1200);assert.equal(m.height,height);assert.ok((await stat(path)).size<160000)
  }
  const source=await readFile('components/originals/rio-drift/game.tsx','utf8')
  assert.doesNotMatch(source,/wallet\.(?:debit|credit|settle|startRound|placeBet|applyReceipt)/)
  assert.match(source,/PlayGameShell/);assert.match(source,/engagementActive=\{active\}/)
  assert.match(source,/onPointerCancel=\{release\}/);assert.match(source,/clearInput\(\); remainder.current = 0/)
})
