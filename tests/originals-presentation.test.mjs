import test from 'node:test'
import assert from 'node:assert/strict'
import { stat } from 'node:fs/promises'
import { registerHooks } from 'node:module'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import country from '../components/country-context.tsx'
import avia from '../lib/originals/avia/definition.ts'
import golaco from '../lib/originals/golaco/definition.ts'
import raio from '../lib/originals/raio/definition.ts'
import royale from '../lib/originals/brasil21/definition.ts'
import three from '../lib/originals/three-game-definitions.ts'
import aviaCopy from '../lib/originals/avia/copy.ts'
import golacoCopy from '../lib/originals/golaco/copy.ts'
import powerCopy from '../lib/originals/power-copy.ts'
import threeCopy from '../lib/originals/three-game-copy.ts'
import threeSeo from '../lib/originals/three-game-seo.ts'
import discovery from '../lib/discovery/catalog.ts'
import query from '../lib/discovery/query.ts'
import localeTools from '../lib/locale.ts'
import seo from '../lib/seo.ts'
import sitemap from '../app/sitemap.ts'
import owner from '../lib/owner/server/catalog.ts'

const cssHooks = registerHooks({ load(url, context, next) {
  if (String(url).includes('.module.css')) return { format:'module', shortCircuit:true, source:'const s = new Proxy({}, { get: (_, key) => String(key) }); export default s;' }
  return next(url, context)
} })
const aviaGameModule = await import('../components/originals/avia/game.tsx')
const AviaGame = aviaGameModule.default?.default ?? aviaGameModule.default
cssHooks.deregister()

const changes = [
  [avia.AVIA, 'avia-de-janeiro', 'avia-de-janeiro', 'Liva Skyline', 'Avia de Janeiro', avia.AVIA_POSTER],
  [golaco.GOLACO, 'liva-golaco', 'golaco', 'Liva Golazo', 'Liva Golaço', golaco.GOLACO_POSTER],
  [raio.RAIO, 'liva-raio', 'liva-raio', 'Liva Rayo', 'Liva Raio', raio.RAIO_POSTER],
  [royale.BRASIL21, 'liva-21-brasil', 'liva-21-brasil', 'Liva 21 Royale', 'Liva 21 Brasil', royale.BRASIL21_POSTER],
  [three.SAMBA_DROP, 'samba-drop', 'samba-drop', 'Liva Ritmo Drop', 'Liva Samba Drop', three.gamePoster('samba-drop')],
  [three.CARNAVAL, 'carnaval-gold', 'carnaval-gold', 'Liva Fiesta Gold', 'Liva Carnaval Gold', three.gamePoster('carnaval-gold')],
]
const locales = ['es-MX', 'es-CO', 'es-PE', 'pt-BR', 'en']
function copyFor(slug, locale) {
  if (slug === 'avia-de-janeiro') { const c = aviaCopy.aviaCopy(locale); return { title:c.title, description:c.description, body:c.paragraphs.join(' ') } }
  if (slug === 'golaco') { const c = golacoCopy.golacoCopy(locale); return { title:c.seoTitle, description:c.description, body:c.articleIntro + c.articleBonus + c.bonusRules } }
  if (slug === 'liva-raio' || slug === 'liva-21-brasil') { const c = powerCopy.powerCopy(locale), key = slug === 'liva-raio' ? 'raio' : 'brasil'; return { title:c[key+'Title'], description:c[key+'Description'], body:c[key+'Intro'] } }
  const c = threeSeo.threeSeoCopy(slug, locale)
  return { title:c.title, description:threeCopy.threeDescription(slug, locale), body:c.paragraphs.join(' ') }
}

test('pan-LATAM presentation keeps stable game identities and remembered search routes in every locale', () => {
  for (const locale of locales) {
    const entries = discovery.discoveryEntries(locale)
    for (const [game,id,slug,name,legacy] of changes) {
      assert.equal(game.id,id); assert.equal(game.slug,slug)
      assert.equal(game.title[localeTools.contentLocale(locale)],name)
      for (const search of [name,legacy]) {
        const found = query.queryDirectory(entries,{q:search}).items[0]
        assert.equal(found?.id,id,`${locale}: ${search}`)
        assert.equal(found?.href,`/play/${slug}`)
        assert.equal(found?.title,name)
      }
      assert.equal(owner.ownerGames.find(row=>row.id===id)?.title,name)
    }
    assert.equal(entries.find(row=>row.slug==='crash').title,'Island Crash')
    assert.equal(entries.find(row=>row.slug==='liva-ginga').title,'Liva Ginga')
  }
})

test('renamed page metadata preserves canonicals, bounded sitemap and country indexability policy', () => {
  const rows = sitemap.default()
  assert.equal(rows.length,317)
  for (const locale of locales) {
    const segment = locale.toLowerCase(), seen = new Set()
    for (const [, ,slug,name,legacy,poster] of changes) {
      const c=copyFor(slug,locale), path=`/play/${slug}`
      const metadata=seo.pageMetadata({title:c.title,description:c.description,path,localeSegment:segment,images:[poster]})
      assert.ok(c.title.startsWith(name), `${locale}: ${slug}`)
      assert.ok(!c.title.includes(legacy))
      assert.equal(metadata.alternates.canonical,`https://www.playliva.com/${segment}${path}`)
      assert.equal(metadata.openGraph.title,metadata.title)
      assert.equal(metadata.twitter.title,metadata.title)
      assert.ok(!seen.has(metadata.title)); seen.add(metadata.title)
      const eligible = !['es-co','es-pe'].includes(segment)
      assert.equal(metadata.robots.index,eligible)
      assert.equal(rows.filter(row=>row.url.endsWith(`/${segment}${path}`)).length,eligible?1:0)
      if (eligible) for (const target of ['en','pt-br','es-mx']) assert.ok(metadata.alternates.languages[target].endsWith(`/${target}${path}`))
      assert.ok(rows.every(row=>!row.url.includes(name.toLowerCase().replaceAll(' ','-'))))
    }
  }
})

test('shared Spanish presentation removes the retired country theme without changing rule mechanics', () => {
  for (const locale of ['es-MX','es-CO','es-PE']) {
    for (const [, ,slug] of changes) {
      const c=copyFor(slug,locale)
      assert.doesNotMatch(`${c.title} ${c.description} ${c.body}`,/Brasil|Brazil|Janeiro|Golaço|Raio|Samba|Final de Ouro/i)
      assert.ok(c.description.length>70)
    }
    assert.equal(powerCopy.powerCopy(locale).powerNumbers,'NÚMEROS RAYO')
    assert.equal(golacoCopy.golacoCopy(locale).finalBonus,'Final de Oro')
    assert.equal(threeCopy.threeCopy(locale).meter,'MEDIDOR DE RITMO')
    assert.ok(threeCopy.threeRules('samba-drop',locale).some(line=>line.includes('97%')))
    assert.ok(threeCopy.threeRules('carnaval-gold',locale).some(line=>line.includes('500×')))
  }
})

test('all renamed discoveries keep compact existing artwork destinations', async () => {
  for (const [, ,slug, , ,poster] of changes) {
    const asset=await stat(`public${poster}`)
    assert.ok(asset.size>1000 && asset.size<500000,slug)
  }
})

test('Skyline runtime wordmark and footer use the current neutral identity in every locale', () => {
  for (const locale of locales) {
    const markup = renderToStaticMarkup(React.createElement(AppRouterContext.Provider, { value:{push(){},prefetch(){}} },
      React.createElement(PathnameContext.Provider, { value:`/${locale.toLowerCase()}/play/avia-de-janeiro` },
        React.createElement(country.CountryProvider, { initialLocale:locale, visitorCountryCode:'MX' }, React.createElement(AviaGame)))))
    const dom = new JSDOM(markup), doc = dom.window.document
    assert.equal(doc.querySelector('[data-avia-game] h1').textContent, 'Liva Skyline')
    assert.equal(doc.querySelector('[data-avia-game] .mark').textContent, 'SKYLINELIVA')
    assert.equal(doc.querySelector('[data-avia-game] .signal').textContent, aviaCopy.aviaCopy(locale).coast)
    assert.doesNotMatch(doc.querySelector('[data-avia-game]').textContent, /Rio de Janeiro|DE JANEIRO|Avia de Janeiro/i)
    dom.window.close()
  }
})
