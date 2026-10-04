import { commercialFixture } from './fixtures/promo-commercial.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import sharp from 'sharp'
import engine from '../lib/originals/rio-drift/crash-engine.ts'
import walletModule from '../lib/originals/session.ts'
import audio from '../lib/originals/rio-drift/audio.ts'
import catalog from '../lib/discovery/catalog.ts'
import query from '../lib/discovery/query.ts'
import help from '../lib/originals/game-help.ts'
import copy from '../lib/originals/rio-drift/copy.ts'
import definition from '../lib/originals/rio-drift/definition.ts'
import promo from '../lib/affiliates/betsson-promo.ts'
import automation from '../lib/owner/server/automation.ts'
import policy from '../lib/owner/video-production.ts'
import sitemap from '../app/sitemap.ts'
import autopilot from '../lib/owner/server/search-autopilot.ts'

const sampleFor = point => Math.ceil((1-97/(point+.25))*0x1_0000_0000)
function fixture(point=400,extra={}) {
 let at=1000,n=0
 const wallet=walletModule.createDemoSessionStore(()=>null,()=>at)
 wallet.hydrate()
 const game=engine.createTurboEngine(wallet,{now:()=>at,id:()=>`turbo-${++n}`,random:{uint32:()=>sampleFor(point)},...extra})
 return {wallet,game,at(value){at=value;game.tick()},jump(ms){at+=ms;game.tick()},balance:()=>wallet.getSnapshot().session.balance,transactions:()=>wallet.getSnapshot().session.transactions}
}

test('stable identity becomes Crash; ignition is brief and no future outcome enters the snapshot',()=>{
 const f=fixture();assert.equal(definition.RIO_DRIFT.id,'rio-drift');assert.equal(definition.RIO_DRIFT.slug,'rio-drift');assert.equal(definition.RIO_DRIFT.category,'crash')
 assert.equal(f.game.start(100).ok,true);assert.equal(f.game.getSnapshot().phase,'launch')
 assert.equal(f.game.cashOut(),false);assert.equal(f.balance(),walletModule.INITIAL_CREDIT_UNITS-100)
 for(const key of ['point','crashAt','random','score','combo'])assert.equal(key in f.game.getSnapshot(),false)
 f.jump(engine.LAUNCH_MS-1);assert.equal(f.game.getSnapshot().phase,'launch')
 f.jump(1);assert.equal(f.game.getSnapshot().phase,'running');assert.equal(f.game.getSnapshot().multiplier,100)
 assert.equal(f.game.start(100).ok,false);assert.equal(f.wallet.reset().ok,false)
})
test('manual cashout locks one exact integer return while round continues to crash',()=>{
 const f=fixture(400);f.game.start(500);f.jump(engine.LAUNCH_MS+engine.timeToMultiplier(200)+.01)
 assert.equal(f.game.cashOut('stale'),false);assert.equal(f.game.cashOut(),true);assert.equal(f.game.cashOut(),false)
 assert.equal(f.game.getSnapshot().result.payout,1000);assert.equal(f.game.getSnapshot().phase,'running')
 const balance=f.balance();f.jump(100000);assert.equal(f.game.getSnapshot().phase,'crashed');assert.equal(f.game.getSnapshot().multiplier,400);assert.equal(f.balance(),balance)
 f.jump(engine.REACTION_MS-1);assert.equal(f.game.getSnapshot().phase,'crashed');f.jump(1);assert.equal(f.game.getSnapshot().phase,'ready')
 assert.equal(f.transactions().length,2);assert.ok(f.transactions().every(x=>x.gameId==='rio-drift'))
 assert.equal(f.wallet.reset().ok,true)
})
test('automatic deadline wins before crash even when both are observed in a delayed tick',()=>{
 const f=fixture(400);f.game.start(100,200);f.jump(100000)
 assert.equal(f.game.getSnapshot().phase,'crashed');assert.equal(f.game.getSnapshot().result.won,true);assert.equal(f.game.getSnapshot().result.multiplier,200)
 assert.equal(f.transactions().length,2);for(let i=0;i<10;i++)f.jump(100000);assert.equal(f.transactions().length,2)
})
test('manual and auto equality lose, instant crashes debit once and cannot be cashed out',()=>{
 for(const point of [100,200,2500])for(const auto of [null,point===100?101:point]) {
  const f=fixture(point);f.game.start(100,auto);f.at(1000+engine.LAUNCH_MS+engine.timeToMultiplier(point))
  assert.equal(f.game.cashOut(),false);assert.equal(f.game.getSnapshot().phase,'crashed');assert.equal(f.game.getSnapshot().result.won,false)
  assert.equal(f.balance(),walletModule.INITIAL_CREDIT_UNITS-100);assert.equal(f.transactions().length,1)
 }
})
test('25x finishes and auto-banks only if strictly before sampled crash, never at the tied crash',()=>{
 for(const auto of [null,2500]) {
  const f=fixture(3000);f.game.start(100,auto);f.jump(engine.LAUNCH_MS+engine.timeToMultiplier(2500))
  assert.equal(f.game.getSnapshot().phase,'finished');assert.equal(f.game.getSnapshot().result.payout,2500)
  assert.equal(f.game.getSnapshot().history[0].capped,true);assert.equal(f.transactions().length,2)
 }
 const f=fixture(2500);f.game.start(100,2500);f.jump(100000)
 assert.equal(f.game.getSnapshot().phase,'crashed');assert.equal(f.game.getSnapshot().result.won,false)
})
test('cadence does not affect outcomes; regressing clocks never rewind a round',()=>{
 const results=[30,60,120].map(fps=>{const f=fixture(400);f.game.start(333,200);for(let i=1;i<fps*12;i++)f.at(1000+i*1000/fps);return {result:f.game.getSnapshot().result,balance:f.balance(),history:f.game.getSnapshot().history}})
 assert.deepEqual(results[0],results[1]);assert.deepEqual(results[1],results[2]);assert.equal(results[0].result.payout,666)
 const f=fixture();f.game.start(100);f.jump(2000);const before=f.game.getSnapshot();f.at(0);assert.deepEqual(f.game.getSnapshot(),before)
})
test('invalid input or RNG never debit; duplicate ids and reentry never double settle',()=>{
 for(const stake of [0,99,5001,NaN,1.1,Infinity]) {const f=fixture();assert.equal(f.game.start(stake).ok,false);assert.equal(f.transactions().length,0)}
 for(const auto of [100,2501,NaN,Infinity,101.5]) {const f=fixture();assert.equal(f.game.start(100,auto).ok,false);assert.equal(f.transactions().length,0)}
 for(const random of [{uint32:()=>NaN},{uint32:()=>{throw Error('unavailable')}}]) {const f=fixture(400,{random});assert.equal(f.game.start(100).reason,'random-unavailable');assert.equal(f.transactions().length,0)}
 const f=fixture(400,{id:()=> 'one'});f.game.start(100,200)
 f.wallet.subscribe(()=>{f.game.cashOut();f.game.start(100)})
 f.jump(100000);f.jump(engine.REACTION_MS);assert.equal(f.game.start(100).ok,false);assert.equal(f.transactions().length,2)
})
test('reload does not restore or refund active rounds; legacy skill storage is untouched',async()=>{
 const values=new Map([['playliva.originals.rio-drift.records','legacy-score']]),storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)}
 const first=walletModule.createDemoSessionStore(()=>storage);const game=engine.createTurboEngine(first);game.start(100)
 const second=walletModule.createDemoSessionStore(()=>storage);second.hydrate();assert.equal(second.getSnapshot().session.balance,walletModule.INITIAL_CREDIT_UNITS-100)
 assert.equal(engine.createTurboEngine(second).getSnapshot().phase,'ready');assert.equal(values.get('playliva.originals.rio-drift.records'),'legacy-score')
 const source=await readFile('components/originals/rio-drift/game.tsx','utf8');assert.doesNotMatch(source,/records|steeringInput|PointerEvent|wallet\.(debit|credit)/)
})
test('five locales describe crash accurately, retain old search alias, preserve stable routes and fail closed',async()=>{
 for(const locale of ['pt-BR','en','es-MX','es-CO','es-PE']){
  const entries=catalog.discoveryEntries(locale),entry=entries.find(g=>g.slug==='rio-drift')
  assert.equal(entries.filter(g=>g.slug==='rio-drift').length,1);assert.equal(entry.category,'crash');assert.equal(entry.format,'crash')
  for(const q of ['Liva Turbo Crash','Rio Drift'])assert.equal(query.queryDirectory(entries,{q}).items[0].slug,'rio-drift')
  assert.ok(catalog.relatedDiscovery(entry,entries,'provider').length>0)
  const c=copy.driftCopy(locale);assert.ok(c.paragraphs.join(' ').length>1000);assert.match(c.title,/Liva Turbo Crash/)
  assert.ok((await help.loadGameHelp('rio-drift',locale)).sections.flatMap(s=>s.items).length>=8)
 }
 for(const locale of ['pt-br','en','es-mx'])assert.equal(sitemap.default().filter(r=>r.url.endsWith(`/${locale}/play/rio-drift`)).length,1)
 for(const geo of ['MX','CO','PE','BR','GE'])assert.equal(promo.getBetssonPromo(geo,'es-MX',promo.BETSSON_PROMO_PLACEMENTS.originalsEngagement,{pageSlug:'rio-drift'}),null)
 for(const geo of ['MX','CO','PE'])assert.ok(promo.getBetssonPromo(geo,`es-${geo}`,promo.BETSSON_PROMO_PLACEMENTS.originalsEngagement,{pageSlug:'rio-drift',snapshot:commercialFixture(geo)}))
 assert.match(autopilot.searchTarget('https://www.playliva.com/pt-br/play/rio-drift').next,/Liva Turbo Crash/)
 assert.ok(!automation.generationGames().some(g=>g.slug==='rio-drift'));assert.throws(()=>policy.videoProductionPolicy.assertEnabled(),/disabled/i)
})
test('audio intensity changes without restarting the shared loop; mute, hide and dispose remain effective',()=>{
 const calls=[],synth={music:null,setMix(){},setEnabled:on=>calls.push(['enabled',on]),setVisible:on=>calls.push(['visible',on]),unlock(){},startLoop:()=>calls.push(['loop']),stopLoop:()=>calls.push(['stop']),musicLevel:()=>calls.push(['level']),ready:()=>null,dispose:()=>calls.push(['dispose'])}
 const a=audio.createDriftAudio(synth),s={phase:'running',multiplier:100};a.setEnabled(true);a.unlock();a.drive(s);const count=calls.length
 for(let i=0;i<120;i++)a.drive({...s,multiplier:100+i});assert.equal(calls.length,count)
 a.drive({...s,phase:'crashed'});assert.equal(calls.length,count+2);a.setVisible(false);assert.equal(calls.at(-1)[0],'stop');a.setEnabled(false);a.cue('crash');a.dispose();assert.equal(calls.at(-1)[0],'dispose')
})
test('original covers are compact and correctly sized',async()=>{
 for(const [file,height] of [['poster.webp',675],['share.webp',630]]){const path='public/originals/rio-drift/'+file,m=await sharp(path).metadata();assert.equal(m.width,1200);assert.equal(m.height,height);assert.ok((await stat(path)).size<160000)}
 assert.match(await readFile('assets-source/rio-drift/poster.svg','utf8'),/LIVA TURBO/)
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
    const a=audio.createDriftAudio(),s={phase:'running',multiplier:100}
    a.setMix({music:true,sfx:true});a.setEnabled(true);a.drive(s)
    assert.equal(contexts.length,0);a.unlock();a.unlock();assert.equal(contexts.length,1);assert.equal(timers,1)
    for(const cue of ['start','cashout','crash','finish','ui'])a.cue(cue)
    for(let i=0;i<100;i++){a.drive(s);a.setMix({music:i%2===0,sfx:true})}
    assert.equal(timers,1);assert.equal(contexts.length,1)
    a.setVisible(false);assert.equal(timers,0);a.setVisible(true);assert.equal(timers,1)
    a.setEnabled(false);assert.equal(timers,0);a.setEnabled(true);assert.equal(timers,1)
    a.dispose();assert.equal(timers,0);assert.equal(contexts[0].closed,true)
  }finally{if(old)Object.defineProperty(globalThis,'window',old);else delete globalThis.window}
})
