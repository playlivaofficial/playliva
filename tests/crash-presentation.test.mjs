import test from 'node:test'
import assert from 'node:assert/strict'
import engineModule from '../lib/originals/crash/engine.ts'
import walletModule from '../lib/originals/session.ts'
import motionModule from '../lib/originals/crash/presentation.ts'
import timingModule from '../lib/originals/crash/timing.ts'
const { createCrashEngine, PREPARING_MS, KICK_MS, timeToMultiplier } = engineModule
const { flightPosition, fallPosition, CASTAWAY_START } = motionModule
const { fallDurationMs, IMPACT_BEAT_MS } = timingModule
const contact = PREPARING_MS + KICK_MS
function fixture(point) {
  let now=0, id=0
  const wallet=walletModule.createDemoSessionStore(()=>null)
  const engine=createCrashEngine(wallet,{now:()=>now,id:()=>`visual-${++id}`,random:{uint32:()=>Math.max(0,Math.ceil((1-97/point)*0x1_0000_0000))}})
  return {wallet,engine,at(value){now=value;engine.tick()},snapshot:engine.getSnapshot}
}
test('shared contact clock has no pre-contact displacement or post-contact idle phase',()=> {
  const f=fixture(500); f.engine.start(100)
  f.at(contact-.001); assert.equal(f.snapshot().phase,'kick')
  assert.deepEqual([flightPosition(-.001).x,flightPosition(-.001).y,flightPosition(-.001).z],[...CASTAWAY_START])
  f.at(contact); assert.equal(f.snapshot().phase,'flying')
  assert.ok(flightPosition(.001).x>CASTAWAY_START[0]); assert.ok(flightPosition(.001).y>CASTAWAY_START[1])
  assert.ok(flightPosition(.25).x>.35+2); assert.ok(flightPosition(.25).y>2.5)
})
for(const point of [100,110,250,1000,10000]) test(`${point/100}x loss freezes before continuous fall and readies once after impact`,()=> {
  const f=fixture(point); f.engine.start(100)
  const flightMs=timeToMultiplier(point), crashAt=contact+flightMs, duration=fallDurationMs(flightMs)
  f.at(crashAt+.0001)
  const snapshot=f.snapshot(), balance=f.wallet.getSnapshot().session.balance
  assert.equal(snapshot.phase,'crashed'); assert.equal(snapshot.multiplier,point); assert.equal(snapshot.result.payout,0)
  const start=flightPosition(flightMs/1000,point), fall=fallPosition(flightMs/1000,0,point)
  assert.equal(fall.x,start.x); assert.equal(fall.y,start.y)
  assert.ok(duration>=400 && duration<=900)
  const end=fallPosition(flightMs/1000,duration,point)
  assert.ok(Math.abs(end.y-CASTAWAY_START[1])<1e-10)
  assert.ok(end.x>start.x)
  assert.ok(fallPosition(flightMs/1000,duration*.8,point).y>fallPosition(flightMs/1000,duration*.95,point).y)
  assert.equal(end.phase,'impact')
  for(const age of [16,200,duration-1,duration,duration+IMPACT_BEAT_MS-1]) {
    f.at(snapshot.finishedAt+age); assert.equal(f.snapshot().multiplier,point)
    assert.equal(f.engine.cashOut(),false); assert.equal(f.engine.start(100).ok,false)
    assert.equal(f.wallet.getSnapshot().session.balance,balance)
    assert.equal(f.snapshot().history.length,1)
    assert.equal(f.wallet.getSnapshot().session.transactions.length,1)
  }
  let ready=0; f.engine.subscribe(()=>{if(f.snapshot().phase==='ready')ready++})
  f.at(snapshot.finishedAt+duration+IMPACT_BEAT_MS+.001)
  assert.equal(f.snapshot().phase,'ready'); assert.ok(IMPACT_BEAT_MS>=150 && IMPACT_BEAT_MS<=350)
  f.engine.tick(); f.engine.tick(); assert.equal(ready,1)
  assert.equal(f.engine.start(100).ok,true)
  assert.equal(f.engine.cashOut(snapshot.roundId),false)
})
