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
import { attributionPayload } from './attribution'
import { commercialContext } from './commercial-context'

export type TrackEventName =
  | 'content_view'
  | 'discovery_search'
  | 'discovery_click'
  | 'provider_view'
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
  | 'demo_cashout'
  | 'demo_crash'
  | 'demo_slot_win'
  | 'demo_bonus_trigger'
  | 'demo_free_spin_start'
  | 'demo_bonus_complete'
  | 'demo_bonus_retrigger'
  | 'demo_streak_increase'
  | 'demo_sound_toggle'
  | 'demo_table_action'
  | 'demo_table_feature'
  | 'demo_table_result'

export type PageType =
  | 'provider'
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
  campaignKey?: string
  provider?: string
  taxonomy?: string
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
  /** Free-play gameplay context: coarse labels only (e.g. "2-5x", "big", "8", "on"). */
  multiplierBucket?: string
  winTier?: string
  spinsAwarded?: string
  streakLevel?: string
  soundState?: string
  rows?: string
  risk?: string
}

const EVENTS: readonly TrackEventName[] = ['content_view', 'discovery_search', 'discovery_click', 'provider_view', 'page_view', 'game_view', 'comparison_view',
  'category_view', 'where_to_play_view', 'operator_view', 'affiliate_impression',
  'affiliate_click', 'free_play_open', 'demo_round_start', 'demo_round_complete',
  'demo_balance_reset', 'play_real_view', 'play_real_click', 'offer_impression', 'offer_dismiss',
  'demo_cashout', 'demo_crash', 'demo_slot_win', 'demo_bonus_trigger', 'demo_free_spin_start',
  'demo_bonus_complete', 'demo_bonus_retrigger', 'demo_streak_increase', 'demo_sound_toggle', 'demo_table_action', 'demo_table_feature', 'demo_table_result']
const CONTEXT_FIELDS = ['campaignKey', 'provider', 'taxonomy', 'country', 'language', 'pageType', 'pageSlug', 'gameId', 'gameSlug',
  'matchId', 'matchSlug', 'category', 'operatorId', 'operatorSlug', 'offerId', 'ctaLocation',
  'placement', 'destination', 'originalId', 'roundId', 'promoId', 'brand', 'surface',
  'trafficSource', 'utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm',
  'completedCycleNumber', 'triggerMultiple', 'exposureNumber',
  'multiplierBucket', 'winTier', 'spinsAwarded', 'streakLevel', 'soundState', 'rows', 'risk'] as const
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
  if (typeof document !== 'undefined' && document.querySelector('[data-owner-geo-preview]')) return
  if (typeof window === 'undefined' || !hasAnalyticsConsent() || !EVENTS.includes(event)) return
  const data: Record<string, unknown> = {
    event,
    timestamp: new Date().toISOString(),
    device: getDeviceClass(),
    ...sanitizeTrackPayload({ ...attributionPayload(), ...payload, ...commercialContext(window.location.pathname, payload.placement) }, window.location.pathname),
  }

  // One activation, one random event receipt. A transport retry reuses its ID.
  // No visitor ID, query string, partner URL, IP or referrer is sent.
  // The first-party feed accepts the canonical discovery inventory only. Legal
  // templates, archive pages and other noindex documents are outside that feed.
  const noindex = typeof document !== 'undefined' && /\bnoindex\b/i.test(document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '')
  // Filtered Games views still belong to the same canonical Games route.
  const canonicalGamesView = /^\/(en|pt-br|es-mx)\/games$/.test(window.location.pathname)
  if ((!noindex || canonicalGamesView) && ['page_view', 'content_view', 'demo_round_start', 'demo_round_complete', 'affiliate_impression', 'offer_impression', 'affiliate_click'].includes(event) && typeof window.fetch === 'function') {
    const body = JSON.stringify({ id: window.crypto.randomUUID(), ...data, event: event === 'offer_impression' ? 'affiliate_impression' : event })
    const send = () => window.fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true, credentials: 'same-origin' })
    void send().then(response => { if (response.status >= 500 && hasAnalyticsConsent()) return send(); return response }).catch(() => { /* Measurement never interrupts navigation. */ })
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
