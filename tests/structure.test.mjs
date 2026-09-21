import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import dataModule from '../lib/data.ts'
import affiliateModule from '../lib/affiliate.ts'
import contentModule from '../lib/content.ts'
import sportsCtaModule from '../components/sports/affiliate-cta.tsx'
const { GAMES, CATEGORIES, GAME_LISTS, OPERATORS, offersByCountry, getGame, getGamesByIds,
  getRelatedGames, getOperator, getOperatorsForGame, isAffiliateEligible } = dataModule
const { resolveDestination } = affiliateModule

test('canonical categories and existing game identities remain consistent', () => {
  assert.deepEqual(CATEGORIES.map(c => c.slug), ['crash', 'slots', 'live-casino', 'table-games', 'instant-games'])
  // Approved production identity snapshot: taxonomy changes must not rename games.
  assert.deepEqual(GAMES.map(g => [g.id, g.slug, g.title, g.provider]), [
    ['g1', 'aviator', 'Aviator', 'Spribe'], ['g2', 'jetx', 'JetX', 'SmartSoft'],
    ['g3', 'spaceman', 'Spaceman', 'Pragmatic Play'], ['g4', 'mines', 'Mines', 'Spribe'],
    ['g5', 'gates-of-olympus', 'Gates of Olympus', 'Pragmatic Play'],
    ['g6', 'sweet-bonanza', 'Sweet Bonanza', 'Pragmatic Play'],
    ['g7', 'lightning-roulette', 'Lightning Roulette', 'Evolution'], ['g8', 'crazy-time', 'Crazy Time', 'Evolution'],
    ['g10', 'plinko', 'Plinko', 'Spribe'], ['g11', 'big-bass-bonanza', 'Big Bass Bonanza', 'Pragmatic Play'],
    ['g12', 'blackjack-live', 'Blackjack Live', 'Evolution'],
  ])
  const slugs = category => GAMES.filter(g => g.category === category).map(g => g.slug)
  assert.deepEqual(slugs('crash'), ['aviator', 'jetx', 'spaceman'])
  assert.deepEqual(slugs('instant-games'), ['mines', 'plinko'])
  assert.deepEqual(slugs('table-games'), ['blackjack-live'])
  for (const locale of ['en', 'pt-BR', 'es-MX']) for (const category of CATEGORIES) {
    const copy = contentModule.getCategoryContent(category.slug, locale)
    assert.ok(copy.name && copy.description && copy.cta)
  }
})

test('rankings and related games respect discovery categories', () => {
  for (const list of GAME_LISTS) {
    assert.ok(getGamesByIds(list.gameIds).every(g => g.category === list.category), list.slug)
  }
  for (const game of GAMES) for (const country of ['BR', 'MX']) {
    assert.ok(getRelatedGames(game, country).every(g => g.category === game.category && g.id !== game.id))
  }
})

test('Blackjack discovery changes preserve verified commercial routing without extending approvals', () => {
  const partner = getOperator('betsson-group-affiliates')
  const game = getGame('blackjack-live')
  assert.ok(getOperatorsForGame(game, 'BR').includes(partner))
  for (const analyticsAllowed of [undefined, false, true]) {
    for (const extra of [{}, { category: 'table-games' }, { category: 'live-casino' }, { pageType: 'game', pageSlug: game.slug }]) {
      assert.equal(resolveDestination({ operatorSlug: partner.slug, country: 'BR', gameSlug: game.slug, analyticsAllowed, ...extra })?.url,
        partner.categoryAffiliateUrl['live-casino'].BR)
    }
  }
  for (const extra of [{ country: 'MX', gameSlug: game.slug }, { category: 'table-games' },
    { category: 'instant-games' }, { gameSlug: 'mines' }, { gameSlug: 'plinko' },
    { category: 'slots', gameSlug: game.slug }, { category: 'sports' }]) {
    assert.equal(resolveDestination({ operatorSlug: partner.slug, country: 'BR', ...extra }), null)
  }
  assert.equal(isAffiliateEligible({ ...partner, categories: ['sports'] }, 'BR'), false)
  // Fingerprint of ALL operator and offer records at e7a8218, not inferred approvals.
  assert.equal(createHash('sha256').update(JSON.stringify([OPERATORS, offersByCountry])).digest('hex'),
    '41f3d9a976c4a0641ece98c29f3178fdece74cd492d311ce7a32f0f5e34b287a')
})

test('archived sportsbook component cannot render a betting action', () => {
  assert.equal(sportsCtaModule.AffiliateCTA({ affiliateUrl: '#', bookmakerId: 'test-only' }), null)
})
