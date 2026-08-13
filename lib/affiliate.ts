/**
 * Centralized affiliate routing.
 *
 * External affiliate URLs are never hard-coded into components or rendered
 * as visible text/links. Components build an internal `/go` href and the
 * route handler resolves the correct GEO-specific destination, rejecting
 * inactive operators or unsupported markets.
 */

import { getOperator, getOperatorById, getOffers } from './data'
import type { CountryCode } from './types'

export interface GoParams {
  /** Operator slug (preferred) */
  operator?: string
  /** Offer id (used on the offers surface) */
  offer?: string
  country: CountryCode
  /** Visitor's current UI language, forwarded for tracking only. */
  language?: string
  /** Optional context, forwarded for tracking only. */
  game?: string
  /** Sports fixture slug, forwarded for tracking only. */
  match?: string
  category?: string
  page?: string
  /** Editorial page slug (e.g. game slug, best-list slug), for tracking only. */
  pageSlug?: string
  cta?: string
  /** CTA placement label, e.g. "where-to-play", "operator_hero". */
  placement?: string
}

/** Build the internal tracked-redirect href. Pure — safe on client/server. */
export function buildGoHref(params: GoParams): string {
  const sp = new URLSearchParams()
  sp.set('country', params.country)
  if (params.operator) sp.set('operator', params.operator)
  if (params.offer) sp.set('offer', params.offer)
  if (params.language) sp.set('language', params.language)
  if (params.game) sp.set('game', params.game)
  if (params.match) sp.set('match', params.match)
  if (params.category) sp.set('category', params.category)
  if (params.page) sp.set('page', params.page)
  if (params.pageSlug) sp.set('pageSlug', params.pageSlug)
  if (params.cta) sp.set('cta', params.cta)
  if (params.placement) sp.set('placement', params.placement)
  return `/go?${sp.toString()}`
}

export interface ResolvedDestination {
  url: string
  operatorId?: string
  operatorSlug?: string
  offerId?: string
}

/**
 * Fill a tracking-template string with the current redirect context.
 * Supported tokens: {geo} {language} {pageType} {pageSlug} {gameSlug}
 * {matchSlug} {placement}. Unmatched tokens are left as-is rather than
 * throwing, so a partial template never breaks a redirect.
 */
function applyTrackingTemplate(
  template: string,
  ctx: {
    geo: CountryCode
    language?: string | null
    pageType?: string | null
    pageSlug?: string | null
    gameSlug?: string | null
    matchSlug?: string | null
    placement?: string | null
  },
): string {
  const tokens: Record<string, string> = {
    '{geo}': ctx.geo,
    '{language}': ctx.language ?? '',
    '{pageType}': ctx.pageType ?? '',
    '{pageSlug}': ctx.pageSlug ?? '',
    '{gameSlug}': ctx.gameSlug ?? '',
    '{matchSlug}': ctx.matchSlug ?? '',
    '{placement}': ctx.placement ?? '',
  }
  return Object.entries(tokens).reduce(
    (acc, [token, value]) => acc.split(token).join(value),
    template,
  )
}

/** Append a tracking-template query string to a base destination URL. */
function withTrackingTemplate(
  baseUrl: string,
  template: string | undefined,
  ctx: Parameters<typeof applyTrackingTemplate>[1],
): string {
  if (!template) return baseUrl
  const filled = applyTrackingTemplate(template, ctx)
  const separator = baseUrl.includes('?') ? '&' : '?'
  return filled ? `${baseUrl}${separator}${filled}` : baseUrl
}

/**
 * Resolve the final affiliate URL for a given operator/offer + market.
 * Returns null when the destination is missing, inactive, or the market is
 * not supported — callers must handle a graceful fallback.
 */
export function resolveDestination(params: {
  operatorSlug?: string | null
  offerId?: string | null
  country: CountryCode
  language?: string | null
  pageType?: string | null
  pageSlug?: string | null
  gameSlug?: string | null
  matchSlug?: string | null
  placement?: string | null
}): ResolvedDestination | null {
  const { operatorSlug, offerId, country, ...ctx } = params

  // Offer-based resolution (validate the offer is live and verified in this market).
  if (offerId) {
    const offer = getOffers(country).find(
      (o) => o.id === offerId && o.active && o.status === 'verified',
    )
    if (offer) {
      const operator = getOperatorById(offer.operatorId)
      // Defense in depth: same explicit cross-check as `getPublicOffers` —
      // never redirect to an offer the linked operator hasn't confirmed.
      if (
        operator?.verifiedOffers &&
        !operator.verifiedOffers.includes(offer.id)
      ) {
        return null
      }
      const url = withTrackingTemplate(
        offer.affiliateUrl,
        operator?.trackingTemplate?.[country],
        { geo: country, ...ctx },
      )
      return {
        url,
        offerId: offer.id,
        operatorId: offer.operatorId,
      }
    }
    return null
  }

  // Operator-based resolution.
  if (operatorSlug) {
    const operator = getOperator(operatorSlug)
    if (!operator || !operator.active || operator.affiliateStatus !== 'approved')
      return null
    if (!operator.countries.includes(country)) return null
    const baseUrl = operator.affiliateUrl[country]
    if (!baseUrl) return null
    const url = withTrackingTemplate(
      baseUrl,
      operator.trackingTemplate?.[country],
      { geo: country, ...ctx },
    )
    return { url, operatorId: operator.id, operatorSlug: operator.slug }
  }

  return null
}
