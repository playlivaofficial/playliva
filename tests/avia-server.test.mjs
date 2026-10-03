import test from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes, createHash } from 'node:crypto'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import service from '../lib/originals/avia/server.ts'
import engine from '../lib/originals/avia/engine.ts'

test('Avia durable server serializes simultaneous requests, persists reload state and rejects stale-round replays', async () => {
  assert.ok(!process.env.VERCEL, 'This fixture must never run against production')
  const token=randomBytes(32).toString('hex'),id=createHash('sha256').update(token).digest('hex')
  const directory=resolve('.local/avia'),path=resolve(directory,id+'.json')
  await mkdir(directory,{recursive:true})
  const state=engine.newAviaRound(Date.now()-engine.COUNTDOWN_MS-1000,'fixture-concurrent',{uint32:()=>0xf0000000})
  engine.actAvia(state,{type:'bet',roundId:state.id,stake:1000,auto:null},state.opensAt)
  await writeFile(path,JSON.stringify(state))
  const results=await Promise.all(Array.from({length:16},()=>service.aviaRequest(token,{type:'cashout',roundId:state.id})))
  assert.ok(results.every(r=>r.view.wager.status==='won'))
  assert.equal(new Set(results.map(r=>r.view.wager.payout)).size,1)
  const saved=JSON.parse(await readFile(path,'utf8'));assert.equal(saved.receipts.length,2);assert.equal(saved.sequence,2)
  const restored=await service.aviaRequest(token,{type:'state'});assert.equal(restored.view.wager.payout,saved.wager.payout)
  const stale=await service.aviaRequest(token,{type:'cashout',roundId:'another-round'});assert.equal(stale.error,'stale-round');assert.equal(stale.view.sequence,2)
})

test('Avia origin validation handles Next loopback normalization without opening cross-origin access',()=>{
 const request=(origin,host='127.0.0.1:3132',site='same-origin')=>new Request('http://localhost:3132/api/originals/avia',{headers:{origin,host,'sec-fetch-site':site}})
 assert.equal(service.allowedAviaOrigin(request('http://127.0.0.1:3132')),true)
 for(const origin of ['https://example.invalid','http://127.0.0.1:3133','null','http://localhost:3132'])assert.equal(service.allowedAviaOrigin(request(origin)),false)
 assert.equal(service.allowedAviaOrigin(request('http://127.0.0.1:3132','127.0.0.1:3132','cross-site')),false)
})
