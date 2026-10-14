# Search visibility: Phase 2, 14 October 2026

Baseline: PR #72, `4a9a6309eca38a4404f4e26f5f224ed52b4606cd`.
This release improves existing pages; it adds no routes or indexable inventory.

## Measured search baseline

Authenticated Search Console, `playliva.com` Domain property, Web, three-month
period **13 August–11 October 2026** (latest available dates displayed):

| Searcher country | Clicks | Impressions | CTR | Average position |
| --- | ---: | ---: | ---: | ---: |
| Mexico | 0 | 67 | 0% | 41.0 |
| Colombia | 0 | 1 | 0% | 6.0 |
| Peru | 0 | 3 | 0% | 39.3 |
| All countries | 3 | 488 | 0.6% | 32.4 |

The six exact page filters combined with the respective country filters show:

| Page | Clicks / impressions | Position | Reported query evidence / intent |
| --- | --- | --- | --- |
| `/es-mx/games/blackjack-live` | 0 / 43 | 45.3 | `live blackjack` 29; `blackjack en vivo` 10; `blackjack live` 2; `blackjack ao vivo` 1; `live casino blackjack` 1. Rules, decisions and live-table variants. |
| `/es-mx/games/aviator` | 0 / 0 | No impressions | No query rows. Existing round-control, practice and availability intent. |
| `/es-mx/games/gates-of-olympus` | 0 / 0 | No impressions | No query rows. Original-edition mechanics and distinction from promotions. |
| `/es-mx/slots` | 0 / 0 | No impressions | No query rows. Format discovery and comparison. |
| `/es-co/games/aviator` | 0 / 0 | No impressions | No query rows. Controls and Colombian portal/currency checks. |
| `/es-pe/where-to-play/aviator` | 0 / 0 | No impressions | No query rows. Verified availability and destination checks. |

Blackjack's all-country page filter has 45 impressions and average position 45.
The country-filtered figures above must not be mixed with that total. GSC can
omit anonymized granular query rows. No keyword volume, difficulty or current
ranking was inferred from the five empty page reports. The global three clicks
are not evidence of LATAM growth.

Current stored URL Inspection results: MX Blackjack and MX Aviator are
“Crawled — currently not indexed,” last crawled 15 August at 05:13:56 and
03:42:48 respectively, with successful fetch, indexing allowed and Google-selected
“Inspected URL.” MX Gates, MX Slots, CO Aviator and PE Aviator Where to Play are
currently “URL is unknown to Google”; crawl/canonical fields are N/A. Earlier
historical impressions do not establish current indexing. All six production
pages independently return 200, index/follow and a self-canonical in rendered
HTML. No conflicting Google canonical or technical rejection was demonstrated.

## Exact changes and scorecard

| Priority | Confirmed gap before | Released improvement / validation |
| --- | --- | --- |
| P1 | MX Blackjack named decisions without explaining them or comparing variants. | Two sections explain decisions, a non-prescriptive hand example, Classic/Infinite/Lightning differences and reading the exact table's help. Links to Evolution, practice and bonus exclusions. |
| P1 | MX/CO Aviator had introductory paragraphs without a worked control example. | Three sections per edition explain round states, gross virtual-credit return, manual/automatic controls and separate country checks. No prediction or profitability claims. |
| P1 | MX Gates lacked a practical way to read symbol counts and distinguish feature spins from promotions. | Two sourced sections cover the original's cascades, eight-symbol minimum and 4+ scatter / 15-spin feature. No assumptions about other editions or operators. |
| P1 | MX Slots offered broad category guidance without a clear reading path. | Two sections provide format/edition/demo/terms checks and contextual links to the Mexican selection and relevant games. |
| P1 | PE Aviator Where to Play had generic checks. | Two server-rendered sections distinguish exact-game availability from a generic brand destination, locale from GEO, and MINCETUR / PEN / promotion checks. Operator cards and commercial resolution are untouched. |
| P1 | Each Mexico Top Games list had **one** incoming link from indexable sitemap HTML; copy claimed popularity without evidence. | Each now has **three** verified incoming links. Published methodology and inclusion reasons replace unsupported popularity claims. Numeric order remains a reading order. |
| P1 | The list methodology component used a Portuguese-only heading. | Uses the existing localized heading. No new translation or UI system. |
| P1 | MX Slots selection description claimed “slots populares” without evidence. | Description now accurately describes an editorial comparison. All eight titles/H1s, six priority descriptions, canonicals and hreflang remain unchanged. |
| P2 | A legacy ad test depended on live wall-clock time after its 14 October evidence expiry. | Test clock uses its recorded review date. Actual expiry gates, regulatory evidence and production suppression remain unchanged. |

The two new incoming links for Crash come from the Aviator page and Aviator
demo guide; the existing Crash category link stays. Slots gains links from Gates
and the bonus guide; the existing Slots category link stays. CO/PE guides do not
inherit Mexico lists. Reading links are normal server-rendered HTML anchors,
not outbound capabilities. No new commercial or operator claims are introduced.

Only the eight substantively reviewed page/locale pairs get an editorial date of
14 October. Adding a navigation link does not redate the six guides. Sitemap
membership, indexability rules, schema types, canonical host and alternates stay
unchanged. The local fixture sitemap remains 343 URLs; production's configured
commercial inventory has 366. Counts must be compared within the same environment.

## Indexing monitor

All six existing guide URLs were inspected again without another indexing request:

| Guide | Googlebot last crawl, 14 October | Current stored status |
| --- | --- | --- |
| `/es-mx/guides/aviator-demo` | 10:33:08 | Crawled — currently not indexed |
| `/es-mx/guides/bonos-casino` | 10:37:14 | Crawled — currently not indexed |
| `/es-co/guides/aviator-demo` | 10:31:12 | Crawled — currently not indexed |
| `/es-co/guides/bonos-casino` | 10:41:16 | Crawled — currently not indexed |
| `/es-pe/guides/aviator-demo` | 10:43:16 | Crawled — currently not indexed |
| `/es-pe/guides/bonos-casino` | 10:47:18 | Crawled — currently not indexed |

All show successful fetch, crawl/index allowed, self-declared canonical and
Google-selected “Inspected URL.” Earlier same-day live tests passed. Some stored
inspection views show “Temporary processing error” for sitemap discovery; that
is a Google reporting field, not evidence of a failed page fetch. No confirmed
technical rejection or wrong canonical was found. Crawling and accepted queue
requests do not establish indexing. **Zero new indexing requests in Phase 2.**

The Pages report last updated 9 October: 38 indexed, 365 excluded (203 discovered,
103 crawled, 54 intentional noindex, 5 redirects). It predates the new guides.
The previous investigation reconciled all 306 discovered/crawled examples:
286 currently indexable, 12 intentional noindex, 7 redirects, 1 retired 404.
CO/PE were absent from that older example pool. Do not submit all exclusions.

## Business measurement

Owner Growth, last 30 days, received-event coverage **27 September–14 October
UTC** (first day partial): 462 page views, 462 content views, 337 starts, 324
completed cycles, 226 commercial impressions, 35 consented affiliate clicks.
Those affiliate clicks are historical BR records: `ig` 30, direct 4, Instagram 1.
ES-MX / ES-CO / ES-PE commercial impressions and clicks are zero. They are not
LATAM organic acquisitions.

The `source=google` filtered overview and affiliate report show **zero received
page/content views, starts, completed cycles, impressions and affiliate clicks**.
Consequently there are no recorded Google-attributed Offers or Where to Play
visits in this coverage. Missing/unconsented/lost traffic is not reconstructed.
Counts are events, not unique people or sessions; this is not an attributed
conversion cohort. The current aggregate store does not retain `utm_medium`, so
nonzero `source=google` records alone could not distinguish organic from paid.
GSC country clicks remain the organic acquisition authority. FTD/revenue are not
connected. The fixed older Vercel snapshot in Owner Growth is a separate period.

Owner UI traffic is suppressed by the existing client guard; server Owner GEO
preview events are discarded. HTTP QA does not send client analytics events.
No production measurement, consent or affiliate logic was changed.

## Validation and next measurable actions

- Node 24.20.0 / pnpm 10.30.3; frozen install, lint, typecheck, all 679 tests,
  production build and 648-route crawl pass. Three existing lint warnings remain.
- Complete local sitemap crawl: 343 URLs, zero HTTP/metadata/hreflang/schema
  failures, duplicate metadata or orphan pages. Both Mexico selections exit the
  one-link group. Protected commercial, tracking, consent and gameplay hashes pass.
- New content is readable without overflow at 1440 / 430 / 390 / 320. Browser
  console reports no errors. Secret scan and diff hygiene pass. Hosted and live
  release verification is reported with the actual PR and merge SHA.
- P0, next 7–14 days: check stored guide status/canonical and any new coverage
  rejection; request again only for a demonstrated material reason. Retain the
  original single submission history. Compare page crawl dates with this release.
- P1, 30 days: compare equal final 28-day windows ending before/after the release,
  for these exact page/country pairs. Record impressions, clicks, CTR and position;
  analyze new query rows before changing titles. Zero-to-small counts are too noisy
  to prove a ranking gain. Track guide indexing transitions separately.
- P1, 60 days: prioritize pages that actually gain query impressions; expand only
  the missing explanation demonstrated by those queries. Compare consented Google
  landing, content, Offers/Where to Play and validated outbound events by market.
  Verify source/medium limitations before claiming conversion attribution.
- P2, 90 days: assess retained indexed pages and repeatable acquisition against
  the baseline. Plan new content only for documented gaps, not page-count growth.
  Review measured mobile field data when available. No traffic or revenue target
  is presented as a guaranteed outcome.

Sources: [Evolution blackjack](https://games.evolution.com/live-casino/live-blackjack/),
[SPRIBE Aviator](https://spribe.co/games/aviator),
[Gates of Olympus](https://www.pragmaticplay.com/en/games/gates-of-olympus/),
and the existing linked Mexican / Colombian / Peruvian regulatory references.
Provider documentation establishes game facts, not local commercial availability.
