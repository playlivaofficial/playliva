import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server.js'
import locale from '../lib/locale.ts'
import middleware from '../middleware.ts'

const choose = (country, acceptLanguage = null, cookieLocale) => locale.detectRootLocaleSegment({ country, acceptLanguage, cookieLocale })

test('first visits seed target regional Spanish while honoring explicit language preferences', () => {
  for (const [country, segment] of [['MX','es-mx'],['CO','es-co'],['PE','es-pe']]) {
    assert.equal(choose(country), segment)
    assert.equal(choose(country, 'es,en;q=0.8'), segment)
    assert.equal(choose(country, 'es-419,es;q=0.9'), segment)
    assert.equal(choose(country, 'en-US,es;q=0.9'), 'en')
    assert.equal(choose(country, 'pt-BR,es;q=0.9'), 'pt-br')
    assert.equal(choose(country, 'es;q=0.4,en;q=0.9'), 'en')
    assert.equal(choose(country, 'en;q=0,es;q=0.8'), segment)
    for (const manual of locale.LOCALE_SEGMENTS) assert.equal(choose(country, 'es', manual), manual)
  }
  assert.equal(choose('CO', 'es-PE,es;q=0.9'), 'es-pe', 'an explicit supported regional language remains a preference')
  assert.equal(choose('BR'), 'pt-br')
  for (const country of [null,'GE','US','XX','invalid']) assert.equal(choose(country), 'en')
  assert.equal(choose('CO', 'fr-FR'), 'es-co')
  assert.equal(choose('PE', null, 'bad-cookie'), 'es-pe')
  assert.equal(choose(' co ', 'es'), 'es-co')
})

test('only bare root varies by visitor, preserves query and cannot cache another visitor locale', () => {
  for (const [country, target] of [['MX','es-mx'],['CO','es-co'],['PE','es-pe'],['BR','pt-br'],['GE','en']]) {
    const headers = { 'x-vercel-ip-country':country }
    const response = middleware.middleware(new NextRequest('https://www.playliva.com/?utm_source=qa', {headers}))
    assert.equal(response.status, 302)
    assert.equal(response.headers.get('location'), `https://www.playliva.com/${target}?utm_source=qa`)
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.match(response.headers.get('vary'), /X-Vercel-IP-Country/)
    const legacy = middleware.middleware(new NextRequest('https://www.playliva.com/games/aviator?utm_source=qa', {headers}))
    assert.equal(legacy.status, 308)
    assert.equal(legacy.headers.get('location'), 'https://www.playliva.com/pt-br/games/aviator?utm_source=qa')
    const prefixed = middleware.middleware(new NextRequest('https://www.playliva.com/en/games', {headers}))
    assert.equal(prefixed.status, 200)
    assert.equal(prefixed.headers.get('x-locale'), 'en')
  }
  const explicit = middleware.middleware(new NextRequest('https://www.playliva.com/', {headers:{'x-vercel-ip-country':'CO','accept-language':'es','cookie':'playliva_locale=pt-br'}}))
  assert.equal(explicit.headers.get('location'), 'https://www.playliva.com/pt-br')
})
