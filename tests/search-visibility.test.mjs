import test from 'node:test'
import assert from 'node:assert/strict'
import intent from '../lib/search-intent.ts'
import scope from '../lib/search-intent-scope.ts'
import guides from '../lib/latam-guides.ts'
import editorial from '../lib/editorial.ts'
import content from '../lib/content.ts'
import data from '../lib/data.ts'
import locale from '../lib/locale.ts'
import policy from '../lib/discovery/indexability.ts'

test('search explanations are restricted to the eight reviewed locale/page pairs', () => {
  assert.equal(Object.values(scope.SEARCH_INTENT_PATHS).flat().length, 8)
  for (const [active, paths] of Object.entries(scope.SEARCH_INTENT_PATHS)) for (const path of paths) {
    const guide = intent.searchIntentGuide(path, active)
    assert.ok(guide.sections.length > 0)
    const links = guide.sections.flatMap(section => section.links ?? [])
    assert.ok(links.length >= 2 && links.length <= 8)
    for (const link of links) {
      assert.match(link.href, /^\/(games|providers|guides|best|where-to-play|play|offers|crash|slots)/)
      assert.doesNotMatch(link.href, /\/go|https:|\?|es-mx|es-co|es-pe/)
    }
    assert.equal(editorial.editorialRecord(path, active).updatedAt, '2026-10-14')
    assert.equal(editorial.editorialRecord(path, locale.localeToSegment(active)).updatedAt, '2026-10-14')
  }
  for (const active of ['en', 'pt-BR', 'es-CO', 'es-PE']) {
    assert.equal(intent.searchIntentGuide('/best/best-slots-mexico', active), null)
    assert.equal(intent.searchIntentGuide('/slots', active), null)
  }
  assert.equal(intent.searchIntentGuide('/where-to-play/aviator', 'es-MX'), null)
  assert.equal(intent.searchIntentGuide('/games/jetx', 'es-CO'), null)
  assert.equal(editorial.editorialRecord('/games/gates-of-olympus', 'es-CO').updatedAt, '2026-10-13')
  assert.equal(editorial.editorialRecord('/games/aviator', 'en').updatedAt, undefined)
})

test('Mexico reading links reach its weak lists without exporting them to CO/PE', () => {
  for (const [slug, target] of [['aviator-demo', '/best/best-crash-games-mexico'], ['bonos-casino', '/best/best-slots-mexico']]) {
    assert.ok(guides.latamGuide(slug, 'es-MX').links.some(link => link.href === target))
    for (const active of ['es-CO', 'es-PE']) assert.ok(!guides.latamGuide(slug, active).links.some(link => link.href === target))
    assert.equal(policy.discoveryIndexability(target, 'es-mx').index, true)
    assert.equal(policy.discoveryIndexability(target, 'es-co').index, false)
    assert.equal(editorial.editorialRecord('/guides/' + slug, 'es-MX').updatedAt, '2026-10-13', 'navigation alone is not a new substantive review')
  }
  assert.ok(intent.searchIntentGuide('/games/aviator', 'es-MX').sections.flatMap(s => s.links ?? []).some(l => l.href.endsWith('best-crash-games-mexico')))
  for (const path of ['/slots', '/games/gates-of-olympus']) assert.ok(intent.searchIntentGuide(path, 'es-MX').sections.flatMap(s => s.links ?? []).some(l => l.href.endsWith('best-slots-mexico')))
})

test('Mexico selections explain criteria without claiming measured popularity or commercial availability', () => {
  for (const slug of ['best-crash-games-mexico', 'best-slots-mexico']) {
    const list = data.getGameList(slug), copy = content.getGameListContent(list, 'es-MX')
    assert.equal(copy.methodologyCriteria.length, 4)
    assert.ok(list.gameIds.every(id => copy.selectionReasons[id]))
    assert.doesNotMatch(copy.intro + copy.editorialContent + copy.seoDescription, /slots populares|según disponibilidad y popularidad|más exploran|son favoritos/)
    assert.match(copy.editorialContent, /orden|lectura/)
    assert.match(copy.editorialContent, /separado|no acredita/)
  }
})
