import { commercialFixture } from './fixtures/promo-commercial.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import React,{act} from 'react'
import {createRoot} from 'react-dom/client'
import {JSDOM,VirtualConsole} from 'jsdom'
import {AppRouterContext} from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import {PathnameContext} from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import country from '../components/country-context.tsx'
import consent from '../lib/consent.ts'
import session from '../lib/originals/session.ts'
const css=registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return{format:'commonjs',shortCircuit:true,source:'module.exports={}' };return next(url,context)}})
const imported=await import('../components/originals/rio-drift/game.tsx'),gameModule=imported.default??imported
const Game=gameModule.default??gameModule
css.deregister()

async function mounted(geo,verify){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message))
 const dom=new JSDOM('<div id="root"></div>',{url:'https://site.example.invalid/es-mx/play/rio-drift',pretendToBeVisual:true,virtualConsole:vc}),saved=new Map()
 const raf=new Map(),timers=new Map();let id=0,time=1000,round=0
 dom.window.requestAnimationFrame=fn=>{raf.set(++id,fn);return id};dom.window.cancelAnimationFrame=id=>raf.delete(id)
 dom.window.setInterval=fn=>{timers.set(++id,fn);return id};dom.window.clearInterval=id=>timers.delete(id)
 dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}})
 dom.window.ResizeObserver=class{observe(){}disconnect(){}}
 dom.window.IntersectionObserver=class{constructor(fn){this.fn=fn}observe(el){this.fn([{isIntersecting:true,intersectionRatio:1,target:el}])}disconnect(){}}
 dom.window.HTMLElement.prototype.getBoundingClientRect=()=>({width:390,height:490,left:0,top:0,right:390,bottom:490})
 const gradient={addColorStop(){}},context=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>o[k]??(()=>{})})
 dom.window.HTMLCanvasElement.prototype.getContext=()=>context
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true}
 dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'))}
 const globals={...Object.fromEntries(['window','self','document','location','navigator','Event','HTMLElement','HTMLCanvasElement','HTMLDialogElement','Node','ResizeObserver','IntersectionObserver','requestAnimationFrame','cancelAnimationFrame'].map(k=>[k,dom.window[k]])),performance:{now:()=>time,mark(){},measure(){},clearMeasures(){}},crypto:{randomUUID:()=>`turbo-test-${++round}`,getRandomValues:array=>{array[0]=Math.ceil((1-97/400.25)*0x1_0000_0000);return array}}}
 for(const [key,value]of Object.entries(globals)){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,value})}
 globalThis.IS_REACT_ACT_ENVIRONMENT=true
 consent.saveConsent({necessary:true,analytics:true,marketing:false})
 const root=createRoot(document.getElementById('root'))
 const click=async selector=>{const el=document.querySelector(selector);assert.ok(el,selector);assert.equal(el.disabled,false);await act(()=>el.dispatchEvent(new window.MouseEvent('click',{bubbles:true})))}
 const advance=async(ms=40)=>{time+=ms;await act(()=>{for(const fn of [...timers.values()])fn();const jobs=[...raf.values()];raf.clear();for(const fn of jobs)fn(time)})}
 const phase=()=>document.querySelector('[data-turbo-phase]').dataset.turboPhase
 const ledger=()=>session.decodeSession(window.localStorage.getItem(session.DEMO_STORAGE_KEY))
 try{
  await act(async()=>{root.render(React.createElement(AppRouterContext.Provider,{value:{push(){},prefetch(){}}},React.createElement(PathnameContext.Provider,{value:'/es-mx/play/rio-drift'},React.createElement(country.CountryProvider,{initialLocale:'es-MX',visitorCountryCode:geo,commercial:geo==='MX'?commercialFixture('MX'):undefined},React.createElement(Game)))));await Promise.resolve()})
  await advance();await verify({click,advance,phase,ledger,dom})
  assert.deepEqual(errors,[])
 }finally{await act(()=>root.unmount());assert.equal(raf.size,0);assert.equal(timers.size,0);dom.window.close();for(const [k,d]of saved)if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];delete globalThis.IS_REACT_ACT_ENVIRONMENT}
}

test('Turbo UI has one action and no steering; cashout persists while round continues, then replay works',async()=>{
 await mounted('GE',async({click,advance,phase,ledger})=>{
  assert.equal(document.querySelector('h1').textContent,'Liva Turbo Crash');assert.equal(document.querySelectorAll('[data-turbo-action]').length,1)
  assert.equal(document.querySelector('[aria-label="Girar a la izquierda"]'),null)
  const initial=ledger().balance
  await click('[data-turbo-action]');assert.equal(phase(),'launch');assert.equal(ledger().balance,initial-100)
  assert.equal(document.querySelector('[data-turbo-action]').disabled,true)
  await advance(900);assert.equal(phase(),'running');assert.match(document.querySelector('[data-turbo-action]').textContent,/RETIRAR/)
  await advance(1000);await click('[data-turbo-action]');await advance()
  assert.equal(phase(),'running');assert.equal(ledger().transactions.length,2);assert.equal(document.querySelector('[data-turbo-action]').disabled,true)
  const balance=ledger().balance;await advance(15000);assert.equal(phase(),'crashed');assert.equal(ledger().balance,balance)
  await advance(1100);assert.equal(phase(),'ready');assert.equal(window.dataLayer.filter(e=>e.event==='demo_round_complete').length,1)
  assert.equal(window.dataLayer.filter(e=>e.event==='demo_cashout').length,1)
  assert.equal(window.dataLayer.filter(e=>e.event==='demo_best_score').length,0)
  await click('[data-turbo-action]');assert.equal(phase(),'launch')
 })
})
test('Settings and hidden tabs do not pause the deadline or allow credit reset during a round',async()=>{
 await mounted('GE',async({click,advance,phase,ledger,dom})=>{
  await click('[data-turbo-action]');await click('[data-casino-settings-trigger]')
  assert.match(document.querySelector('dialog').textContent,/La ronda sigue/)
  assert.equal([...document.querySelectorAll('button')].find(b=>b.textContent==='Restablecer Saldo').disabled,true)
  Object.defineProperty(dom.window.document,'visibilityState',{configurable:true,value:'hidden'})
  await advance(20000);assert.equal(phase(),'crashed');assert.equal(ledger().transactions.length,1)
  Object.defineProperty(dom.window.document,'visibilityState',{configurable:true,value:'visible'})
  await advance(1100);await click('dialog header button');assert.equal(phase(),'ready')
 })
})
for(const geo of ['MX','BR','GE'])test(`Turbo ${geo}: completed-round promo cadence 3/6/9, never ignition, running or crash`,async()=>{
 await mounted(geo,async({click,advance,phase})=>{
  assert.equal(Boolean(document.querySelector('[data-sponsored-banner]')),geo==='MX')
  for(let cycle=1;cycle<=9;cycle++){
   await click('[data-turbo-action]');assert.equal(document.querySelector('[data-engagement-offer]'),null)
   await advance(900);assert.equal(phase(),'running');assert.equal(document.querySelector('[data-engagement-offer]'),null)
   await advance(20000);assert.equal(phase(),'crashed');assert.equal(document.querySelector('[data-engagement-offer]'),null)
   await advance(1100);assert.equal(phase(),'ready');await act(()=>new Promise(r=>setTimeout(r,700)))
   const offer=document.querySelector('[data-engagement-offer]');assert.equal(Boolean(offer),geo==='MX'&&cycle%3===0)
   if(offer)await act(()=>offer.querySelector('button').click())
  }
  assert.equal(window.dataLayer.filter(e=>e.event==='demo_round_complete').length,9)
  assert.deepEqual(window.dataLayer.filter(e=>e.event==='offer_impression'&&e.placement==='originals_engagement_offer').map(e=>e.completedCycleNumber),geo==='MX'?['3','6','9']:[])
 })
})
