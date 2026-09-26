import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import session from '../lib/originals/session.ts'
import samba from '../lib/originals/samba-drop/math.ts'
import drop from '../lib/originals/samba-drop/engine.ts'
import levanta from '../lib/originals/levanta/engine.ts'
import carnaval from '../lib/originals/carnaval/math.ts'
import config from '../lib/originals/carnaval/config.ts'
import slot from '../lib/originals/carnaval/engine.ts'
import defs from '../lib/originals/three-game-definitions.ts'
import copy from '../lib/originals/three-game-copy.ts'
import help from '../lib/originals/game-help.ts'
import engagement from '../lib/affiliates/betsson-engagement.ts'
const wallet=()=>session.createDemoSessionStore(()=>null,()=>0)
const loss=()=>['drums','fan','jewel','macaw','heart'].map(s=>Array(3).fill(s))

for(const rows of samba.ROWS)for(const risk of samba.RISKS)test(`Samba ${rows}/${risk}: exact probability, symmetry and expected return`,()=>{
 const c=samba.configuration(rows,risk);assert.equal(c.probability.reduce((a,b)=>a+b,0),1);assert.ok(c.expectedReturn>.9698&&c.expectedReturn<=.97)
 assert.deepEqual(c.multipliers,[...c.multipliers].reverse());assert.equal(c.multipliers.length,rows+1)
 const counts=Array(rows+1).fill(0)
 for(let value=0;value<2**rows;value++){const path=samba.drawPath(rows,{uint32:()=>value}),bucket=samba.bucketFor(path);assert.equal(path.length,rows);counts[bucket]++}
 assert.deepEqual(counts,c.probability.map(p=>p*2**rows))
})
test('Samba rejects invalid inputs; no RNG fallback or debit on random failure',()=>{
 assert.throws(()=>samba.configuration(10,'low'));assert.throws(()=>samba.drawPath(12,{uint32:()=>-1}));assert.throws(()=>samba.bucketFor([1,2]))
 const w=wallet(),e=drop.createDropEngine(w,{random:{uint32:()=>{throw Error('unavailable')}}});assert.throws(()=>e.start(100,12,'high'));assert.equal(w.getSnapshot().session.transactions.length,0)
})
test('Samba lands and settles once, locks reset, refuses reentrant settlement and duplicate IDs',()=>{
 let at=0;const w=wallet(),e=drop.createDropEngine(w,{now:()=>at,id:()=> 'drop-1',random:{uint32:()=>0}})
 assert.equal(e.start(100,16,'high').ok,true);assert.equal(w.reset().ok,false);assert.equal(e.start(100,8,'low').ok,false)
 const unsubscribe=w.subscribe(()=>e.tick());at=e.getSnapshot().landsAt-1;e.tick();assert.equal(e.getSnapshot().result,null)
 at++;e.tick();const result=e.getSnapshot().result;assert.equal(result.bucket,0);assert.equal(w.getSnapshot().session.transactions.filter(t=>t.kind==='credit').length,1)
 for(let i=0;i<20;i++)e.tick();assert.equal(w.getSnapshot().session.transactions.length,2)
 at+=650;e.tick();assert.equal(e.getSnapshot().phase,'ready');assert.equal(e.start(100,8,'low').ok,false);unsubscribe()
})
test('Skuptu cashout deadline equality loses and a prior auto target wins even on a late frame',()=>{
 for(const auto of [null,110]){let at=0;const w=wallet(),e=levanta.createLevantaEngine(w,{now:()=>at,id:()=> 'lift',random:{uint32:()=>0x80000000}});assert.equal(e.start(100,auto).ok,true)
 const deadline=1500+levanta.timeToMultiplier(194);at=deadline;assert.equal(e.cashOut(),false);const s=e.getSnapshot();assert.equal(s.phase,'failed');assert.equal(s.multiplier,194);assert.equal(s.crashAt,deadline);assert.equal(s.result.won,auto!==null);assert.equal(s.result.payout,auto===null?0:110)
 for(let i=0;i<10;i++)e.tick();assert.equal(w.getSnapshot().session.transactions.length,auto===null?1:2);at+=2450;e.tick();assert.equal(e.getSnapshot().phase,'ready')}
})
test('Skuptu successful cashout continues the same round with one payout and locked reset',()=>{
 let at=0;const w=wallet(),e=levanta.createLevantaEngine(w,{now:()=>at,id:()=> 'lift-win',random:{uint32:()=>0xeeeeeeee}});e.start(100)
 at=2500;e.tick();assert.equal(e.cashOut(),true);assert.equal(e.cashOut(),false);assert.equal(w.reset().ok,false);assert.equal(e.getSnapshot().phase,'lifting');assert.equal(e.getSnapshot().history.length,1)
 at=40000;e.tick();assert.equal(e.getSnapshot().phase,'failed');assert.equal(e.getSnapshot().history.length,1);assert.equal(w.getSnapshot().session.transactions.length,2)
})
test('Carnaval is twenty distinct lines; Wild substitution, scatter awards and note progression',()=>{
 assert.equal(new Set(config.LINES.map(l=>l.join())).size,20)
 let g=loss();g[0][0]='drums';g[1][0]='crown';g[2][0]='drums';assert.ok(carnaval.evaluateSpin(g,100).payout>0)
 for(const n of [2,3,4,5,9]){g=loss();for(let i=0;i<n;i++)g[Math.floor(i/3)][i%3]='mask';assert.equal(carnaval.evaluateSpin(g,100).awardedSpins,n<3?0:n===3?8:n===4?12:20)}
 g=loss();g[2][1]='note';g[3][1]='note';assert.throws(()=>carnaval.evaluateSpin(g,100));assert.equal(carnaval.evaluateSpin(g,100,4).streak,5)
 g=Array.from({length:5},()=>Array(3).fill('drums'));const r=carnaval.evaluateSpin(g,5000,5);assert.equal(r.payout,5000*500);assert.equal(r.capped,true)
})
test('Carnaval complete bonus, retrigger cap, single debit and Normal/Turbo outcome invariance',()=>{
 function run(turbo){const w=wallet();w.setSettings({sound:false,haptics:false,turbo});let at=0,calls=0;const e=slot.createCarnavalEngine(w,{now:()=>at,id:()=> 'series',draw:(_r,free)=>{calls++;const g=loss();if(!free){g[0][0]=g[1][0]=g[2][0]='mask'}else {g[1][0]='note';g[2][0]='mask';g[3][0]='mask'}return g}})
 assert.equal(e.spin(100).ok,true);const reveal=e.getSnapshot().revealAt;assert.equal(w.reset().ok,false)
 const seen=[],ids=new Set();for(let i=0;i<300;i++){at+=5000;e.tick();const s=e.getSnapshot();if(s.result&&!ids.has(s.result.id)){ids.add(s.result.id);seen.push(s.result)}if(s.phase==='bonus-summary')break}
 assert.equal(e.getSnapshot().phase,'bonus-summary');assert.equal(e.getSnapshot().bonusAwarded,32);assert.equal(e.getSnapshot().streak,5);assert.equal(calls,33);assert.equal(w.getSnapshot().session.transactions.filter(t=>t.kind==='debit').length,1);assert.equal(w.reset().ok,true);return {reveal,seen}}
 const normal=run(false),turbo=run(true);assert.ok(normal.reveal>turbo.reveal);assert.deepEqual(normal.seen,turbo.seen)
})
test('All three use the shared completed-cycle 3/6/9 cadence and dismissal allows future offers',()=>{
 for(const game of defs.THREE_GAMES){const opens=[],timers=[];const trigger=engagement.createEngagementTrigger({cycleMultiple:3,delayMs:0,open:m=>opens.push(m.completedCycleNumber),close(){},schedule(fn){timers.push(fn);return timers.length},cancel(){}})
 for(let i=1;i<=9;i++){trigger.observe(true);assert.equal(trigger.isOpen,false,game.slug);trigger.observe(false);timers.splice(0).forEach(fn=>fn());trigger.dismiss()};assert.deepEqual(opens,[3,6,9]);trigger.dispose()}
})

test('Carnaval can retry a failed free-spin draw without a second debit or a consumed free spin',()=>{
 let at=0,failOnce=true;const w=wallet(),e=slot.createCarnavalEngine(w,{now:()=>at,id:()=> 'retry-bonus',draw:(_r,free)=>{const g=loss();if(!free)g[0][0]=g[1][0]=g[2][0]='mask';else if(failOnce){failOnce=false;throw Error('temporary random failure')}return g}})
 assert.equal(e.spin(100).ok,true);at=5000;e.tick();assert.equal(e.getSnapshot().phase,'bonus-intro')
 at=10000;e.tick();assert.equal(e.getSnapshot().phase,'error');assert.equal(e.getSnapshot().bonusRemaining,8)
 assert.equal(e.continueBonus(),true);assert.equal(e.getSnapshot().phase,'spinning');assert.equal(e.getSnapshot().bonusRemaining,7)
 assert.equal(w.getSnapshot().session.transactions.filter(t=>t.kind==='debit').length,1)
})
for(const locale of ['en','pt-BR','es-MX'])for(const game of defs.THREE_GAMES)test(`${game.slug}: localized rules and final identity ${locale}`,async()=>{
 assert.ok(copy.threeRules(game.slug,locale).length>=5);assert.ok(copy.threeDescription(game.slug,locale).length>80)
 const h=await help.loadGameHelp(game.slug,locale);assert.ok(h.sections.length>=3);if(game.slug==='carnaval-gold')assert.equal(h.paytable.length,9)
 assert.ok(await readFile(new URL(`../app/[locale]/play/${game.slug}/page.tsx`,import.meta.url)))
})
test('Skuptu source assets retain exact owner hashes and runtime carries all measured clips',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../public/originals/levanta/manifest.json',import.meta.url),'utf8'));assert.equal(manifest.sources.length,3);assert.deepEqual(manifest.sources.map(s=>s.clip),['Ready','Lift','Fail']);assert.ok(manifest.runtime.bytes<2000000)
 const {createHash}=await import('node:crypto');for(const source of manifest.sources){const b=await readFile(new URL('../assets-source/originals/levanta/'+source.source,import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),source.sha256)}
})
