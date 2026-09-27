import sitemap from '@/app/sitemap'
import { getOperator, isAffiliateEligible } from '@/lib/data'
import { catalogSummaries } from '@/lib/catalog'
import { commercialContext } from '@/lib/commercial-context'
import { sanitizeTrackPayload, type TrackPayload } from '@/lib/tracking'
import type { MetricEvent } from '../metrics'
import { visitorMarket } from '@/lib/visitor-market'
import { SPOTLIGHT_GAMES } from '@/lib/home/spotlight'
import { PRIVATE_CAMPAIGNS } from '@/lib/affiliates/campaign-references'

const routes = new Set(sitemap().map(row => new URL(row.url).pathname))
const games = new Map(catalogSummaries('en').map(game => [game.slug, game]))
const events = ['page_view', 'content_view', 'demo_round_start', 'demo_round_complete', 'affiliate_impression', 'affiliate_click']

/** Treat public submissions as untrusted. Discard all unrecognized fields. */
export function eventInput(input: unknown, headers: Headers, now = Date.now()): { id: string; dimensions: Omit<MetricEvent, 'date' | 'count'> } | null {
  if (!input || typeof input !== 'object') return null
  const row = input as Record<string, unknown>
  if (typeof row.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(row.id) ||
    typeof row.event !== 'string' || !events.includes(row.event) || typeof row.timestamp !== 'string' ||
    !Number.isFinite(Date.parse(row.timestamp)) || Math.abs(now - Date.parse(row.timestamp)) > 300000 ||
    typeof row.url !== 'string' || !routes.has(row.url)) return null
  const safe = sanitizeTrackPayload(row as TrackPayload, row.url)
  const context = commercialContext(row.url, safe.placement)
  const gameSlug = context.gameSlug ?? (games.has(safe.gameSlug) ? safe.gameSlug : '')
  const game = games.get(gameSlug)
  const original = context.pageType === 'play' ? SPOTLIGHT_GAMES.find(item => item.slug === context.gameSlug) : undefined
  const operator = safe.operatorSlug ? getOperator(safe.operatorSlug) : undefined
  if (row.event.startsWith('affiliate_') && (!safe.placement || !operator || !visitorMarket(headers) || !isAffiliateEligible(operator, visitorMarket(headers)!))) return null
  const geo = headers.get('x-vercel-ip-country')?.toUpperCase() ?? ''
  return { id: row.id, dimensions: {
    event: row.event, route: row.url, game: gameSlug, locale: context.language,
    operator: operator?.slug ?? '', placement: safe.placement ?? '', geo: /^[A-Z]{2}$/.test(geo) ? geo : 'unknown',
    device: row.device === 'mobile' ? 'mobile' : row.device === 'desktop' ? 'desktop' : 'unknown',
    source: safe.trafficSource ?? 'direct', utmContent: safe.utmContent ?? '', campaign: safe.utmCampaign ?? '',
    partnerCampaign: Object.hasOwn(PRIVATE_CAMPAIGNS, safe.campaignKey) ? safe.campaignKey : safe.promoId ?? '',
    platform: ['tiktok', 'instagram', 'youtube'].includes(safe.utmSource ?? safe.trafficSource) ? safe.utmSource ?? safe.trafficSource : '',
    pageFamily: context.pageType, taxonomy: context.taxonomy, provider: game?.providerId ?? (original ? 'playliva' : context.provider ?? ''),
    category: game?.category ?? original?.category.en.toLowerCase().replaceAll(' ', '-') ?? context.category ?? safe.category ?? '',
  } }
}
