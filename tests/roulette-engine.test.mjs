import test from 'node:test'
import assert from 'node:assert/strict'
import config from '../lib/originals/roulette/config.ts'
import bets from '../lib/originals/roulette/bets.ts'
import orbit from '../lib/originals/roulette/presentation.ts'
import engine from '../lib/originals/roulette/engine.ts'
import session from '../lib/originals/session.ts'
import simulation from '../lib/originals/roulette/simulation.ts'
const { WHEEL_ORDER, RED_NUMBERS, samplePocket, pocketColor, ROULETTE_TIMING: timing } = config
const { ROULETTE_BETS, rouletteBet, settleRoulette } = bets
const { createRouletteEngine } = engine
function harness(number = 23, overrides = {}) {
  let at = 0, id = 0, draws = 0
  const wallet = overrides.wallet ?? session.createDemoSessionStore(() => null)
  const game = createRouletteEngine(wallet, { now: () => at, id: () => `orbit-${++id}`, random: { uint32: () => { draws++; return number } }, ...overrides })
  const tick = (ms = 1000) => { at += ms; game.tick() }
  const place = (id = 'straight:23', amount = 1000) => game.place(id, amount)
  const spin = () => game.spin(game.getSnapshot().revision)
  const finish = () => { tick(timing.closingMs + timing.spinMs + timing.settlingMs); assert.equal(game.getSnapshot().phase, 'result') }
  return { game, wallet, tick, place, spin, finish, draws: () => draws }
}

test('roulette: central identity, 37 canonical European pockets and exact colors', () => {
  assert.deepEqual(WHEEL_ORDER, [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26])
  assert.equal(new Set(WHEEL_ORDER).size, 37); assert.deepEqual([...WHEEL_ORDER].sort((a,b)=>a-b), Array.from({length:37},(_,i)=>i))
  assert.equal(RED_NUMBERS.length,18); assert.deepEqual(RED_NUMBERS,[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36])
  assert.equal(pocketColor(0),'green'); assert.equal(WHEEL_ORDER.filter(n=>pocketColor(n)==='black').length,18)
  for(let i=1;i<37;i++)assert.notEqual(pocketColor(WHEEL_ORDER[i]),pocketColor(WHEEL_ORDER[i===36?1:i+1]))
  assert.throws(()=>pocketColor(37)); assert.throws(()=>{WHEEL_ORDER[0]=2},TypeError)
  assert.equal(config.LIVA_ROULETTE.category,'table-games'); assert.equal(config.LIVA_ROULETTE.slug,'roulette')
})
test('roulette: crypto bounded sampling rejects the modulo tail and fails closed', () => {
  const limit=Math.floor(2**32/37)*37, values=[0xffffffff,limit,limit-1]
  assert.equal(samplePocket({uint32:()=>values.shift()}),36)
  for(let n=0;n<37;n++)assert.equal(samplePocket({uint32:()=>n}),n)
  for(const n of [-1,2**32,1.5,NaN])assert.throws(()=>samplePocket({uint32:()=>n}))
  assert.throws(()=>samplePocket({uint32:()=>0xffffffff}),/unavailable/)
  assert.ok(config.secureRouletteRandom.uint32()>=0)
})
test('roulette: every canonical inside/outside definition has correct geometry, coverage and immutable odds', () => {
  const counts={straight:37,split:60,street:12,corner:22,'six-line':11,'first-four':1,dozen:3,column:3,red:1,black:1,odd:1,even:1,low:1,high:1}
  assert.equal(ROULETTE_BETS.length,155); assert.equal(new Set(ROULETTE_BETS.map(b=>b.id)).size,155)
  for(const [type,count]of Object.entries(counts))assert.equal(ROULETTE_BETS.filter(b=>b.type===type).length,count,type)
  for(const b of ROULETTE_BETS){assert.equal(new Set(b.numbers).size,b.numbers.length);assert.ok(b.numbers.every(n=>n>=0&&n<=36));assert.equal(b.numbers.length*(b.profitOdds+1),36)}
  for(const b of ROULETTE_BETS.filter(b=>b.type==='split')){
    const[a,c]=b.numbers; assert.ok(a===0&&c<=3||c-a===3||c-a===1&&Math.floor((a-1)/3)===Math.floor((c-1)/3))
  }
  for(const b of ROULETTE_BETS.filter(b=>b.type==='corner')){const n=b.numbers[0];assert.deepEqual(b.numbers,[n,n+1,n+3,n+4]);assert.notEqual(n%3,0)}
  assert.deepEqual(rouletteBet('first-four:0-1-2-3').numbers,[0,1,2,3])
  assert.deepEqual(rouletteBet('column:2').numbers,[2,5,8,11,14,17,20,23,26,29,32,35])
  assert.deepEqual(rouletteBet('street:34-35-36').numbers,[34,35,36])
  assert.deepEqual(rouletteBet('six-line:31-32-33-34-35-36').numbers,[31,32,33,34,35,36])
  assert.equal(rouletteBet('split:3-4'),undefined); assert.equal(rouletteBet('straight:00'),undefined)
  assert.throws(()=>{ROULETTE_BETS[0].numbers.push(5)},TypeError)
})
test('roulette: all 155 bets settle against all 37 results with exact profit and returned stake', () => {
  for(const bet of ROULETTE_BETS)for(let number=0;number<37;number++){
    const result=settleRoulette([{betId:bet.id,amount:123}],number)
    const expected=bet.numbers.includes(number)?123*(bet.profitOdds+1):0
    assert.equal(result.returned,expected,`${bet.id} on ${number}`);assert.equal(result.profit,expected-123)
    assert.equal(result.stake,123);assert.equal(result.bets[0].won,expected>0)
  }
})
test('roulette: multiple bets aggregate stacks, mixed wins/losses and zero correctly', () => {
  const placements=[{betId:'straight:23',amount:1000},{betId:'red:red',amount:500},{betId:'straight:23',amount:500},{betId:'even:even',amount:200}]
  const r=settleRoulette(placements,23)
  assert.equal(r.bets.length,3);assert.equal(r.stake,2200);assert.equal(r.returned,55000);assert.equal(r.profit,52800)
  assert.equal(settleRoulette(placements,0).returned,0)
  assert.equal(settleRoulette([{betId:'first-four:0-1-2-3',amount:1000}],0).returned,9000)
  for(const type of ['red','black','odd','even','low','high'])assert.equal(settleRoulette([{betId:`${type}:${type}`,amount:1000}],0).returned,0)
  for(let n=1;n<=3;n++)for(const type of ['column','dozen'])assert.equal(settleRoulette([{betId:`${type}:${n}`,amount:1000}],0).returned,0)
})
test('roulette: invalid/custom wagers, fractional units and overflow are rejected', () => {
  for(const amount of [0,-1,1.2,Infinity,Number.MAX_SAFE_INTEGER])assert.throws(()=>settleRoulette([{betId:'straight:1',amount}],1))
  assert.throws(()=>settleRoulette([{betId:'custom:win',amount:100}],1))
  assert.throws(()=>settleRoulette([{betId:'straight:1',amount:session.MAX_CREDIT_UNITS}],1))
  assert.throws(()=>settleRoulette([],37));assert.throws(()=>settleRoulette([],.1))
})
test('roulette: placed chips reserve only, Undo removes one chip and Clear does not refund/debit', () => {
  const h=harness();assert.equal(h.place().ok,true);h.place('red:red',500);h.place()
  assert.equal(h.wallet.getSnapshot().session.balance,1000000);assert.equal(h.wallet.getSnapshot().session.transactions.length,0)
  assert.equal(h.game.getSnapshot().totalStake,2500);assert.equal(h.game.undo().ok,true);assert.equal(h.game.getSnapshot().totalStake,1500)
  assert.equal(h.game.clear().ok,true);assert.equal(h.game.getSnapshot().totalStake,0);assert.equal(h.spin().reason,'empty-bets')
})
test('roulette: Spin freezes a predetermined ticket, locks bets and debits exactly once', () => {
  const h=harness();h.place();h.place('red:red',1000);const revision=h.game.getSnapshot().revision
  assert.equal(h.game.spin(revision).ok,true);assert.equal(h.draws(),1)
  assert.equal(h.game.getSnapshot().phase,'closing');assert.equal(h.game.getSnapshot().result,null)
  assert.equal(h.game.getSnapshot().orbit.number,23);assert.equal(h.wallet.getSnapshot().session.balance,998000)
  assert.equal(h.game.spin(revision).ok,false)
  for(const response of [h.place(),h.game.undo(),h.game.clear(),h.game.repeat(),h.wallet.reset()])assert.equal(response.ok,false)
  h.tick(160);assert.equal(h.game.getSnapshot().phase,'spinning')
  h.tick(3800);assert.equal(h.game.getSnapshot().phase,'settling');assert.equal(h.game.getSnapshot().result.number,23)
  assert.equal(h.wallet.getSnapshot().session.transactions.length,1)
  h.tick(120);assert.equal(h.game.getSnapshot().phase,'result');assert.equal(h.game.getSnapshot().result.returned,38000)
  assert.deepEqual(h.wallet.getSnapshot().session.transactions.map(t=>[t.kind,t.amount]),[['debit',2000],['credit',38000]])
  for(let i=0;i<30;i++)h.tick(0)
  assert.equal(h.wallet.getSnapshot().session.transactions.length,2);assert.equal(h.game.getSnapshot().completed,1)
})
test('roulette: complete loss creates no credit transaction; zero wins only matching bets', () => {
  const h=harness(0);h.place('red:red',1000);h.spin();h.finish()
  assert.equal(h.game.getSnapshot().result.returned,0);assert.equal(h.wallet.getSnapshot().session.transactions.length,1)
  const zero=harness(0);zero.place('straight:0',1000);zero.spin();zero.finish()
  assert.equal(zero.game.getSnapshot().result.returned,36000)
})
test('roulette: Repeat uses only the last completed ticket and charges nothing until Spin', () => {
  const h=harness();h.place();h.place('odd:odd',200);h.spin();h.finish();h.tick(850)
  assert.equal(h.game.getSnapshot().phase,'betting');assert.equal(h.game.getSnapshot().placements.length,0)
  const balance=h.wallet.getSnapshot().session.balance
  assert.equal(h.game.repeat().ok,true);assert.equal(h.game.getSnapshot().totalStake,1200);assert.equal(h.wallet.getSnapshot().session.balance,balance)
  assert.equal(h.game.repeat().ok,false);assert.equal(h.game.undo().ok,true);assert.equal(h.game.getSnapshot().totalStake,1000)
  h.spin();h.finish();assert.equal(h.game.getSnapshot().completed,2)
  assert.equal(h.wallet.getSnapshot().session.transactions.length,4)
})
test('roulette: insufficient balance, wager limits, invalid chips and unfunded Repeat fail without mutations', () => {
  const h=harness();h.wallet.hydrate();h.wallet.debit(999950)
  assert.equal(h.place('red:red',100).reason,'insufficient-credits');assert.equal(h.game.getSnapshot().totalStake,0)
  assert.equal(h.place('straight:37',100).reason,'invalid-bet');assert.equal(h.place('red:red',101).reason,'invalid-bet')
  const limited=harness();for(let i=0;i<100;i++)assert.equal(limited.place('red:red',10000).ok,true)
  assert.equal(limited.place('red:red',100).reason,'stake-limit')
  const repeat=harness(0);repeat.place('red:red',1000);repeat.spin();repeat.finish();repeat.tick(850)
  repeat.wallet.debit(repeat.wallet.getSnapshot().session.balance-50)
  assert.equal(repeat.game.repeat().reason,'insufficient-credits');assert.equal(repeat.game.getSnapshot().totalStake,0)
})
test('roulette: stake is revalidated at Spin and a competing shared round blocks debit', () => {
  const h=harness();h.place();h.wallet.debit(999500)
  assert.equal(h.spin().reason,'insufficient-credits');assert.equal(h.game.getSnapshot().phase,'betting')
  const other=harness();other.place();other.wallet.acquireRound('other-game')
  assert.equal(other.spin().reason,'round-active');assert.equal(other.wallet.getSnapshot().session.transactions.length,0)
})
test('roulette: entropy/ID/clock failure and balance/history headroom fail before debit', () => {
  for(const options of [{random:{uint32:()=>{throw Error('no entropy')}}},{id:()=>''},{now:()=>NaN}]){
    const h=harness(23,options);h.place();assert.equal(h.spin().ok,false);assert.equal(h.wallet.getSnapshot().session.transactions.length,0)
  }
  const h=harness();h.wallet.hydrate();h.wallet.credit(session.MAX_CREDIT_UNITS-1000000);h.place()
  assert.equal(h.spin().reason,'balance-limit');assert.equal(h.wallet.getSnapshot().session.balance,session.MAX_CREDIT_UNITS)
})
test('roulette: stale Spin revision cannot start a changed ticket', () => {
  const h=harness();h.place();const revision=h.game.getSnapshot().revision;h.place('red:red',100)
  assert.equal(h.game.spin(revision).ok,false);assert.equal(h.wallet.getSnapshot().session.transactions.length,0)
})
test('roulette: reentrant wallet callbacks cannot duplicate Spin or settlement', () => {
  const h=harness();h.wallet.hydrate();h.place()
  h.wallet.subscribe(()=>{assert.equal(h.spin().ok,false);h.game.tick()})
  assert.equal(h.spin().ok,true);h.finish()
  assert.deepEqual(h.wallet.getSnapshot().session.transactions.map(t=>t.kind),['debit','credit'])
  assert.equal(h.game.getSnapshot().completed,1)
})
test('roulette: reload/abandon keeps booked debit, drops incomplete spin, never refunds or resumes', () => {
  let saved=null;const access=()=>({getItem:()=>saved,setItem:(_,v)=>{saved=v}})
  const wallet=session.createDemoSessionStore(access),h=harness(23,{wallet})
  h.place();h.spin();h.game.abandon();h.tick(10000)
  assert.equal(h.game.getSnapshot().phase,'betting');assert.equal(h.game.getSnapshot().previousBets.length,0)
  const fresh=session.createDemoSessionStore(access);fresh.hydrate();const newGame=createRouletteEngine(fresh)
  assert.equal(fresh.getSnapshot().session.balance,999000);assert.equal(fresh.getSnapshot().session.transactions.length,1)
  assert.equal(newGame.getSnapshot().phase,'betting');assert.equal(newGame.getSnapshot().placements.length,0)
})
test('roulette: reentrant interruption after debit is deferred safely and leaves no live round', () => {
  const h=harness();h.wallet.hydrate();h.place();h.wallet.subscribe(()=>h.game.abandon())
  h.spin();h.tick(10000)
  assert.equal(h.wallet.getSnapshot().session.transactions.length,1);assert.equal(h.game.getSnapshot().phase,'betting')
  assert.equal(h.wallet.reset().ok,true)
})
test('roulette: final ball alignment is exact for all pockets and repeated orbits', () => {
  let previous=null
  for(let round=0;round<74;round++){
    const number=round%37,plan=orbit.createOrbitPlan(number,previous),end=orbit.sampleOrbit(plan,1)
    assert.equal(orbit.pocketUnderBall(end.wheel,end.ball),number)
    assert.equal(end.radius,orbit.BALL_POCKET_RADIUS);assert.equal(end.landed,true)
    assert.equal(orbit.pocketUnderBall(...[orbit.sampleOrbit(plan,10).wheel,orbit.sampleOrbit(plan,10).ball]),number)
    assert.ok(plan.wheelEnd>plan.wheelStart);assert.ok(plan.ballEnd<plan.ballStart)
    if(previous){assert.ok(Math.abs(((plan.wheelStart-previous.wheelEnd)%360))<.0001);assert.equal(plan.ballStartRadius,orbit.BALL_POCKET_RADIUS)}
    assert.throws(()=>{plan.number=36},TypeError);previous=plan
  }
})
test('roulette: continuous deceleration and pocket entry have no final teleport; reduced motion preserves outcome', () => {
  const plan=orbit.createOrbitPlan(23)
  let previous=orbit.sampleOrbit(plan,0),earlySpeed=0,lateSpeed=0
  for(let i=1;i<=3800;i++){
    const current=orbit.sampleOrbit(plan,i/3800)
    assert.ok(current.wheel>=previous.wheel);assert.ok(current.ball<=previous.ball)
    assert.ok(Math.abs(current.radius-previous.radius)<1)
    if(i===100)earlySpeed=previous.ball-current.ball
    if(i===3700)lateSpeed=previous.ball-current.ball
    previous=current
  }
  assert.ok(earlySpeed>lateSpeed*100)
  assert.ok(Math.abs(orbit.sampleOrbit(plan,.9999).radius-orbit.BALL_POCKET_RADIUS)<.01)
  const reduced=orbit.sampleOrbit(plan,1,true)
  assert.equal(orbit.pocketUnderBall(reduced.wheel,reduced.ball),23);assert.equal(orbit.sampleOrbit(plan,.5,true).opacity,0)
})
test('roulette: million-outcome verification is reproducible, approximately uniform and mathematically 36/37', () => {
  const r=simulation.simulateRoulette(1000000,8132026)
  assert.equal(r.pockets.reduce((a,b)=>a+b,0),1000000)
  for(const count of r.pockets)assert.ok(Math.abs(count-1000000/37)<1000)
  assert.equal(r.red+r.black+r.zero,r.rounds);assert.equal(r.odd+r.even+r.zero,r.rounds)
  assert.equal(r.dozens.reduce((a,b)=>a+b,0)+r.zero,r.rounds)
  assert.equal(r.columns.reduce((a,b)=>a+b,0)+r.zero,r.rounds)
  for(const row of r.theory){assert.equal(row.returnNumerator,36);assert.equal(row.returnDenominator,37)}
  assert.deepEqual(simulation.simulateRoulette(1000,17),simulation.simulateRoulette(1000,17))
  assert.match(r.purpose,/not certified RTP/)
})
