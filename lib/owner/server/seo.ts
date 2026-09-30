import audit from '@/data/owner/search-console-audit.json'
import { indexingState, seoOpportunities } from '../metrics'
import { publishedInventory } from './catalog'
export { searchSource, type SearchData } from './search-report'

export function indexingAudit() {
  const known = [...audit.newPages.map(row => ({ url: row.url, state: indexingState(row.inspection, row.request), detail: row.inspection, request: row.request })), ...audit.existing.map(row => ({ url: row.url, state: indexingState(row.state), detail: `${row.state}; fetch ${row.fetch}; canonical ${row.canonical}`, request: 'No new request recorded in this audit' }))]
  return publishedInventory().map(row => {
    const url = `https://www.playliva.com${row.route}`, observation = known.find(item => item.url === url)
    return { route: row.route, locale: row.locale, topic: row.topic, url, state: observation?.state ?? 'Unknown', detail: observation?.detail ?? 'No inspection result in this imported audit.', request: observation?.request ?? 'Not recorded', observedAt: '2026-09-27', inSitemap: true }
  })
}
export const searchAudit = { property: audit.property, sitemap: audit.sitemap, observedAt: '2026-09-27', provenance: 'Manual production Search Console audit; historical snapshot, not a live indexing feed.' }
export { seoOpportunities }
