import { commercialFixture } from './fixtures/promo-commercial.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import math from '../lib/originals/raio/math.ts'
import raio from '../lib/originals/raio/engine.ts'
import brasil from '../lib/originals/brasil21/engine.ts'
import cards from '../lib/originals/blackjack/cards.ts'
import bets from '../lib/originals/roulette/bets.ts'
import orbit from '../lib/originals/roulette/presentation.ts'
import session from '../lib/originals/session.ts'
import engagement from '../lib/affiliates/betsson-engagement.ts'
import promo from '../lib/affiliates/betsson-promo.ts'
const seed=()=>{let n=123456789;return{uint32(){n^=n<<13;n^=n>>>17;n^=n<<5;return n>>>0}}}
const card=(rank,id=rank)=>({rank,suit:'spades',id})
const deck=(ranks)=>[...ranks.map((r,i)=>card(r,`c${i}`)),...cards.createDeck(6)]
test('Raio analytic return is 36/37; ordinary and boosted straight replace returns, all other bets retain standard settlement',()=>{
  assert.ok(Math.abs(math.RAIO_EXPECTED_RETURN-36/37)<1e-12)
  const powers=[{number:0,multiplier:40},{number:1,multiplier:80},{number:2,multiplier:160},{number:3,multiplier:260}]
  for(let n=0;n<37;n++){const r=math.settleRaio([{betId:`straight:${n}`,amount:100}],n,powers);assert.equal(r.returned,100*(powers.find(p=>p.number===n)?.multiplier??32))}
  for(const bet of bets.ROULETTE_BETS.filter(b=>b.type!=='straight'))for(let n=0;n<37;n++)assert.equal(math.settleRaio([{betId:bet.id,amount:100}],n,powers).returned,bets.settleRoulette([{betId:bet.id,amount:100}],n).returned)
  const random=seed(),counts={40:0,80:0,160:0,260:0}
  for(let i=0;i<20000;i++){const p=math.selectPowerNumbers(random);assert.equal(new Set(p.map(x=>x.number)).size,4);p.forEach(x=>counts[x.multiplier]++)}
  for(const [m,p]of [[40,.5],[80,.4],[160,.09],[260,.01]])assert.ok(Math.abs(counts[m]/80000-p)<.009)
})
test('Raio debits once, reveals and credits at landing, blocks active edits, completes only after result beat',()=>{
  let now=0;const wallet=session.createDemoSessionStore(()=>null),engine=raio.createRaioEngine(wallet,{now:()=>now,id:()=> 'raio-test',random:seed()})
  assert.ok(engine.place('red:red',100));assert.ok(engine.spin());assert.equal(engine.spin(),false);assert.equal(engine.place('straight:2',100),false)
  now=raio.CHARGE_MS+raio.SPIN_MS-1;engine.tick();assert.equal(engine.getSnapshot().result,null)
  now++;engine.tick();const s=engine.getSnapshot();assert.equal(s.phase,'result');const p=orbit.sampleOrbit(s.orbit,1);assert.equal(orbit.pocketUnderBall(p.wheel,p.ball),s.result.number)
  const balance=wallet.getSnapshot().session.balance;engine.tick();engine.tick();assert.equal(wallet.getSnapshot().session.balance,balance);assert.equal(s.completed,0)
  now+=raio.RAIO_RESULT_MS;engine.tick();assert.equal(engine.getSnapshot().completed,1);assert.equal(engine.getSnapshot().phase,'ready')
  engine.repeat();assert.equal(engine.spin(),false,'duplicate round ID rejected');engine.dispose()
})

test('Raio preserves a visible result beat after a delayed/background frame',()=>{
  let now=0;const engine=raio.createRaioEngine(session.createDemoSessionStore(()=>null),{now:()=>now,id:()=> 'delayed-frame',random:seed()})
  engine.place('red:red',100);engine.spin()
  now=60000;engine.tick()
  assert.equal(engine.getSnapshot().phase,'result')
  assert.equal(engine.getSnapshot().completed,0)
  now+=raio.RAIO_RESULT_MS-1;engine.tick();assert.equal(engine.getSnapshot().completed,0)
  now++;engine.tick();assert.equal(engine.getSnapshot().completed,1)
  engine.dispose()
})
test('Brasil blackjack natural, power rank, simultaneous naturals, bust, push and ordinary 21 follow published returns',()=>{
  const natural=[card('A'),card('K')],twenty=[card('10'),card('Q')]
  assert.equal(brasil.settleBrasil(natural,twenty,100,'A').returned,400)
  assert.equal(brasil.settleBrasil(natural,twenty,100,'2').returned,220)
  assert.equal(brasil.settleBrasil(natural,natural,100,'A').returned,100)
  assert.equal(brasil.settleBrasil([card('7'),card('7'),card('7')],twenty,100,'7').returned,200)
  assert.equal(brasil.settleBrasil(twenty,twenty,100,'K').outcome,'push')
  assert.equal(brasil.settleBrasil([...twenty,card('5')],[...twenty,card('6')],100,'K').returned,0)
  assert.deepEqual(cards.handValue([card('A'),card('A'),card('9')]),{total:21,soft:true,bust:false,blackjack:false})
})
test('Brasil double draws exactly one card, dealer stands on soft17, hole concealed, settlement cannot repeat',()=>{
  let now=0;const wallet=session.createDemoSessionStore(()=>null),engine=brasil.createBrasilEngine(wallet,{now:()=>now,id:()=> 'brasil-test',deck:()=>deck(['5','A','6','6','K']),power:()=> '2'})
  assert.ok(engine.start(100));assert.equal(engine.start(100),false)
  for(let i=0;i<5;i++){now+=250;engine.tick()}
  assert.equal(engine.getSnapshot().phase,'player');assert.equal(engine.getSnapshot().dealer.length,1)
  assert.ok(engine.act('double'));assert.equal(engine.act('hit'),false);assert.equal(engine.getSnapshot().player.length,3)
  for(let i=0;i<10;i++){now+=250;engine.tick()}
  const s=engine.getSnapshot();assert.equal(s.dealer.length,2);assert.equal(s.result.stake,200);assert.equal(s.result.returned,400)
  const ledger=wallet.getSnapshot().session.transactions;assert.equal(ledger.filter(t=>t.kind==='debit').length,2);assert.equal(ledger.filter(t=>t.kind==='credit').length,1)
  for(let i=0;i<10;i++){now+=1000;engine.tick()}assert.equal(wallet.getSnapshot().session.transactions.length,3)
})
for(const kind of ['raio','brasil21'])test(`${kind}: existing engagement trigger opens only after fully settled cycles 3/6, dismissal preserves cadence, no duplicate exposure`,()=>{
  let now=0,id=0;const wallet=session.createDemoSessionStore(()=>null),random=seed()
  const engine=kind==='raio'?raio.createRaioEngine(wallet,{now:()=>now,id:()=>`r-${++id}`,random}):brasil.createBrasilEngine(wallet,{now:()=>now,id:()=>`b-${++id}`,deck:()=>deck(['10','9','K','8']),power:()=> '4'})
  const active=kind==='raio'?raio.raioActive:brasil.brasilActive,opened=[];let pending=null
  const trigger=engagement.createEngagementTrigger({cycleMultiple:3,delayMs:650,open:m=>opened.push(m),close(){},schedule(fn){pending=fn;return 1},cancel(){pending=null}})
  engine.subscribe(()=>trigger.observe(active(engine.getSnapshot().phase)))
  for(let cycle=1;cycle<=6;cycle++){
    if(kind==='raio'){engine.place('red:red',100);engine.spin()}else engine.start(100)
    let steps=0
    while(active(engine.getSnapshot().phase)&&steps++<100){assert.equal(pending,null,'never schedule over active play or result animation');if(engine.getSnapshot().phase==='player')engine.act('stand');now+=250;engine.tick()}
    assert.ok(steps<100)
    pending?.();pending=null
    assert.equal(opened.length,Math.floor(cycle/3))
    if(cycle===3){trigger.dismiss();assert.equal(trigger.isOpen,false)}
    trigger.observe(false)
  }
  assert.deepEqual(opened.map(m=>[m.completedCycleNumber,m.exposureNumber]),[[3,1],[6,2]])
  engine.dispose();trigger.dispose()
})
test('new slugs retain shared promo GEO suppression, attribution route and third-cycle configuration',()=>{
  for(const slug of ['liva-raio','liva-21-brasil'])for(const geo of ['MX','CO','PE']) {
    const placement=promo.BETSSON_PROMO_PLACEMENTS.originalsEngagement,snapshot=commercialFixture(geo)
    const model=promo.getBetssonPromo(geo,`es-${geo}`,placement,{pageSlug:slug,snapshot})
    assert.ok(model);assert.equal(model.engagement.cycleMultiple,3);assert.equal(model.pageSlug,slug)
    for(const other of ['BR','US','GB','PT'])assert.equal(promo.getBetssonPromo(other,`es-${geo}`,placement,{pageSlug:slug,snapshot}),null)
  }
})

test('unresolved engine errors cannot masquerade as completed affiliate cycles',()=>{
  assert.equal(raio.raioActive('error'),true)
  assert.equal(brasil.brasilActive('error'),true)
  let now=0
  const store=session.createDemoSessionStore(()=>null)
  const wallet={...store,credit:()=>({ok:false,reason:'invalid-amount'})}
  const engine=brasil.createBrasilEngine(wallet,{now:()=>now,id:()=> 'failed-credit',deck:()=>deck(['A','9','K','8']),power:()=> 'A'})
  const opened=[]
  const trigger=engagement.createEngagementTrigger({cycleMultiple:3,delayMs:0,open:m=>opened.push(m),close(){},schedule(fn){fn();return 1},cancel(){}})
  engine.subscribe(()=>trigger.observe(brasil.brasilActive(engine.getSnapshot().phase)))
  engine.start(100)
  for(let i=0;i<20;i++){now+=500;engine.tick()}
  assert.equal(engine.getSnapshot().phase,'error')
  assert.equal(engine.getSnapshot().completed,0)
  assert.equal(opened.length,0)
  engine.dispose();trigger.dispose()
})

test('Brasil hit/stand decisions, dealer natural peek and invalid stakes cannot double-charge',()=>{
  for(const ranks of [['10','A','9','K'],['5','10','6','7','2','K']]){
    let now=0;const wallet=session.createDemoSessionStore(()=>null),engine=brasil.createBrasilEngine(wallet,{now:()=>now,id:()=> 'decision-test',deck:()=>deck(ranks),power:()=> '2'})
    assert.equal(engine.start(101),false);assert.equal(wallet.getSnapshot().session.transactions.length,0)
    assert.ok(engine.start(100));for(let i=0;i<5;i++){now+=250;engine.tick()}
    if(ranks[1]==='A'){
      assert.equal(engine.getSnapshot().phase,'reveal');assert.equal(engine.act('double'),false)
    }else{
      assert.equal(engine.getSnapshot().phase,'player');assert.ok(engine.act('hit'));assert.equal(engine.act('hit'),false)
      now+=250;engine.tick();assert.equal(engine.getSnapshot().player.length,3);assert.equal(engine.act('double'),false)
      assert.ok(engine.act('stand'));assert.equal(engine.act('stand'),false)
    }
    for(let i=0;i<20;i++){now+=500;engine.tick()}
    assert.equal(engine.getSnapshot().completed,1)
    assert.equal(wallet.getSnapshot().session.transactions.filter(t=>t.kind==='debit').length,1)
    engine.dispose()
  }
})
