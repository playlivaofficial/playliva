import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  DEFAULT_LOCALE_SEGMENT,
  detectLocaleSegmentFromAcceptLanguage,
  isLocaleSegment,
} from '@/lib/locale'

const LOCALE_COOKIE = 'playliva_locale'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const segments = pathname.split('/')
  const firstSegment = segments[1] ?? ''

  // Already locale-prefixed: pass through, but forward the segment as a
  // request header so `app/[locale]/layout.tsx` can set `<html lang>`
  // server-side without re-deriving it from params in every consumer.
  if (isLocaleSegment(firstSegment)) {
    const response = NextResponse.next()
    response.headers.set('x-locale', firstSegment)
    return response
  }

  // Bare root: redirect to a *detected* locale (cookie → Accept-Language →
  // default). This is the only visitor-dependent redirect — it only ever
  // targets locale-prefixed URLs, which short-circuit above, so it cannot
  // loop.
  if (pathname === '/') {
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value
    const target = isLocaleSegment(cookieLocale ?? '')
      ? (cookieLocale as string)
      : detectLocaleSegmentFromAcceptLanguage(request.headers.get('accept-language'))
    const url = request.nextUrl.clone()
    url.pathname = `/${target}`
    return NextResponse.redirect(url, 302)
  }

  // Any other non-locale path is a legacy URL (old bookmarks/links, e.g.
  // `/games/aviator`) — permanently redirect to the default locale's
  // equivalent path. Deterministic target (not visitor-detected) for
  // cache-friendliness, and a 308 tells search engines to drop the old URL
  // from the index in favor of the new one.
  const url = request.nextUrl.clone()
  url.pathname = `/${DEFAULT_LOCALE_SEGMENT}${pathname}`
  return NextResponse.redirect(url, 308)
}

export const config = {
  matcher: [
    /*
     * Match everything except:
     * - /go (tracked affiliate redirect, never locale-prefixed)
     * - /api
     * - /_next (static/image optimization internals)
     * - /sitemap.xml, /robots.txt, /manifest.webmanifest and similar
     *   top-level special files
     * - any request for a file with an extension (favicon, images, etc.)
     */
    '/((?!go|api|_next|sitemap.xml|robots.txt|manifest.webmanifest|.*\\..*).*)',
  ],
}
