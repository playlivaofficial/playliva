import { NextResponse, type NextRequest } from 'next/server'
import { resolveDestination } from '@/lib/affiliate'
import { COUNTRIES } from '@/lib/data'
import type { CountryCode } from '@/lib/types'

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
  return response
}

/**
 * Tracked affiliate redirect endpoint.
 *
 * Resolves the correct GEO-specific affiliate URL server-side, rejecting
 * inactive operators or unsupported markets. External URLs never appear in
 * the client DOM. Client-side context (page type, game, CTA) is captured by
 * the tracking layer before navigation; here we log a server-side record and
 * redirect.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl

  const country = searchParams.get('country') as CountryCode | null
  const operatorSlug = searchParams.get('operator')
  const offerId = searchParams.get('offer')

  const validCountry =
    country && COUNTRIES.some((c) => c.code === country) ? country : null

  // Graceful fallback target when we cannot resolve a valid destination.
  const fallback = operatorSlug
    ? `${origin}/operators/${operatorSlug}`
    : `${origin}/offers`

  if (!validCountry) {
    return redirect(fallback)
  }

  const language = searchParams.get('language') ?? undefined
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
  })

  if (!destination) {
    return redirect(fallback)
  }

  // Server-side attribution record for the `affiliate_click` event (kept
  // minimal; no sensitive/personal data — only editorial identifiers and
  // the current context, GTM/GA4-compatible shape).
  console.log('[v0] affiliate_click', {
    timestamp: new Date().toISOString(),
    geo: validCountry,
    language,
    page: pageType,
    pageSlug,
    game: gameSlug,
    match: matchSlug,
    category,
    operatorId: destination.operatorId,
    offerId: destination.offerId,
    placement,
    device: request.headers.get('user-agent') ?? undefined,
  })

  return redirect(destination.url)
}
