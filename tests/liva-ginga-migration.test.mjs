import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server.js'
import middlewareModule from '../middleware.ts'
import sitemapModule from '../app/sitemap.ts'
import definition from '../lib/originals/embaixadinha/definition.ts'
import discovery from '../lib/originals/discovery.ts'
import copy from '../lib/originals/embaixadinha/copy.ts'
import seo from '../lib/seo.ts'

test('Liva Ginga preserves locale and queries in an exact HTTP 301 migration', () => {
  for (const segment of ['en', 'pt-br', 'es-mx']) {
    const response = middlewareModule.middleware(new NextRequest(`https://www.playliva.com/${segment}/play/embaixadinha?utm_source=youtube&utm_content=first&x=a%20b`))
    assert.equal(response.status, 301)
    const destination = new URL(response.headers.get('location'))
    assert.equal(destination.pathname, `/${segment}/play/liva-ginga`)
    assert.equal(destination.searchParams.get('utm_content'), 'first'); assert.equal(destination.searchParams.get('x'), 'a b')
    assert.equal(middlewareModule.middleware(new NextRequest(`https://www.playliva.com/${segment}/play/liva-ginga`)).status, 200)
  }
})

test('Liva Ginga is the only football-crash sitemap/canonical identity, with localized direct links', () => {
  const entries = sitemapModule.default()
  assert.equal(entries.filter(e => e.url.endsWith('/play/liva-ginga')).length, 3)
  assert.ok(entries.every(e => !e.url.includes('/play/embaixadinha')))
  assert.equal(definition.EMBAIXADINHA.slug, 'liva-ginga')
  assert.equal(definition.EMBAIXADINHA.id, 'liva-embaixadinha', 'stable historical analytics/wallet identity')
  for (const [segment, locale] of [['en','en'],['pt-br','pt-BR'],['es-mx','es-MX']]) {
    const text = copy.embaixadinhaCopy(locale)
    assert.match(text.seoTitle, /Liva Ginga/)
    assert.doesNotMatch(JSON.stringify(text), /Embaixadinha/i)
    const metadata = seo.pageMetadata({title:text.seoTitle,description:text.description,path:'/play/liva-ginga',localeSegment:segment})
    assert.ok(String(metadata.alternates.canonical).endsWith(`/${segment}/play/liva-ginga`))
    assert.ok(Object.values(metadata.alternates.languages).every(url => String(url).endsWith('/play/liva-ginga')))
    const links = discovery.originalsLinks(locale, 'golaco')
    assert.ok(links.some(l => l.href === '/play/liva-ginga' && l.label === 'Liva Ginga'))
    assert.ok(links.every(l => !l.href.includes('embaixadinha')))
  }
})
