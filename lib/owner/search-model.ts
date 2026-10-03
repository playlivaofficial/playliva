/** Pure Search Console evidence and experiment rules. No network, media or secrets. */
import { isLocaleSegment } from '../locale'
import { getGeoConfig } from '../geo'

/** Reporting defaults are display filters; they never grant commercial GEO. */
export function evidenceLocale(country: string, locale: string) {
  return locale || getGeoConfig(country.toUpperCase())?.locale.toLowerCase() || 'es-mx'
}
export const SEARCH_PROPERTY = 'sc-domain:playliva.com'
export const SEARCH_WINDOWS = [7, 14, 28] as const
export type Grain = 'total' | 'page' | 'query'
export interface SearchFact { grain: Grain; date: string; page: string; query: string; country: string; device: string; clicks: number; impressions: number; position: number }
export interface Measure { clicks: number; impressions: number; ctr: number; position: number; days: number }
export interface SearchRun { day: string; status: 'running' | 'success' | 'failed'; startedAt: string; finishedAt?: string; from?: string; to?: string; rows?: number; error?: string }
export interface Experiment {
  id: string; page: string; action: 'title'; previous: string; next: string; reason: string; startedAt: string; startDate: string;
  baseline: { from: string; to: string; measure: Measure }; evidence: Signal; measurements: { window: number; current: Measure; previous: Measure; verdict: string }[];
  status: 'pending' | 'measuring' | 'winner' | 'loser' | 'inconclusive' | 'rolled_back'; endedAt?: string;
}
export interface SeoState { enabled: boolean; revision: number; coverageFrom: string | null; newest: string | null; lastSuccess: string | null; lastEvaluation: string | null; experiments: Experiment[]; audit: { at: string; action: string; experiment?: string; page?: string; reason: string }[] }
export const emptySeoState = (): SeoState => ({ enabled: false, revision: 0, coverageFrom: null, newest: null, lastSuccess: null, lastEvaluation: null, experiments: [], audit: [] })
export const shiftDay = (date: string, days: number) => new Date(Date.parse(date + 'T00:00:00Z') + days * 86400000).toISOString().slice(0, 10)
export const googleDay = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
export function canonicalPage(value: string): string | null {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || !['playliva.com', 'www.playliva.com'].includes(url.hostname.toLowerCase()) || url.port || url.username || url.password) return null
    // Only recognized tracking parameters are safe to collapse. Facets are not new entities.
    if ([...url.searchParams.keys()].some(key => !/^(utm_[a-z_]+|gclid|fbclid|msclkid)$/i.test(key))) return null
    const path = url.pathname.replace(/\/+$/, '') || '/'
    if (!isLocaleSegment(path.split('/')[1]) || /%|\/\//.test(path)) return null
    return 'https://www.playliva.com' + path
  } catch { return null }
}
export function aggregate(rows: SearchFact[]): Measure {
  const impressions = rows.reduce((n, r) => n + r.impressions, 0), clicks = rows.reduce((n, r) => n + r.clicks, 0)
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: impressions ? rows.reduce((n, r) => n + r.position * r.impressions, 0) / impressions : 0, days: new Set(rows.filter(r => r.impressions > 0).map(r => r.date)).size }
}
export function windowMeasure(rows: SearchFact[], end: string, days: number, previous = false): Measure {
  const to = previous ? shiftDay(end, -days) : end, from = shiftDay(to, 1 - days)
  return aggregate(rows.filter(row => row.date >= from && row.date <= to))
}
export function freshness(state: SeoState, now = new Date()) {
  if (!state.lastSuccess || !state.newest) return 'unavailable'
  if (now.getTime() - Date.parse(state.lastSuccess) > 36 * 3600000 || state.newest < shiftDay(googleDay(now), -7)) return 'stale'
  return state.newest < shiftDay(googleDay(now), -1) ? 'delayed' : 'current'
}
export interface Signal { page: string; query: string; kind: string; reason: string; action: string; from: string; to: string; country: string; windows: { days: number; current: Measure; previous: Measure }[] }
export function signals(facts: SearchFact[], end: string, indexable: Set<string>, country = 'bra', locale = 'pt-br'): Signal[] {
  const groups = new Map<string, SearchFact[]>()
  for (const row of facts) {
    if (!['page', 'query'].includes(row.grain) || row.grain === 'query' && !row.query || row.country !== country || !row.page.startsWith(`https://www.playliva.com/${locale}/`) || !indexable.has(row.page)) continue
    const key = JSON.stringify([row.page, row.query]); groups.set(key, [...(groups.get(key) ?? []), row])
  }
  const result: Signal[] = []
  for (const rows of groups.values()) {
    const windows = SEARCH_WINDOWS.map(days => ({ days, current: windowMeasure(rows, end, days), previous: windowMeasure(rows, end, days, true) }))
    const c = windows[2].current, p = windows[2].previous
    if (c.impressions < 100 || c.days < 7) continue
    const add = (kind: string, reason: string, action: string) => result.push({ page: rows[0].page, query: rows[0].query, country, kind, reason, action, from: shiftDay(end, -27), to: end, windows })
    const sustained = windows.slice(0, 2).every(({ current: a, previous: b }) => a.impressions >= 100 && b.impressions >= 100 && a.days >= 5 && b.days >= 5 && a.clicks >= 5 && b.clicks >= 3 && a.impressions >= b.impressions * 1.25 && a.clicks >= b.clicks * 1.2 && a.ctr >= b.ctr * 0.95 && a.position <= b.position + 1)
    if (sustained) add('winner', 'Growth persists in both 7D and 14D: impressions ≥25% and clicks ≥20% higher, meaningful samples, CTR and rank stable or better.', 'Consider manual promotion; this is an observed association, not proof of an SEO intervention.')
    if (windows.slice(0, 2).every(({ current: a, previous: b }) => a.impressions >= 100 && b.impressions >= 100 && b.clicks >= 5 && a.clicks < b.clicks * 0.7 && a.impressions < b.impressions * 0.7)) add('declining', 'Clicks and impressions fell ≥30% in both 7D and 14D with comparable observed samples.', 'Inspect seasonality, indexing and content before changing anything.')
    if (c.position >= 4 && c.position <= 15) add('within-reach', `28D: ${c.impressions} impressions, ${c.clicks} clicks, ${(100*c.ctr).toFixed(2)}% CTR, position ${c.position.toFixed(1)}.`, 'Review relevant explanations and existing discovery links against this exact intent.')
    if (c.position >= 1 && c.position <= 15 && c.ctr < 0.02) add('low-ctr', `28D CTR ${(100*c.ctr).toFixed(2)}% at position ${c.position.toFixed(1)}; ${c.impressions} impressions across ${c.days} days. Prior CTR ${p.impressions ? (100*p.ctr).toFixed(2)+'%' : 'unknown'}.`, 'Review title relevance. Automatic editing requires substantially stronger samples and historical decline.')
  }
  return result.sort((a, b) => b.windows[2].current.impressions - a.windows[2].current.impressions || a.page.localeCompare(b.page) || a.kind.localeCompare(b.kind)).slice(0, 50)
}
export function titleCandidate(name: string) {
  const title = `${name}: como funciona e onde jogar`
  return title.length <= 62 && !/[<>\r\n]/.test(name) ? title : null
}
/** Explicit public rollout: arcade eligibility never expands to other unfinished Originals. */
export function isSearchTitleTarget(page: string) {
  return /^https:\/\/www\.playliva\.com\/pt-br\/(games\/[a-z0-9-]+|play\/rio-drift)$/.test(page)
}
export function eligibleExperiment(signal: Signal, state: SeoState, now: Date, previous: string, next: string) {
  if (!state.enabled || !['current', 'delayed'].includes(freshness(state, now)) || !state.coverageFrom || state.coverageFrom > shiftDay(signal.to, -55) || signal.query || signal.kind !== 'low-ctr' || !isSearchTitleTarget(signal.page) || signal.country !== 'bra' || previous === next) return false
  if (state.experiments.some(e => e.status === 'measuring' || e.status === 'pending' || e.page === signal.page && (e.status === 'winner' || Date.parse(e.endedAt ?? e.startedAt) > now.getTime() - 90 * 86400000))) return false
  const { current: c, previous: p } = signal.windows[2]
  return c.impressions >= 1000 && p.impressions >= 1000 && c.days >= 21 && p.days >= 21 && p.clicks >= 20 && c.ctr < p.ctr * 0.7 && Math.abs(c.position - p.position) <= 2 && signal.windows.slice(0,2).every(w => w.current.impressions >= 200 && w.previous.impressions >= 200 && w.current.ctr < w.previous.ctr * 0.7)
}
export function measureExperiment(experiment: Experiment, facts: SearchFact[], end: string, now: Date): Experiment {
  if (experiment.status !== 'measuring') return experiment
  const rows = facts.filter(row => row.grain === 'page' && row.page === experiment.page && row.country === 'bra')
  const measurements = SEARCH_WINDOWS.filter(days => shiftDay(experiment.startDate, days - 1) <= end).map(days => {
    // Keep the recorded final-data baseline fixed. Never include the edit day
    // or silently move the comparison forward as Google's lag catches up.
    const current = windowMeasure(rows, shiftDay(experiment.startDate, days - 1), days), previous = windowMeasure(rows, experiment.baseline.to, days)
    const sufficient = current.impressions >= 1000 && previous.impressions >= 1000 && previous.clicks >= 20 && current.days >= Math.min(5, days) && previous.days >= Math.min(5, days) && Math.abs(current.position - previous.position) <= 2
    const verdict = !sufficient ? 'insufficient' : current.ctr < previous.ctr * 0.7 && current.clicks < previous.clicks * 0.7 ? 'negative' : current.ctr > previous.ctr * 1.2 && current.clicks > previous.clicks * 1.2 ? 'positive' : 'neutral'
    return { window: days, current, previous, verdict }
  })
  const sustainedLoss = measurements.some(m=>m.window===7&&m.verdict==='negative') && measurements.some(m=>m.window===14&&m.verdict==='negative')
  const last = measurements.find(m=>m.window===28)
  const status = sustainedLoss ? 'rolled_back' : last ? last.verdict === 'positive' && measurements.find(m=>m.window===14)?.verdict === 'positive' ? 'winner' : 'inconclusive' : 'measuring'
  return { ...experiment, measurements, status, ...(status !== 'measuring' ? { endedAt: now.toISOString() } : {}) }
}
