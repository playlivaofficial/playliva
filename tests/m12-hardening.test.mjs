import test from 'node:test'
import assert from 'node:assert/strict'
import React, { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot } from 'react-dom/client'
import { JSDOM } from 'jsdom'
import { readFile } from 'node:fs/promises'
import { registerHooks } from 'node:module'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import brazil from '../lib/compliance/brazil.ts'
import offerEvidence from '../lib/compliance/offers.ts'
import data from '../lib/data.ts'
import affiliate from '../lib/affiliate.ts'
import tracking from '../lib/tracking.ts'
import consent from '../lib/consent.ts'
import rtp from '../lib/rtp.ts'
import editorial from '../lib/editorial.ts'
import sitemapModule from '../app/sitemap.ts'
import country from '../components/country-context.tsx'
import warning from '../components/affiliates/brazil-ad-warning.tsx'
import rtpView from '../components/rtp-fact.tsx'
import schema from '../components/json-ld.tsx'
import crash from '../lib/originals/crash/definition.ts'

const hooks = registerHooks({ load(url, context, next) {
  if (url.endsWith('.module.css')) return { format: 'commonjs', shortCircuit: true, source: 'module.exports = {}' }
  return next(url, context)
} })
const unwrap = m => m.default ?? m
const banner = unwrap(await import('../components/affiliates/betsson-sponsored-banner.tsx'))
const providerCta = unwrap(await import('../components/affiliates/provider-play-real-cta.tsx'))
const originalCta = unwrap(await import('../components/originals/play-real-cta.tsx'))
const operatorCard = unwrap(await import('../components/operator-card.tsx'))
const operatorProfile = unwrap(await import('../components/operator-profile-view.tsx'))
hooks.deregister()
const partner = data.getOperator('betsson-group-affiliates')
const evidence = brazil.BRAZIL_AUTHORIZATIONS[partner.id]
const checked = Date.parse('2026-09-14T12:00:00Z')

test('M12 BR evidence: exact official identity, domain and independent review deadline', () => {
  assert.equal(evidence.legalEntity, 'SIMULCASTING BRASIL SOM E IMAGEM S.A.')
  assert.equal(evidence.cnpj, '17.385.948/0001-05')
  assert.equal(evidence.authorizedDomain, 'betsson.bet.br')
  assert.match(evidence.authorization, /371.*2025/)
  assert.equal(brazil.hasCurrentBrazilEvidence(evidence, checked), true)
  assert.equal(brazil.hasCurrentBrazilEvidence(undefined, checked), false)
  assert.equal(brazil.hasCurrentBrazilEvidence(evidence, Date.parse('2026-10-14T00:00:00Z')), false)
  assert.equal(brazil.hasCurrentBrazilEvidence(evidence, Date.parse('2026-09-13T23:59:59Z')), false)
  for (const patch of [{ status: 'suspended' }, { status: 'withdrawn' }, { source: '' },
    { cnpj: '' }, { reviewBy: '2099-01-01' }, { verifiedAt: 'invalid' }]) {
    assert.equal(brazil.hasCurrentBrazilEvidence({ ...evidence, ...patch }, checked), false)
  }
})

test('M12 BR allowlist rejects missing authorization and lookalike or unrelated domains', () => {
  assert.equal(brazil.isAuthorizedBrazilDestination(partner, partner.affiliateUrl.BR, checked), true)
  for (const url of ['https://betsson.bet.br.evil.invalid', 'https://evilbetsson.bet.br',
    'http://betsson.bet.br', 'https://betsson.com', 'https://person@betsson.bet.br',
    'https://betsson.bet.br:8443', 'not a URL']) {
    assert.equal(brazil.isAuthorizedBrazilDestination(partner, url, checked), false, url)
  }
  assert.equal(brazil.isAuthorizedBrazilDestination({ id: 'unknown' }, partner.affiliateUrl.BR, checked), false)
})

test('M12 missing or stale evidence closes lists, UI models and server redirect resolution together', () => {
  const original = evidence.status
  try {
    evidence.status = 'suspended' // process-local fixture, never a production record change
    assert.equal(data.isAffiliateEligible(partner, 'BR'), false)
    assert.equal(affiliate.resolveDestination({ operatorSlug: partner.slug, country: 'BR' }), null)
    assert.equal(data.getPublicOperators().includes(partner), false)
    assert.equal(data.getOperatorsForGame(data.getGame('aviator'), 'BR').includes(partner), false)
  } finally { evidence.status = original }
  assert.equal(data.isAffiliateEligible(partner, 'MX'), false)
})

test('M12 warning area formula accounts for padded ads and responsive width', () => {
  for (const [adWidth, bandWidth] of [[288, 246], [328, 286], [1200, 1160]]) {
    for (const contentHeight of [100, 500, 1400]) {
      const height = brazil.requiredWarningHeight(adWidth, contentHeight + 96, bandWidth, 96)
      assert.ok(bandWidth * height / (adWidth * (contentHeight + height)) >= 0.1)
    }
  }
})

for (const locale of ['en', 'pt-BR', 'es-MX']) test(`M12 every existing promotional component carries one horizontal BR warning: ${locale}`, () => {
  const render = child => new JSDOM(renderToStaticMarkup(React.createElement(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
    React.createElement(PathnameContext.Provider, { value: '/en' }, React.createElement(country.CountryProvider, { initialLocale: locale }, child)))))
  for (const child of [
    React.createElement(banner.BetssonSponsoredBanner, { surface: 'homepage' }),
    React.createElement(providerCta.ProviderPlayRealCta, { gameSlug: 'aviator', category: 'crash' }),
    React.createElement(originalCta.PlayRealCTA, { game: crash.ISLAND_CRASH }),
    React.createElement(operatorCard.OperatorCard, { operator: partner, country: 'BR' }),
    React.createElement(operatorProfile.OperatorProfileView, { operator: partner }),
  ]) {
    const dom = render(child), doc = dom.window.document
    assert.ok(doc.querySelectorAll('a[href^="/go?"]').length)
    for (const link of doc.querySelectorAll('a[href^="/go?"]')) {
      const ad = link.closest('[data-betting-ad]')
      assert.ok(ad)
      assert.equal(ad.getAttribute('data-evidence-state'), 'pending', 'cached markup fails closed before evidence hydration')
      assert.equal(ad.querySelectorAll('[data-brazil-ad-warning]').length, 1)
      assert.ok(ad.textContent.includes(brazil.BRAZIL_AD_RULES.warnings[0]))
      assert.ok(ad.textContent.includes('18+'))
      assert.equal(ad.querySelector('.br-ad-compliance').lang, 'pt-BR', 'Brazilian statutory wording independent of UI language')
    }
    dom.window.close()
  }
})

test('M12 cached ads become visible only with current evidence and close at offer expiry', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://www.playliva.com/en' })
  const saved = new Map()
  for (const key of ['window', 'document', 'Event']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const root = createRoot(document.getElementById('root'))
  try {
    const render = expiresAt => React.createElement('aside', { 'data-betting-ad': '', 'data-evidence-state': 'pending' },
      React.createElement(warning.BrazilAdWarning, { operatorId: partner.id, expiresAt }))
    await act(() => root.render(render(Date.now() + 3600000)))
    assert.equal(document.querySelector('aside').dataset.evidenceState, 'current')
    await act(() => root.render(render(Date.now() - 1)))
    assert.equal(document.querySelector('aside').dataset.evidenceState, 'expired')
  } finally {
    await act(() => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key] }
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})

test('M12 offer publication requires source, dated terms, expiry and market-specific legal review', () => {
  const offer = { title: 'Process-local evidence fixture', terms: 'Test only, never published', country: 'BR',
    source: 'https://betsson.bet.br', lastVerifiedAt: '2026-09-14', validUntil: '2026-09-20',
    complianceReview: { market: 'BR', status: 'reviewed-permitted', legalSource: brazil.BRAZIL_AD_RULES.guidance, verifiedAt: '2026-09-14', reviewBy: '2026-09-20' } }
  assert.equal(offerEvidence.hasCurrentOfferEvidence(offer, checked), true)
  for (const field of ['source', 'lastVerifiedAt', 'validUntil', 'complianceReview', 'title', 'terms']) {
    assert.equal(offerEvidence.hasCurrentOfferEvidence({ ...offer, [field]: undefined }, checked), false, field)
  }
  assert.equal(offerEvidence.hasCurrentOfferEvidence({ ...offer, complianceReview: { ...offer.complianceReview, market: 'MX' } }, checked), false)
  assert.equal(offerEvidence.hasCurrentOfferEvidence(offer, Date.parse('2026-09-21')), false)
  assert.deepEqual(data.getPublicOffers('BR'), [], 'no offer fabricated by M12')
})

test('M12 analytics allowlist strips search, contact details, wallet data and event overrides', () => {
  const safe = tracking.sanitizeTrackPayload({ country: 'BR', locale: 'en', pageType: 'play',
    originalId: 'island-crash', roundId: 'ephemeral-round-1', gameId: 'g1+g2',
    url: '/en/play/crash?email=private%40example.invalid#secret',
    email: 'private@example.invalid', ip: '192.0.2.1', userAgent: 'private', guestId: 'persistent',
    wallet: { balance: 10 }, balance: 10, event: 'override', timestamp: 'override' }, '/en')
  assert.deepEqual(safe, { country: 'BR', pageType: 'play', originalId: 'island-crash',
    roundId: 'ephemeral-round-1', gameId: 'g1+g2', language: 'en', url: '/en/play/crash' })
  for (const value of ['https://outside.invalid/private', '//outside.invalid', '/en/person@example.invalid', '/en/%40private', '/en/../private']) assert.equal(tracking.analyticsPath(value), undefined)
  assert.equal(tracking.analyticsPath('/en?private=1'), '/en')
  assert.equal(consent.parseConsent('{"analytics":true}'), null)
})

test('M12 RTP only publishes verified provider/edition facts and omits unknown values', () => {
  assert.equal(Object.keys(rtp.RTP_EVIDENCE).length, 3)
  for (const evidence of Object.values(rtp.RTP_EVIDENCE)) {
    assert.equal(rtp.validRtpEvidence(evidence, evidence.gameSlug, evidence.provider), true)
    for (const patch of [{ source: '' }, { source: 'https://spribe.co/games/multikeno' },
      { publishedPercent: '101%' }, { publishedPercent: 'unknown' }, { verifiedAt: '' }, { variant: {} }]) {
      assert.equal(rtp.validRtpEvidence({ ...evidence, ...patch }, evidence.gameSlug, evidence.provider), false)
    }
  }
  assert.equal(rtp.getRtpEvidence('sugar-rush', 'Pragmatic Play'), undefined)
  assert.equal(renderToStaticMarkup(React.createElement(rtpView.RtpFact, { slug: 'sugar-rush', provider: 'Pragmatic Play', locale: 'pt-BR' })), '')
  assert.match(renderToStaticMarkup(React.createElement(rtpView.RtpFact, { slug: 'spribe-keno', provider: 'SPRIBE', locale: 'pt-BR' })), /97,00%.*segundo o provedor/)
})

test('M12 editorial dates never become build timestamps; unknown legacy dates remain unknown', () => {
  assert.equal(editorial.EDITOR.name, 'PlayLiva')
  assert.equal(editorial.editorialRecord('/games/sugar-rush').publishedAt, '2026-09-13')
  assert.equal(editorial.editorialRecord('/games/aviator').publishedAt, undefined)
  assert.equal(editorial.editorialRecord('/games/aviator').updatedAt, undefined)
  const entries = sitemapModule.default()
  assert.equal(entries.find(item => item.url.endsWith('/en/games/aviator')).lastModified, undefined)
  for (const segment of ['en', 'pt-br', 'es-mx']) for (const path of ['/editorial-policy', '/authors/playliva']) {
    assert.ok(entries.some(item => item.url.endsWith(`/${segment}${path}`)))
  }
})

test('M12 JSON-LD cannot terminate its script when editorial text contains markup', () => {
  const value = { '@context': 'https://schema.org', '@type': 'WebSite', name: '</script><script>alert(1)</script>' }
  const dom = new JSDOM(renderToStaticMarkup(React.createElement(schema.JsonLd, { data: value })))
  assert.equal(dom.window.document.querySelectorAll('script').length, 1)
  assert.deepEqual(JSON.parse(dom.window.document.querySelector('script').textContent), value)
  dom.window.close()
})

test('M12 Original gameplay shell omits operator ads and keeps accessible warning styling', async () => {
  const shell = await readFile(new URL('../components/originals/play-game-shell.tsx', import.meta.url), 'utf8')
  assert.equal(shell.includes('PlayRealCTA'), false)
  assert.equal(shell.includes('BetssonSponsoredBanner'), false)
  assert.ok(shell.includes('data-game-viewport'))
  assert.ok(shell.includes('data-game-controls'))
  const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8')
  assert.match(css, /writing-mode: horizontal-tb/)
  assert.match(css, /\[data-betting-ad\]:not\(\[data-evidence-state="current"\]\)/)
  assert.match(css, /prefers-reduced-motion: reduce/)
})
