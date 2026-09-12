import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import sharp from 'sharp'
import discoveryModule from '../lib/originals/discovery.ts'
import dataModule from '../lib/data.ts'
import sitemapModule from '../app/sitemap.ts'
import presentationModule from '../lib/originals/crash/presentation.ts'
import engineModule from '../lib/originals/crash/engine.ts'
const { originalsDiscoveryCopy, ISLAND_CRASH_POSTER } = discoveryModule

test('one Original, complete localized copy, existing indexed routes and lightweight poster', async () => {
  const keys = Object.keys(originalsDiscoveryCopy('en'))
  for (const [locale, segment, label] of [['en', 'en', 'Play Free'], ['pt-BR', 'pt-br', 'Jogar grátis'], ['es-MX', 'es-mx', 'Jugar gratis']]) {
    const copy = originalsDiscoveryCopy(locale)
    assert.deepEqual(Object.keys(copy), keys)
    assert.ok(Object.values(copy).every(value => value.trim().length > 0))
    assert.equal(copy.playFree, label)
    for (const legal of ['noDeposits', 'noWithdrawals', 'noValue']) assert.ok(copy.disclaimer.toLowerCase().includes(copy[legal].toLowerCase()))
    assert.doesNotMatch(copy.seoTitle + copy.seoDescription, /Betsson|Betano|Aviator|SPRIBE|coming soon/i)
    assert.ok(sitemapModule.default().some(entry => entry.url.endsWith(`/${segment}/play`)))
  }
  assert.ok(dataModule.GAMES.every(game => game.id !== 'island-crash' && game.slug !== 'island-crash'))
  const poster = new URL(`../public${ISLAND_CRASH_POSTER}`, import.meta.url)
  assert.ok((await stat(poster)).size < 100_000)
  const info = await sharp(await readFile(poster)).metadata()
  assert.deepEqual([info.format, info.width, info.height], ['webp', 1200, 675])
  for (const path of ['components/originals/island-crash-feature.tsx', 'lib/originals/discovery.ts']) {
    const source = await readFile(new URL(`../${path}`, import.meta.url), 'utf8')
    assert.doesNotMatch(source, /import .*island-scene|import .*crash\/engine|import .*three|\.glb/)
  }
  const feature = await readFile(new URL('../components/originals/island-crash-feature.tsx', import.meta.url), 'utf8')
  assert.equal((feature.match(/prefetch=\{false\}/g) ?? []).length, 2, 'poster and Play Free never prefetch the game payload')
})

test('contact starts flight immediately, with powerful continuous ascent and preserved growth curve', () => {
  const { PREPARING_MS, IMPACT_MS, KICK_MS, GROWTH_MS } = engineModule
  assert.equal(IMPACT_MS, KICK_MS)
  assert.ok(PREPARING_MS + KICK_MS <= 800)
  assert.equal(GROWTH_MS, 7000, 'outcome timing curve is not sped up')
  const { flightPosition: position, CASTAWAY_START } = presentationModule
  assert.deepEqual([position(0).x, position(0).y, position(0).z], [...CASTAWAY_START])
  assert.ok(position(.016).x - position(0).x > .1, 'no dead frame after contact')
  assert.ok(position(.016).y - position(0).y > .15)
  assert.ok(position(.2).y > 1.5)
  assert.ok(position(.5).y > 2.8)
  assert.ok(position(1).y > 4.5)
  for (const t of [.1, .3, .8, 1, 3, 10, 35]) {
    assert.ok(position(t + .016).x > position(t).x)
    assert.ok(position(t + .016).y > position(t).y)
  }
  assert.ok(position(4, 500).speed > position(4, 100).speed)
})
