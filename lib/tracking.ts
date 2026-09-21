/**
 * Lightweight, analytics-agnostic tracking layer.
 *
 * Events are pushed to `window.dataLayer` (GTM-compatible) and, in
 * development, logged for inspection. This is the single integration point
 * for consented, privacy-minimal product measurement.
 *
 * No private/sensitive data is captured — only editorial identifiers and
 * the current context.
 */

import { hasAnalyticsConsent } from './consent'

export type TrackEventName =
  | 'page_view'
  | 'game_view'
  | 'comparison_view'
  | 'category_view'
  | 'where_to_play_view'
  | 'operator_view'
  | 'affiliate_impression'
  | 'affiliate_click'
  | 'free_play_open'
  | 'demo_round_start'
  | 'demo_round_complete'
  | 'demo_balance_reset'
  | 'play_real_view'
  | 'play_real_click'
  | 'offer_impression'
  | 'offer_dismiss'

export type PageType =
  | 'home'
  | 'games'
  | 'game'
  | 'category'
  | 'games_like'
  | 'comparison'
  | 'best_list'
  | 'where_to_play'
  | 'operators'
  | 'operator'
  | 'offers'
  | 'play'
  | 'content'

export interface TrackPayload {
  country?: string
  language?: string
  /** Legacy callers; normalized to the language field, never used as market. */
  locale?: string
  url?: string
  pageType?: PageType
  /** Editorial slug of the current page (game slug, best-list slug, etc). */
  pageSlug?: string
  gameId?: string
  gameSlug?: string
  /** Sports fixture identifier, when the context is a match. */
  matchId?: string
  matchSlug?: string
  category?: string
  operatorId?: string
  operatorSlug?: string
  offerId?: string
  ctaLocation?: string
  /** CTA/module placement label, e.g. "where-to-play", "operator_hero". */
  placement?: string
  /** A stable identifier for the destination — never the raw affiliate URL. */
  destination?: string
  originalId?: string
  roundId?: string
  /** Central promo identifier, e.g. the Betsson BR campaign id. */
  promoId?: string
  /** Partner brand key, e.g. "betsson". */
  brand?: string
  /** Funnel surface family: "originals", "discovery" or "offers". */
  surface?: string
  /** Preserved landing attribution (see `lib/attribution.ts`). */
  trafficSource?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  /** Recurring gameplay offer: cycles completed when it opened (3, 6, 9 …), as a string. */
  completedCycleNumber?: string
  /** Configured cadence, e.g. "3". */
  triggerMultiple?: string
  /** Ordinal of the exposure in the play session, as a string. */
  exposureNumber?: string
}

const EVENTS: readonly TrackEventName[] = ['page_view', 'game_view', 'comparison_view',
  'category_view', 'where_to_play_view', 'operator_view', 'affiliate_impression',
  'affiliate_click', 'free_play_open', 'demo_round_start', 'demo_round_complete',
  'demo_balance_reset', 'play_real_view', 'play_real_click', 'offer_impression', 'offer_dismiss']
const CONTEXT_FIELDS = ['country', 'language', 'pageType', 'pageSlug', 'gameId', 'gameSlug',
  'matchId', 'matchSlug', 'category', 'operatorId', 'operatorSlug', 'offerId', 'ctaLocation',
  'placement', 'destination', 'originalId', 'roundId', 'promoId', 'brand', 'surface',
  'trafficSource', 'utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm',
  'completedCycleNumber', 'triggerMultiple', 'exposureNumber'] as const
/** Campaign identifiers may contain dots (e.g. "reels.br"); still no spaces, slashes or free text. */
const ATTRIBUTION_FIELDS: readonly string[] = ['trafficSource', 'utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm']

/** Never collect search terms, query strings, fragments, full URLs or free text. */
export function analyticsPath(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const path = value.split(/[?#]/, 1)[0]
  return /^\/(?:[a-z0-9-]+\/)*[a-z0-9-]*$/.test(path) && path.length <= 240 ? path : undefined
}

export function sanitizeTrackPayload(payload: TrackPayload, currentPath: string): Record<string, string> {
  const safe: Record<string, string> = {}
  for (const key of CONTEXT_FIELDS) {
    const value = payload[key]
    const pattern = key === 'gameId' ? /^[a-zA-Z0-9][a-zA-Z0-9_+-]{0,99}$/
      : ATTRIBUTION_FIELDS.includes(key) ? /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}$/
      : /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/
    if (typeof value === 'string' && pattern.test(value)) safe[key] = value
  }
  if (!safe.language && typeof payload.locale === 'string' && ['en', 'pt-BR', 'es-MX'].includes(payload.locale)) safe.language = payload.locale
  const path = analyticsPath(payload.url) ?? analyticsPath(currentPath)
  if (path) safe.url = path
  return safe
}

/** Best-effort device class, derived client-side only — never fingerprinting. */
export function getDeviceClass(): 'mobile' | 'desktop' | undefined {
  if (typeof navigator === 'undefined') return undefined
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    ? 'mobile'
    : 'desktop'
}

export function track(event: TrackEventName, payload: TrackPayload = {}): void {
  if (typeof window === 'undefined' || !hasAnalyticsConsent() || !EVENTS.includes(event)) return
  const data: Record<string, unknown> = {
    event,
    timestamp: new Date().toISOString(),
    device: getDeviceClass(),
    ...sanitizeTrackPayload(payload, window.location.pathname),
  }

  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push(data)
    window.gtag?.('event', event, { ...data,
      page_location: `${window.location.origin}${data.url ?? '/'}`, page_referrer: '',
    })
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[v0] track', event, data)
  }
}
