import 'server-only'
import { requireOwner } from './gate'
import { readOwnerState, persistenceMode, localEnabled } from './store'
import { emptyOwnerState, readFilters } from '../model'
import { socialLibrary } from './social'
import { searchSource, indexingAudit, searchAudit, seoOpportunities } from './seo'
import { analyticsSource } from './analytics'
import { contentPipeline } from './content'
import { operatorOverview, ownerGames } from './catalog'
import { youtubeReadiness } from './youtube'
import { aggregateEvents } from '../metrics'
import { affiliateReport, conversionSource } from './affiliate'
import { generationSummary } from './automation'
import { privateStorageConfigured } from './object-storage'
import trafficSnapshot from '@/data/owner/traffic-snapshot.json'
import searchSnapshot from '@/data/owner/search-performance-snapshot.json'

export async function growthData(params: URLSearchParams) {
  await requireOwner()
  const filters = readFilters(params)
  let state = emptyOwnerState(), persistenceError = false
  try { state = await readOwnerState() } catch { persistenceError = true }
  const [social, analytics, search, youtubeReady] = await Promise.all([socialLibrary(state), analyticsSource(), searchSource(filters), youtubeReadiness()])
  const opportunities = seoOpportunities(search.data.queries)
  const measured = ['connected', 'no_data'].includes(analytics.state) && (!filters.from || filters.from >= analytics.data.from) && filters.to <= analytics.data.to
  const filteredGame = ownerGames.filter(game => !filters.game || game.slug === filters.game)
  const games = filteredGame.map(game => {
    const pageData = search.data.pages.filter(row => new URL(row.page).pathname.endsWith(`/play/${game.slug}`)), impressions = pageData.reduce((sum, row) => sum + row.impressions, 0)
    return { ...game, metrics: measured ? aggregateEvents(analytics.data.events, { ...filters, game: game.slug }) : null,
      creatives: social.data.filter(row => row.gameSlug === game.slug).length,
      // The bounded top-page report cannot establish zero for an omitted page.
      seoClicks: search.state === 'connected' && pageData.length ? pageData.reduce((sum, row) => sum + row.clicks, 0) : null,
      seoImpressions: search.state === 'connected' && pageData.length ? impressions : null,
      topLocale: pageData.sort((a, b) => b.clicks - a.clicks)[0]?.page.split('/')[3] ?? null }
  }).sort((a, b) => params.get('gameSort') === 'clicks' ? (b.metrics?.clicks ?? -1) - (a.metrics?.clicks ?? -1) : params.get('gameSort') === 'creatives' ? b.creatives - a.creatives : a.title.localeCompare(b.title))
  return { filters, games, catalog: ownerGames, social, analytics, measured, search, opportunities, indexing: indexingAudit(), searchAudit, youtubeReady,
    automation: await generationSummary(state), privateMedia: privateStorageConfigured(),
    metrics: measured ? aggregateEvents(analytics.data.events, filters) : null,
    groups: affiliateReport(analytics.data.events, filters).groups, conversions: conversionSource(),
    operators: operatorOverview(), content: contentPipeline(state, social.data, opportunities), activity: state.activity.slice(-25).reverse(), jobs: state.jobs.slice(-25).reverse(),
    trafficSnapshot, searchSnapshot, persistence: persistenceMode(), persistenceError, mediaMode: privateStorageConfigured() ? 'Private Vercel Blob; authenticated access' : localEnabled() ? 'Local filesystem; protected access' : 'Production object storage not connected' }
}
export type GrowthData = Awaited<ReturnType<typeof growthData>>
