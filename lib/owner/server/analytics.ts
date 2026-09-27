import { readLocalText } from './local-files'
import { resolve } from 'node:path'
import { localEnabled } from './store'
import type { Source } from '../model'
import type { MetricEvent } from '../metrics'
export interface AnalyticsData { events: MetricEvent[]; from: string; to: string }
/** Existing consented tracking has no server event database. Accept only explicitly supplied, dated exports. */
export async function analyticsSource(): Promise<Source<AnalyticsData>> {
  const empty = { events: [], from: '', to: '' }
  if (!localEnabled() || !process.env.OWNER_ANALYTICS_EXPORT) return { state: 'not_connected', label: 'Traffic & affiliate event data', detail: 'The public consented event layer exists. No readable analytics reporting source or historical event export is connected.', data: empty }
  try {
    const input = JSON.parse(await readLocalText(resolve(process.env.OWNER_ANALYTICS_EXPORT)))
    if (!input.source || !/^\d{4}-\d{2}-\d{2}$/.test(input.from) || !/^\d{4}-\d{2}-\d{2}$/.test(input.to) || !Array.isArray(input.events) || input.events.length > 100000) throw new Error('Invalid export')
    const dimensions = ['route', 'game', 'locale', 'operator', 'placement', 'geo', 'device', 'source', 'utmContent'] as const
    const events: MetricEvent[] = input.events.map((row: Record<string, unknown>) => {
      if (typeof row.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || typeof row.event !== 'string' || !['page_view', 'demo_round_start', 'demo_round_complete', 'affiliate_impression', 'offer_impression', 'affiliate_click'].includes(row.event) || typeof row.count !== 'number' || !Number.isSafeInteger(row.count) || row.count < 0) throw new Error('Invalid event')
      return { date: row.date, event: row.event, count: row.count, ...Object.fromEntries(dimensions.map(key => [key, typeof row[key] === 'string' ? row[key].slice(0, 240) : ''])) } as MetricEvent
    })
    return { state: events.length ? 'connected' : 'no_data', label: String(input.source).slice(0, 120), detail: `Dated export coverage: ${input.from} to ${input.to}. Event counts are not unique visitors or an attributed conversion cohort.`, observedAt: input.exportedAt, data: { events, from: input.from, to: input.to } }
  } catch { return { state: 'unavailable', label: 'Analytics export', detail: 'The supplied report is unreadable or invalid. No counts have been inferred.', data: empty } }
}
