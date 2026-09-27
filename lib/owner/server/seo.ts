import audit from '@/data/owner/search-console-audit.json'
import { googleAccessToken, googleCredentials, googleRead } from './google'
import { indexingState, seoOpportunities, type SearchRow } from '../metrics'
import type { Filters, Source } from '../model'
import { publishedInventory } from './catalog'

export interface SearchData { clicks: number | null; impressions: number | null; ctr: number | null; position: number | null; queries: SearchRow[]; pages: SearchRow[] }
export async function searchSource(filters: Filters): Promise<Source<SearchData>> {
  const data: SearchData = { clicks: null, impressions: null, ctr: null, position: null, queries: [], pages: [] }
  if (!await googleCredentials('search')) return { state: 'not_connected', label: 'Search Console performance', detail: 'The signed-in browser audit is preserved separately. A server-side Search Console read connection has not been configured.', data }
  try {
    const token = await googleAccessToken('search'), property = process.env.OWNER_SEARCH_PROPERTY || 'sc-domain:playliva.com'
    const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`
    const groups: { dimension: string; operator: string; expression: string }[] = []
    const route = filters.route || (filters.game ? `/${filters.locale || 'pt-br'}/play/${filters.game}` : '')
    if (route) groups.push({ dimension: 'page', operator: 'equals', expression: `https://www.playliva.com${route}` })
    else if (filters.locale) groups.push({ dimension: 'page', operator: 'contains', expression: `/${filters.locale.toLowerCase()}/` })
    const startDate = filters.from || new Date(Date.now() - 480 * 86400000).toISOString().slice(0, 10)
    const query = (dimensions: string[]) => googleRead(endpoint, token, { startDate, endDate: filters.to, dimensions, rowLimit: 1000, dataState: 'final', ...(groups.length ? { dimensionFilterGroups: [{ filters: groups }] } : {}) })
    const [summary, queries, pages] = await Promise.all([query([]), query(['query', 'page']), query(['page'])])
    const total = summary.rows?.[0]
    const normalize = (rows: { keys: string[]; clicks: number; impressions: number; ctr: number; position: number }[], withQuery: boolean): SearchRow[] => (rows ?? []).map(row => ({ query: withQuery ? row.keys[0] : '', page: row.keys[withQuery ? 1 : 0], clicks: row.clicks, impressions: row.impressions, ctr: row.ctr, position: row.position }))
    return { state: total ? 'connected' : 'no_data', label: 'Search Console performance', detail: `Final Google data, ${startDate} to ${filters.to}. Top 1,000 query/page rows; anonymized queries may be omitted.`, observedAt: new Date().toISOString(), data: { clicks: total?.clicks ?? 0, impressions: total?.impressions ?? 0, ctr: total?.ctr ?? 0, position: total?.position ?? null, queries: normalize(queries.rows, true), pages: normalize(pages.rows, false) } }
  } catch { return { state: 'unavailable', label: 'Search Console performance', detail: 'Google reporting is unavailable or authorization has expired. The historical audit remains available below.', data } }
}
export function indexingAudit() {
  const known = [...audit.newPages.map(row => ({ url: row.url, state: indexingState(row.inspection, row.request), detail: row.inspection, request: row.request })), ...audit.existing.map(row => ({ url: row.url, state: indexingState(row.state), detail: `${row.state}; fetch ${row.fetch}; canonical ${row.canonical}`, request: 'No new request recorded in this audit' }))]
  const slugs = ['skuptu-levanta', 'samba-drop', 'carnaval-gold', 'liva-ginga', 'golaco', 'liva-raio', 'liva-21-brasil']
  return publishedInventory().filter(row => slugs.some(slug => row.route.endsWith(`/play/${slug}`))).map(row => {
    const url = `https://www.playliva.com${row.route}`, observation = known.find(item => item.url === url)
    return { route: row.route, locale: row.locale, topic: row.topic, url, state: observation?.state ?? 'Unknown', detail: observation?.detail ?? 'No inspection result in this imported audit.', request: observation?.request ?? 'Not recorded', observedAt: '2026-09-27', inSitemap: true }
  })
}
export const searchAudit = { property: audit.property, sitemap: audit.sitemap, observedAt: '2026-09-27', provenance: 'Manual production Search Console audit; historical snapshot, not a live indexing feed.' }
export { seoOpportunities }
