import blackjackDef from '../lib/originals/blackjack/definition.ts'
import rouletteDef from '../lib/originals/roulette/config.ts'
import minesDef from '../lib/originals/mines/config.ts'
import capybaraDef from '../lib/originals/capybara/definition.ts'
import gingaDef from '../lib/originals/embaixadinha/definition.ts'
import golacoDef from '../lib/originals/golaco/definition.ts'
import threeDef from '../lib/originals/three-game-definitions.ts'
import raioDef from '../lib/originals/raio/definition.ts'
import brasilDef from '../lib/originals/brasil21/definition.ts'
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
import promoConfig from '../lib/affiliates/betsson-promo-config.ts'
import promoModule from '../lib/affiliates/betsson-promo.ts'
import engagement from '../lib/affiliates/betsson-engagement.ts'
import cycleModule from '../lib/engagement/gameplay-cycle.ts'
import attribution from '../lib/attribution.ts'
import tracking from '../lib/tracking.ts'
import consent from '../lib/consent.ts'
import affiliate from '../lib/affiliate.ts'
import data from '../lib/data.ts'
import brazil from '../lib/compliance/brazil.ts'
import betssonModule from '../lib/affiliates/betsson.ts'
import countryModule from '../components/country-context.tsx'
import providerModule from '../components/originals/demo-session.tsx'
import sessionModule from '../lib/originals/session.ts'
import crashDef from '../lib/originals/crash/definition.ts'
import i18nModule from '../lib/i18n.ts'

const cssHooks = registerHooks({ load(url, context, next) {
  if (String(url).includes('.module.css')) {
    return { format: 'module', shortCircuit: true, source: 'const s = new Proxy({}, { get: (_, k) => String(k) }); export default s;' }
  }
  return next(url, context)
} })
const unwrap = module => module.default ?? module
const shellModule = unwrap(await import('../components/originals/play-game-shell.tsx'))
const discoveryModule = unwrap(await import('../components/affiliates/betsson-discovery-offer.tsx'))
const gameDetailModule = unwrap(await import('../components/game-detail-view.tsx'))
const offersModule = unwrap(await import('../components/offers-view.tsx'))
cssHooks.deregister()

const { BETSSON_PROMO, BETSSON_PROMO_PLACEMENTS, BETSSON_PROMO_OFFER_ID, isBetssonPromoLive } = promoConfig
const { getBetssonPromo, betssonPromoExpiresAt } = promoModule
const { createEngagementTrigger } = engagement
const { createGameplayCycleObserver, isCycleMilestone } = cycleModule
const { CountryProvider } = countryModule
const { createTranslator } = i18nModule
const partner = data.getOperator(BETSSON_PROMO.operatorSlug)
const locales = [['pt-BR', 'pt-br'], ['en', 'en'], ['es-MX', 'es-mx']]
const PLACEMENTS = Object.values(BETSSON_PROMO_PLACEMENTS)
const allOriginals = [crashDef.ISLAND_CRASH, raioDef.RAIO, brasilDef.BRASIL21, blackjackDef.LIVA_BLACKJACK, rouletteDef.LIVA_ROULETTE, minesDef.LIVA_MINES, capybaraDef.CAPYBARA_GOLD, gingaDef.EMBAIXADINHA, golacoDef.GOLACO, ...threeDef.THREE_GAMES]

function wrap(locale, path, child) {
  return React.createElement(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
    React.createElement(PathnameContext.Provider, { value: path },
      React.createElement(CountryProvider, { initialLocale: locale, visitorCountryCode: 'BR' }, child)))
}
const render = (locale, path, child) => new JSDOM(renderToStaticMarkup(wrap(locale, path, child))).window.document

test('central Betsson BR campaign config: verified wording only, licensed tracked link, dated evidence', () => {
  assert.equal(BETSSON_PROMO.promoId, 'betsson-br-casino-100-giros')
  assert.equal(BETSSON_PROMO.brand, 'betsson')
  assert.equal(BETSSON_PROMO.market, 'BR')
  assert.equal(BETSSON_PROMO.campaignName, 'Betsson BR | Ganhe 100 Giros!')
  assert.equal(BETSSON_PROMO.headline, 'Ganhe 100 Giros!')
  assert.equal(BETSSON_PROMO.subheadline, undefined, 'no unverified secondary claim')
  assert.equal(BETSSON_PROMO.ctaLabel, 'Jogar na Betsson')
  assert.equal(BETSSON_PROMO.affiliateUrl, 'playliva-affiliate:betsson-br-promo')
  assert.equal(betssonModule.netreferTrackingKey(BETSSON_PROMO.affiliateUrl), null)
  assert.notEqual(BETSSON_PROMO.affiliateUrl, partner.affiliateUrl.BR, 'campaign link is the dedicated Direct Link, not the brand link')
  assert.equal(brazil.isAuthorizedBrazilDestination(partner, BETSSON_PROMO.affiliateUrl), true)
  assert.match(BETSSON_PROMO.landingPageUrl, /^https:\/\/ofertas\.betsson\.bet\.br\//)
  assert.deepEqual([...BETSSON_PROMO.verifiedTerms], [], 'landing-page terms were not readable outside Brazil; nothing is claimed')
  assert.match(BETSSON_PROMO.source, /Media Gallery.*Direct Link "Betsson BR \| Ganhe 100 Giros!"/)
  assert.equal(BETSSON_PROMO.creative.kind, 'logo', 'no static official banner file exists; the native card uses the approved logo')
  assert.deepEqual([...BETSSON_PROMO.placements], PLACEMENTS)
  assert.deepEqual(BETSSON_PROMO.frequencyCap, { scope: 'milestone', max: 1 })
  assert.equal(BETSSON_PROMO.engagement.cycleMultiple, 3)
  assert.deepEqual(BETSSON_PROMO.engagement.copy, {
    'pt-BR': { headline: 'Ganhe 100 Giros!', condition: 'Aposte R$20 em jogos selecionados e ganhe 100 giros no Tigre Sortudo.', cta: 'Jogar na Betsson' },
    en: { headline: 'Get 100 Spins!', condition: 'Bet R$20 on selected games and get 100 spins on Tigre Sortudo.', cta: 'Play at Betsson' },
    'es-MX': { headline: '¡Consigue 100 giros!', condition: 'Apuesta R$20 en juegos seleccionados y consigue 100 giros en Tigre Sortudo.', cta: 'Jugar en Betsson' },
  })
  for (const locale of Object.keys(BETSSON_PROMO.engagement.copy)) {
    const text = Object.values(BETSSON_PROMO.engagement.copy[locale]).join(' ')
    assert.doesNotMatch(text, /grátis|gratis|free|registr|sem depósito|no deposit|sin depósito|depósito mínimo|rollover|expira|termina|últim|last chance/i, locale)
  }
  const live = Date.parse('2026-09-22T12:00:00Z')
  assert.equal(isBetssonPromoLive(BETSSON_PROMO, live), true)
  assert.equal(isBetssonPromoLive(BETSSON_PROMO, Date.parse('2026-09-20T23:59:59Z')), false)
  assert.equal(isBetssonPromoLive(BETSSON_PROMO, Date.parse('2026-10-14T00:00:00Z')), false)
  assert.equal(isBetssonPromoLive({ ...BETSSON_PROMO, enabled: false }, live), false)
  assert.ok(betssonPromoExpiresAt() <= Date.parse('2026-10-14T00:00:00Z'))
  const compactConfig = Object.fromEntries(Object.entries(BETSSON_PROMO).filter(([key]) => key !== 'engagement'))
  for (const text of JSON.stringify(compactConfig).match(/"[^"]*"/g)) {
    assert.doesNotMatch(text, /depósito|rollover|apost(a|e) mínim|válido até|R\$|bônus|bonus/i, `compact placements carry no condition: ${text}`)
  }
  assert.equal(BETSSON_PROMO.headline, 'Ganhe 100 Giros!', 'compact headline unchanged')
})

test('the Offers page record is derived from the config and passes every existing publication gate', () => {
  const offer = data.BETSSON_PROMO_OFFER
  assert.equal(offer.id, BETSSON_PROMO_OFFER_ID)
  assert.equal(offer.title, BETSSON_PROMO.headline)
  assert.equal(offer.affiliateUrl, BETSSON_PROMO.affiliateUrl)
  assert.equal(offer.promoId, BETSSON_PROMO.promoId)
  assert.equal(offer.status, 'verified')
  assert.equal(offer.complianceReview.market, 'BR')
  assert.equal(offer.complianceReview.reviewBy, BETSSON_PROMO.validUntil)
  assert.equal(data.isOfferEligible(offer, 'BR'), true)
  assert.equal(data.isOfferEligible(offer, 'MX'), false)
  assert.deepEqual(data.getPublicOffers('BR'), [offer])
  assert.deepEqual(data.getPublicOffers('MX'), [])
  const resolved = affiliate.resolveDestination({ offerId: offer.id, operatorSlug: partner.slug, country: 'BR', pageType: 'offers', placement: 'offers_page' })
  assert.equal(resolved?.url, BETSSON_PROMO.affiliateUrl)
  assert.equal(affiliate.resolveDestination({ offerId: offer.id, country: 'MX' }), null)
  assert.equal(affiliate.resolveDestination({ offerId: offer.id, operatorSlug: 'kto', country: 'BR' }), null)
})

test('promo resolver is GEO-gated, placement-scoped and only ever links through /go?offer=', () => {
  for (const placement of PLACEMENTS) for (const [locale] of locales) {
    const model = getBetssonPromo('BR', locale, placement, { pageSlug: 'crash' })
    assert.ok(model, `${placement} ${locale}`)
    assert.equal(model.headline, 'Ganhe 100 Giros!')
    assert.equal(model.ctaLabel, locale === 'pt-BR' ? 'Jogar na Betsson' : locale === 'en' ? 'Play at Betsson' : 'Jugar en Betsson')
    assert.equal(model.creative.kind, 'logo')
    const query = new URL(model.href, 'https://www.playliva.com').searchParams
    assert.match(model.href, /^\/go\?/)
    assert.equal(query.get('offer'), BETSSON_PROMO_OFFER_ID)
    assert.equal(query.get('operator'), partner.slug)
    assert.equal(query.get('country'), 'BR')
    assert.equal(query.get('language'), locale)
    assert.equal(query.get('placement'), placement)
    assert.equal(query.get('pageSlug'), 'crash')
    assert.equal(query.get('category'), null)
    assert.equal(query.get('game'), null)
    assert.doesNotMatch(model.href, /betsson\.bet\.br/)
    assert.equal(getBetssonPromo('MX', locale, placement), null)
    assert.equal(getBetssonPromo('PT', locale, placement), null)
    assert.equal(getBetssonPromo('BR', locale, placement, { now: Date.parse('2026-12-01T00:00:00Z') }), null)
    assert.equal(getBetssonPromo('BR', locale, placement, { config: { ...BETSSON_PROMO, enabled: false } }), null)
    assert.equal(getBetssonPromo('BR', locale, placement, { config: { ...BETSSON_PROMO, placements: [] } }), null)
    assert.equal(getBetssonPromo('BR', locale, placement, { config: { ...BETSSON_PROMO, affiliateUrl: 'https://betsson.com/x' } }), null,
      'a config link that does not match the eligible offer destination fails closed')
  }
  const original = brazil.BRAZIL_AUTHORIZATIONS[partner.id].status
  try {
    brazil.BRAZIL_AUTHORIZATIONS[partner.id].status = 'suspended'
    assert.equal(getBetssonPromo('BR', 'pt-BR', BETSSON_PROMO_PLACEMENTS.offersPage), null, 'stale BR authorization closes the promo')
  } finally { brazil.BRAZIL_AUTHORIZATIONS[partner.id].status = original }
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

test('attribution: UTMs and known social referrers are preserved per session; free text is rejected', () => {
  const { parseAttribution, classifyReferrer, sanitizeAttributionValue, attributionPayload } = attribution
  assert.deepEqual(parseAttribution('?utm_source=TikTok&utm_medium=social&utm_campaign=island-crash_v2&utm_content=reel.1&x=1', 'https://www.tiktok.com/@x'),
    { trafficSource: 'tiktok', utm: { utm_source: 'tiktok', utm_medium: 'social', utm_campaign: 'island-crash_v2', utm_content: 'reel.1' } })
  assert.deepEqual(parseAttribution('', 'https://www.instagram.com/reel/abc'), { trafficSource: 'instagram', utm: {} })
  assert.deepEqual(parseAttribution('', 'https://youtube.com/shorts/x'), { trafficSource: 'youtube', utm: {} })
  assert.deepEqual(parseAttribution('', 'https://unknown.example/path'), { trafficSource: 'referral', utm: {} })
  assert.equal(parseAttribution('', ''), null)
  assert.equal(parseAttribution('', 'https://www.playliva.com/pt-br', 'www.playliva.com'), null)
  assert.equal(classifyReferrer('not a url'), undefined)
  assert.equal(sanitizeAttributionValue('email=person@example.com'), undefined)
  assert.equal(sanitizeAttributionValue('a'.repeat(101)), undefined)
  assert.equal(sanitizeAttributionValue(' Reels_BR.2 '), 'reels_br.2')
  assert.deepEqual(attributionPayload({ trafficSource: 'tiktok', utm: { utm_source: 'tiktok', utm_term: 'crash' } }),
    { trafficSource: 'tiktok', utmSource: 'tiktok', utmMedium: undefined, utmCampaign: undefined, utmContent: undefined, utmTerm: 'crash' })
  const safe = tracking.sanitizeTrackPayload({ promoId: BETSSON_PROMO.promoId, brand: 'betsson', surface: 'originals', placement: 'originals_engagement_offer',
    trafficSource: 'tiktok', utmSource: 'tiktok', utmCampaign: 'reel.1', utmContent: 'has space', email: 'x@y.z', country: 'BR' }, '/pt-br/play/crash?utm_source=tiktok')
  assert.deepEqual(safe, { country: 'BR', placement: 'originals_engagement_offer', promoId: BETSSON_PROMO.promoId, brand: 'betsson', surface: 'originals',
    trafficSource: 'tiktok', utmSource: 'tiktok', utmCampaign: 'reel.1', url: '/pt-br/play/crash' })
  assert.equal(consent.parseConsent(null), null)
})

for(const game of allOriginals) test(`${game.slug}: Originals shell offers after cycles 3, 6 and 9 with milestone analytics`, async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: `https://www.playliva.com/pt-br/play/${game.slug}?utm_source=tiktok&utm_campaign=reel.1`, virtualConsole: new VirtualConsole() })
  const saved = new Map()
  for (const key of ['window', 'self', 'document', 'location', 'navigator', 'Event', 'KeyboardEvent', 'HTMLElement', 'Node', 'IntersectionObserver']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
  }
  Object.defineProperty(globalThis, 'IntersectionObserver', { configurable: true, value: class {
    constructor(callback) { this.callback = callback }
    observe(target) { this.callback([{ target, isIntersecting: true, intersectionRatio: 1 }]) }
    disconnect() {}
  } })
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const root = createRoot(document.getElementById('root'))
  const store = sessionModule.createDemoSessionStore(() => window.localStorage, () => 1)
  const events = []
  window.dataLayer = { push: item => events.push(item) }
  window.localStorage.setItem(consent.CONSENT_STORAGE_KEY, JSON.stringify({ necessary: true, analytics: true, marketing: false }))
  attribution.captureAttribution()

  const mount = roundActive => act(() => root.render(wrap('pt-BR', `/pt-br/play/${game.slug}`,
    React.createElement(providerModule.DemoSessionProvider, { store },
      React.createElement(shellModule.PlayGameShell, { game, roundActive, controls: React.createElement('button', {}, 'Start') },
        React.createElement('div', {}, 'viewport'))))))
  const sleep = ms => act(() => new Promise(resolve => setTimeout(resolve, ms)))
  try {
    await mount(false)
    assert.equal(document.querySelector('[data-betsson-engagement-offer]'), null)
    const header = document.querySelector('[data-betsson-banner="originals"]')
    assert.ok(header.textContent.includes('Ganhe 100 Giros!'))
    assert.ok(header.textContent.includes('Jogar na Betsson'))
    assert.match(header.querySelector('a[href^="/go?"]').getAttribute('href'), /offer=of-br-betsson-100-giros.*placement=originals_header/)
    for (let round = 1; round <= 3; round += 1) {
      await mount(true)
      assert.equal(document.querySelector('[data-betsson-engagement-offer]'), null, 'never during an active round')
      await mount(false)
    }
    assert.equal(document.querySelector('[data-betsson-engagement-offer]'), null, 'settle delay before opening')
    await sleep(BETSSON_PROMO.engagement.delayMs + 80)
    const offer = document.querySelector('[data-betsson-engagement-offer]')
    assert.ok(offer, 'opens after the third settled round')
    assert.equal(offer.closest('[data-game-unit]'), null, 'rendered outside the game unit')
    assert.equal(document.querySelector('[data-game-unit] [data-betting-ad]'), null)
    const dialog = offer.querySelector('[role="dialog"]')
    assert.equal(dialog.getAttribute('aria-modal'), 'true')
    assert.ok(dialog.hasAttribute('data-betting-ad'))
    assert.equal(dialog.querySelectorAll('[data-brazil-ad-warning]').length, 1)
    assert.ok(dialog.textContent.includes('18+'))
    assert.equal(dialog.querySelector('h2').textContent, 'Ganhe 100 Giros!')
    assert.equal(dialog.querySelector('[data-promo-condition]').textContent, 'Aposte R$20 em jogos selecionados e ganhe 100 giros no Tigre Sortudo.')
    assert.equal(offer.getAttribute('data-completed-cycle'), '3')
    assert.equal(offer.getAttribute('data-exposure'), '1')
    assert.equal(document.querySelector('[data-betsson-banner="originals"]').textContent.includes('R$20'), false, 'compact header stays short-form')
    const cta = dialog.querySelector('a[data-promo-cta]')
    assert.equal(cta.textContent, 'Jogar na Betsson')
    assert.equal(cta.getAttribute('target'), '_blank')
    assert.ok(cta.rel.split(' ').includes('sponsored'))
    const query = new URL(cta.getAttribute('href'), 'https://www.playliva.com').searchParams
    assert.equal(query.get('offer'), BETSSON_PROMO_OFFER_ID)
    assert.equal(query.get('placement'), 'originals_engagement_offer')
    assert.equal(query.get('pageSlug'), game.slug)
    assert.doesNotMatch(dialog.innerHTML, /betsson\.bet\.br|bannerflow/)
    assert.equal(dialog.querySelector('audio, video, [autoplay]'), null, 'no autoplay media')
    assert.doesNotMatch(dialog.textContent, /\d+:\d\d|termina em|expira/i, 'no countdown or fake urgency')
    assert.ok(dialog.querySelector('button[aria-label]'), 'explicit close control')
    const impression = events.find(item => item.event === 'offer_impression' && item.placement === 'originals_engagement_offer')
    assert.ok(impression)
    assert.equal(impression.promoId, BETSSON_PROMO.promoId)
    assert.equal(impression.brand, 'betsson')
    assert.equal(impression.placement, 'originals_engagement_offer')
    assert.equal(impression.surface, 'originals')
    assert.equal(impression.gameSlug, game.slug)
    assert.equal(impression.originalId, game.id)
    assert.equal(impression.country, 'BR')
    assert.equal(impression.language, 'pt-BR')
    assert.equal(impression.url, `/pt-br/play/${game.slug}`)
    assert.equal(impression.trafficSource, 'tiktok')
    assert.equal(impression.utmCampaign, 'reel.1')
    assert.equal(impression.category, game.category)
    assert.equal(impression.completedCycleNumber, '3')
    assert.equal(impression.triggerMultiple, '3')
    assert.equal(impression.exposureNumber, '1')
    assert.ok(['mobile', 'desktop'].includes(impression.device))
    assert.equal(impression.email, undefined)
    await act(() => { cta.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true })) })
    assert.equal(events.filter(item => item.event === 'affiliate_click').length,1)
    const click = events.find(item => item.event === 'affiliate_click')
    assert.equal(click?.promoId, BETSSON_PROMO.promoId)
    assert.equal(click?.trafficSource, 'tiktok')
    assert.equal(click?.completedCycleNumber, '3')
    await act(() => { dialog.querySelector('button[aria-label]').click() })
    assert.equal(document.querySelector('[data-betsson-engagement-offer]'), null)
    assert.equal(events.filter(item => item.event === 'offer_dismiss').length, 1)
    assert.equal(events.find(item => item.event === 'offer_dismiss').exposureNumber, '1')
    for (let round = 4; round <= 5; round += 1) {
      await mount(true); await mount(false)
      await sleep(BETSSON_PROMO.engagement.delayMs + 80)
      assert.equal(document.querySelector('[data-betsson-engagement-offer]'), null, `cycle ${round} shows nothing`)
    }
    await mount(true); await mount(false)
    await sleep(BETSSON_PROMO.engagement.delayMs + 80)
    const second = document.querySelector('[data-betsson-engagement-offer]')
    assert.ok(second, 'cycle 6 reopens the offer after a dismissal')
    assert.equal(second.getAttribute('data-completed-cycle'), '6')
    assert.equal(second.getAttribute('data-exposure'), '2')
    assert.equal(events.filter(item => item.event === 'offer_impression' && item.placement === 'originals_engagement_offer').length, 2)
    assert.equal(events.filter(item => item.event === 'offer_impression' && item.placement === 'originals_engagement_offer')[1].completedCycleNumber, '6')
    assert.equal(events.filter(item => item.event === 'offer_impression' && item.placement === 'originals_engagement_offer')[1].exposureNumber, '2')
    await act(() => { document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) })
    assert.equal(document.querySelector('[data-betsson-engagement-offer]'), null, 'Escape dismisses')
    for (let round = 7; round <= 9; round += 1) { await mount(true); await mount(false) }
    await sleep(BETSSON_PROMO.engagement.delayMs + 80)
    const third = document.querySelector('[data-betsson-engagement-offer]')
    assert.equal(third?.getAttribute('data-completed-cycle'), '9')
    assert.equal(third?.getAttribute('data-exposure'), '3')
    assert.equal(events.filter(item => item.event === 'offer_impression' && item.placement === 'originals_engagement_offer').length, 3, 'one impression per milestone')
    assert.equal(window.sessionStorage.getItem('playliva.betsson.engagement.betsson-br-casino-100-giros'), null, 'no session cap is written')
  } finally {
    await act(() => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] }
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})

for(const game of allOriginals) test(`${game.slug}: non-Brazil suppresses every campaign surface`, async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: `https://www.playliva.com/es-mx/play/${game.slug}`, virtualConsole: new VirtualConsole() })
  const saved = new Map()
  for (const key of ['window', 'self', 'document', 'location', 'navigator', 'Event', 'HTMLElement', 'Node']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
  }
  window.localStorage.setItem('playliva.country', 'MX')
  Object.defineProperty(globalThis, 'IntersectionObserver', { configurable: true, value: class {
    constructor(callback) { this.callback = callback }
    observe(target) { this.callback([{ target, isIntersecting: true, intersectionRatio: 1 }]) }
    disconnect() {}
  } })
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const root = createRoot(document.getElementById('root'))
  const store = sessionModule.createDemoSessionStore(() => window.localStorage, () => 1)

  const mount = roundActive => act(() => root.render(wrap('es-MX', `/es-mx/play/${game.slug}`,
    React.createElement(providerModule.DemoSessionProvider, { store },
      React.createElement(shellModule.PlayGameShell, { game, roundActive, controls: React.createElement('button', {}, 'Start') },
        React.createElement('div', {}, 'viewport'))))))
  try {
    await mount(false)
    assert.equal(document.querySelector('[data-betsson-banner]'), null)
    for (let round = 0; round < 4; round += 1) { await mount(true); await mount(false) }
    await act(() => new Promise(resolve => setTimeout(resolve, BETSSON_PROMO.engagement.delayMs + 80)))
    assert.equal(document.querySelector('[data-betsson-engagement-offer]'), null)
    assert.equal(document.querySelector('a[href^="/go"]'), null)
  } finally {
    await act(() => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] }
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})

test('discovery Where-to-Play swaps only the Betsson card for the campaign card and keeps the multi-operator grid', () => {
  for (const [locale, segment] of locales) {
    const t = createTranslator(locale)
    const doc = render(locale, `/${segment}/games/aviator`, React.createElement(gameDetailModule.GameDetailView, { game: data.getGame('aviator') }))
    const card = doc.querySelector('#where-to-play [data-betsson-discovery-offer]')
    assert.ok(card, locale)
    assert.equal(card.getAttribute('data-game-slug'), 'aviator')
    assert.ok(card.hasAttribute('data-betting-ad'))
    assert.equal(card.getAttribute('data-evidence-state'), 'pending')
    assert.equal(card.querySelectorAll('[data-brazil-ad-warning]').length, 1)
    assert.ok(card.querySelector('h3').textContent.includes('Ganhe 100 Giros!'))
    assert.ok(card.textContent.includes(t('promo.casinoBoundary')))
    assert.doesNotMatch(card.textContent, /Aviator/, 'never claims the spins are for the game being viewed')
    assert.ok(card.textContent.includes(t('notice.affiliateShort')))
    assert.ok(card.textContent.includes('18+'))
    const links = [...card.querySelectorAll('a[href^="/go?"]')]
    assert.equal(links.length, 2)
    assert.equal(links[0].textContent.includes(locale === 'pt-BR' ? 'Jogar na Betsson' : t('affiliate.playAtNamed', { name: 'Betsson' })), true)
    assert.equal(doc.querySelectorAll('#where-to-play [data-betsson-discovery-offer]').length, 1)
    assert.doesNotMatch(card.innerHTML, /betsson\.bet\.br/)
    const standalone = render(locale, `/${segment}/games/aviator`, React.createElement(discoveryModule.BetssonDiscoveryOffer, { gameSlug: 'aviator' }))
    assert.ok(standalone.querySelector('[data-betsson-discovery-offer]'))
  }
})

test('Offers page renders the campaign as a verified offer card with tracked CTA, terms access and BR warning', () => {
  for (const [locale, segment] of locales) {
    const t = createTranslator(locale)
    const doc = render(locale, `/${segment}/offers`, React.createElement(offersModule.OffersView))
    const card = doc.querySelector(`[data-offer-id="${BETSSON_PROMO_OFFER_ID}"]`)
    assert.ok(card, locale)
    assert.equal(doc.querySelectorAll(`[data-offer-id="${BETSSON_PROMO_OFFER_ID}"]`).length, 1, 'no duplicate card across sections')
    assert.equal(card.getAttribute('data-promo-id'), BETSSON_PROMO.promoId)
    assert.ok(doc.querySelector('[data-offers-verified]').textContent.includes(t('affiliate.verifiedOffers')))
    assert.equal(card.querySelector('h3').textContent, 'Ganhe 100 Giros!')
    assert.equal(card.querySelector('h3').getAttribute('lang'), 'pt-BR')
    assert.ok(card.textContent.includes(t('promo.offerBoundary')))
    assert.ok(card.textContent.includes(t('promo.terms')))
    assert.ok(card.textContent.includes('18+'))
    assert.equal(card.querySelectorAll('[data-brazil-ad-warning]').length, 1)
    const links = [...card.querySelectorAll('a[href^="/go?"]')]
    assert.equal(links.length, 2, 'CTA plus terms access')
    const cta = new URL(links[0].getAttribute('href'), 'https://www.playliva.com').searchParams
    assert.equal(cta.get('offer'), BETSSON_PROMO_OFFER_ID)
    assert.equal(cta.get('placement'), 'offers_page')
    assert.equal(cta.get('page'), 'offers')
    assert.equal(links[0].textContent.includes(locale === 'pt-BR' ? 'Jogar na Betsson' : locale === 'en' ? 'Play at Betsson' : 'Jugar en Betsson'), true)
    assert.doesNotMatch(card.innerHTML, /betsson\.bet\.br/)
    assert.ok(card.querySelector('img[alt=""]'), 'operator logo as the approved brand mark')
  }
})

test('no Original game file or engine imports the campaign; the shell owns the offer mount', async () => {
  for (const path of ['crash/crash-game.tsx', 'capybara/capybara-game.tsx', 'blackjack/blackjack-game.tsx', 'roulette/roulette-game.tsx', 'mines/mines-game.tsx']) {
    const source = await readFile(new URL(`../components/originals/${path}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /betsson|promo|offer/i, path)
  }
  const shell = await readFile(new URL('../components/originals/play-game-shell.tsx', import.meta.url), 'utf8')
  assert.ok(shell.includes('BetssonEngagementOffer'))
  const viewport = shell.indexOf('data-game-viewport'), controls = shell.indexOf('data-game-controls'), offer = shell.indexOf('<BetssonEngagementOffer')
  assert.ok(viewport > 0 && controls > viewport && offer > controls, 'offer mounts after the game unit')
})
