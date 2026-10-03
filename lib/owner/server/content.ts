import { randomUUID } from 'node:crypto'
import { CONTENT_STATES, type ContentItem, type OwnerState } from '../model'
import { ownerGames, publishedInventory } from './catalog'
import { logActivity, updateOwnerState } from './store'
import type { Creative } from '../model'
import type { Opportunity } from '../metrics'
import { isLocaleSegment } from '@/lib/locale'

export function contentPipeline(state: OwnerState, creatives: Creative[], opportunities: Opportunity[]): ContentItem[] {
  const inventory = publishedInventory()
  const next: ContentItem[] = ownerGames.filter(game => !creatives.some(item => item.gameSlug === game.slug)).map(game => ({ id: `social-${game.slug}`, type: 'Social opportunity', locale: 'pt-br', topic: game.title, query: '', route: `/pt-br${game.route}`, status: 'opportunity', reason: `This live Original has no creative in the imported ${creatives.length}-item Shorts library.`, updatedAt: null, source: 'Catalog compared with Social Engine inventory' }))
  const seo: ContentItem[] = opportunities.map(item => ({ id: `seo-${item.id}`, type: 'SEO opportunity', locale: new URL(item.route || 'https://www.playliva.com/pt-br').pathname.split('/')[1], topic: item.topic, query: item.topic, route: item.route ? new URL(item.route).pathname : '', status: 'opportunity', reason: `${item.reason} ${item.action}`, updatedAt: null, source: item.source ?? 'Search Console performance rules' }))
  const rows = [...inventory, ...next, ...seo].map(item => state.content[item.id] ?? item)
  return [...rows, ...Object.values(state.content).filter(item => !rows.some(row => row.id === item.id))]
}
export async function saveContent(input: Record<string, unknown>) {
  const text = (key: string, limit = 240) => typeof input[key] === 'string' ? input[key].trim().slice(0, limit) : ''
  const status = text('status') as ContentItem['status'], topic = text('topic'), locale = text('locale'), route = text('route')
  if (!CONTENT_STATES.includes(status) || !topic || !isLocaleSegment(locale)) throw new Error('Provide a topic, supported locale and valid content state.')
  if (route && (!/^\/[a-z-]+(?:\/[a-z0-9-]+)*$/.test(route) || route.split('/')[1] !== locale)) throw new Error('Use a clean public route matching the selected locale.')
  if (status === 'published' && !publishedInventory().some(item => item.route === route)) throw new Error('Published status requires an existing sitemap page. This tool does not publish pages.')
  const id = text('id') || `plan-${randomUUID()}`
  if (!/^[a-z0-9-]{1,140}$/.test(id)) throw new Error('Invalid content ID.')
  return updateOwnerState(state => {
    const item: ContentItem = { id, type: text('type', 60) || 'Editorial plan', locale, topic, query: text('query'), route, status, reason: text('reason', 500), updatedAt: new Date().toISOString(), source: 'Owner content plan; public content is unchanged' }
    state.content[id] = item
    logActivity(state, 'content_updated', id, `${topic}: ${status}`)
    return 'Content plan saved. No public page was changed or published.'
  })
}
