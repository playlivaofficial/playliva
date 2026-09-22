import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import dataModule from '../lib/data.ts'
import contentModule from '../lib/content.ts'

const { getComparison, getGame, getGameList } = dataModule
const {
  getCategoryContent,
  getComparisonContent,
  getCrashHubContent,
  getGameContent,
  getGameListContent,
} = contentModule

test('Traffic Sprint 1: PT-BR Aviator pages have distinct intent-led metadata and headings', () => {
  const aviator = getGameContent(getGame('aviator'), 'pt-BR')
  const pages = [aviator.seo.game, aviator.seo.whereToPlay, aviator.seo.gamesLike]
  assert.equal(new Set(pages.map((page) => page.title)).size, pages.length)
  assert.equal(new Set(pages.map((page) => page.description)).size, pages.length)
  assert.equal(new Set(pages.map((page) => page.h1)).size, pages.length)
  assert.match(aviator.seo.game.h1, /como funciona/i)
  assert.match(aviator.seo.whereToPlay.h1, /onde jogar/i)
  assert.match(aviator.seo.gamesLike.h1, /alternativas/i)
  assert.match(aviator.entityDifference, /Ao contrário de um slot/i)
  assert.match(aviator.availabilityNote, /disponibilidade é conferida/i)
})

test('Traffic Sprint 1: pairwise comparisons use documented mechanics without unsupported outcome claims', () => {
  for (const slug of ['aviator-vs-jetx', 'aviator-vs-spaceman']) {
    const comparison = getComparisonContent(getComparison(slug), 'pt-BR')
    const copy = [comparison.intro, ...comparison.similarities, ...comparison.differences, comparison.editorialSummary].join(' ')
    assert.match(copy, /cash.?out/i)
    assert.match(copy, /provedor|SPRIBE|SmartSoft|Pragmatic Play/i)
    assert.doesNotMatch(copy, /maior comunidade|mais disponível|melhor payout|maior RTP|mais seguro|vencedor geral/i)
    assert.match(comparison.seo.title, new RegExp(slug === 'aviator-vs-jetx' ? 'Aviator vs JetX' : 'Aviator vs Spaceman', 'i'))
  }
})

test('Traffic Sprint 1: crash hub, evergreen guide and Brazil selection remain separate', () => {
  const category = getCategoryContent('crash', 'pt-BR')
  const guide = getCrashHubContent('pt-BR')
  const selection = getGameListContent(getGameList('best-crash-games-brazil'), 'pt-BR')
  assert.match(category.h1, /categoria/i)
  assert.match(guide.h1, /avaliar e escolher/i)
  assert.match(selection.title, /Brasil/i)
  assert.equal(new Set([category.seoTitle, guide.seoTitle, selection.seoTitle]).size, 3)
  assert.ok(guide.criteria.length >= 8)
  assert.deepEqual(Object.keys(selection.selectionReasons).sort(), ['g1', 'g2', 'g3'])
  assert.ok(selection.methodologyCriteria.length >= 5)
  assert.doesNotMatch(`${selection.intro} ${selection.editorialContent}`, /player count|market share|mais jogad|popularidade/i)
})

test('Traffic Sprint 1: contextual links stay internal and affiliate card implementation is untouched', async () => {
  const sources = await Promise.all([
    '../components/game-detail-view.tsx',
    '../components/where-to-play-view.tsx',
    '../components/games-like-view.tsx',
    '../components/comparison-view.tsx',
    '../components/category-page-view.tsx',
    '../components/crash-games-hub-view.tsx',
    '../components/best-list-view.tsx',
  ].map((path) => readFile(new URL(path, import.meta.url), 'utf8')))
  const joined = sources.join('\n')
  for (const path of [
    '/games/aviator', '/where-to-play/aviator', '/games-like/aviator',
    '/compare/aviator-vs-jetx', '/compare/aviator-vs-spaceman',
    '/crash', '/best/crash-games', '/best/best-crash-games-brazil', '/play/crash',
  ]) assert.ok(joined.includes(path), path)
  assert.match(sources[1], /WhereToPlayOperatorCard/)
  assert.match(sources[1], /pageType="where_to_play"/)
  assert.doesNotMatch(joined, /https?:\/\/[^'"`]*betsson/i)
})
