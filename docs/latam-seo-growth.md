# LATAM organic discovery: baseline and editorial plan

Observed 13 October 2026. Source: the authenticated `playliva.com` Search Console
Domain property, rendered production HTML and the repository. This is a baseline,
not evidence of gains from this release. No purchased keyword data was used.

## Search Console baseline

The selected three-month Web report contains data from 13 August to 10 October
2026. Country filters identify searcher location, not the language of a page.

| Market | Clicks | Impressions | CTR | Average position |
| --- | ---: | ---: | ---: | ---: |
| All countries | 3 | 488 | 0.6% | 32.4 |
| Mexico | 0 | 67 | 0% | 41 |
| Colombia | 0 | 1 | 0% | 6 |
| Peru | 0 | 3 | 0% | 39.3 |

Mexico's visible queries include `live blackjack` (29 impressions), `blackjack en
vivo` (10) and `blackjack live` (4), all without clicks. Peru shows `lightning
roulette` (3); Colombia's query table reports no data. Small counts do not support
market sizing or a dependable ranking trend. Anonymized queries are not all shown.

Global leading queries are `crazy time funky time lightning roulette evolution`
(85), `live blackjack` (34), `big bass slots online` (17), `blackjack live` (16)
and `play big bass bonanza` (15), all with zero clicks in the visible table.
The leading landing pages by impressions are:

| Path | Clicks | Impressions |
| --- | ---: | ---: |
| `/en/compare/crazy-time-vs-lightning-roulette` | 0 | 90 |
| `/en/games/big-bass-bonanza` | 0 | 79 |
| `/es-mx/games/blackjack-live` | 0 | 45 |
| `/en` | 0 | 35 |
| `/en/best/best-slots-brazil` | 0 | 33 |
| `/en/games/blackjack-live` | 0 | 33 |

Desktop: 2 clicks / 302 impressions. Mobile: 1 / 185. Tablet: 0 / 1.
Leading countries: United States 0 / 140, Mexico 0 / 67, Brazil 1 / 46,
India 0 / 31 and United Kingdom 0 / 26. Georgia accounts for the other two clicks.

The Pages report, updated 9 October, shows **38 indexed / 365 not indexed**:
203 discovered currently not indexed, 103 crawled currently not indexed,
54 excluded by noindex and 5 redirects. No duplicate/canonical or 404 exclusion
category was displayed. Intentional noindex routes are not defects.

The existing `https://www.playliva.com/sitemap.xml` submission is **Success**,
submitted and last read 28 September, with 313 discovered pages. This historical
Google count differs from the current sitemap; submission does not prove indexing.
No duplicate submission or property/ownership change was made.
Settings confirms **You are a verified owner**, all robots files are valid and
2.35k crawl requests in the last 90 days.

Mobile and desktop Core Web Vitals both report insufficient usage data in the
last 90 days (report updated 12 October). There is no measured field-data pass.
Breadcrumbs: 1 valid / 0 invalid. Manual Actions and Security Issues both show
**No issues detected**.

## Technical baseline and implementation

The pre-change production crawl contains 340 sitemap URLs: all return 200 with
self-canonicals, indexable robots and one H1. It finds no duplicate title,
description or H1 within a locale. Ten commercial profiles/availability guides
have no incoming links from indexable HTML when the visitor has a neutral GEO.
Their existing recommendation UI correctly depends on real visitor eligibility.

This release adds server-rendered **internal editorial references** on regional
Offers and Operators pages. These references do not include partner destinations,
campaign IDs or outbound capabilities; existing GEO checks still govern CTAs.
It adds country-specific currency, identity, regulator and edition checks to:

- Games: Aviator, Gates of Olympus, Sweet Bonanza and Blackjack Live.
- Categories: Crash, Slots and Live Casino.
- Providers: SPRIBE, Pragmatic Play and Evolution.

Those ten paths are reviewed for each Spanish market. Only this reviewed cluster
is released from the Colombia/Peru noindex hold; unreviewed shared pages remain
held. Mexican headings inherited by Colombia/Peru are corrected. Existing EN,
PT-BR, games, commercials and Sports/LivaSports behavior remain unchanged.

Two substantive guides are new in each of `/es-mx`, `/es-co`, `/es-pe`:
`/guides/aviator-demo` and `/guides/bonos-casino`. They explain product identity,
practice limitations, manual/automatic withdrawal, rollover bases, contribution,
expiry and exclusions. The numerical bonus example is explicitly hypothetical.
They do not advertise invented campaigns or host a SPRIBE demo.

The six new URLs have self-canonicals and exactly three reciprocal Spanish
hreflang equivalents. EN/PT-BR and unknown guide URLs return 404/noindex rather
than invented translations. Guides use Article JSON-LD with visible organizational
authorship and real publication/review dates; no ratings or FAQ rich-result claims
are fabricated. Existing breadcrumb schema remains in the shared route system.
The crawl now checks reciprocal indexable hreflang and malformed JSON-LD.

Final local verification: Node 24.20.0 / pnpm 10.30.3; frozen install, lint,
typecheck, 676 regression tests, production build and 648-route crawl passed.
The rendered indexable crawl covers 343 URLs with zero failures, duplicate
metadata/headings or orphans. Representative guide/provider/Offers layouts pass
1440 / 430 / 390 / 320 widths without document overflow; the browser reports no
console errors. Secret scan and diff hygiene passed. Three documented baseline
lint warnings and Next's existing middleware deprecation warning remain.

The sitemap adds 26 indexable URLs: six guides and twenty reviewed CO/PE existing
pages. Expected production inventory with the current approved commercial registry
is 366, versus 340 before this release. Local fixture inventory is 343; production
operator configuration accounts for the difference. Only reviewed Spanish pages
receive the new editorial modification date. No robots disallow, canonical-host,
domain redirect, dependency, registry or affiliate destination change is required.

## Keyword-to-page map and research limits

These are observed query/intent opportunities, not volume or difficulty estimates.
Provider documentation validates mechanics; country regulator sources support
verification instructions without certifying any specific brand.

| Market / priority | Query family and evidence | Preferred destination |
| --- | --- | --- |
| MX P0 | `blackjack en vivo`, `live blackjack`: measured GSC impressions | `/es-mx/games/blackjack-live`, supported by `/es-mx/live-casino` and `/es-mx/providers/evolution` |
| MX P1 | `Aviator demo`, `avioncito`: observed demo/tutorial SERP intent | `/es-mx/guides/aviator-demo` → game → verified Where to Play |
| CO P1 | `Aviator demo Colombia`: observed demo SERP intent; GSC too small to quantify | `/es-co/guides/aviator-demo`, `/es-co/games/aviator` |
| PE P1 | `Gates of Olympus demo`, `Sweet Bonanza`: observed slot/demo discovery intent; not measured PlayLiva demand | `/es-pe/games/gates-of-olympus`, `/es-pe/games/sweet-bonanza` → verified availability |
| All P1 | Provider/catalog searches, edition-specific rules | Regional SPRIBE / Pragmatic Play / Evolution pages and category hubs |
| All P1 | `bonos casino`, `rollover`, game contribution: conditions/comparison intent | Regional `/guides/bonos-casino` → approved `/offers` |
| PE P2 | `lightning roulette`: 3 measured impressions, insufficient trend | Existing `/es-pe/where-to-play/lightning-roulette` if published by current inventory; review a substantive guide before expanding indexability |
| All P2 | `Aviator vs JetX`, `Gates of Olympus vs Sweet Bonanza` | Existing comparisons: review distinct mechanics and local availability before any CO/PE noindex release |

Do not create separate near-duplicate pages for every keyword. Demo guides must
distinguish provider products from PlayLiva Originals. Where to Play and Offers
remain governed by actual approved records, not editorial language or a query.
Sports impressions are not an expansion target for PlayLiva.

### Sources reviewed

- [SPRIBE Aviator](https://spribe.co/games/aviator), including provider demo entry.
- [Gates of Olympus](https://www.pragmaticplay.com/en/games/gates-of-olympus/) and
  [Sweet Bonanza](https://www.pragmaticplay.com/en/games/sweet-bonanza-slot/).
- [Evolution Live Blackjack](https://games.evolution.com/live-casino/live-blackjack/).
- [Mexico permit information](https://sitios.segob.gob.mx/es/Juegos_y_Sorteos/Permisionario):
  official search result verified; direct research fetch was unavailable.
- [Coljuegos Internet games](https://www.coljuegos.gov.co/publicaciones/301519/juegos_operados_por_internet/).
- [MINCETUR registry portal](https://apuestasdeportivas.mincetur.gob.pe/index.html).
- [Documented bonus terms example](https://support.betano.pe/hc/es-pe/articles/7412005071645--Qu%C3%A9-es-el-Bono-de-Casino):
  explanatory source, not a PlayLiva offer or partner endorsement.
- [Google localized versions guidance](https://developers.google.com/search/docs/specialty/international/localized-versions).

Observed competitor results include [MX Aviator demo](https://aviator.org.mx/demo/),
[CO Aviator demo](https://co.aviator.game/demo) and
[Peru slot discovery](https://awintura.com/es-pe/category/slots). They demonstrate
competing page formats, not authoritative rules, licenses or estimated demand.

## Measurable 30/60/90-day plan

**Days 1–30:** compare the same target URL set weekly by country/device in GSC;
record indexed, discovered-not-indexed, crawled-not-indexed, clicks, impressions,
CTR and position. Inspect one representative URL per new guide/market before any
indexing request; avoid duplicate submissions. Operational targets: zero sitemap
HTTP/canonical/hreflang failures and zero orphan targets. Recheck official source
links and approved commercial inventory. Do not interpret low-count noise as wins.

**Days 31–60:** use actual queries to select up to three substantial editorial
updates, prioritizing MX blackjack and the guide/game pairs gaining impressions.
Review existing comparisons before unlocking any additional regional page. Compare
equal 28-day periods per market and landing page. Measure the eligible discovery
→ Where to Play / Offers → affiliate click funnel only under existing consent
rules; separate GEO suppression and referral clicks from deposits/revenue.

**Days 61–90:** expand only demonstrated winners with distinct tutorials or
comparisons. Consolidate cannibalizing pages if evidence exists. Review returning
queries, non-brand clicks, engagement and eligible affiliate referrals against the
baseline. Evaluate CWV field data when available; use repeatable mobile lab traces
for diagnosis meanwhile. No traffic, ranking or revenue percentage is promised.

GSC is lagged and sparse; monthly search volume, keyword difficulty and current
field CWV are unavailable. The public PageSpeed mobile request returned HTTP 429
(daily API quota exceeded), so no lab score is asserted. The release can remove technical obstacles, but cannot
force crawling, indexing, ranking or commission generation.
