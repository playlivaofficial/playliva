import { commercialFixture } from './fixtures/promo-commercial.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir, stat } from 'node:fs/promises'
import sharp from 'sharp'
import copyModule from '../lib/originals/capybara/copy.ts'
import definitionModule from '../lib/originals/capybara/definition.ts'
import seoModule from '../lib/seo.ts'
import sitemapModule from '../app/sitemap.ts'
import realModule from '../lib/originals/play-real.ts'
import dataModule from '../lib/data.ts'
const source = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const { capybaraCopy } = copyModule, { CAPYBARA_GOLD } = definitionModule
test('Capybara: complete EN/PT/ES functional copy, truthful SEO and reciprocal alternates', () => {
  const keys = Object.keys(capybaraCopy('en'))
  for (const [locale, segment] of [['en', 'en'], ['pt-BR', 'pt-br'], ['es-MX', 'es-mx']]) {
    const copy = capybaraCopy(locale)
    assert.deepEqual(Object.keys(copy), keys); assert.ok(Object.values(copy).every(v => typeof v === 'object' || v.trim().length > 0))
    assert.equal(Object.keys(copy.symbols).length, 9)
    assert.doesNotMatch(JSON.stringify(copy), /Betsson|Pragmatic|PG Soft|Fortune Tiger|provably fair/i)
    if (locale !== 'en') for (const field of ['spin', 'spinning', 'bet', 'win', 'freeSpins', 'remaining', 'bonusMultiplier', 'jungleBonus', 'again', 'bigWin', 'superWin', 'megaWin', 'how', 'wild']) assert.notEqual(copy[field], capybaraCopy('en')[field])
    const metadata = seoModule.pageMetadata({ title: CAPYBARA_GOLD.title[locale], description: copy.description, path: '/play/capybara-gold', localeSegment: segment })
    assert.ok(metadata.alternates.canonical.endsWith(`/${segment}/play/capybara-gold`))
    for (const s of ['en', 'pt-br', 'es-mx']) assert.ok(metadata.alternates.languages[s].endsWith(`/${s}/play/capybara-gold`))
    assert.ok(metadata.alternates.languages['x-default'].endsWith('/en/play/capybara-gold'))
    assert.ok(sitemapModule.default().some(e => e.url.endsWith(`/${segment}/play/capybara-gold`)))
  }
})
test('Capybara: Originals discovery stays separate, lightweight and never imports the engine', async () => {
  assert.ok(dataModule.GAMES.every(game => !/capybara/i.test(game.slug + game.id)))
  const feature = await source('components/originals/capybara-feature.tsx')
  assert.match(feature, /data-original-card="capybara-gold"/)
  assert.equal((feature.match(/prefetch=\{false\}/g) ?? []).length, 2)
  assert.doesNotMatch(feature, /import .*engine|import .*capybara-game|import .*simulation|\.png/)
  assert.match(await source('components/play-view.tsx'), /IslandCrashFeature surface="hub"[\s\S]*CapybaraFeature surface="hub"/)
  assert.match(await source('components/originals/island-crash-feature.tsx'), /surface === 'home' && <CapybaraFeature surface="home"/)
  assert.match(await source('components/category-page-view.tsx'), /slug === 'slots' && <CapybaraDiscoverySection/)
  assert.match(await source('components/mobile-bottom-nav.tsx'), /activePath === '\/play\/capybara-gold'\) return null/)
  assert.match(await source('components/originals/capybara/capybara-entry.tsx'), /dynamic\(\(\) => import\('\.\/capybara-game'\)/)
  assert.doesNotMatch(await source('components/originals/capybara/capybara-game.tsx'), /Math\.random|simulation|URLSearchParams|searchParams|wallet\.credit|wallet\.debit/)
})
test('Capybara: approved Slots/GEO affiliate routing never claims a provider mapping', () => {
  assert.equal(CAPYBARA_GOLD.category,'slots')
  for(const geo of ['MX','CO','PE']) {
    const locale=`es-${geo}`,snapshot=commercialFixture(geo)
    const options=realModule.getPlayRealOptions(geo,'slots',locale,snapshot)
    assert.equal(options.length,1)
    const query=new URL(options[0].href,'https://www.playliva.com').searchParams
    assert.equal(query.get('category'),'slots')
    assert.equal(query.get('country'),geo)
    assert.equal(query.get('game'),null)
    assert.deepEqual(realModule.getPlayRealOptions('BR','slots',locale,snapshot),[])
  }
})

test('Capybara: original alpha assets stay small and sources remain non-public', async () => {
  const dir = new URL('../public/originals/capybara-gold/', import.meta.url), names = await readdir(dir)
  assert.equal(names.length, 11)
  let total = 0
  for (const name of names) {
    assert.ok(name.endsWith('.webp')); const path = new URL(name, dir); total += (await stat(path)).size
    const info = await sharp(await readFile(path)).metadata()
    assert.equal(info.format, 'webp')
    if (!['river.webp', 'mascot.webp'].includes(name)) { assert.equal(info.width, 160); assert.equal(info.hasAlpha, true) }
  }
  assert.ok(total < 300000)
  const manifest = JSON.parse(await source('assets-source/capybara-gold/manifest.json'))
  assert.equal(manifest.assets.length, 10); assert.ok(manifest.assets.every(a => a.generator === 'built-in imagegen' && a.prompt))
})
