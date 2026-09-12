/**
 * Lightweight, analytics-agnostic tracking layer.
 *
 * Events are pushed to `window.dataLayer` (GTM-compatible) and, in
 * development, logged for inspection. This is the single integration point
 * for future analytics/attribution: GEO → page → game → operator →
 * affiliate click → (later) registration → FTD → revenue.
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
  [key: string]: unknown
}

/** Best-effort device class, derived client-side only — never fingerprinting. */
function getDeviceClass(): 'mobile' | 'desktop' | undefined {
  if (typeof navigator === 'undefined') return undefined
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    ? 'mobile'
    : 'desktop'
}

export function track(event: TrackEventName, payload: TrackPayload = {}): void {
  if (typeof window === 'undefined' || !hasAnalyticsConsent()) return
  const data: Record<string, unknown> = {
    event,
    timestamp: new Date().toISOString(),
    device: getDeviceClass(),
    ...payload,
  }

  if (typeof window !== 'undefined') {
    if (!payload.url) data.url = window.location.pathname + window.location.search
    window.dataLayer = window.dataLayer ?? []
    window.dataLayer.push(data)
    window.gtag?.('event', event, data)
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[v0] track', event, data)
  }
}
