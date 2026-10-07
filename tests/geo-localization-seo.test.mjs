import test from 'node:test'
import { registration as reviewedFixture } from './fixtures/commercial.mjs'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import locale from '../lib/locale.ts'
import i18n from '../lib/i18n.ts'
import geo from '../lib/geo.ts'
import editorial from '../lib/geo-editorial.ts'
import seo from '../lib/seo.ts'
import sitemap from '../app/sitemap.ts'
import policy from '../lib/discovery/indexability.ts'
import discovery from '../lib/discovery/catalog.ts'
import catalog from '../lib/catalog/index.ts'
import legal from '../lib/legal-content.ts'
import commercialSeo from '../lib/commercial/seo.ts'
import data from '../lib/data.ts'
const hooks = registerHooks({ load(url, context, next) {
  if (url.endsWith('.module.css')) return { format:'commonjs', shortCircuit:true, source:'module.exports = {}' }
  return next(url, context)
} })
const unwrap = value => value.generateMetadata ? value : value.default
const wtpPage = unwrap(await import('../app/[locale]/where-to-play/[slug]/page.tsx'))
const offersPage = unwrap(await import('../app/[locale]/offers/page.tsx'))
const operatorPage = unwrap(await import('../app/[locale]/operators/page.tsx'))
hooks.deregister()

test('MX/CO/PE have actual routes, shared Spanish strings and distinct currency context', () => {
  for (const [segment, code, currency] of [['es-mx','MX','MXN'],['es-co','CO','COP'],['es-pe','PE','PEN']]) {
    const active = locale.segmentToLocale(segment)
    assert.equal(locale.localeToSegment(active), segment)
    assert.equal(locale.contentLocale(active), 'es-MX')
    assert.equal(locale.detectLocaleSegmentFromAcceptLanguage(`${segment},es;q=0.9,en;q=0.8`), segment)
    assert.equal(i18n.createTranslator(active)('nav.games'), 'Juegos')
    assert.equal(geo.geoForLocale(active), code)
    assert.match(geo.formatMarketMoney(1250, code), new RegExp(currency))
    assert.equal(editorial.geoEditorial(active).currency, currency)
    const entries = discovery.discoveryEntries(active)
    assert.equal(entries.length, discovery.discoveryEntries('es-MX').length)
    assert.ok(entries.every(game => game.title && game.summary && game.href))
    assert.ok(catalog.catalogSummaries(active).every(game => game.summary))
    assert.ok(legal.getLegalPage('affiliate-disclosure', active).sections.some(section => section.h?.includes(editorial.geoEditorial(active).name)))
  }
  assert.equal(locale.swapLocaleInPath('/es-mx/play/skuptu-levanta', 'es-co'), '/es-co/play/skuptu-levanta')
  assert.equal(geo.geoForLocale('pt-BR'), null)
  assert.equal(geo.geoForLocale('en'), null)
})

test('regional SEO expands only substantive entry pages, preserving canonical shared inventory', () => {
  const rows = sitemap.default()
  const regional = rows.filter(row => /\/es-(co|pe)(\/|$)/.test(row.url))
  assert.deepEqual(regional.map(row => new URL(row.url).pathname).sort(), ['/es-co','/es-co/games','/es-pe','/es-pe/games'])
  assert.ok(rows.length < 330)
  assert.equal(rows.filter(row => /\/pt-br\/where-to-play\//.test(row.url)).length, 9)
  assert.ok(!rows.some(row => /\/(offers|operators)(\/|$)/.test(new URL(row.url).pathname)))
  const titles = new Set()
  for (const segment of ['es-mx','es-co','es-pe']) for (const path of ['/', '/games']) {
    const metadata = seo.pageMetadata({ path, localeSegment: segment })
    assert.equal(metadata.robots.index, true)
    assert.equal(metadata.alternates.canonical, `https://www.playliva.com/${segment}${path === '/' ? '' : path}`)
    assert.equal(metadata.openGraph.locale, segment.replace('-', '_').replace(/_(co|pe|mx)$/, match => match.toUpperCase()))
    assert.equal(metadata.alternates.languages['x-default'], `https://www.playliva.com/en${path === '/' ? '' : path}`)
    assert.equal(Object.keys(metadata.alternates.languages).length, 6)
    titles.add(JSON.stringify(metadata.title))
  }
  assert.equal(titles.size, 6)
  for (const segment of ['es-co','es-pe']) for (const path of ['/games/aviator','/providers/spribe','/play/skuptu-levanta','/games-like/aviator']) {
    const metadata = seo.pageMetadata({ title:'Shared game content', path, localeSegment:segment })
    assert.equal(metadata.robots.index, false)
    assert.equal(metadata.alternates.languages, undefined)
    assert.equal(metadata.alternates.canonical, `https://www.playliva.com/${segment}${path}`)
    assert.equal(policy.discoveryIndexability(path, segment).index, false)
  }
})

test('pending commercial pages are noindex and emit no alternate claims', async () => {
  for (const segment of ['pt-br','en','es-mx','es-co','es-pe']) {
    for (const page of [offersPage, operatorPage]) {
      const metadata = await page.generateMetadata({ params: Promise.resolve({ locale:segment }) })
      assert.equal(metadata.robots.index, false)
      assert.equal(metadata.alternates.languages, undefined)
    }
  }
})

test('verified exact-game data activates only the matching regional WTP canonical', async () => {
  const previous = process.env.PLAYLIVA_COMMERCIAL_REGISTRY
  const fixture = { id:'fixture-co', slug:'fixture-co', brand:'Fixture', geo:'CO', productTypes:['crash'], approved:true, active:true,
    affiliateUrl:'https://affiliate.fixture.invalid/approved', campaignKey:'fixture-campaign', currency:'COP', priority:1,
    assets:{ logo:'/icon-512.png', alt:'Fixture' }, legal:reviewedFixture('CO').legal, verifiedGames:['g1'] }
  try {
    process.env.PLAYLIVA_COMMERCIAL_REGISTRY = JSON.stringify([fixture])
    assert.deepEqual(commercialSeo.publishedWhereToPlayLocales(data.getGame('aviator')).sort(), ['es-co','pt-br'])
    assert.deepEqual(commercialSeo.publishedOperatorLocales('fixture-co'), ['es-co'])
    const co = await wtpPage.generateMetadata({ params:Promise.resolve({ locale:'es-co', slug:'aviator' }) })
    assert.equal(co.robots.index, true)
    assert.match(co.title, /Colombia/)
    assert.equal(co.alternates.languages['es-co'], 'https://www.playliva.com/es-co/where-to-play/aviator')
    const pe = await wtpPage.generateMetadata({ params:Promise.resolve({ locale:'es-pe', slug:'aviator' }) })
    assert.equal(pe.robots.index, false)
    assert.equal(pe.alternates.languages, undefined)
    assert.ok(sitemap.default().some(row => row.url.endsWith('/es-co/where-to-play/aviator')))
    assert.ok(!sitemap.default().some(row => row.url.endsWith('/es-pe/where-to-play/aviator')))
    fixture.verifiedGames=[]
    process.env.PLAYLIVA_COMMERCIAL_REGISTRY=JSON.stringify([fixture])
    assert.deepEqual(commercialSeo.publishedWhereToPlayLocales(data.getGame('aviator')), ['pt-br'])
  } finally { if (previous === undefined) delete process.env.PLAYLIVA_COMMERCIAL_REGISTRY; else process.env.PLAYLIVA_COMMERCIAL_REGISTRY=previous }
})
