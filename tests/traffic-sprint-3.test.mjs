import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import dataModule from '../lib/data.ts'
import contentModule from '../lib/content.ts'
import catalogModule from '../lib/catalog/index.ts'

const { getComparison, getGame, getOperator, getOperatorsForGame } = dataModule
const {
  getAlternativeNote,
  getCategoryContent,
  getComparisonContent,
  getGameContent,
} = contentModule
const { getReferenceGame, getReferenceProvider, REFERENCE_GAMES } = catalogModule

test('Traffic Sprint 3: PT-BR Live Casino pages own distinct search intents', () => {
  const category = getCategoryContent('live-casino', 'pt-BR')
  const crazy = getGameContent(getGame('crazy-time'), 'pt-BR')
  const lightning = getGameContent(getGame('lightning-roulette'), 'pt-BR')
  const blackjack = getGameContent(getGame('blackjack-live'), 'pt-BR')

  assert.match(category.h1, /roleta, blackjack e game shows/i)
  assert.match(category.seoTitle, /cassino ao vivo/i)
  assert.match(crazy.seo.game.h1, /como funciona o jogo ao vivo/i)
  assert.match(crazy.seo.gamesLike.h1, /alternativas e diferenças/i)
  assert.match(crazy.seo.whereToPlay.h1, /onde jogar/i)
  assert.match(lightning.seo.game.h1, /como funciona a roleta ao vivo/i)
  assert.match(lightning.seo.whereToPlay.h1, /onde jogar/i)
  assert.match(blackjack.seo.game.h1, /como funciona o blackjack ao vivo/i)
  assert.match(blackjack.seo.whereToPlay.h1, /onde jogar/i)

  const titles = [
    category.seoTitle,
    crazy.seo.game.title,
    crazy.seo.gamesLike.title,
    crazy.seo.whereToPlay.title,
    lightning.seo.game.title,
    lightning.seo.whereToPlay.title,
    blackjack.seo.game.title,
    blackjack.seo.whereToPlay.title,
  ]
  assert.equal(new Set(titles).size, titles.length)
})

test('Traffic Sprint 3: core game copy stays within documented Evolution mechanics', () => {
  const crazy = getGameContent(getGame('crazy-time'), 'pt-BR')
  const lightning = getGameContent(getGame('lightning-roulette'), 'pt-BR')
  const blackjack = getGameContent(getGame('blackjack-live'), 'pt-BR')
  const copy = [crazy, lightning, blackjack]
    .flatMap((game) => [game.description, game.shortDescription, game.whatIsIt, ...(game.howItWorks ?? [])])
    .join(' ')

  assert.doesNotMatch(copy, /RTP|retorno ao jogador|mais popular|mais jogado|melhor payout/i)
  assert.match(crazy.whatIsIt, /Evolution/i)
  assert.match(crazy.howItWorks.join(' '), /Coin Flip.*Cash Hunt.*Pachinko.*Crazy Time/i)
  assert.match(lightning.whatIsIt, /zero único/i)
  assert.match(lightning.howItWorks.join(' '), /um a cinco Números da Sorte/i)
  assert.match(blackjack.whatIsIt, /mais próxima de 21/i)
  assert.match(blackjack.entityDifference, /PlayLiva Original separado.*créditos virtuais/i)
})

test('Traffic Sprint 3: alternatives and comparison explain factual format differences', () => {
  const crazy = getGame('crazy-time')
  const notes = [
    getAlternativeNote(crazy.id, getGame('lightning-roulette').id, 'pt-BR'),
    getAlternativeNote(crazy.id, getGame('blackjack-live').id, 'pt-BR'),
  ]
  for (const note of notes) {
    assert.match(note, /Evolution/i)
    assert.doesNotMatch(note, /mais popular|mais jogado|melhor/i)
  }

  const comparison = getComparisonContent(getComparison('crazy-time-vs-lightning-roulette'), 'pt-BR')
  const copy = [comparison.intro, ...comparison.similarities, ...comparison.differences, comparison.editorialSummary].join(' ')
  assert.match(copy, /quatro (?:áreas de )?bônus/i)
  assert.match(copy, /um a cinco Números da Sorte/i)
  assert.match(copy, /não define vencedor/i)
  assert.doesNotMatch(copy, /melhor payout|maior RTP|mais popular|mais jogado/i)
  assert.match(comparison.seo.title, /Crazy Time vs Lightning Roulette/i)
})

test('Traffic Sprint 3: Evolution cluster remains sourced and keeps entities distinct', () => {
  const provider = getReferenceProvider('evolution')
  const games = REFERENCE_GAMES.filter((game) => game.providerId === provider.id)
  const dream = getReferenceGame('dream-catcher')
  const monopoly = getReferenceGame('monopoly-live')

  assert.match(provider.overview['pt-BR'], /cartas ao vivo, dados físicos, roleta e game shows/i)
  assert.ok(games.length >= 5)
  assert.ok(games.every((game) => game.sources.length > 0))
  assert.match(dream.content['pt-BR'].howItWorks, /multiplicadores consecutivos/i)
  assert.match(monopoly.content['pt-BR'].howItWorks, /dados lançados no estúdio/i)
  assert.doesNotMatch(`${dream.content['pt-BR'].overview} ${monopoly.content['pt-BR'].overview}`, /RTP|mais popular|melhor/i)
})

test('Traffic Sprint 3: existing verified affiliate availability is preserved without new destinations', async () => {
  const partner = getOperator('betsson-group-affiliates')
  for (const slug of ['crazy-time', 'lightning-roulette', 'blackjack-live']) {
    assert.ok(getOperatorsForGame(getGame(slug), 'BR').includes(partner), slug)
  }

  const sources = await Promise.all([
    '../components/category-page-view.tsx',
    '../components/game-detail-view.tsx',
    '../components/where-to-play-view.tsx',
    '../components/games-like-view.tsx',
    '../components/comparison-view.tsx',
    '../components/catalog/reference-views.tsx',
  ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')))
  const joined = sources.join('\n')
  for (const path of [
    '/live-casino', '/games/crazy-time', '/where-to-play/crazy-time',
    '/games/lightning-roulette', '/where-to-play/lightning-roulette',
    '/games/blackjack-live',
    '/games/dream-catcher', '/games/monopoly-live', '/providers/evolution',
    '/games-like/crazy-time', '/compare/crazy-time-vs-lightning-roulette',
  ]) assert.ok(joined.includes(path), path)
  assert.match(sources[1], /where-to-play\/\$\{game\.slug\}/)
  assert.match(sources[2], /WhereToPlayOperatorCard/)
  assert.match(sources[2], /pageType="where_to_play"/)
  assert.doesNotMatch(joined, /https?:\/\/[^'"`]*betsson/i)
})
