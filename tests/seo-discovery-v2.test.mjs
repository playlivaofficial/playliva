import test from 'node:test'
import assert from 'node:assert/strict'
import catalog from '../lib/discovery/catalog.ts'
import query from '../lib/discovery/query.ts'
import policy from '../lib/discovery/indexability.ts'
import metadata from '../lib/discovery/seo.ts'
import schemas from '../lib/discovery/schema.ts'
import references from '../lib/catalog/index.ts'
import sitemap from '../app/sitemap.ts'
import metrics from '../lib/owner/metrics.ts'
import links from '../lib/discovery/links.ts'
import tracking from '../lib/tracking.ts'
const entries=catalog.discoveryEntries('pt-BR')
test('V2 directory ranks real games, legitimate aliases and all Originals without duplicates',()=>{
 assert.equal(entries.length,56);assert.equal(new Set(entries.map(g=>g.href)).size,56)
 for(const [q,href] of [['Aviator','/games/aviator'],['Aviat','/games/aviator'],['Skuptu Levanta','/play/skuptu-levanta'],['Samba Drop','/play/samba-drop'],['Liva Ginga','/play/liva-ginga'],['Book of Dead','/games/book-of-dead'],['Golden Orbit','/play/roulette']])assert.equal(query.queryDirectory(entries,{q}).items[0].href,href,q)
 for(const game of entries.filter(g=>g.kind==='original'))assert.equal(query.queryDirectory(entries,{q:game.title}).items[0].href,game.href)
 assert.equal(query.queryDirectory(entries,{q:'something-not-a-game'}).total,0)
 assert.equal(query.queryDirectory(entries,{q:'SPRIBE'}).total,5)
 assert.ok(query.queryDirectory(entries,{q:'Play n GO'}).total>=6)
 assert.ok(query.queryDirectory(entries,{q:'instantaneos'}).total>=6)
 assert.ok(query.searchScore(entries.find(g=>g.slug==='aviator'),'aviator')>query.searchScore(entries.find(g=>g.slug==='aviator'),'aviato'))
 assert.equal(query.queryDirectory([...entries,...entries],{q:'mines'}).total,2)
})
test('V2 filters combine, pages are bounded and provider inventory includes legacy games',()=>{
 assert.equal(query.queryDirectory(entries,{provider:'pragmatic-play',kind:'provider'}).total,18)
 assert.equal(query.queryDirectory(entries,{provider:'spribe',category:'crash'}).total,1)
 assert.equal(query.queryDirectory(entries,{kind:'original',category:'slots'}).total,3)
 assert.ok(query.queryDirectory(entries,{format:'blackjack'}).items.every(g=>g.format==='blackjack'))
 const first=query.queryDirectory(entries),second=query.queryDirectory(entries,{page:'2'})
 assert.equal(first.items.length,12);assert.equal(first.pages,5);assert.ok(second.items.every(g=>!first.items.some(f=>f.href===g.href)))
 assert.equal(query.queryDirectory(entries,{page:'-1'}).page,1);assert.equal(query.queryDirectory(entries,{page:'99999'}).page,5)
 assert.equal(query.queryDirectory(entries,{provider:'invented'}).total,0)
 assert.equal(query.hasDirectoryFacets({q:'aviator'}),true)
})
test('V2 quality gates agree with metadata, reciprocal alternates and sitemap; missing artwork is held',()=>{
 for(const seg of ['pt-br','en','es-mx'])for(const g of entries.filter(g=>g.kind==='provider'))assert.equal(policy.entityQuality(g.slug,seg).index,true,g.slug+seg)
 const original=references.REFERENCE_GAMES[0].artwork,slug=references.REFERENCE_GAMES[0].slug
 try{references.REFERENCE_GAMES[0].artwork={status:'fallback',source:'playliva-neutral',sourceUrl:null,rightsStatus:'pending-rights',verifiedAt:'2026-09-27'}
  assert.equal(policy.entityQuality(slug,'pt-br').index,false)
  const meta=metadata.pageMetadata({title:'Test',path:'/games/'+slug,localeSegment:'pt-br'})
  assert.equal(meta.robots.index,false);assert.equal(meta.alternates.languages,undefined)
  assert.ok(!sitemap.default().some(g=>g.url.endsWith('/games/'+slug)))
 }finally{references.REFERENCE_GAMES[0].artwork=original}
 const rows=sitemap.default();assert.equal(rows.length,322);assert.equal(new Set(rows.map(r=>r.url)).size,322)
 for(const row of rows){const [,seg,...parts]=new URL(row.url).pathname.split('/');assert.equal(policy.discoveryIndexability('/'+parts.join('/'),seg).index,true)}
 assert.ok(!rows.some(r=>/owner|\?/.test(r.url)))
 assert.equal(policy.discoveryIndexability('/owner/growth','pt-br').index,false)
 assert.equal(policy.discoveryIndexability('/games?provider=spribe','pt-br').index,false)
 assert.equal(policy.discoveryIndexability('/where-to-play/spribe-dice','pt-br').index,false)
 assert.equal(policy.discoveryIndexability('/where-to-play/aviator','en').index,false)
 for(const seg of ['pt-br','en','es-mx']){const m=metadata.pageMetadata({title:'Aviator',path:'/games/aviator',localeSegment:seg});assert.equal(m.alternates.canonical,`https://www.playliva.com/${seg}/games/aviator`);assert.equal(Object.keys(m.alternates.languages).length,4)}
})
test('V2 cross-discovery and editorial links stay deterministic, bounded and within real routes',()=>{
 const samba=entries.find(g=>g.slug==='samba-drop')
 assert.equal(catalog.relatedDiscovery(samba,entries,'provider')[0].slug,'plinko')
 assert.deepEqual(query.queryDirectory(entries,{format:'plinko'}).items.map(g=>g.href).sort(),['/games/plinko','/play/samba-drop'])
 for(const g of entries){for(const kind of ['provider','original']){const related=catalog.relatedDiscovery(g,entries,kind);assert.ok(related.length<=3);assert.ok(related.every(r=>r.href!==g.href&&entries.some(e=>e.href===r.href)));assert.deepEqual(related,catalog.relatedDiscovery(g,entries,kind))}}
 for(const category of ['crash','slots','instant-games','live-casino']){const result=links.editorialLinks(entries.filter(g=>g.kind==='provider'&&g.category===category).map(g=>g.slug),'pt-BR');assert.ok(result.length>0);assert.ok(result.length<=9)}
 const schema=schemas.entitySchema('spribe-dice','pt-br');assert.equal(schema['@type'],'VideoGame');assert.equal(schema.publisher.name,'SPRIBE');assert.equal(schema.offers,undefined);assert.equal(schema.aggregateRating,undefined);assert.equal(schema.review,undefined)
 assert.equal(schemas.entitySchema('not-real','pt-br'),null)
})
test('V2 SEO opportunities require evidence and distinguish decay from no connection',()=>{
 assert.deepEqual(metrics.seoOpportunities([]),[])
 const rows=metrics.seoOpportunities([{query:'game',page:'https://www.playliva.com/pt-br/games/aviator',clicks:2,impressions:150,ctr:2/150,position:8,previousImpressions:400}])
 assert.ok(rows.some(r=>r.kind==='content-decay'));assert.ok(rows.every(r=>r.priority&&r.source&&r.reason&&r.action))
 assert.ok(!metrics.seoOpportunities([{query:'unmapped',page:'',impressions:200,ctr:0,position:20}]).some(r=>r.kind==='missing-landing'))
})
test('V2 discovery measurement strips raw search terms and URL parameters',()=>{
 const safe=tracking.sanitizeTrackPayload({surface:'directory',gameSlug:'aviator',query:'private search',url:'/pt-br/games?q=private-search'},'/pt-br/games')
 assert.equal(safe.query,undefined);assert.equal(safe.url,'/pt-br/games');assert.ok(!JSON.stringify(safe).includes('private'))
})
test('V2 Search Console comparison matches equal periods and never infers omitted rows as zero',()=>{
 assert.deepEqual(metrics.previousSearchPeriod('2026-09-01','2026-09-28'),{from:'2026-08-04',to:'2026-08-31'})
 assert.equal(metrics.previousSearchPeriod('','2026-09-28'),null)
 assert.equal(metrics.previousSearchPeriod('2026-09-28','2026-09-01'),null)
 const rows=metrics.compareSearchPeriods([{query:'aviator',page:'/a',impressions:200},{query:'aviator',page:'/b',impressions:150},{query:'mines',page:'/c',impressions:200}], [{query:'aviator',page:'/a',impressions:100},{query:'mines',page:'/c',impressions:0}])
 assert.equal(rows[0].previousImpressions,100)
 assert.equal(rows[1].previousImpressions,undefined)
 assert.equal(rows[2].previousImpressions,0)
})
