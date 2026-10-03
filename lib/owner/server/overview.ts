import { discoveryHealth } from './discovery'
import 'server-only'
import { requireOwner } from './gate'
import { readOwnerState, persistenceMode, localEnabled } from './store'
import { emptyOwnerState, readFilters } from '../model'
import { socialLibrary } from './social'
import { searchSource, indexingAudit, searchAudit, seoOpportunities } from './seo'
import { analyticsSource } from './analytics'
import { contentPipeline } from './content'
import { operatorOverview, ownerGames, commercialReadiness } from './catalog'
import { youtubeReadiness } from './youtube'
import { aggregateEvents } from '../metrics'
import { affiliateReport, conversionSource } from './affiliate'
import { generationSummary } from './automation'
import { isStoredVideo } from '../social-inventory'
import { privateStorageConfigured } from './object-storage'
import { generationDate } from '../automation-model'
import trafficSnapshot from '@/data/owner/traffic-snapshot.json'
import searchSnapshot from '@/data/owner/search-performance-snapshot.json'

export async function growthData(params: URLSearchParams) {
  await requireOwner()
  const filters = readFilters(params)
  let state = emptyOwnerState(), persistenceError = false
  try { state = await readOwnerState() } catch { persistenceError = true }
  const [social, analytics, search, youtubeReady] = await Promise.all([socialLibrary(state, params.get('creative') ?? undefined), analyticsSource(), searchSource(filters), youtubeReadiness()])
  const discovery = discoveryHealth(filters), indexing = indexingAudit()
  const inspected = indexing.filter(row => row.state === 'Crawled — currently not indexed' && (!filters.locale || row.locale === filters.locale) && (!filters.route || row.route === filters.route) && (!filters.game || row.route.endsWith('/play/'+filters.game)))
  const opportunities = [...seoOpportunities(search.data.queries), ...discovery.opportunities, ...inspected.map(row=>({id:'indexing-'+row.route.replaceAll('/','-'),kind:'not-indexed',priority:2,source:'Search Console inspection '+row.observedAt,topic:row.topic,route:row.url,reason:row.detail,action:'Inspect content and internal links, then check Google again. A request is not an indexing guarantee.'}))].sort((a,b)=>(a.priority??2)-(b.priority??2)||a.id.localeCompare(b.id))
  const measured = ['connected', 'no_data'].includes(analytics.state) && (!filters.from || filters.from <= analytics.data.to) && filters.to >= analytics.data.from
  const filteredGame = ownerGames.filter(game => !filters.game || game.slug === filters.game)
  const games = filteredGame.map(game => {
    const pageData = search.data.pages.filter(row => new URL(row.page).pathname.endsWith(`/play/${game.slug}`)), impressions = pageData.reduce((sum, row) => sum + row.impressions, 0)
    return { ...game, metrics: measured ? aggregateEvents(analytics.data.events, { ...filters, game: game.slug }) : null,
      creatives: social.data.filter(row => row.gameSlug === game.slug && isStoredVideo(row)).length,
      // The bounded top-page report cannot establish zero for an omitted page.
      seoClicks: search.state === 'connected' && pageData.length ? pageData.reduce((sum, row) => sum + row.clicks, 0) : null,
      seoImpressions: search.state === 'connected' && pageData.length ? impressions : null,
      topLocale: pageData.sort((a, b) => b.clicks - a.clicks)[0]?.page.split('/')[3] ?? null }
  }).sort((a, b) => params.get('gameSort') === 'clicks' ? (b.metrics?.clicks ?? -1) - (a.metrics?.clicks ?? -1) : params.get('gameSort') === 'creatives' ? b.creatives - a.creatives : a.title.localeCompare(b.title))
  const daily = { enabled: false, date: generationDate(new Date().toISOString()), timezone: 'Asia/Tbilisi', expected: 0, ready: 0, items: [] }
  return { filters, games, catalog: ownerGames, social, analytics, measured, search, opportunities, indexing, discovery, searchAudit, youtubeReady,
    daily,
    automation: await generationSummary(state), privateMedia: privateStorageConfigured(),
    metrics: measured ? aggregateEvents(analytics.data.events, filters) : null,
    groups: affiliateReport(analytics.data.events, filters).groups, conversions: conversionSource(),
    operators: operatorOverview(), commercialReadiness: commercialReadiness(), content: contentPipeline(state, social.data, opportunities), activity: state.activity.slice(-25).reverse(), jobs: state.jobs.slice(-25).reverse(),
    trafficSnapshot, searchSnapshot, persistence: persistenceMode(), persistenceError, mediaMode: privateStorageConfigured() ? 'Private Vercel Blob; authenticated access' : localEnabled() ? 'Local filesystem; protected access' : 'Production object storage not connected' }
}
export type GrowthData = Awaited<ReturnType<typeof growthData>>
