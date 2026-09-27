# Revenue Readiness

PlayLiva measures consented click intent, not deposits or earnings. Game engines,
settlement, the 3/6/9 recurring offer cadence, verified availability, operator
approvals, destination choices and canonical page inventory are unchanged.

## Funnel and attribution

| Page / surface | Existing action | Operator / destination reference | Canonical click taxonomy |
| --- | --- | --- | --- |
| Home, Games and Play hubs | Sponsored banner → `/go` | Approved Betsson BR promotion while live, otherwise approved brand campaign | `playliva_banner` |
| Every Original: compact header | Sponsor → `/go` | Same central BR promotion / approved brand fallback | `playliva_original_sponsor` |
| Every Original: settled cycle 3, 6, 9… | Recurring offer → `/go` | Central BR promotion | `playliva_original_popup` |
| Real game entity | Existing game CTA, sponsor and verified Where-to-Play cards → `/go` | Existing verified game/category routing or explicitly generic operator promotion | `playliva_real_game` |
| Where-to-Play | Eligible operator / campaign card → `/go` | Existing verified game availability; campaign card retains its casino-promotion boundary | `playliva_where_to_play` |
| Comparison | Existing operator / campaign cards and sponsor → `/go` | Existing approved operator routing | `playliva_comparison` |
| Games Like | Existing cards and sponsor → `/go` | Existing approved operator routing | `playliva_games_like` |
| Category | Existing sponsor and operator cards → `/go` | Existing category or generic campaign, according to the placement | `playliva_category` |
| Provider hub | Existing sponsored banner → `/go` | Generic approved operator / central promotion; no new game-availability claims | `playliva_provider` |
| Offers, operator profiles and remaining banner placements | Existing affiliate button / banner → `/go` | Existing eligibility resolver | `playliva_banner` |

Editorial discovery links remain internal and are not affiliate clicks. There is
no new sticky ad. Originals continue linking to real games, and real games retain
their Original discovery links. All 12 Originals share the same sponsor and
settled-cycle offer component.

One actual anchor activation emits one `affiliate_click`. The central tracker
adds current route, locale, page family, taxonomy and visit attribution. The
server enriches game/provider/category from the real catalog and replaces the
submitted country with request GEO. Public operator, placement, campaign and
creative keys are recorded; raw partner URLs, query strings, credentials,
referrer paths, search terms and visitor identifiers are not.

Existing campaign `offer_impression` events remain available to the browser
analytics layer. The first-party collector normalizes them to
`affiliate_impression`; it does not collect both names. Owner CTR uses that one
canonical exposure stream. Popup metrics require the actual popup placement.
Imports must use canonical `affiliate_impression` rows for exposure/CTR reporting;
ambiguous legacy mirrored `offer_impression` totals are not added to them.

## GEO and private campaign configuration

Runtime eligibility uses Vercel's `x-vercel-ip-country`, independently of language
and the saved market selector. Unknown/unsupported GEO fails closed. Both initial
HTML and hydrated UI suppress ineligible links. `/go` independently verifies the
request country, so an edited `country=BR` query cannot grant eligibility.
Public pages render per request to prevent cached Brazil commercial output from
being reused for another GEO. SEO market policy, canonicals and sitemap membership
remain independent of that runtime eligibility.

Reference: [Vercel geolocation headers](https://vercel.com/kb/guide/geo-ip-headers-geolocation-vercel-functions).
Local tests explicitly supply BR/GE headers; that is a test fixture, not a
production visitor override.

Public configuration contains only these references:

- `playliva-affiliate:betsson-br-brand`
- `playliva-affiliate:betsson-br-crash`
- `playliva-affiliate:betsson-br-live-casino`
- `playliva-affiliate:betsson-br-promo`

The private server variable `PLAYLIVA_AFFILIATE_DESTINATIONS` maps the corresponding
keys (without the scheme) to the existing approved destinations. Configure it as
a sensitive PlayLiva Production/Preview secret. Never put real values in Git,
documentation, a public variable, test output or page props. The server validates
HTTPS, the approved host and credential-free URLs; missing/invalid mappings fall
back internally. Functional tracking paths and configured query templates remain
intact. No new affiliate sub-ID template is claimed or enabled.

## Manual social links

`lib/social/manual-links.ts` reuses the existing Shorts `trackedTargetUrl` builder:

```text
https://www.playliva.com/pt-br/play/samba-drop
  ?utm_source=tiktok
  &utm_medium=organic_social
  &utm_campaign=playliva_originals
  &utm_content=samba-drop-creative-01
```

Use `tiktok`, `instagram` or `youtube`; keep the existing creative and campaign
keys when a creative already has them. The owner creative review displays the
three platform links. Nothing uploads or publishes automatically.

Every Original creative lands on its registered `/pt-br/play/{slug}` page:
`crash`, `mines`, `blackjack`, `roulette`, `capybara-gold`, `liva-ginga`, `golaco`,
`liva-raio`, `liva-21-brasil`, `skuptu-levanta`, `samba-drop`, `carnaval-gold`.
Educational real-game creatives use the existing game, provider or category
canonical; general discovery uses `/pt-br/games`. Unknown/private/redirect targets
are rejected. UTM URLs retain the clean page's canonical and do not enter sitemap.

Attribution is stored only after analytics consent. It survives internal
navigation, updates on a new explicit campaign/external landing, expires after
30 minutes of inactivity, and clears on withdrawal of consent. SPA navigation
updates page context; filter/query edits do not invent page views.

## Owner measurement and storage

Apply `scripts/owner/migrate.mjs` with the existing isolated PlayLiva
`OWNER_DATABASE_URL`. Migration 002 adds separate event tables in
`playliva_owner`; it does not append events to the owner authentication/state
document. Preview deployments require a separate `OWNER_STATE_KEY` beginning
`owner-preview-`. Never use another product's database.

`POST /api/events` checks same origin, analytics consent, a bounded body, the
canonical route registry, allowed events, current timestamp and verified operator
eligibility. No GET redirect is counted as a click. A random ID represents one
event, not a person. Receipt insertion and counter increment are one atomic SQL
statement; a retry with the same ID cannot increment twice, including across
concurrent processes. The client retries a server failure once with that ID.

Daily counters contain coarse, anonymous dimensions. Receipts are pruned after
one day on subsequent activity, and old quota rows after seven days. No idle
cleanup worker or new paid service is introduced. Daily totals are retained;
the bounded dashboard query covers the latest 90 days. Existing Neon request/
compute/storage usage grows with consented events and dimension cardinality.
Intake has a 240-request/minute ephemeral source bucket and a 100,000-attempt/day
database ceiling per scope. Raw IPs and the temporary bucket hashes are not
written to the database. These bounds prevent uncontrolled collection costs;
blocked, unconsented or lost requests are not estimated as traffic.

Owner Overview shows page/content views, game starts, completed cycles,
commercial exposures and affiliate clicks. Affiliate performance groups click
intent by route, game, operator, placement, source, social platform, page family,
taxonomy, provider, campaign and creative. The source note shows actual collection
coverage; a selected period may only partially overlap that coverage. These are
event ratios, not unique-user or conversion-cohort rates. FTD, deposits, CPA,
RevShare, commission and revenue remain explicitly unconnected.

## Commercial-intent review set

This is an architecture-based audit set, not a traffic or revenue ranking:

| Intent | PT-BR routes |
| --- | --- |
| Verified operator discovery | `/where-to-play/aviator`, `/where-to-play/crazy-time`, `/where-to-play/lightning-roulette` |
| Game research with existing commercial paths | `/games/aviator`, `/games/crazy-time`, `/games/lightning-roulette`, `/games/sweet-bonanza` |
| Related-game research | `/games-like/aviator`, `/compare/aviator-vs-jetx` |
| Provider/category exploration | `/providers/spribe`, `/providers/evolution`, `/crash`, `/live-casino` |
| Original engagement | `/play/crash`, `/play/capybara-gold`, `/play/blackjack`, `/play/samba-drop`, `/play/skuptu-levanta` |

The homepage and Games hub are additionally checked as acquisition entry points.
Release evidence belongs in the ignored `social/output/revenue-readiness/`
directory: operator transport checks with hosts/statuses only, database retry
tests, browser checks, screenshots, route crawl, SEO audit and release identifiers.
Partner geolocation may prevent a Georgia probe from inspecting Brazil-specific
landing content. Do not label that content verified solely from an HTTP redirect.
