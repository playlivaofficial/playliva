import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import copy from '../lib/originals/power-copy.ts'
import raio from '../lib/originals/raio/definition.ts'
import brasil from '../lib/originals/brasil21/definition.ts'
import seo from '../lib/seo.ts'
import sitemap from '../app/sitemap.ts'
import analytics from '../lib/originals/analytics.ts'
import { JSDOM } from 'jsdom'

test('new tables have complete localized rules, reciprocal metadata and six unique sitemap entries', async () => {
  const entries = sitemap.default()
  for (const game of [raio.RAIO, brasil.BRASIL21]) for (const [locale, segment] of [['en','en'],['pt-BR','pt-br'],['es-MX','es-mx']]) {
    const c = copy.powerCopy(locale), kind = game === raio.RAIO ? 'raio' : 'brasil'
    assert.deepEqual(Object.keys(c), Object.keys(copy.powerCopy('en')))
    for (const key of ['spin','deal','hit','stand','double','ready','charge','dealing','yourTurn','dealerTurn','powerRule']) {
      if (locale !== 'en') assert.notEqual(c[key], copy.powerCopy('en')[key], `${locale}:${key}`)
    }
    const path = `/${segment}/play/${game.slug}`
    assert.equal(entries.filter(e => new URL(e.url).pathname === path).length, 1)
    const metadata = seo.pageMetadata({ title:c[kind+'Title'], description:c[kind+'Description'], path:`/play/${game.slug}`, localeSegment:segment })
    assert.ok(metadata.alternates.canonical.endsWith(path))
    for (const alternate of ['en','pt-br','es-mx']) assert.ok(metadata.alternates.languages[alternate].endsWith(`/${alternate}/play/${game.slug}`))
    assert.ok(c[kind+'Rules'].length >= 6)
    assert.doesNotMatch(c[kind+'Description'], /Betsson|Evolution|Lightning Roulette|certified/)
  }
  for (const p of ['public/originals/raio/poster.svg','public/originals/brasil21/poster.svg']) assert.ok((await stat(p)).size < 20000)
})

test('both entry variants mount the existing wallet and exactly one existing shell, with no second affiliate store', async () => {
  const entry = await readFile('components/originals/power/entry.tsx','utf8')
  assert.match(entry, /<DemoSessionProvider>/)
  for (const path of ['raio-game','brasil-game']) {
    const source = await readFile(`components/originals/power/${path}.tsx`,'utf8')
    assert.equal((source.match(/<PlayGameShell /g) ?? []).length, 1)
    assert.match(source, /roundActive=\{active\}/)
    assert.doesNotMatch(source, /BetssonEngagementOffer|createEngagementTrigger|localStorage|sessionStorage/)
  }
})

test('table events respect analytics rejection and carry only existing coarse fields when accepted', () => {
  const dom = new JSDOM('', {url:'https://www.playliva.com/pt-br/play/liva-raio'})
  const saved = new Map()
  for (const key of ['window','document','location','navigator']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis,key))
    Object.defineProperty(globalThis,key,{configurable:true,value:dom.window[key]})
  }
  try {
    const context = {originalId:'liva-raio',originalSlug:'liva-raio',locale:'pt-BR',country:'BR',category:'table-games',roundId:'round-1',winTier:'spin'}
    window.localStorage.setItem('playliva.cookie-consent',JSON.stringify({necessary:true,analytics:false,marketing:false}))
    analytics.trackFreePlay('demo_table_action',context)
    assert.equal(window.dataLayer,undefined)
    window.localStorage.setItem('playliva.cookie-consent',JSON.stringify({necessary:true,analytics:true,marketing:false}))
    for (const event of ['demo_table_action','demo_table_feature','demo_table_result']) analytics.trackFreePlay(event,context)
    assert.equal(window.dataLayer.length,3)
    for (const event of window.dataLayer) {
      assert.equal(event.pageSlug,'liva-raio'); assert.equal(event.language,'pt-BR')
      assert.equal(event.url,'/pt-br/play/liva-raio'); assert.equal(event.winTier,'spin')
      assert.equal(event.balance,undefined); assert.equal(event.stake,undefined)
    }
  } finally {
    dom.window.close()
    for (const [key,descriptor] of saved) if(descriptor) Object.defineProperty(globalThis,key,descriptor); else delete globalThis[key]
  }
})
