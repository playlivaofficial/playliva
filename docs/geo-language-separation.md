# Automatic GEO and three public languages

Baseline: PR #73 / `3a9dd266584802c4cb77797a2cc66ef35d28586a`.

## Findings and correction

The public menu showed five locale choices and country flags. Offers also
mounted a public country picker. Its saved `playliva.country` value could
replace the client display country after hydration; commercial context then
required that value to equal request GEO. A stale MX preference could therefore
suppress a real Colombian visitor's approved offers. It did not authorize a
different GEO. Root negotiation also let browser EN/PT preferences override
the required Spanish first-visit default.

Owner controls are separate. Anonymous production HTML had no Owner bar and
the preview API returned 401. The authenticated browser showed the private
Real/MX/CO/PE controls. The public picker was a real defect; the authenticated
Owner bar was not evidence of public exposure.

The correction reuses the existing server GEO resolver and commercial registry:

- Public languages are exactly **Español, English, Português**, with no flags or
  country choices. Trigger/options have at least 44px tap targets.
- First visits from MX/CO/PE default to their existing Spanish SEO edition,
  regardless of browser language. Explicit EN/PT language cookies are honored.
  Old Spanish regional cookies mean Spanish; the detected country selects the
  corresponding Spanish root. Prefixed URLs are never redirected by visitor GEO.
- Language changes preserve server-authorized commercial GEO, partner hierarchy,
  currency and campaign resolution. Normal page switches preserve queries/UTMs
  and anchors. Existing language-cookie format stays compatible with affiliate
  fallbacks; it now explicitly uses SameSite=Lax and HTTPS Secure.
- The context has one effective GEO prop, already resolved server-side from real
  request GEO or an authenticated Owner preview. There is no public GEO setter.
  Obsolete country storage is ignored, not deleted or rewritten.
- Offers shows a read-only detected market label. The old picker export is a
  noninteractive retired stub. No public page mounts a country selector.
- Existing Owner session authorization, preview API, expiry/logout checks,
  cross-origin protections and destinations are unchanged. Preview is resolved
  before rendering, using the same boundary as outbound redirects.
- Locale responses explicitly require private/no-store caching. Existing dynamic
  rendering and server-side outbound GEO revalidation remain in place.

Commercial hierarchy remains MX Betsson + Winpot, CO bwin + Betsson, and PE
Inkabet + 1xBet. Brazil and other unsupported GEOs remain commercially suppressed.
No operator, approval, offer, destination, contract, game engine, popup cadence,
analytics, LivaSports or automatic-video setting is changed.

## Routing and SEO

`/es-mx`, `/es-co`, `/es-pe`, `/en` and `/pt-br` remain the internal
route representation. The menu groups Spanish editions as one language and uses
trusted GEO to choose its route. Existing country copy, canonicals, hreflang,
schema, editorial dates, robots and sitemap membership are preserved.

The two new guides are Spanish-only. All pages still show three languages. Their
menu explains the fallback: choosing EN/PT from Aviator demo opens the existing
localized Aviator page; choosing it from the bonus guide opens existing Offers.
No unreviewed translation or duplicate indexable guide is created. Direct EN/PT
guide URLs remain 404/noindex. Spanish-to-Spanish routing preserves the guide.

## Verification

Node 24.20.0 / pnpm 10.30.3. Frozen install, lint, typecheck, all 685 unit/DOM
tests and production build pass. Lint has two existing warnings; the removed
country-state effect no longer produces a warning. The warning budget is unchanged.

Focused tests cover all three language choices for MX/CO/PE and retired/unknown
GEOs, stale local storage, normal navigation, cookie preference, UTM/anchor
preservation, correct currencies and both partner identities. Existing commercial,
consent, popup, expiry, engine and destination safeguards remain covered.

The production route suite includes the 648-page crawl and a second loopback
server with approved **synthetic** inventory: 39 language/GEO pages plus Owner
login, MX/CO/PE previews in all languages, anonymous isolation, reset and logout.
Tests never follow partner URLs and never use production credentials.

Local browser QA at 320/390/430/768/1024/1440 covers 24 menu/page combinations:
three exact options, no public picker or Owner bar, no overflow, 44px minimum tap
targets and no console errors. Local sitemap crawl remains 343 fixture URLs,
with zero canonical/hreflang/schema failures, duplicate metadata or orphan pages.

Authenticated Preview, real Production, main CI and the exact release SHA are
reported after release. Real-country requests are simulated only in controlled
local tests; authenticated Production Owner preview is explicitly identified as
preview, not a claim of requests originating from Mexican/Colombian/Peruvian IPs.
Anonymous Production requests with forged country headers/cookies stay suppressed.

Source: [Vercel request headers](https://vercel.com/docs/headers/request-headers).
The deployed platform supplies country from the request IP. Browser language,
route locale, query parameters and public cookies are not geographic evidence.
