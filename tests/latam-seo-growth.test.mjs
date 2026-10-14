import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import latam from '../lib/latam-editorial.ts'
import guides from '../lib/latam-guides.ts'
import policy from '../lib/discovery/indexability.ts'
import seo from '../lib/discovery/seo.ts'
import sitemap from '../app/sitemap.ts'
import editorial from '../lib/editorial.ts'
import commercial from '../lib/commercial/server.ts'
import data from '../lib/data.ts'
import content from '../lib/content.ts'
import { registration as reviewedFixture } from './fixtures/commercial.mjs'

test('reviewed regional pages have substantive country copy and reciprocal indexed equivalents',()=>{
  const rows=sitemap.default(), titles=new Set()
  for(const segment of latam.LATAM_SEGMENTS) for(const path of latam.LATAM_REVIEWED_PATHS.filter(path=>!path.startsWith('/guides/'))) {
    const locale=segment==='es-mx'?'es-MX':segment==='es-co'?'es-CO':'es-PE'
    const topic=latam.latamTopic(path,locale)
    assert.ok(topic.paragraphs.join(' ').length>350)
    assert.ok(topic.country.check.length>220)
    assert.ok(topic.country.money.length>220)
    assert.equal(policy.discoveryIndexability(path,segment).index,true)
    const metadata=seo.pageMetadata({title:'Fallback',path,localeSegment:segment})
    assert.equal(metadata.robots.index,true)
    assert.ok(metadata.title.includes(topic.country.name))
    titles.add(metadata.title)
    const row=rows.find(row=>row.url===metadata.alternates.canonical)
    assert.ok(row)
    assert.deepEqual(row.alternates.languages,metadata.alternates.languages)
    assert.equal(row.lastModified,editorial.editorialRecord(path,locale).updatedAt)
    for(const url of Object.values(metadata.alternates.languages)) assert.ok(rows.some(row=>row.url===url))
  }
  assert.equal(titles.size,30)
  assert.equal(editorial.editorialRecord('/games/aviator','en').updatedAt,undefined)
  assert.equal(editorial.editorialRecord('/games/aviator','pt-BR').updatedAt,undefined)
  assert.equal(policy.discoveryIndexability('/games/jetx','es-co').index,false)
  assert.equal(policy.discoveryIndexability('/play/blackjack','es-pe').index,false)
  assert.match(content.getGameContent(data.getGame('aviator'),'es-CO').seo.game.h1,/Colombia/)
  assert.doesNotMatch(content.getGameContent(data.getGame('aviator'),'es-PE').seo.game.h1,/México|Brasil/)
})

test('guides have local context, distinct intents and no unsupported alternate languages',()=>{
  for(const segment of latam.LATAM_SEGMENTS) for(const slug of latam.LATAM_GUIDE_SLUGS) {
    const locale=segment==='es-mx'?'es-MX':segment==='es-co'?'es-CO':'es-PE', guide=guides.latamGuide(slug,locale)
    const article=[...guide.sections.flatMap(section=>section.paragraphs),guide.country.demo,guide.country.money,guide.country.check].join(' ')
    assert.ok(article.split(/\s+/).length>450)
    assert.ok(guide.faqs.every(faq=>faq.question&&faq.answer))
    assert.ok(guide.sources.every(source=>source.url.startsWith('https://')))
    const metadata=seo.pageMetadata({title:guide.title,description:guide.description,path:`/guides/${slug}`,localeSegment:segment})
    assert.deepEqual(Object.keys(metadata.alternates.languages).sort(),[...latam.LATAM_SEGMENTS].sort())
  }
  assert.equal(guides.latamGuide('aviator-demo','en'),null)
  assert.equal(guides.latamGuide('bonos-casino','pt-BR'),null)
  assert.equal(guides.latamGuide('made-up','es-MX'),null)
})

test('country editorial navigation contains no outbound capabilities and requires current approved inventory',async()=>{
  const source=await readFile(new URL('../components/regional-commercial-guide.tsx',import.meta.url),'utf8')
  assert.doesNotMatch(source,/affiliateUrl|campaignId|trackingTemplate|\/go\?/)
  assert.equal(latam.latamCountry('pt-BR'),null)
  assert.equal(commercial.snapshotFromRegistry('CO',[]).operators.length,0)
  const fixture=reviewedFixture('CO')
  fixture.verifiedGames=['g1']
  const snapshot=commercial.snapshotFromRegistry('CO',[fixture])
  assert.equal(snapshot.operators.length,1)
  assert.equal(data.getOperatorsForGame(data.getGame('aviator'),'CO',snapshot.operators).length,1)
  assert.equal(data.getOperatorsForGame(data.getGame('aviator'),'PE',snapshot.operators).length,0)
  fixture.active=false
  assert.equal(commercial.snapshotFromRegistry('CO',[fixture]).operators.length,0)
})
