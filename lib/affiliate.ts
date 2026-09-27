/**
 * Centralized affiliate routing.
 *
 * External affiliate URLs are never hard-coded into components or rendered
 * as visible text/links. Components build an internal `/go` href and the
 * route handler resolves the correct GEO-specific destination, rejecting
 * inactive operators or unsupported markets.
 */

import { getOperator, getOperatorById, getOffers, getPublicOperators,
  isAffiliateEligible, isOfferEligible, isCategorySlug, affiliateGameSlug, affiliateCategory,
  type AffiliateContext } from './data'
import type { CountryCode } from './types'
import { DEFAULT_LOCALE_SEGMENT, isLocaleSegment, localeToSegment } from './locale'

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
    (acc, [token, value]) => acc.split(token).join(encodeURIComponent(value)),
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
  if (!filled) return baseUrl
  const url = new URL(baseUrl)
  new URLSearchParams(filled).forEach((value, key) => url.searchParams.append(key, value))
  return url.toString()
}

/**
 * Resolve a configured destination reference for an operator/offer + market.
 * Private campaign keys become URLs only in the server-side /go adapter.
 * Returns null when the destination is missing, inactive, or the market is
 * not supported — callers must handle a graceful fallback.
 */
export function resolveDestination(params: AffiliateContext & {
  operatorSlug?: string | null
  offerId?: string | null
  country: CountryCode
  language?: string | null
  /** Gates optional measurement only, never configured functional partner attribution. */
  analyticsAllowed?: boolean
}): ResolvedDestination | null {
  const { operatorSlug, offerId, country, analyticsAllowed = false, ...context } = params
  const gameSlug = affiliateGameSlug(context)
  const category = affiliateCategory(context)
  const ctx = { ...context, gameSlug }

  // Offer-based resolution (validate the offer is live and verified in this market).
  if (offerId) {
    const offer = getOffers(country).find(
      (o) => o.id === offerId && isOfferEligible(o, country, context),
    )
    if (offer) {
      const operator = getOperatorById(offer.operatorId)
      if (operatorSlug && operatorSlug !== operator?.slug) return null
      const url = withTrackingTemplate(
        withTrackingTemplate(offer.affiliateUrl, operator?.trackingTemplate?.[country], { geo: country, ...ctx }),
        analyticsAllowed ? operator?.analyticsTrackingTemplate?.[country] : undefined,
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
    if (!operator || !isAffiliateEligible(operator, country, context)) return null
    // A category-specific destination (e.g. crash, live-casino) takes
    // priority over the generic destination when the operator has an
    // explicit link for it in this market; otherwise fall back to the
    // generic `affiliateUrl`.
    const categoryUrl = category && isCategorySlug(category)
      ? operator.categoryAffiliateUrl?.[category]?.[country]
      : undefined
    const baseUrl = categoryUrl ?? operator.affiliateUrl[country]
    if (!baseUrl) return null
    const url = withTrackingTemplate(
      withTrackingTemplate(baseUrl, operator.trackingTemplate?.[country], { geo: country, ...ctx }),
      analyticsAllowed ? operator.analyticsTrackingTemplate?.[country] : undefined,
      { geo: country, ...ctx },
    )
    return { url, operatorId: operator.id, operatorSlug: operator.slug }
  }

  return null
}

/** Never interpolate an untrusted operator into a fallback path. */
export function affiliateFallbackPath(params: {
  operatorSlug?: string | null
  language?: string | null
  cookieLocale?: string | null
}): string {
  const language = params.language
  const segment = language && isLocaleSegment(language) ? language
    : language === 'pt-BR' || language === 'es-MX' ? localeToSegment(language)
    : params.cookieLocale && isLocaleSegment(params.cookieLocale) ? params.cookieLocale
    : DEFAULT_LOCALE_SEGMENT
  const operator = getPublicOperators().find((o) => o.slug === params.operatorSlug)
  const path = operator ? `/operators/${encodeURIComponent(operator.slug)}`
    : params.operatorSlug ? '/operators' : '/offers'
  return `/${segment}${path}`
}
