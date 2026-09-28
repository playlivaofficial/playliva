import test from 'node:test'
import assert from 'node:assert/strict'
import {pauseCaptureClock,hasReadyCaptureControl} from '../scripts/owner/capture-clock.mjs'
import {JSDOM} from 'jsdom'

test('capture clock tolerates a slow control round-trip while still idle', async () => {
  let time=Date.parse('2026-09-28T12:00:00Z'),paused=false
  const previous=Date.now;Date.now=()=>time
  try{
    const page={evaluate:async fn=>{const result=fn();time+=1500;return result},clock:{pauseAt:async target=>{assert.ok(target>=time,'slow control round-trip must not put pause target in the past');paused=true}}}
    await pauseCaptureClock(page)
    assert.ok(paused)
  }finally{Date.now=previous}
})

test('capture readiness waits for a usable gameplay control, not unrelated settings or disabled loading UI', () => {
  const dom=new JSDOM('<div data-game-controls><button>Settings</button><button disabled>COMEÇAR</button></div>'),previous=globalThis.document
  globalThis.document=dom.window.document
  try{assert.equal(hasReadyCaptureControl(),false);document.querySelector('button[disabled]').disabled=false;assert.equal(hasReadyCaptureControl(),true)}finally{globalThis.document=previous;dom.window.close()}
})

test('roulette readiness accepts the enabled table bet before the spin button can be enabled', () => {
  const dom=new JSDOM('<div data-game-unit><div data-game-viewport><button data-bet="red:red">Red</button></div><div data-game-controls><button disabled data-roulette-spin>GIRAR</button></div></div>'),previous=globalThis.document
  globalThis.document=dom.window.document
  try{assert.equal(hasReadyCaptureControl(),true);document.querySelector('[data-bet]').disabled=true;assert.equal(hasReadyCaptureControl(),false)}finally{globalThis.document=previous;dom.window.close()}
})
