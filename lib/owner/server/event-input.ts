import { isAffiliateEligible } from '@/lib/data'
import { catalogSummaries } from '@/lib/catalog'
import { commercialContext } from '@/lib/commercial-context'
import { sanitizeTrackPayload, type TrackPayload } from '@/lib/tracking'
import type { MetricEvent } from '../metrics'
import { visitorMarket } from '@/lib/visitor-market'
import { SPOTLIGHT_GAMES } from '@/lib/home/spotlight'
import { commercialSnapshot } from '@/lib/commercial/server'
import { parseCommercialReference } from '@/lib/commercial/references'
import type { CommercialSnapshot } from '@/lib/commercial/types'
import { isMeasuredPublicRoute } from './event-routes'

const games = new Map(catalogSummaries('en').map(game => [game.slug, game]))
const events = ['page_view', 'content_view', 'demo_round_start', 'demo_round_complete', 'affiliate_impression', 'affiliate_click']

/** Treat public submissions as untrusted. Discard all unrecognized fields. */
export function eventInput(input: unknown, headers: Headers, now = Date.now(), commercial: CommercialSnapshot = commercialSnapshot(visitorMarket(headers))): { id: string; dimensions: Omit<MetricEvent, 'date' | 'count'> } | null {
  if (!input || typeof input !== 'object') return null
  const row = input as Record<string, unknown>
  if (typeof row.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(row.id) ||
    typeof row.event !== 'string' || !events.includes(row.event) || typeof row.timestamp !== 'string' ||
    !Number.isFinite(Date.parse(row.timestamp)) || Math.abs(now - Date.parse(row.timestamp)) > 300000 ||
    typeof row.url !== 'string' || !isMeasuredPublicRoute(row.url, commercial)) return null
  const safe = sanitizeTrackPayload(row as TrackPayload, row.url)
  const context = commercialContext(row.url, safe.placement)
  const gameSlug = context.gameSlug ?? (games.has(safe.gameSlug) ? safe.gameSlug : '')
  const game = games.get(gameSlug)
  const original = context.pageType === 'play' ? SPOTLIGHT_GAMES.find(item => item.slug === context.gameSlug) : undefined
  const market = visitorMarket(headers)
  const operator = safe.operatorSlug ? commercial.operators.find(operator => operator.slug === safe.operatorSlug) : undefined
  const reference = market && operator ? parseCommercialReference(operator.affiliateUrl[market]) : null
  const campaign = safe.promoId ? commercial.campaigns.find(campaign => campaign.id === safe.promoId && campaign.operatorId === operator?.id && campaign.geo === market) : undefined
  if (row.event.startsWith('affiliate_') && (!safe.placement || !operator || !market || commercial.geo !== market ||
    !isAffiliateEligible(operator, market) || !reference || reference.operatorId !== operator.id || reference.geo !== market ||
    reference.campaignKey !== safe.campaignKey || safe.promoId && (!campaign || !campaign.approved || !campaign.active || !campaign.placements.includes(safe.placement)))) return null
  const geo = headers.get('x-vercel-ip-country')?.toUpperCase() ?? ''
  return { id: row.id, dimensions: {
    event: row.event, route: row.url, game: gameSlug, locale: context.language,
    operator: operator?.slug ?? '', placement: safe.placement ?? '', geo: /^[A-Z]{2}$/.test(geo) ? geo : 'unknown',
    device: row.device === 'mobile' ? 'mobile' : row.device === 'desktop' ? 'desktop' : 'unknown',
    source: safe.trafficSource ?? 'direct', utmContent: safe.utmContent ?? '', campaign: safe.utmCampaign ?? '',
    partnerCampaign: reference?.campaignKey ?? '', cta: safe.ctaLocation ?? '', currency: market && commercial.geo === market ? commercial.currency ?? '' : '',
    platform: ['tiktok', 'instagram', 'youtube'].includes(safe.utmSource ?? safe.trafficSource) ? safe.utmSource ?? safe.trafficSource : '',
    pageFamily: context.pageType, taxonomy: context.taxonomy, provider: game?.providerId ?? (original ? 'playliva' : context.provider ?? ''),
    category: game?.category ?? original?.category.en.toLowerCase().replaceAll(' ', '-') ?? context.category ?? safe.category ?? '',
  } }
}
