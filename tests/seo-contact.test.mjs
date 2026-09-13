import test from 'node:test'
import assert from 'node:assert/strict'
import structuredDataModule from '../lib/structured-data.ts'
const { getBreadcrumbJsonLd } = structuredDataModule
import seoModule from '../lib/seo.ts'
const { SITE_URL, pageMetadata } = seoModule
import dataModule from '../lib/data.ts'
const { getGame } = dataModule
import artworkModule from '../lib/game-artwork.ts'
const { getGameOgImage, hasApprovedArtwork } = artworkModule
import contactModule from '../lib/contact.ts'
const { contactDraft } = contactModule
import translationModule from '../lib/i18n.ts'
const { createTranslator } = translationModule

test('breadcrumb JSON-LD matches localized home/category routes in every locale', () => {
  for (const segment of ['en', 'pt-br', 'es-mx']) {
    const data = getBreadcrumbJsonLd([{ label: 'Home', href: '/' }, { label: 'Games', href: '/games' }, { label: 'Aviator' }], segment)
    assert.equal(data.itemListElement[0].item, `${SITE_URL}/${segment}`)
    assert.equal(data.itemListElement[1].item, `${SITE_URL}/${segment}/games`)
    assert.equal(data.itemListElement[2].item, undefined)
  }
})

test('title branding is applied once; indexability is explicit for known pages', () => {
  assert.equal(pageMetadata({ title: 'Best Crash Games | PlayLiva', path: '/best/crash-games', localeSegment: 'en' }).title, 'Best Crash Games')
  assert.deepEqual(pageMetadata({ title: 'PlayLiva — Discover Games', path: '/', localeSegment: 'en' }).title, { absolute: 'PlayLiva — Discover Games' })
  const metadata = pageMetadata({ path: '/terms', localeSegment: 'en', index: false })
  assert.equal(metadata.robots.index, false)
  assert.equal(metadata.robots.googleBot.index, false)
})

test('generic Blackjack Live uses the approved local cover and withholds the Speed tile', () => {
  const game = getGame('blackjack-live')
  assert.equal(game.title, 'Blackjack Live')
  assert.equal(hasApprovedArtwork(game), true)
  assert.deepEqual(getGameOgImage(game), ['/games/blackjack-live.webp'])
  assert.notEqual(game.image, '/games/blackjack-live.jpg')
})

test('contact produces only an encoded email draft using the existing address', () => {
  const url = new URL(contactDraft({ name: 'A & B', email: 'person@example.invalid', topic: 'Question & follow-up', message: 'Line one\nLine two' }))
  assert.equal(url.protocol, 'mailto:')
  assert.equal(url.pathname, 'hello@playliva.com')
  assert.equal(url.searchParams.get('subject'), 'Question & follow-up')
  assert.equal(url.searchParams.get('body'), 'A & B\nperson@example.invalid\n\nLine one\nLine two')
  for (const locale of ['en', 'pt-BR', 'es-MX']) {
    const t = createTranslator(locale)
    assert.notEqual(t('contact.openDraft'), 'contact.openDraft')
    assert.notEqual(t('contact.draftNote'), 'contact.draftNote')
  }
})
