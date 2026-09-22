import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import dataModule from '../lib/data.ts'
import contentModule from '../lib/content.ts'
import catalogModule from '../lib/catalog/index.ts'

const { getComparison, getGame, getGameList } = dataModule
const {
  getAlternativeNote,
  getCategoryContent,
  getComparisonContent,
  getGameContent,
  getGameListContent,
} = contentModule
const { getReferenceProvider, REFERENCE_GAMES } = catalogModule

test('Traffic Sprint 2: PT-BR Slots pages own distinct search intents', () => {
  const category = getCategoryContent('slots', 'pt-BR')
  const gates = getGameContent(getGame('gates-of-olympus'), 'pt-BR')
  const sweet = getGameContent(getGame('sweet-bonanza'), 'pt-BR')
  const bigBass = getGameContent(getGame('big-bass-bonanza'), 'pt-BR')

  assert.match(category.h1, /formatos e mecânicas/i)
  assert.match(category.seoTitle, /catálogo/i)
  assert.match(gates.seo.game.h1, /como funciona/i)
  assert.match(gates.seo.gamesLike.h1, /alternativas e diferenças/i)
  assert.match(gates.seo.whereToPlay.h1, /onde jogar/i)
  assert.match(sweet.seo.game.h1, /como funciona/i)
  assert.match(sweet.seo.whereToPlay.h1, /onde jogar/i)
  assert.match(bigBass.seo.game.h1, /como funciona/i)

  const titles = [
    category.seoTitle,
    gates.seo.game.title,
    gates.seo.gamesLike.title,
    gates.seo.whereToPlay.title,
    sweet.seo.game.title,
    sweet.seo.whereToPlay.title,
    bigBass.seo.game.title,
  ]
  assert.equal(new Set(titles).size, titles.length)
})

test('Traffic Sprint 2: game copy stays within documented mechanics', () => {
  const games = ['gates-of-olympus', 'sweet-bonanza', 'big-bass-bonanza']
    .map((slug) => getGameContent(getGame(slug), 'pt-BR'))
  for (const game of games) {
    const copy = [game.description, game.shortDescription, game.whatIsIt, ...(game.howItWorks ?? [])].join(' ')
    assert.doesNotMatch(copy, /alta volatilidade|RTP|retorno ao jogador|mais popular|melhor payout|mais jogado/i)
    assert.match(copy, /Pragmatic Play/i)
  }
  assert.match(games[0].entityDifference, /linhas de pagamento fixas/i)
  assert.match(games[1].entityDifference, /qualquer posição/i)
  assert.match(games[2].whatIsIt, /coleta de prêmios/i)
})

test('Traffic Sprint 2: alternatives and comparison explain factual tradeoffs', () => {
  const gates = getGame('gates-of-olympus')
  const sweet = getGame('sweet-bonanza')
  const bigBass = getGame('big-bass-bonanza')
  const notes = [
    getAlternativeNote(gates.id, sweet.id, 'pt-BR'),
    getAlternativeNote(gates.id, bigBass.id, 'pt-BR'),
  ]
  for (const note of notes) {
    assert.match(note, /Pragmatic Play/i)
    assert.match(note, /cascata|multiplicador|rodadas grátis|coleta/i)
    assert.doesNotMatch(note, /público|popular|melhor/i)
  }

  const comparison = getComparisonContent(getComparison('gates-of-olympus-vs-sweet-bonanza'), 'pt-BR')
  const copy = [comparison.intro, ...comparison.similarities, ...comparison.differences, comparison.editorialSummary].join(' ')
  assert.match(copy, /qualquer posição/i)
  assert.match(copy, /8 a 30/i)
  assert.match(copy, /8 a 12/i)
  assert.match(copy, /sem um vencedor geral/i)
  assert.doesNotMatch(copy, /melhor payout|maior RTP|mais popular|mais jogado/i)
  assert.match(comparison.seo.title, /Gates of Olympus vs Sweet Bonanza/i)
})

test('Traffic Sprint 2: Brazil Slots selection is transparent and unranked', () => {
  const selection = getGameListContent(getGameList('best-slots-brazil'), 'pt-BR')
  assert.match(selection.title, /seleção editorial/i)
  assert.deepEqual(Object.keys(selection.selectionReasons).sort(), ['g11', 'g5', 'g6'])
  assert.ok(selection.methodologyCriteria.length >= 5)
  assert.doesNotMatch(`${selection.intro} ${selection.editorialContent}`, /popularidade|market share|mais jogad|melhor payout|RTP|volatilidade/i)
})

test('Traffic Sprint 2: Pragmatic Play remains a sourced catalog hub', () => {
  const provider = getReferenceProvider('pragmatic-play')
  const games = REFERENCE_GAMES.filter((game) => game.providerId === provider.id)
  assert.match(provider.overview['pt-BR'], /linhas fixas|grupos conectados|pagamento em qualquer posição/i)
  assert.ok(games.some((game) => game.slug === 'sugar-rush'))
  assert.ok(games.length >= 10)
  assert.ok(games.every((game) => game.sources.length > 0))
})

test('Traffic Sprint 2: cluster links are contextual and affiliate implementation is unchanged', async () => {
  const sources = await Promise.all([
    '../components/category-page-view.tsx',
    '../components/game-detail-view.tsx',
    '../components/where-to-play-view.tsx',
    '../components/games-like-view.tsx',
    '../components/comparison-view.tsx',
    '../components/best-list-view.tsx',
    '../components/catalog/reference-views.tsx',
  ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')))
  const joined = sources.join('\n')
  for (const path of [
    '/slots', '/games/gates-of-olympus',
    '/games-like/gates-of-olympus', '/compare/gates-of-olympus-vs-sweet-bonanza',
    '/games/sweet-bonanza',
    '/games/big-bass-bonanza', '/providers/pragmatic-play', '/best/best-slots-brazil',
  ]) assert.ok(joined.includes(path), path)
  assert.match(sources[2], /WhereToPlayOperatorCard/)
  assert.match(sources[2], /pageType="where_to_play"/)
  assert.doesNotMatch(joined, /https?:\/\/[^'"`]*betsson/i)
})
