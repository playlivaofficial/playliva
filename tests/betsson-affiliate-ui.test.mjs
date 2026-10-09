import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import countryModule from '../components/country-context.tsx'
import promotion from '../lib/affiliates/promotion.ts'
import playReal from '../lib/originals/play-real.ts'
import blackjack from '../lib/originals/blackjack/definition.ts'
import roulette from '../lib/originals/roulette/config.ts'
import capybara from '../lib/originals/capybara/definition.ts'
import crash from '../lib/originals/crash/definition.ts'
import mines from '../lib/originals/mines/config.ts'
import { commercialFixture } from './fixtures/promo-commercial.mjs'
const hooks=registerHooks({load(url,context,next){if(String(url).includes('.module.css'))return{format:'module',shortCircuit:true,source:'export default new Proxy({}, {get:(_,k)=>String(k)});'};return next(url,context)}})
const unwrap=m=>m.default??m
const {PlayRealCTA}=unwrap(await import('../components/originals/play-real-cta.tsx'))
const {BetssonSponsoredBanner}=unwrap(await import('../components/affiliates/betsson-sponsored-banner.tsx'))
hooks.deregister()
const {CountryProvider}=countryModule
function render(geo,locale,child,snapshot=commercialFixture(geo)) {
  return new JSDOM(renderToStaticMarkup(React.createElement(AppRouterContext.Provider,{value:{push(){},prefetch(){}}},
    React.createElement(PathnameContext.Provider,{value:`/${locale.toLowerCase()}/play/mines`},
      React.createElement(CountryProvider,{initialLocale:locale,visitorCountryCode:geo,commercial:snapshot},child))))).window.document
}
for(const geo of ['MX','CO','PE'])test(`${geo}: Original referrals retain truthful category/game/brand modes and correct market`,()=>{
  const locale=`es-${geo}`,snapshot=commercialFixture(geo)
  const expected=[[crash.ISLAND_CRASH,'verified-category','crash',null],[capybara.CAPYBARA_GOLD,'verified-category','slots',null],
    [blackjack.LIVA_BLACKJACK,'verified-game','table-games','blackjack-live'],[roulette.LIVA_ROULETTE,'verified-game','live-casino','lightning-roulette'],[mines.LIVA_MINES,'verified-category','instant-games',null]]
  for(const[game,mode,category,gameSlug]of expected) {
    const options=playReal.getOriginalOperatorCtas(game,geo,locale,snapshot)
    assert.equal(options[0].mode,mode)
    const query=new URL(options[0].href,'https://www.playliva.com').searchParams
    assert.equal(query.get('country'),geo)
    assert.equal(query.get('game'),gameSlug)
    assert.equal(query.get('category'),category)
    const doc=render(geo,locale,React.createElement(PlayRealCTA,{game}),snapshot)
    assert.equal(doc.querySelector('[data-operator-cta-mode]').dataset.operatorCtaMode,mode)
    assert.ok(doc.querySelector('[data-commercial-disclosure]'))
    assert.equal(doc.querySelector('[data-brazil-ad-warning]'),null)
    assert.equal(doc.querySelector('a[href^="/go?"]').getAttribute('href'),options[0].href)
    assert.doesNotMatch(doc.body.textContent,/Jogar na Betsson|Ganhe 100|R\$20|Sponsored/)
    assert.deepEqual(playReal.getOriginalOperatorCtas(game,'BR',locale,snapshot),[])
  }
  const brandOnly=commercialFixture(geo,{productTypes:['slots'],verifiedGames:[]})
  const generic=playReal.getOriginalOperatorCtas(mines.LIVA_MINES,geo,locale,brandOnly)
  assert.equal(generic[0].mode,'generic-brand')
  const href=new URL(generic[0].href,'https://www.playliva.com')
  assert.equal(href.searchParams.get('game'),null)
  assert.equal(href.searchParams.get('category'),null)
  assert.deepEqual(playReal.getOriginalOperatorCtas(blackjack.LIVA_BLACKJACK,geo,locale,brandOnly),[],'blackjack referral never reuses another game')
  assert.deepEqual(playReal.getOriginalOperatorCtas(roulette.LIVA_ROULETTE,geo,locale,brandOnly),[],'roulette referral never reuses another game')
})

test('campaign artwork uses only explicitly allowed language; fallback logo has no promotional text',()=>{
  const snapshot=commercialFixture('MX'),offer=snapshot.offers[0]
  offer.creative={id:'pt-test-art',assetPath:'/placeholder.svg',width:600,height:200,alt:{'pt-BR':'Arte de teste'},languages:['pt-BR']}
  assert.equal(promotion.getPromotion(snapshot,'MX','pt-BR',promotion.PROMO_PLACEMENTS.originalsHeader).creative.id,'pt-test-art')
  for(const locale of ['en','es-MX','es-CO','es-PE']) {
    const model=promotion.getPromotion(snapshot,'MX',locale,promotion.PROMO_PLACEMENTS.originalsHeader)
    assert.equal(model.creative.kind,'logo')
    assert.notEqual(model.creative.id,'pt-test-art')
  }
})

for(const geo of ['MX','CO','PE'])test(`${geo}: no offer copy is fabricated for an approved operator without an approved campaign`,()=>{
  const snapshot=commercialFixture(geo,{offer:undefined}),locale=`es-${geo}`
  const banner=promotion.getSponsoredBanner(snapshot,geo,locale,'homepage')
  assert.ok(banner)
  assert.equal(banner.promo,null)
  assert.equal(banner.creative.kind,'logo')
  const doc=render(geo,locale,React.createElement(BetssonSponsoredBanner,{surface:'homepage'}),snapshot)
  const card=doc.querySelector('[data-sponsored-banner]')
  assert.ok(card)
  assert.equal(card.dataset.bannerLayout,'compact-header')
  // Shared chrome names the configured operator; Inkabet Peru never reads as Betsson.
  assert.match(card.textContent,new RegExp(`apuestas en ${banner.operatorName}`))
  if(banner.operatorName!=='Betsson')assert.doesNotMatch(card.textContent,/Betsson/)
  assert.doesNotMatch(card.textContent,/Oferta de prueba|Giros|gratis|Ganhe|R\$20|private-test-id/)
  assert.equal(card.querySelector('a[href^="/go?"]').rel,'sponsored noopener noreferrer')
})

test('operator CTA text is a configuration change for both banner and provider-game surfaces',()=>{
  const snapshot=commercialFixture('MX',{offer:undefined,ctaText:{'es-MX':'Consultar Test Partner'}})
  assert.equal(promotion.getSponsoredBanner(snapshot,'MX','es-MX','homepage').ctaLabel,'Consultar Test Partner')
  assert.equal(promotion.getProviderGameCta(snapshot,'MX','es-MX',{gameSlug:'aviator'}).ctaLabel,'Consultar Test Partner')
  const doc=render('MX','es-MX',React.createElement(BetssonSponsoredBanner,{surface:'homepage'}),snapshot)
  assert.equal(doc.querySelector('a[href^="/go?"]').textContent,'Consultar Test Partner')
})
