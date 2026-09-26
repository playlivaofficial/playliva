import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import sharp from 'sharp'
import seo from '../lib/originals/three-game-seo.ts'
import defs from '../lib/originals/three-game-definitions.ts'
import copy from '../lib/originals/three-game-copy.ts'
import locales from '../lib/locale.ts'

for (const segment of ['pt-br', 'en', 'es-mx']) test(`Three-game SEO: unique localized intent, canonical clusters and factual schema (${segment})`, () => {
  const titles = new Set(), descriptions = new Set(), paragraphs = new Set()
  const locale = locales.segmentToLocale(segment)
  for (const game of defs.THREE_GAMES) {
    const metadata = seo.threeGameMetadata(game.slug, segment), schema = seo.threeGameJsonLd(game.slug, segment), article = seo.threeSeoCopy(game.slug, locale)
    const canonical = `https://www.playliva.com/${segment}/play/${game.slug}`
    assert.equal(metadata.alternates.canonical, canonical)
    assert.equal(metadata.alternates.languages['x-default'], `https://www.playliva.com/pt-br/play/${game.slug}`)
    for (const other of ['pt-br', 'en', 'es-mx']) assert.equal(metadata.alternates.languages[other], `https://www.playliva.com/${other}/play/${game.slug}`)
    assert.equal(metadata.robots.index, true); assert.equal(metadata.openGraph.url, canonical)
    assert.deepEqual(metadata.twitter.images, metadata.openGraph.images)
    assert.equal(metadata.twitter.card, 'summary_large_image')
    assert.equal(schema.url, canonical); assert.equal(schema.name, game.title[locale]); assert.equal(schema.inLanguage, locale)
    assert.equal(schema.isAccessibleForFree, true); assert.equal(schema['@type'], 'VideoGame')
    assert.equal(schema.aggregateRating, undefined); assert.equal(schema.review, undefined)
    assert.equal(article.paragraphs.length, 2); assert.ok(article.paragraphs.join(' ').length > 500)
    titles.add(article.title); descriptions.add(metadata.description); paragraphs.add(article.paragraphs.join(' '))
    if (segment !== 'en') assert.doesNotMatch([copy.threeRules(game.slug, locale), article.paragraphs, metadata.description, Object.values(copy.threeCopy(locale))].flat(2).join(' '), /\b(?:Samba Meter|Wild|Scatter|How to play|Free spins|Credits per round)\b/i)
  }
  assert.equal(titles.size, 3); assert.equal(descriptions.size, 3); assert.equal(paragraphs.size, 3)
})

test('Every new game has an existing lightweight 1200×630 discovery/share asset', async () => {
  for (const game of defs.THREE_GAMES) {
    const image = await readFile(new URL('../public' + defs.gamePoster(game.slug), import.meta.url)), metadata = await sharp(image).metadata()
    assert.equal(metadata.width, 1200); assert.equal(metadata.height, 630)
    assert.ok(image.length < 300000, `${game.slug}: oversized poster`)
  }
})
