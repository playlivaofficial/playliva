import blackjackDef from '../lib/originals/blackjack/definition.ts'
import rouletteDef from '../lib/originals/roulette/config.ts'
import minesDef from '../lib/originals/mines/config.ts'
import capybaraDef from '../lib/originals/capybara/definition.ts'
import gingaDef from '../lib/originals/embaixadinha/definition.ts'
import golacoDef from '../lib/originals/golaco/definition.ts'
import threeDef from '../lib/originals/three-game-definitions.ts'
import raioDef from '../lib/originals/raio/definition.ts'
import brasilDef from '../lib/originals/brasil21/definition.ts'
import aviaDef from '../lib/originals/avia/definition.ts'
import driftDef from '../lib/originals/rio-drift/definition.ts'
import crashDef from '../lib/originals/crash/definition.ts'
import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { readFile } from 'node:fs/promises'
import React, { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { JSDOM, VirtualConsole } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import promotion from '../lib/affiliates/promotion.ts'
import legacy from '../lib/affiliates/betsson-promo.ts'
import engagement from '../lib/affiliates/betsson-engagement.ts'
import cycleModule from '../lib/engagement/gameplay-cycle.ts'
import countryModule from '../components/country-context.tsx'
import providerModule from '../components/originals/demo-session.tsx'
import sessionModule from '../lib/originals/session.ts'
import consent from '../lib/consent.ts'
import commercialTypes from '../lib/commercial/types.ts'
import commercialRegistry from '../lib/commercial/server.ts'
import { registration } from './fixtures/commercial.mjs'
import { commercialFixture } from './fixtures/promo-commercial.mjs'

const hooks = registerHooks({ load(url, context, next) {
  if (String(url).includes('.module.css')) return { format: 'module', shortCircuit: true, source: 'export default new Proxy({}, {get: (_,k)=>String(k)});' }
  return next(url, context)
} })
const unwrap = module => module.default ?? module
const { PlayGameShell } = unwrap(await import('../components/originals/play-game-shell.tsx'))
const { BetssonDiscoveryOffer } = unwrap(await import('../components/affiliates/betsson-discovery-offer.tsx'))
const { OffersView } = unwrap(await import('../components/offers-view.tsx'))
const { OfferCard } = unwrap(await import('../components/offer-card.tsx'))
hooks.deregister()
const { CountryProvider } = countryModule
const { getPromotion, PROMO_PLACEMENTS } = promotion
const { createEngagementTrigger } = engagement
const { createGameplayCycleObserver, isCycleMilestone } = cycleModule
const allOriginals = [crashDef.ISLAND_CRASH, raioDef.RAIO, brasilDef.BRASIL21, blackjackDef.LIVA_BLACKJACK, rouletteDef.LIVA_ROULETTE, minesDef.LIVA_MINES, capybaraDef.CAPYBARA_GOLD, gingaDef.EMBAIXADINHA, golacoDef.GOLACO, ...threeDef.THREE_GAMES, aviaDef.AVIA, driftDef.RIO_DRIFT]
function wrap(geo, locale, path, child, commercial = commercialFixture(geo)) {
  return React.createElement(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
    React.createElement(PathnameContext.Provider, { value: path },
      React.createElement(CountryProvider, { initialLocale: locale, visitorCountryCode: geo, commercial }, child)))
}
function render(geo, locale, child, snapshot = commercialFixture(geo)) {
  return new JSDOM(renderToStaticMarkup(wrap(geo, locale, `/${locale.toLowerCase()}/offers`, child, snapshot))).window.document
}

for (const geo of ['MX','CO','PE']) test(`${geo}: campaign publication and suppression use exact GEO/currency, approved operator and valid campaign`, () => {
  const locale = `es-${geo}`, fixture = commercialFixture(geo)
  assert.equal(fixture.operators.length, 1)
  assert.equal(fixture.offers.length, 1)
  for (const placement of Object.values(PROMO_PLACEMENTS)) {
    const model = getPromotion(fixture, geo, locale, placement, { pageSlug:'crash' })
    assert.ok(model)
    assert.equal(model.market, geo)
    assert.equal(model.locale, locale)
    assert.match(model.engagementCopy.condition, new RegExp(fixture.currency))
    const params = new URL(model.href, 'https://www.playliva.com').searchParams
    assert.equal(params.get('country'), geo)
    assert.equal(params.get('offer'), fixture.offers[0].id)
    assert.equal(params.get('placement'), placement)
    assert.doesNotMatch(model.href, /https?:|betsson|R%24/)
    for (const other of ['MX','CO','PE','BR','PT','GE']) if (other !== geo) assert.equal(getPromotion(fixture, other, locale, placement), null)
    for (const field of ['approved','active']) {
      const bad=structuredClone(fixture); bad.campaigns[0][field]=false
      assert.equal(getPromotion(bad,geo,locale,placement),null)
      const operator=structuredClone(fixture);operator.operators[0][field]=false
      assert.equal(getPromotion(operator,geo,locale,placement),null)
    }
    const noLink=structuredClone(fixture);noLink.operators[0].affiliateUrl={}
    assert.equal(getPromotion(noLink,geo,locale,placement),null)
    const noCopy=structuredClone(fixture);noCopy.campaigns[0].copy={en:fixture.campaigns[0].copy.en}
    assert.equal(getPromotion(noCopy,geo,locale,placement),null,'Spanish never falls back to English promotion copy')
    const currency=structuredClone(fixture);currency.campaigns[0].currency='BRL'
    assert.equal(getPromotion(currency,geo,locale,placement),null)
    assert.equal(getPromotion(fixture,geo,locale,placement,{now:Date.parse(fixture.campaigns[0].validUntil)}),null)
    const noPlacement=structuredClone(fixture);noPlacement.campaigns[0].placements=[]
    assert.equal(getPromotion(noPlacement,geo,locale,placement),null)
  }
})

test('retired BR configuration and every default market are promotion-free', () => {
  assert.equal(legacy.BETSSON_PROMO.enabled,false)
  for(const geo of ['BR','MX','CO','PE','GE','PT']) {
    assert.equal(legacy.getBetssonPromo(geo,'pt-BR',PROMO_PLACEMENTS.originalsEngagement),null)
    assert.equal(promotion.getSponsoredBanner(undefined,geo,'pt-BR','originals'),null)
  }
})

test('ambiguous campaign and offer identifiers suppress both otherwise approved operators in one GEO',()=>{
  const template=commercialFixture('MX').campaigns[0]
  for(const collision of ['campaign','offer']) {
    const first=registration('MX',{offer:structuredClone(template)})
    const second=registration('MX',{id:'second-mx',slug:'second-partner',campaignKey:'second-mx-campaign',offer:structuredClone(template)})
    if(collision==='campaign')second.offer.offer.id='second-offer'
    else second.offer.id='second-campaign'
    assert.equal(commercialRegistry.snapshotFromRegistry('MX',[first]).operators.length,1)
    assert.equal(commercialRegistry.snapshotFromRegistry('MX',[second]).operators.length,1)
    const snapshot=commercialRegistry.snapshotFromRegistry('MX',[first,second])
    assert.equal(snapshot.operators.length,0,`${collision} collision cannot select an arbitrary operator`)
    assert.equal(snapshot.offers.length,0)
    assert.equal(snapshot.campaigns.length,0)
    assert.equal(getPromotion(snapshot,'MX','es-MX',PROMO_PLACEMENTS.originalsEngagement),null)
  }
})

test('Colombia rejects foreign-currency offer copy and publishes only configured localized artwork',()=>{
  const base=commercialFixture('CO'),campaign=base.campaigns[0]
  for(const condition of ['Condición incorrecta: MXN 100','Condición incorrecta: R$20']) {
    const blocked=commercialFixture('CO',{offer:{...campaign,copy:{'es-CO':{headline:'Oferta de prueba',condition,cta:'Consultar condiciones'}}}})
    assert.equal(blocked.offers.length,0)
    assert.equal(getPromotion(blocked,'CO','es-CO',PROMO_PLACEMENTS.originalsEngagement),null)
  }
  const creative={id:'test-co-art',assetPath:'/placeholder.svg',width:600,height:200,alt:{'es-CO':'Arte de prueba'},languages:['es-CO']}
  const configured=commercialFixture('CO',{offer:{...campaign,offer:{...campaign.offer,creative,currency:'COP'}}})
  assert.deepEqual(configured.offers[0].creative,creative)
  assert.equal(configured.offers[0].currency,'COP')
  assert.equal(getPromotion(configured,'CO','es-CO',PROMO_PLACEMENTS.originalsHeader).creative.id,'test-co-art')
  assert.equal(getPromotion(configured,'CO','en',PROMO_PLACEMENTS.originalsHeader).creative.kind,'logo')
})

test('shared gameplay-cycle observer counts only settled true→false edges', () => {
  const seen = []
  const cycles = createGameplayCycleObserver(cycle => seen.push(cycle))
  assert.equal(cycles.observe(false), null)
  assert.equal(cycles.observe(false), null, 'idle re-renders never count')
  assert.equal(cycles.observe(true), null)
  assert.equal(cycles.observe(true), null, 'an active round re-rendering is still one round')
  assert.equal(cycles.observe(false), 1)
  assert.equal(cycles.observe(true), null)
  assert.equal(cycles.observe(false), 2)
  assert.deepEqual(seen, [1, 2])
  assert.equal(cycles.completed, 2)
  assert.equal(cycles.active, false)
  for (const [cycle, every, expected] of [[3, 3, true], [6, 3, true], [9, 3, true], [1, 3, false], [2, 3, false], [4, 3, false], [0, 3, false], [3, 0, false], [2.5, 3, false]]) {
    assert.equal(isCycleMilestone(cycle, every), expected, `${cycle} % ${every}`)
  }
})

test('engagement trigger: every third settled cycle (3, 6, 9 …), one offer per milestone, dismiss never cancels the next', () => {
  let timers = []
  const schedule = (fn, ms) => { timers.push({ fn, ms }); return timers.length }
  const cancel = id => { timers[id - 1] = null }
  const flush = () => { const pending = timers.filter(Boolean); timers = []; for (const timer of pending) timer.fn() }
  const opened = []
  let closed = 0
  const trigger = createEngagementTrigger({ cycleMultiple: 3, delayMs: 650,
    open: milestone => opened.push(milestone), close: () => { closed += 1 }, schedule, cancel })
  const play = () => { trigger.observe(true); trigger.observe(false) }
  trigger.observe(false); trigger.observe(false)
  assert.equal(trigger.completedRounds, 0)
  play(); flush(); play(); flush()
  assert.deepEqual(opened, [], 'cycles 1 and 2 show nothing')
  play()
  assert.equal(timers.length, 1)
  assert.equal(timers[0].ms, 650, 'settle delay before opening')
  assert.deepEqual(opened, [], 'never opens synchronously at the boundary')
  // A new cycle starting during the settle delay cancels this milestone's offer; it is not re-served.
  trigger.observe(true)
  assert.equal(timers[0], null)
  flush()
  assert.deepEqual(opened, [])
  trigger.observe(false) // cycle 4
  flush()
  assert.deepEqual(opened, [], 'cycle 4 is not a milestone')
  play(); flush() // 5
  play(); flush() // 6
  assert.deepEqual(opened, [{ completedCycleNumber: 6, triggerMultiple: 3, exposureNumber: 1 }])
  assert.equal(trigger.isOpen, true)
  // Dismiss keeps the counter and the cadence.
  trigger.dismiss()
  assert.equal(trigger.isOpen, false)
  flush()
  assert.equal(opened.length, 1, 'dismissed offer does not reopen')
  play(); flush(); play(); flush()
  assert.equal(opened.length, 1, 'cycles 7 and 8 show nothing')
  play(); flush() // 9
  assert.deepEqual(opened[1], { completedCycleNumber: 9, triggerMultiple: 3, exposureNumber: 2 })
  // Starting a cycle while open closes it; the next milestone still fires.
  trigger.observe(true)
  assert.equal(closed, 1)
  trigger.observe(false) // 10
  play(); flush() // 11
  play(); flush() // 12
  assert.deepEqual(opened[2], { completedCycleNumber: 12, triggerMultiple: 3, exposureNumber: 3 })
  assert.equal(trigger.completedRounds, 12)
  assert.equal(trigger.exposures, 3)
  trigger.dismiss()
  play(); flush(); play(); flush(); play(); flush() // 15
  assert.equal(opened[3].completedCycleNumber, 15)
  assert.equal(opened.length, 4, 'exactly one offer per milestone')
})


for (const [index,game] of allOriginals.entries()) test(`${game.slug}: exact settled 3/6/9 cadence and continuous hold remain intact`, async () => {
  const geo=['MX','CO','PE'][index%3],locale=`es-${geo}`,route=`/${locale.toLowerCase()}/play/${game.slug}`
  const fixture=commercialFixture(geo),dom=new JSDOM('<div id="root"></div>',{url:`https://www.playliva.com${route}`,virtualConsole:new VirtualConsole()})
  const saved=new Map()
  for(const key of ['window','self','document','location','navigator','Event','KeyboardEvent','HTMLElement','Node','IntersectionObserver']) {
    saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,value:dom.window[key]})
  }
  Object.defineProperty(globalThis,'IntersectionObserver',{configurable:true,value:class {constructor(cb){this.cb=cb}observe(target){this.cb([{target,isIntersecting:true,intersectionRatio:1}])}disconnect(){}}})
  globalThis.IS_REACT_ACT_ENVIRONMENT=true
  window.localStorage.setItem(consent.CONSENT_STORAGE_KEY,JSON.stringify({necessary:true,analytics:true,marketing:false}))
  const events=[],holds=[];window.dataLayer={push:item=>events.push(item)}
  const root=createRoot(document.getElementById('root')),store=sessionModule.createDemoSessionStore(()=>window.localStorage,()=>1)
  const hold=on=>holds.push(on)
  const mount=active=>act(()=>root.render(wrap(geo,locale,route,
    React.createElement(providerModule.DemoSessionProvider,{store},React.createElement(PlayGameShell,{game,roundActive:active,onEngagementHold:hold,controls:React.createElement('button',{},'Start')},React.createElement('div',{},'viewport'))),fixture)))
  const flush=()=>act(()=>new Promise(resolve=>setTimeout(resolve,35)))
  try {
    await mount(false)
    assert.ok(document.querySelector('[data-sponsored-banner="originals"]'))
    for(let round=1;round<=9;round++) {
      await mount(true)
      assert.equal(document.querySelector('[data-engagement-offer]'),null,'no live-round interruption')
      assert.equal(holds.at(-1),false)
      await mount(false);await flush()
      const popup=document.querySelector('[data-engagement-offer]')
      assert.equal(Boolean(popup),round%3===0,`settled round ${round}`)
      if(!popup)continue
      assert.equal(holds.at(-1),true,'continuous game waits at settled offer boundary')
      assert.equal(popup.closest('[data-game-unit]'),null)
      assert.equal(popup.dataset.completedCycle,String(round))
      assert.equal(popup.dataset.exposure,String(round/3))
      const dialog=popup.querySelector('[role="dialog"]')
      assert.equal(dialog.getAttribute('aria-modal'),'true')
      assert.ok(dialog.querySelector('[data-commercial-disclosure]'))
      assert.equal(dialog.querySelector('[data-brazil-ad-warning]'),null)
      assert.match(dialog.textContent,new RegExp(fixture.currency))
      assert.doesNotMatch(dialog.textContent,/Jogar na Betsson|R\$20|Ganhe/)
      const link=dialog.querySelector('[data-promo-cta]')
      assert.equal(new URL(link.href).searchParams.get('country'),geo)
      if(round===3)await act(()=>link.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true})))
      await act(()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true})))
      assert.equal(document.querySelector('[data-engagement-offer]'),null)
      assert.equal(holds.at(-1),false,'dismissal releases continuous game')
    }
    const impressions=events.filter(item=>item.event==='offer_impression'&&item.placement===PROMO_PLACEMENTS.originalsEngagement)
    assert.deepEqual(impressions.map(item=>item.completedCycleNumber),['3','6','9'])
    assert.ok(impressions.every(item=>item.country===geo&&item.language===locale&&item.originalId===game.id))
    assert.equal(events.filter(item=>item.event==='affiliate_click').length,1)
  } finally {
    await act(()=>root.unmount());dom.window.close()
    for(const[key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key]}
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})

for(const geo of ['MX','CO','PE','BR'])test(`${geo}: pending/default production registry leaves all14 Originals unpromoted`,()=>{
  for(const game of allOriginals) {
    const snapshot=commercialTypes.emptyCommercialSnapshot(['MX','CO','PE'].includes(geo)?geo:null)
    const doc=render(geo,geo==='BR'?'pt-BR':`es-${geo}`,React.createElement(providerModule.DemoSessionProvider,{},React.createElement(PlayGameShell,{game,controls:null},null)),snapshot)
    assert.equal(doc.querySelector('[data-sponsored-banner], [data-engagement-offer], a[href^="/go?"]'),null)
    assert.ok(doc.querySelector('[data-game-viewport]'))
  }
})

for(const geo of ['MX','CO','PE'])test(`${geo}: discovery and Offers render only this market's configured offer`,()=>{
  const locale=`es-${geo}`,snapshot=commercialFixture(geo)
  const doc=render(geo,locale,React.createElement(OffersView),snapshot)
  assert.equal(doc.querySelectorAll('[data-offer-id]').length,1)
  assert.equal(doc.querySelector('[data-offer-id]').dataset.offerId,snapshot.offers[0].id)
  assert.ok(doc.querySelector('[data-commercial-disclosure]'))
  assert.equal(doc.querySelector('[data-brazil-ad-warning]'),null)
  const discovery=render(geo,locale,React.createElement(BetssonDiscoveryOffer,{gameSlug:'aviator',operatorId:snapshot.operators[0].id}),snapshot)
  assert.ok(discovery.querySelector('[data-discovery-offer]'))
  assert.equal(discovery.querySelector('h3').getAttribute('lang'),locale)
  const other=commercialFixture(geo==='MX'?'CO':'MX')
  const wrong=render(geo,locale,React.createElement(OfferCard,{offer:other.offers[0]}),snapshot)
  assert.equal(wrong.querySelector('[data-offer-id]'),null,'passing another country offer cannot reveal its card or terms')
  const pending=render(geo,locale,React.createElement(OffersView),commercialTypes.emptyCommercialSnapshot(geo))
  assert.equal(pending.querySelector('[data-offer-id], [data-offers-sponsored], a[href^="/go?"]'),null)
})

test('promo UI remains outside game viewport and no engine imports campaign configuration',async()=>{
  assert.equal(allOriginals.length,14)
  const shell=await readFile(new URL('../components/originals/play-game-shell.tsx',import.meta.url),'utf8')
  assert.ok(shell.indexOf('<BetssonEngagementOffer')>shell.indexOf('data-game-controls'))
  assert.match(shell,/onHold=\{engagementHold\}/)
  for(const path of ['crash/crash-game.tsx','capybara/capybara-game.tsx','blackjack/blackjack-game.tsx','roulette/roulette-game.tsx','mines/mines-game.tsx','avia/game.tsx','rio-drift/game.tsx']) {
    const source=await readFile(new URL(`../components/originals/${path}`,import.meta.url),'utf8')
    assert.doesNotMatch(source,/affiliates\/betsson|affiliates\/promotion|commercial\/server/)
  }
})

test('an open campaign expires without another gameplay action and releases the held game',{timeout:15000},async()=>{
  const dom=new JSDOM('<div id="root"></div>',{url:'https://www.playliva.com/es-mx/play/crash',virtualConsole:new VirtualConsole()})
  const saved=new Map()
  for(const key of ['window','self','document','location','navigator','Event','HTMLElement','Node']) {
    saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,value:dom.window[key]})
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT=true
  const snapshot=commercialFixture('MX'),holds=[],hold=value=>holds.push(value)
  const expiresAt=Date.now()+2500
  snapshot.campaigns[0].validUntil=new Date(expiresAt).toISOString()
  snapshot.offers[0].validUntil=new Date(expiresAt).toISOString()
  const root=createRoot(document.getElementById('root')),store=sessionModule.createDemoSessionStore(()=>window.localStorage,()=>1)
  const mount=active=>act(()=>root.render(wrap('MX','es-MX','/es-mx/play/crash',
    React.createElement(providerModule.DemoSessionProvider,{store},React.createElement(PlayGameShell,{game:crashDef.ISLAND_CRASH,roundActive:active,onEngagementHold:hold,controls:null},null)),snapshot)))
  try {
    await mount(false)
    for(let cycle=0;cycle<3;cycle++){await mount(true);await mount(false)}
    await act(()=>new Promise(resolve=>setTimeout(resolve,35)))
    assert.ok(document.querySelector('[data-engagement-offer]'))
    assert.equal(holds.at(-1),true)
    await act(()=>new Promise(resolve=>setTimeout(resolve,Math.max(0,expiresAt-Date.now())+80)))
    assert.equal(document.querySelector('[data-engagement-offer]'),null)
    assert.equal(holds.at(-1),false,'expiry releases the continuous game without another round or manual dismissal')
    assert.equal(document.querySelector('[data-sponsored-banner]')?.hasAttribute('data-promo-id'),false,'approved operator may remain but expired offer copy disappears')
  } finally {
    await act(()=>root.unmount());dom.window.close()
    for(const[key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key]}
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})

// Real players restart within the settle delay. Before the shell held the next
// round, an immediate restart cancelled the 3rd/6th/9th-round offer for good.
for (const [index,game] of allOriginals.entries()) test(`${game.slug}: an immediate restart cannot skip the 3/6/9 offer`, async () => {
  const geo=['MX','CO','PE'][index%3],locale=`es-${geo}`,route=`/${locale.toLowerCase()}/play/${game.slug}`
  const fixture=commercialFixture(geo),dom=new JSDOM('<div id="root"></div>',{url:`https://www.playliva.com${route}`,virtualConsole:new VirtualConsole()})
  const saved=new Map()
  for(const key of ['window','self','document','location','navigator','Event','KeyboardEvent','MouseEvent','HTMLElement','Node','IntersectionObserver']) {
    saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,value:dom.window[key]})
  }
  Object.defineProperty(globalThis,'IntersectionObserver',{configurable:true,value:class {constructor(cb){this.cb=cb}observe(target){this.cb([{target,isIntersecting:true,intersectionRatio:1}])}disconnect(){}}})
  globalThis.IS_REACT_ACT_ENVIRONMENT=true
  let finish
  // Stateful stand-in for an engine: the start control lives in the shell controls like every Original's.
  function Harness() {
    const [active,setActive]=React.useState(false)
    finish=()=>setActive(false)
    return React.createElement(PlayGameShell,{game,roundActive:active,
      controls:React.createElement('button',{type:'button','data-start':'',onClick:()=>setActive(true)},'Start')},React.createElement('div',{},'viewport'))
  }
  const root=createRoot(document.getElementById('root')),store=sessionModule.createDemoSessionStore(()=>window.localStorage,()=>1)
  const start=()=>act(()=>document.querySelector('[data-start]').click())
  const active=()=>document.querySelector('[data-start]').closest('fieldset').disabled ? 'held' : 'free'
  try {
    await act(()=>root.render(wrap(geo,locale,route,React.createElement(providerModule.DemoSessionProvider,{store},React.createElement(Harness)),fixture)))
    const shown=[]
    for(let round=1;round<=12;round++) {
      await start()
      assert.equal(document.querySelector('[data-engagement-offer]'),null,`no offer during round ${round}`)
      await act(()=>finish())
      if(round%3!==0) {
        await act(()=>new Promise(resolve=>setTimeout(resolve,40)))
        assert.equal(document.querySelector('[data-engagement-offer]'),null,`no offer after round ${round}`)
        assert.equal(active(),'free')
        continue
      }
      // The player presses Start again at once, inside the settle delay.
      await start()
      assert.equal(active(),'held',`round ${round}: the next round waits for the offer`)
      await act(()=>new Promise(resolve=>setTimeout(resolve,40)))
      const popup=document.querySelector('[data-engagement-offer]')
      assert.ok(popup,`settled round ${round} shows the offer`)
      assert.equal(new URL(popup.querySelector('[data-promo-cta]').href).searchParams.get('country'),geo)
      shown.push(Number(popup.dataset.completedCycle))
      await act(()=>popup.querySelector('[role="dialog"] button').click())
      assert.equal(document.querySelector('[data-engagement-offer]'),null)
      assert.equal(active(),'free','closing the offer releases the next round')
    }
    assert.deepEqual(shown,[3,6,9,12])
  } finally {
    await act(()=>root.unmount());dom.window.close()
    for(const[key,value]of saved){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key]}
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})
