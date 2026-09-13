# M11 — provider reference catalog

## Scope and baseline

Continues M10 main `a7387f9515becf656e4b448a80ab35d7c53b318c` on
`codex/m11-provider-catalog`. This is the revised **neutral factual catalog**
scope, not an affiliate funnel expansion. No new playable Originals, demo
embeds, operator referrals, availability claims or M12 work.

The [pre-import selection matrix](m11-selection-matrix.md) records 31 selected
titles, one deferral and the limitations of Brazilian inventory evidence.
Exact official URLs are maintained alongside each record in
`lib/catalog/games.ts`. Source descriptions were not copied; the summaries
describe specific mechanics and distinguish similarly named variants.

## Data and routing

- 31 new records: 20 Slots, 7 Live Casino, 2 Crash, 2 Instant Games.
- Providers: Pragmatic Play 14, Play’n GO 6, Evolution 7, SmartSoft 2, SPRIBE 2.
- All records have stable explicit IDs, slugs, localized EN/PT-BR/ES-MX
  summaries/overviews/mechanics, official evidence URLs, verification date,
  related references and explicit fallback provenance.
- No RTP, volatility, release-date, max-win, market popularity or ranking
  field has been invented. Stated feature numbers are documented by providers.
- New records are deliberately separate from `lib/data.ts`. The original
  eleven records, operators, offers and all outbound infrastructure stay intact.
- Existing `/games`, `/games-like` and `/compare` route architecture is extended
  with explicit neutral-reference branches. New `/where-to-play` routes do not
  exist; uncurated new Games Like URLs return 404.
- Three reading lists: Sugar Rush, The Dog House, Reactoonz; nine individually
  explained relationships. Other detail pages have bounded related-format links.
- Three comparisons: Sugar Rush vs Sugar Rush 1000; The Dog House vs The Dog
  House Megaways; Lightning Baccarat vs Speed Baccarat. No “better bet” ranking.
- Provider index plus five provider pages; counts explicitly refer to this
  documented reference collection, not a provider’s complete inventory.
- 43 logical routes added, each in three locales: **129 new indexable URLs**.
  Sitemap total **318**, preserving all **189** M10 entries. Canonical,
  reciprocal hreflang, x-default and localized breadcrumb architecture reused.

## Artwork and evidence gaps

All 31 new titles use code-owned, typographic neutral covers differentiated by
category. These are explicitly not official game art. The provenance status is
`fallback`, rights status `pending-rights`, source `playliva-neutral`, checked
2026-09-13. No third-party artwork was downloaded. Existing approved imagery
continues through its existing rights allowlist and lazy image loading.

Play’n GO and Evolution expressly reserve graphic redistribution for written
consent. No authenticated affiliate media portal was available. Public provider
evidence is not evidence of operator availability. The older indexed Betsson BR
Sugar Rush URL opened a general casino lobby during the browser audit, not an
exact-title result. No new-title availability was verified, and all 31 records
remain unverified for GEO/operator availability. No access controls were bypassed.

## Delivery and discovery

The directory now receives a single-language summary projection of 42 total
entries, not all three languages or full game articles. Search matches title,
provider and category, normalizes accents/whitespace, and combines with category
and provider filters. A–Z ordering is factual, not an invented popularity rank.
Twelve cards render per page; filter changes reset pagination. Category pages
retain their existing curated blocks and Originals, followed by a distinct,
bounded reference section. The old explorer remains available for its preserved
M10 regression contract, but the public directory uses the expanded explorer.
No dependencies or lockfile changes are needed.

`scripts/validate-catalog.mjs` now runs before `next build`. Severe ID, slug,
provider, category, localization, source, artwork and relationship errors fail
the build. Existing game/operator/offer references and sitemap uniqueness are
checked too. Tests include negative fixtures and all new localized page types.

The one changed protected snapshot is `app/sitemap.ts`, explicitly authorized
by M11; all fourteen other infrastructure hashes remain unchanged. Its hash is
line-ending normalized like the existing test. A separate M10 URL fixture
asserts that all prior entries remain present. The sixty Original engine,
wallet and renderer files remain covered by their unchanged aggregate checksum.

## M10 before measurements

Local production build, same no-cache gzip proxy, 390×844, unthrottled desktop
hardware. Each route loaded in the same browser; two-second visible reporting
window. Paint timings are local proxies, not field Core Web Vitals. Image totals
below are observed transferred resources, not whole-site asset sizes.

| Page (PT-BR) | JS gzip bytes | CSS gzip bytes | Image bytes | LCP proxy ms | CLS proxy |
| --- | ---: | ---: | ---: | ---: | ---: |
| Homepage | 239284 | 17088 | 296076 | 596 | 0 |
| Games | 224154 | 17088 | 1486132 | 1000 | 0 |
| Slots | 238541 | 17088 | 560604 | 300 | 0 |
| Live Casino | 238541 | 17088 | 147135 | 460 | 0 |
| Aviator detail | 221663 | 17088 | 422909 | 1048 | 0 |

## Verification status

Stable implementation checkpoint: `6c1b10066eef8adeedf3964a6cfea3d7f2fa5f71`.
The subsequent browsing correction clarifies the directory introduction and
returns keyboard focus/scroll position to the first result after pagination.
The focused result container starts about 80px below the viewport top, clear
of the fixed header, verified at 320×720.

Local gates: frozen install, lint (three baseline warnings), typecheck, **217
tests**, production build with integrity guard, **387-route** crawl plus locale
404/outbound probes, and `git diff --check` passed. The crawl includes 93 probes
confirming new game availability pages remain 404, and nine probes for uncurated
Games Like/comparison and unknown-provider routes. No old test was removed.

Responsive browser QA: **52 page/viewport combinations**, 13 PT-BR page types
at 320×720, 360×800, 390×844 and 1440×1000. Pages: homepage, Games, Slots, Crash,
Live Casino, Instant Games, Sugar Rush, Bac Bo, Balloon, SPRIBE Keno, Play’n GO
provider, Games Like Reactoonz, Lightning Baccarat vs Speed Baccarat.
No document-width overflow or completed broken-image loads were found. Visual
screenshots inspect compact paginated cards, the 320px comparison, 390px article
and provider cards, and desktop article/comparison layouts. Search for Sugar
Rush returns the two intended variants; applying Evolution simultaneously
shows the clear empty state. Pragmatic pagination reaches the six final results
with keyboard focus and the first result visible. All five homepage Originals
remain present and each category retains its intended Original block.

Screenshots are maintained as external release evidence, not deployed assets:
`m11-local-games-320.png`, `m11-local-comparison-320.png`,
`m11-local-detail-390.png`, `m11-local-provider-390.png`,
`m11-local-comparison-desktop.png`, `m11-local-detail-desktop.png`.

## M11 after measurements

Same local probe and viewport as the M10 before table; no throttling. Network,
font timing and device scheduling make these paint results noisy proxies.

| Page (PT-BR) | JS gzip bytes | Change | CSS gzip bytes | Image bytes | LCP proxy ms | CLS proxy |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage | 239847 | +563 (+0.24%) | 17889 | 297414 | 460 | 0 |
| Games | 211470 | -12684 (-5.66%) | 17889 | 571655 | 356 | 0 |
| Slots | 251242 | +12701 (+5.32%) | 17889 | 560604 | 492 | 0 |
| Live Casino | 251242 | +12701 (+5.32%) | 17889 | 147135 | 472 | 0 |
| Aviator detail | 234413 | +12750 (+5.75%) | 17889 | 422909 | 1024 | 0 |
| Sugar Rush reference (new) | 234413 | New route | 17889 | 55250 | 304 | 0 |

CSS grows by 801 compressed bytes. Category/detail JavaScript grows by about
12.7 KB compressed for the shared reference UI, while the directory shrinks.
No full localized articles or provenance registry is sent in the directory's
summary projection. No new bitmap, video, GLB or provider-demo payload is added.
The observed image budget includes existing shell/discovery resources; neutral
reference covers themselves require no image transfers.

Hosted CI, final main and Vercel Production are verified separately in the
external release report. Local passes and a pushed feature checkpoint alone
are not a release-completion claim.

Pinned tools: Node 24.20.0 / pnpm 10.30.3. Existing warning baseline: three lint
warnings, ignored dependency build scripts and Next middleware deprecation.
No warnings are suppressed or budgets raised for M11.
