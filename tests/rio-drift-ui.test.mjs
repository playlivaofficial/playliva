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
import records from '../lib/originals/rio-drift/records.ts'
const css=registerHooks({load(url,context,next){if(url.endsWith('.module.css'))return{format:'commonjs',shortCircuit:true,source:'module.exports={}' };return next(url,context)}})
const imported=await import('../components/originals/rio-drift/game.tsx'),gameModule=imported.default??imported
const Game=gameModule.default??gameModule
css.deregister()

async function mounted(geo,verify){
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message))
 const dom=new JSDOM('<div id="root"></div>',{url:'https://site.example.invalid/pt-br/play/rio-drift?utm_source=tiktok&utm_campaign=drift.review',pretendToBeVisual:true,virtualConsole:vc}),saved=new Map()
 const raf=new Map();let id=0,time=1000
 dom.window.requestAnimationFrame=fn=>{raf.set(++id,fn);return id};dom.window.cancelAnimationFrame=id=>raf.delete(id)
 dom.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}})
 dom.window.ResizeObserver=class{observe(){}disconnect(){}}
 dom.window.IntersectionObserver=class{constructor(fn){this.fn=fn}observe(el){this.fn([{isIntersecting:true,intersectionRatio:1,target:el}])}disconnect(){}}
 dom.window.HTMLElement.prototype.getBoundingClientRect=()=>({width:390,height:500,left:0,top:0,right:390,bottom:500})
 dom.window.HTMLElement.prototype.setPointerCapture=()=>{}
 const gradient={addColorStop(){}},context=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get:(o,k)=>o[k]??(()=>{})})
 dom.window.HTMLCanvasElement.prototype.getContext=()=>context
 dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true}
 dom.window.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new dom.window.Event('close'))}
 for(const key of ['window','self','document','location','navigator','Event','HTMLElement','HTMLCanvasElement','HTMLDialogElement','Node','ResizeObserver','IntersectionObserver','requestAnimationFrame','cancelAnimationFrame']){saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,value:dom.window[key]})}
 globalThis.IS_REACT_ACT_ENVIRONMENT=true
 consent.saveConsent({necessary:true,analytics:true,marketing:false})
 const root=createRoot(document.getElementById('root'))
 const click=async selector=>{const el=document.querySelector(selector);assert.ok(el,selector);assert.equal(el.disabled,false);await act(()=>el.dispatchEvent(new window.MouseEvent('click',{bubbles:true})))}
 const frame=async(count=1)=>{for(let i=0;i<count;i++){time+=1000/60;await act(()=>{const jobs=[...raf.values()];raf.clear();for(const fn of jobs)fn(time)})}}
 const key=async(type,k)=>act(()=>document.activeElement.dispatchEvent(new window.KeyboardEvent(type,{key:k,bubbles:true})))
 const pointer=async(selector,type,pointerId=1,clientX=100)=>{const e=new window.MouseEvent(type,{bubbles:true,clientX});Object.defineProperty(e,'pointerId',{value:pointerId});await act(()=>document.querySelector(selector).dispatchEvent(e))}
 try{
  await act(()=>root.render(React.createElement(AppRouterContext.Provider,{value:{push(){},prefetch(){}}},React.createElement(PathnameContext.Provider,{value:'/pt-br/play/rio-drift'},React.createElement(country.CountryProvider,{initialLocale:'pt-BR',visitorCountryCode:geo},React.createElement(Game))))))
  await frame();await verify({click,frame,key,pointer,dom,raf})
  assert.deepEqual(errors,[])
 }finally{await act(()=>root.unmount());assert.equal(raf.size,0);dom.window.close();for(const [k,d]of saved)if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];delete globalThis.IS_REACT_ACT_ENVIRONMENT}
}
test('Rio actual UI: arrows, touch cancellation, Settings pause/resume, reload-safe best and unchanged balance',async()=>{
 await mounted('BR',async({click,frame,key,pointer})=>{
  assert.equal([...document.querySelectorAll('button')].filter(b=>b.textContent==='Redefinir Saldo').length,1)
  const balance=()=>[...document.querySelectorAll('p')].find(p=>p.textContent.includes('Liva Credits')).textContent
  const originalBalance=balance()
  await click('[data-drift-phase] button:not([aria-label])')
  assert.equal(document.querySelector('[data-drift-phase]').dataset.driftPhase,'running')
  await key('keydown','d');await frame(60);await key('keyup','d')
  await pointer('[aria-label="Virar à esquerda"]','pointerdown');await frame(20);await pointer('[aria-label="Virar à esquerda"]','pointercancel')
  await click('[data-casino-settings-trigger]');assert.equal(document.querySelector('[data-drift-phase]').dataset.paused,'true')
  await frame()
  const score=document.querySelector('[aria-label="Pontos"] strong').textContent
  await frame(120);assert.equal(document.querySelector('[aria-label="Pontos"] strong').textContent,score)
  await click('dialog header button');assert.equal(document.querySelector('[data-drift-phase]').dataset.paused,'true')
  const resume=[...document.querySelectorAll('button')].find(b=>b.textContent==='Continuar corrida');await act(()=>resume.click())
  assert.equal(document.querySelector('[data-drift-phase]').dataset.paused,'false')
  // Hold a real keyboard input until collision; record only after reaction completes.
  await key('keydown','d');await frame(300);await key('keyup','d')
  assert.equal(document.querySelector('[data-drift-phase]').dataset.driftPhase,'result')
  const record=records.readRecord(window.localStorage);assert.equal(record.runs,1);assert.ok(record.score>0)
  await frame(100);assert.equal(records.readRecord(window.localStorage).runs,1)
  assert.equal(window.dataLayer.filter(e=>e.event==='demo_round_start').length,1)
  assert.equal(window.dataLayer.filter(e=>e.event==='demo_round_complete').length,1)
  assert.equal(window.dataLayer.filter(e=>e.event==='demo_best_score').length,1)
  assert.equal(balance(),originalBalance)
 })
})
for(const geo of ['BR','GE'])test(`Rio actual UI: ${geo} run cadence uses the shared offer, with no active/impact interruption`,async()=>{
 await mounted(geo,async({click,frame,key})=>{
  assert.equal(Boolean(document.querySelector('[data-betsson-banner]')),geo==='BR')
  for(let cycle=1;cycle<=9;cycle++){
   await click('[data-drift-phase] button:not([aria-label])')
   await key('keydown','d')
   for(let n=0;n<360;n++){await frame();if(document.querySelector('[data-drift-phase]').dataset.driftPhase==='result')break;assert.equal(document.querySelector('[data-betsson-engagement-offer]'),null)}
   await key('keyup','d');assert.equal(document.querySelector('[data-drift-phase]').dataset.driftPhase,'result')
   await act(()=>new Promise(r=>setTimeout(r,700)))
   const offer=document.querySelector('[data-betsson-engagement-offer]')
   assert.equal(Boolean(offer),geo==='BR'&&cycle%3===0)
   if(offer){const close=offer.querySelector('button');assert.ok(close);await act(()=>close.click())}
  }
  const exposures=window.dataLayer.filter(e=>e.event==='offer_impression'&&e.placement==='originals_engagement_offer')
  assert.deepEqual(exposures.map(e=>e.completedCycleNumber),geo==='BR'?['3','6','9']:[])
  assert.equal(window.dataLayer.filter(e=>e.event==='demo_round_complete').length,9)
 })
})
