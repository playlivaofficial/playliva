import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  DEFAULT_LOCALE_SEGMENT,
  detectRootLocaleSegment,
  isLocaleSegment,
} from '@/lib/locale'

const LOCALE_COOKIE = 'playliva_locale'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const segments = pathname.split('/')
  const firstSegment = segments[1] ?? ''

  // Private owner routing has its own server-side page and API authorization.
  if (firstSegment === 'owner') {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
    response.headers.set('Cache-Control', 'private, no-store, max-age=0')
    response.headers.set('Referrer-Policy', 'no-referrer')
    return response
  }

  // Liva Ginga migration: exact legacy game path only, preserving locale and
  // the original query (including social UTMs), without a duplicate index page.
  const legacyFootball = pathname.match(/^\/(?:(en|pt-br|es-mx|es-co|es-pe)\/)?play\/embaixadinha\/?$/)
  if (legacyFootball) {
    const url = request.nextUrl.clone()
    url.pathname = `/${legacyFootball[1] ?? DEFAULT_LOCALE_SEGMENT}/play/liva-ginga`
    return NextResponse.redirect(url, 301)
  }

  // Already locale-prefixed: pass through, but forward the segment as a
  // request header so `app/[locale]/layout.tsx` can set `<html lang>`
  // server-side without re-deriving it from params in every consumer.
  if (isLocaleSegment(firstSegment)) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-locale', firstSegment)
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set('x-locale', firstSegment)
    return response
  }

  // Bare root: honor an explicit language preference, then seed regional
  // Spanish from trusted request GEO. This is the only visitor-dependent redirect — it only ever
  // targets locale-prefixed URLs, which short-circuit above, so it cannot
  // loop.
  if (pathname === '/') {
    const target = detectRootLocaleSegment({
      cookieLocale: request.cookies.get(LOCALE_COOKIE)?.value,
      acceptLanguage: request.headers.get('accept-language'),
      country: request.headers.get('x-vercel-ip-country'),
    })
    const url = request.nextUrl.clone()
    url.pathname = `/${target}`
    const response = NextResponse.redirect(url, 302)
    response.headers.set('Cache-Control', 'private, no-store')
    response.headers.set('Vary', 'Accept-Language, Cookie, X-Vercel-IP-Country')
    return response
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
     * - /dev (internal, development-only tooling, never locale-prefixed)
     * - /api
     * - /_next (static/image optimization internals)
     * - /sitemap.xml, /robots.txt, /manifest.webmanifest and similar
     *   top-level special files
     * - any request for a file with an extension (favicon, images, etc.)
     */
    '/((?!go|dev|api|_next|sitemap.xml|robots.txt|manifest.webmanifest|.*\\..*).*)',
  ],
}
