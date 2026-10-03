import test from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { readdir, readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import countryModule from '../components/country-context.tsx'
import data from '../lib/data.ts'
import content from '../lib/content.ts'
import product from '../lib/product-discovery.ts'
import i18n from '../lib/i18n.ts'

const hooks = registerHooks({ load(url, context, next) {
  if (url.endsWith('.module.css')) return { format: 'commonjs', shortCircuit: true, source: 'module.exports = {}' }
  return next(url, context)
} })
const unwrap = module => module.default ?? module
const { GameDetailView } = unwrap(await import('../components/game-detail-view.tsx'))
const { ComparisonCard } = unwrap(await import('../components/comparison-card.tsx'))
const { ComparisonView } = unwrap(await import('../components/comparison-view.tsx'))
const { SiteFooter } = unwrap(await import('../components/site-footer.tsx'))
hooks.deregister()
const locales = [['en', 'en'], ['pt-BR', 'pt-br'], ['es-MX', 'es-mx']]
function render(locale, segment, child) {
  const tree = React.createElement(AppRouterContext.Provider, { value: { push() {}, prefetch() {} } },
    React.createElement(PathnameContext.Provider, { value: `/${segment}` },
      React.createElement(countryModule.CountryProvider, { initialLocale: locale, visitorCountryCode: 'BR' }, child)))
  return new JSDOM(renderToStaticMarkup(tree))
}

test('M10: provider identity, editorial facts, guide anchors and indexed internal URLs survive the redesign', () => {
  for (const [locale, segment] of locales) for (const slug of ['aviator', 'gates-of-olympus', 'blackjack-live', 'lightning-roulette']) {
    const game = data.getGame(slug), copy = content.getGameContent(game, locale)
    const dom = render(locale, segment, React.createElement(GameDetailView, { game })), doc = dom.window.document
    assert.equal(doc.querySelectorAll('h1').length, 1)
    assert.equal(doc.querySelector('h1').textContent, copy.seo?.game?.h1 ?? game.title)
    assert.ok(doc.querySelector(`[data-provider-detail="${slug}"] [data-provider-hero-art]`))
    assert.ok(doc.querySelector('#overview').textContent.includes(copy.whatIsIt ?? copy.about))
    for (const step of copy.howItWorks ?? []) assert.ok(doc.querySelector('#overview').textContent.includes(step))
    assert.ok(doc.querySelector(`a[href="/${segment}/games-like/${slug}"]`))
    assert.equal(Boolean(doc.querySelector(`a[href="/${segment}/where-to-play/${slug}"]`)), segment === 'pt-br', 'Only published locale guides are linked')
    for (const link of doc.querySelectorAll('nav[aria-label] a[href^="#"]')) assert.ok(doc.querySelector(link.getAttribute('href')))
    assert.ok(doc.querySelector('a[href="#where-to-play"]'))
    assert.ok(doc.querySelector('#where-to-play'))
    assert.equal(doc.querySelector('[data-original-card], [data-game-shell]'), null)
    dom.window.close()
  }
})

test('M10: detail metadata uses the existing localized game type/mechanics without changing facts', () => {
  for (const [locale, segment] of locales) {
    const game = data.getGame('aviator'), copy = content.getGameContent(game, locale)
    const dom = render(locale, segment, React.createElement(GameDetailView, { game })), doc = dom.window.document
    const facts = doc.querySelector('#key-facts').textContent
    assert.ok(facts.includes(copy.gameType))
    for (const mechanic of copy.mechanics) assert.ok(facts.includes(mechanic))
    assert.ok(facts.includes(product.productCopy(locale).mobile))
    if (locale !== 'en') assert.doesNotMatch(facts, /Rising multiplier|Manual cash-out|Desktop, Mobile/)
    dom.window.close()
  }
})

test('M10: existing provider outbound actions keep exact context, new-tab isolation and attribution', () => {
  for (const [locale, segment] of locales) for (const slug of ['aviator', 'blackjack-live', 'lightning-roulette']) {
    const game = data.getGame(slug)
    const dom = render(locale, segment, React.createElement(GameDetailView, { game })), doc = dom.window.document
    // The Betsson Where-to-Play card is the central campaign card (CTA + terms link);
    // the verified exact-game deep link stays on the hero Play Real CTA.
    const links = [...doc.querySelectorAll('#where-to-play a[href^="/go?"]')]
    assert.equal(links.length, 2)
    for (const item of links) {
      const query = new URL(item.getAttribute('href'), 'https://example.invalid').searchParams
      assert.equal(query.get('operator'), 'betsson-group-affiliates')
      assert.equal(query.get('offer'), 'of-br-betsson-100-giros')
      assert.equal(query.get('country'), 'BR')
      assert.equal(query.get('language'), locale)
      assert.equal(query.get('category'), null, 'the campaign card never claims a game/category deep link')
      assert.equal(query.get('game'), null)
      assert.equal(query.get('page'), 'content')
      assert.equal(query.get('pageSlug'), game.slug)
      assert.equal(query.get('placement'), 'discovery_game_offer')
    }
    const hero = new URL(doc.querySelector('[data-betsson-game-cta] a[href^="/go?"]').getAttribute('href'), 'https://example.invalid').searchParams
    assert.equal(hero.get('category'), game.affiliateCategory ?? game.category, 'verified deep link stays on the hero CTA')
    const link = links[0]
    assert.equal(link.getAttribute('target'), '_blank')
    for (const rel of ['sponsored', 'noopener', 'noreferrer']) assert.ok(link.rel.split(' ').includes(rel))
    dom.window.close()
  }
})

test('M10: comparison cards are distinct internal editorial links, preserving comparison facts', () => {
  for (const [locale, segment] of locales) {
    const comparison = data.COMPARISONS[0], copy = content.getComparisonContent(comparison, locale)
    const dom = render(locale, segment, React.createElement(ComparisonCard, { comparison })), doc = dom.window.document
    const card = doc.querySelector('[data-comparison-card]')
    assert.equal(card.getAttribute('href'), `/${segment}/compare/${comparison.slug}`)
    assert.equal(card.querySelectorAll('img').length, 2)
    assert.ok(card.textContent.includes(copy.intro))
    assert.equal(card.querySelector('a[href^="/go"]'), null)
    dom.window.close()
    const page = render(locale, segment, React.createElement(ComparisonView, { comparison }))
    for (const text of [...copy.similarities, ...copy.differences, copy.editorialSummary]) assert.ok(page.window.document.body.textContent.includes(text))
    assert.equal(page.window.document.querySelectorAll('[data-content-card]').length, 3)
    page.window.close()
  }
})

test('M10: footer and trust display have no replacement characters in any supported locale', () => {
  for (const [locale, segment] of locales) {
    const dom = render(locale, segment, React.createElement(SiteFooter))
    assert.doesNotMatch(dom.window.document.body.textContent, /\uFFFD/)
    if (locale === 'es-MX') assert.match(dom.window.document.body.textContent, /18 años/)
    assert.doesNotMatch(i18n.createTranslator(locale)('notice.trust'), /\uFFFD/)
    dom.window.close()
  }
})

// The Island Crash presentation polish deliberately rebases this snapshot: the
// contact marker and kicker staging (butt contact instead of upper back), the
// removed sky streaks, the authorized procedural audio module and its wiring.
// Engine math, wallet accounting, outcomes and every other Original are untouched.
// The Capybara Gold Jungle Gold Bonus polish deliberately rebases it again: the
// authorized 8/12/20 award, ×5 Gold Multiplier and capped-retrigger rules with
// rebalanced free-spin reels, per-reel stop disclosure, procedural slot audio
// (`audio.ts`, `slot-sound.ts`) and bonus presentation. Paid reels, paytable,
// wallet accounting and every other Original are untouched.
// The football Originals rebase it once more by ADDING files only: Liva
// Embaixadinha (`lib/originals/embaixadinha/`), Liva Golaço (`lib/originals/golaco/`),
// the shared procedural synth kit (`synth.ts`) and light discovery-card strings
// (`football-cards.ts`), plus additive analytics events/fields and discovery copy
// naming seven Originals. No existing engine, wallet, renderer or outcome changes.
// Meshy integration changes only Embaixadinha's definition asset URL in these
// frozen roots. The approved Liva Ginga migration also updates public name/copy,
// slug/discovery and music resume after unmute. Engine math, wallet, other-game
// renderers and outcomes remain unchanged.
// Raio / Brasil21 add isolated engines, shared new-table copy/audio and three analytics events.
// Existing engines, wallet and renderers in the protected roots are unchanged.
// Casino UX V2 refreshes this presentation snapshot; casino-ux.test separately freezes production math.
// Avia adds its isolated server engine, localized help and replay-safe shared wallet receipts.
// Existing crash/table math remains covered by the unchanged Casino UX V2 math fixture.
// Rio Drift adds five isolated skill-game modules; shared definition gains an
// editorial-only arcade category, help/analytics/CTA guard are explicitly scoped.
test('Originals: three-game additions and existing Casino UX V2 snapshot', async () => {
  const roots = ['lib/originals', 'components/originals/crash', 'components/originals/capybara', 'components/originals/blackjack', 'components/originals/roulette', 'components/originals/mines']
  const paths = []
  async function walk(path) {
    for (const entry of await readdir(new URL('../' + path, import.meta.url), { withFileTypes: true })) {
      const next = path + '/' + entry.name
      if (entry.isDirectory()) await walk(next)
      else paths.push(next)
    }
  }
  for (const path of roots) await walk(path)
  const hash = createHash('sha256')
  for (const path of paths.sort()) hash.update(path + '\0' + (await readFile(new URL('../' + path, import.meta.url), 'utf8')).replace(/\r\n/g, '\n') + '\0')
  assert.equal(paths.length, 109)
  assert.equal(hash.digest('hex'), '8046a956723650b7cd0e2ea3c9743343cecc8e4b27971e7ffc74af156badbfc8')
})
