import { inPeriod, type Filters } from './model'
export interface MetricEvent { date: string; event: string; count: number; route: string; game: string; locale: string; operator: string; placement: string; geo: string; device: string; source: string; utmContent: string }
export const FUNNEL_EVENTS = ['page_view', 'demo_round_start', 'demo_round_complete', 'affiliate_impression', 'affiliate_click'] as const
export function matchesEvent(row: MetricEvent, filters: Filters) {
  return inPeriod(row.date, filters) && (['game', 'route', 'locale', 'operator', 'placement', 'geo', 'device', 'source'] as const).every(key => !filters[key] || filters[key].toLowerCase() === row[key].toLowerCase())
}
export function aggregateEvents(rows: MetricEvent[], filters: Filters) {
  const matched = rows.filter(row => matchesEvent(row, filters))
  const sum = (events: string[]) => matched.filter(row => events.includes(row.event)).reduce((total, row) => total + row.count, 0)
  const impressions = sum(['affiliate_impression', 'offer_impression']), clicks = sum(['affiliate_click'])
  return { visits: sum(['page_view']), starts: sum(['demo_round_start']), cycles: sum(['demo_round_complete']), impressions, clicks, ctr: impressions ? clicks / impressions : null, popupImpressions: sum(['offer_impression']), popupClicks: matched.filter(row => row.event === 'affiliate_click' && row.placement === 'originals_engagement_offer').reduce((total, row) => total + row.count, 0) }
}
export function groupEvents(rows: MetricEvent[], filters: Filters, dimension: keyof MetricEvent) {
  const values = [...new Set(rows.filter(row => matchesEvent(row, filters)).map(row => String(row[dimension])))]
  return values.map(value => ({ value: value || 'Unspecified', ...aggregateEvents(rows.filter(row => String(row[dimension]) === value), filters) })).sort((a, b) => b.clicks - a.clicks || b.visits - a.visits)
}
export interface SearchRow { query: string; page: string; clicks: number; impressions: number; ctr: number; position: number; previousImpressions?: number; internalLinks?: number; landingPageChecked?: boolean }
export function previousSearchPeriod(from: string, to: string) {
  if (!from || !to) return null
  const start = Date.parse(from), end = Date.parse(to), day = 86400000
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null
  return { from: new Date(start - (end - start + day)).toISOString().slice(0, 10), to: new Date(start - day).toISOString().slice(0, 10) }
}
/** Match the same query AND landing page. An omitted top-row result is unknown, not zero. */
export function compareSearchPeriods(current: SearchRow[], previous: SearchRow[]) {
  const key = (row: SearchRow) => JSON.stringify([row.query, row.page])
  const prior = new Map(previous.map(row => [key(row), row.impressions]))
  return current.map(row => ({ ...row, ...(prior.has(key(row)) ? { previousImpressions: prior.get(key(row)) } : {}) }))
}
export interface Opportunity { id: string; topic: string; route: string; reason: string; action: string; kind: string; priority?: number; source?: string }
export function seoOpportunities(rows: SearchRow[]): Opportunity[] {
  const result: Opportunity[] = []
  for (const [index, row] of rows.entries()) {
    if (row.impressions < 100) continue
    const add = (kind: string, reason: string, action: string) => result.push({ id: `${kind}-${index}`, kind, topic: row.query || row.page, route: row.page, reason, action, priority: 2, source: 'Google Search Console performance' })
    if (row.ctr < 0.02 && row.position <= 15) add('low-ctr', `${row.impressions} impressions, ${(row.ctr * 100).toFixed(1)}% CTR, position ${row.position.toFixed(1)}.`, 'Review the title and description against this exact search intent.')
    if (row.position >= 4 && row.position <= 15) add('within-reach', `Average position ${row.position.toFixed(1)} across ${row.impressions} impressions.`, 'Compare the landing page with this query and improve the relevant explanation and internal links.')
    if (row.previousImpressions && row.impressions >= row.previousImpressions * 1.5 && row.position > 15) add('rising-query', `Impressions rose from ${row.previousImpressions} to ${row.impressions}; position ${row.position.toFixed(1)}.`, 'Strengthen the landing page section that answers this rising query.')
    if (row.previousImpressions && row.previousImpressions >= 100 && row.impressions <= row.previousImpressions * 0.6) add('content-decay', `Impressions fell from ${row.previousImpressions} to ${row.impressions} in the supplied comparable periods.`, 'Check seasonal demand and page changes before refreshing content.')
    if (!row.page && row.query && row.landingPageChecked) add('missing-landing', `${row.impressions} impressions for a query whose landing-page audit found no relevant destination.`, 'Map an existing relevant page before planning new content.')
    if (row.internalLinks !== undefined && row.internalLinks < 2) add('weak-links', `${row.impressions} impressions and ${row.internalLinks} measured incoming internal links.`, 'Add a useful contextual link from an existing relevant page.')
  }
  return result
}
export function indexingState(coverage: string, request?: string) {
  if (/crawled.*not indexed/i.test(coverage)) return 'Crawled — currently not indexed'
  if (/^indexed$|submitted and indexed|url is on google/i.test(coverage)) return 'Indexed'
  if (/unavailable/i.test(coverage)) return 'Inspection unavailable'
  return request === 'accepted' ? 'Requested' : 'Unknown'
}
