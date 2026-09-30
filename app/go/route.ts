import { NextResponse, type NextRequest } from 'next/server'
import { affiliateFallbackPath, resolveDestination } from '@/lib/affiliate'
import { ANALYTICS_COOKIE } from '@/lib/consent'
import { COUNTRIES } from '@/lib/data'
import type { CountryCode } from '@/lib/types'
import { commercialMarket } from '@/lib/owner/server/geo-preview'
import { serverDestination } from '@/lib/affiliates/server-destinations'

/**
 * `/go` is disallowed in `robots.ts`, but that only stops crawling — a
 * search engine that discovers the URL some other way (an external link,
 * a referrer log) could still index the redirect response itself. Setting
 * `X-Robots-Tag` directly on every response here is a second, independent
 * signal that holds regardless of how the URL was found.
 */
function redirect(url: string) {
  const response = NextResponse.redirect(url, { status: 302 })
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  response.headers.set('Cache-Control', 'private, no-store')
  return response
}

/**
 * Tracked affiliate redirect endpoint.
 *
 * Resolves the correct GEO-specific affiliate URL server-side, rejecting
 * inactive operators or unsupported markets. External URLs never appear in
 * the client DOM. Client-side context (page type, game, CTA) is captured by
 * the consented tracking layer before navigation; here we resolve the partner
 * destination and redirect, preserving functional attribution without consent.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl

  const country = searchParams.get('country') as CountryCode | null
  const operatorSlug = searchParams.get('operator')
  const offerId = searchParams.get('offer')

  const validCountry =
    country && COUNTRIES.some((c) => c.code === country) ? country : null

  const language = searchParams.get('language') ?? undefined
  const fallback = new URL(affiliateFallbackPath({
    operatorSlug,
    language,
    cookieLocale: request.cookies.get('playliva_locale')?.value,
  }), origin).toString()

  if (!validCountry || await commercialMarket(request.headers) !== validCountry) {
    return redirect(fallback)
  }

  const pageType = searchParams.get('page') ?? undefined
  const pageSlug = searchParams.get('pageSlug') ?? undefined
  const gameSlug = searchParams.get('game') ?? undefined
  const matchSlug = searchParams.get('match') ?? undefined
  const placement = searchParams.get('placement') ?? searchParams.get('cta') ?? undefined
  const category = searchParams.get('category') ?? undefined

  const destination = resolveDestination({
    operatorSlug,
    offerId,
    country: validCountry,
    language,
    pageType,
    pageSlug,
    gameSlug,
    matchSlug,
    placement,
    category,
    analyticsAllowed: request.cookies.get(ANALYTICS_COOKIE)?.value === 'granted',
  })

  if (!destination) {
    return redirect(fallback)
  }

  // Partner attribution is functional without analytics. Optional measurement
  // requires consent; do not duplicate client events in unconditional server logs.
  const target = serverDestination(destination.url)
  return redirect(target ?? fallback)
}
