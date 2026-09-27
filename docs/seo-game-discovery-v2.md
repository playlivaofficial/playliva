# SEO and Game Discovery V2 — owner review

Status: local implementation, awaiting owner review. No commit, push, PR, merge, deployment or Google indexing submission is authorized before approval of this wave.

## A. Current-state audit

Audited 27 September 2026 against fetched production main `37aa3c7431ff163f8e01661ba305c6602a3e5c2c`. Branch: `codex/seo-game-discovery-v2`. The working tree was clean before work. Source of truth: `playlivaofficial/playliva`.

- 42 real provider games: 11 legacy commercial/discovery entities plus 31 sourced reference entities. Five providers and five discovery categories; Blackjack Live appears in Live Casino, while the Table Games archive retains its established path.
- Provider inventory: Pragmatic Play 18, Evolution 10, Play’n GO 6, SPRIBE 5, SmartSoft 3. The old hubs included only the 31 reference games (14/7/6/2/2), excluding 11 documented games from their primary lists.
- 12 distinct PlayLiva Originals; the old directory's extra Original search covered only its three newest games.
- 8 comparisons, 14 alternatives pages, four market-specific rankings, and the existing general Crash list. Established Aviator, Slots/Pragmatic and Live Casino/Evolution clusters already have useful PT-BR copy and must not be recreated.
- All 42 real games have recorded approved artwork. The reference records have official source URLs and localized mechanics. Legacy records have uneven localized explanations; targeted EN/ES-MX gaps are addressed in this wave.
- Verified RTP exists only for Aviator, SPRIBE Dice and SPRIBE Keno. No new RTP, volatility, maximum-win, release-date or operator-availability claims were added. Reference catalog inclusion remains separate from commercial eligibility.
- Production HTTP crawl: **313 sitemap URLs** (111 PT-BR, 100 EN, 102 ES-MX), all direct 200/self-canonical/indexable. No duplicate titles, descriptions or H1s within a locale; no fully orphaned sitemap pages. **26 pages had only one incoming link from another sitemap page.** Counts refer to rendered HTML links, not Google crawl behavior.
- WTP already excludes empty/ineligible locale variants; rankings already restrict locale-market intent. Preserve these P0 rules and their commercial data source.
- Search Console's imported 28-day snapshot records 3 clicks/149 impressions, observed 27 September. Its query and page tables are independent first-ten-row excerpts, not query/page joins. No shown row meets the existing 100-impression performance threshold. Server reporting remains explicitly disconnected where credentials are absent.

The full baseline crawl is in ignored `social/output/seo-v2/production-before-audit.json`. The compact, credential-free crawl snapshot used by Owner SEO is `data/owner/discovery-crawl.json`; its environment/date are visible in the dashboard.

## B. Discovery UX

The homepage and Play hub now expose a direct game search and provider/discovery navigation near the top. The homepage keeps the Original spotlight and places the real-game catalog before the larger Originals section. Existing sponsor placements remain in their components.

`/games` combines all 42 provider guides and 12 Originals in one deterministic directory. Exact title, title prefix, legitimate alias, title substring, provider/category relevance and bounded one-character typo matching are ordered explicitly. The provider, category, experience and format filters combine. Results are deduplicated by their actual destination, with a maximum of 12 cards per response.

Filtering and pagination run on the server. The directory does not serialize the full catalog into an interactive client component. The small search/form/click boundary sends only consented editorial identifiers to the existing tracking layer; raw search terms and URL query strings are not collected.

Facets use GET forms rather than crawlable combinations of links. Nonempty search/filter/page states are noindex, canonical to the unfiltered directory, absent from the sitemap and excluded from hreflang clusters. Only existing curated canonical paths are indexable.

## C. Real game entities

Keep established substantive entity content. Add factual `VideoGame` schema using the recorded identity, provider, category, localized summary and approved image—no offers, ratings or reviews. Add bounded same-provider, related-format and clearly labelled Original discovery below the guide.

Targeted source-supported fixes cover thin EN explanations for Spaceman, Gates of Olympus, Sweet Bonanza, Crazy Time and Plinko; ES-MX Sweet Bonanza/Plinko; and the PT-BR Plinko explanation. Sweet Bonanza's EN/ES-MX connected-cluster wording is corrected to pay-anywhere. Unsupported volatility/popularity language in touched descriptions is removed.

Sources checked for this targeted work:

- https://www.pragmaticplay.com/en/games/spaceman/
- https://www.pragmaticplay.com/en/games/gates-of-olympus/
- https://www.pragmaticplay.com/en/games/sweet-bonanza-slot/
- https://games.evolution.com/live-casino/game-shows/crazy-time/
- https://spribe.co/games/plinko (provider identity; existing recorded row/risk mechanics retained)

## D–F. Hubs, clusters and cross-discovery

Provider hubs and directory counts now include both existing catalogs. Category links reflect that inventory. No new thin provider pages were created.

The Instant Games first wave explains how Plinko's ball drop, Mines' tile decisions, Dice's threshold and Keno's draw differ. Existing provider documentation supplies these distinctions. The category connects to SPRIBE, its existing alternatives pages, and the separate Samba Drop/Mines Originals.

Category/provider hubs reuse bounded editorial relationships for existing games-like/comparison pages. Legacy alternatives pages gain related documented formats with visible mechanics and an explicit explanation of the broad format relationship, without claiming equivalent odds or rules.

All 12 Original routes append related real games **after the complete existing game and rules** through server layouts. No engine, controls, audio, settlement, wallet, sponsor, engagement offer cadence or game animation was modified. Real entity pages reciprocate with labelled PlayLiva Originals and the virtual-credit distinction.

## G–H. Link hierarchy, quality and indexability

No new canonical routes are created. Sitemap remains **313 URLs**, matching the baseline. No automatic mass generation or facet URLs.

`lib/discovery/indexability.ts` is shared by server metadata boundaries, sitemap and owner quality inventory:

- Entity: existing identity/provider, approved artwork, at least 80 characters of overview and 60 of mechanics, at least two documented features, and a nonduplicate summary. Numerical floors catch incomplete records; they are not permission to pad content. Human/source review remains necessary.
- Provider: substantive localized intro and at least two qualifying entities.
- Category: real inventory and explanatory localized introduction.
- Alternatives: qualifying anchor and at least two related documented formats; curated reference lists also require explicit explanations.
- Comparison: documented pair and meaningful differences, no invented winner.
- WTP: existing independent market/eligibility gate, no new game-level availability inference.
- Rankings: existing market-locale restriction, meaningful inventory and introduction.

Noindex decisions remove the route from sitemap and reciprocal alternates together. Missing optional RTP/volatility never triggers fabricated content. The canonical of a held page remains its own URL.

## I. Owner SEO

The protected SEO page now shows real/provider/Original inventory, provider counts, topic coverage, shared quality decisions, excluded WTP locale variants and measured incoming/outgoing link counts with snapshot provenance. These are structural facts, not organic traffic scores.

All sitemap pages receive an indexing inventory record. Pages outside the imported inspection evidence are **Unknown**, never inferred indexed from sitemap membership. Existing accepted requests remain distinct from indexed status.

The prioritized queue combines measured performance rules, content-quality defects, measured weak links, and dated crawled-not-indexed observations. Every recommendation carries a reason, route, source, action and priority. Connected Search Console reporting requests the preceding equal-length period for query/page and page dimensions. Only exact matching observed rows receive prior impressions; omitted rows stay unknown. Owner tables expose those prior impressions, and growth/decay rules use them. A failed comparison does not discard the current report. A disconnected source cannot manufacture opportunities.

## J. Verification

- Node **v24.20.0**, pnpm **10.30.3**; frozen install passed without manifest/lockfile changes.
- Lint passed: zero errors, the same three existing warnings. Typecheck passed. **480/480 tests passed**. Production build passed with TypeScript validation enabled.
- Build warning comparison: the same eight Owner Growth dynamic-filesystem tracing warnings occur in the previous `password-reset-build.log` and `auth-build.log`; the existing middleware-to-proxy deprecation also remains. No new warning type or source location was introduced.
- HTTP regression crawl passed for **414 public/legal/demo URLs**, plus localized 404 and affiliate fallback probes. It validates canonical/hreflang, JSON-LD, category membership, sponsor/GEO baselines and absence of game runtime on ordinary discovery pages.
- Final sitemap crawl: **313/313 direct 200**, self-canonical and indexable, **0 duplicate title/description/H1 groups**, **0 orphan pages**. Locale counts unchanged: PT-BR 111, EN 100, ES-MX 102.
- Weak incoming links improved **26 → 5**. The remaining routes are recorded below. Link counts come from distinct rendered sitemap pages, not Google.
- **60 browser checks passed**: 12 representative routes at 1440/430/390/320, plus all 12 Originals at 390. No page overflow, broken visible images or reported console errors. All 12 settings panels and dynamically loaded rules opened successfully, with no dialog overflow. Search/form/filter checks passed at all four widths.
- The 480-test suite retains gameplay, 3/6/9 offer cadence, GEO, localization, owner authorization/session and Social Engine coverage. Engine, audio, wallet, settlement, affiliate configuration and auth code are unchanged.
- Directory network check: 12 cards per response, 14 JavaScript resources, **236,385 transferred script bytes** in local Chrome at 1440 and 320; **no GLB/GLTF/video/audio requests**. This is a local observation, not a field Core Web Vitals score.
- Secret scan passed. All **59 deployment traces** exclude private runtime files; **102 client chunks** contain no owner secret configuration names or local access-file reference. Diff whitespace check passed. Runtime pins and lockfile unchanged.
- Generated evidence remains ignored in `social/output/seo-v2/`: `local-final-audit.json`, `browser/report.json`, responsive screenshots, `directory-network.json`, `boundaries.json` and gate logs. The checked-in link snapshot is explicitly labelled `local-review-v2`, with its own timestamp; it is not production or live Google evidence.

Changed areas: shared discovery catalog/query/indexability/schema/copy/link modules; server directory and related-game components; entity/category/provider/home/Play presentation; 12 server Original layouts; Owner SEO health/comparison reporting; additive consented analytics; SEO/route regression tests and this report. No new dependencies or canonical routes.

## K. Local review URLs

The server is bound to `127.0.0.1:3130`. Owner review uses isolated local state and the existing local access password; it does not write to production Neon, Blob or social accounts.

| Review surface | URL |
| --- | --- |
| Homepage | http://127.0.0.1:3130/pt-br |
| Play hub | http://127.0.0.1:3130/pt-br/play |
| Unified search and filters | http://127.0.0.1:3130/pt-br/games |
| Search an Original | http://127.0.0.1:3130/pt-br/games?q=Skuptu+Levanta |
| Real game entity | http://127.0.0.1:3130/pt-br/games/plinko |
| Category hub | http://127.0.0.1:3130/pt-br/instant-games |
| Provider directory | http://127.0.0.1:3130/pt-br/providers |
| Complete provider inventory | http://127.0.0.1:3130/pt-br/providers/spribe |
| Games like | http://127.0.0.1:3130/pt-br/games-like/aviator |
| Existing comparison | http://127.0.0.1:3130/pt-br/compare/aviator-vs-jetx |
| Existing eligible WTP | http://127.0.0.1:3130/pt-br/where-to-play/aviator |
| Original → real game discovery | http://127.0.0.1:3130/pt-br/play/samba-drop |
| Protected owner SEO | http://127.0.0.1:3130/owner/growth/seo |

## L. Real remaining issues

- Five sitemap pages still have only one incoming link: `/en/operators/betsson-group-affiliates`, `/es-mx/operators/betsson-group-affiliates`, `/es-mx/best/best-crash-games-mexico`, `/es-mx/best/best-slots-mexico`, `/pt-br/best/best-slots-brazil`. These retain their existing commercial/market rules. Do not add irrelevant links merely to improve a count.
- PT-BR OG images cover 104/111 sitemap pages. The existing seven omissions are About, Affiliate Disclosure, author, Contact, Editorial Policy, provider directory and Responsible Gaming. Every real game entity and provider detail has an image. No fabricated image was added to close a numerical gap.
- No new organic traffic, conversion, popularity or indexing outcome is claimed. Provider RTP coverage remains 3/42. Optional unknown facts remain absent.
- Existing lint/build warnings remain as documented above; no suppressions or raised warning budget were added.
- Owner review is the next release gate, explicitly required by mission sections 54–56. Nothing has been committed, pushed or deployed; no Google submission has been made.

Live Search Console query growth, complete query/page matching, and fresh indexing status require an authorized server connection or new observed exports. This wave preserves the existing truthful not-connected state. Google follow-up is reserved for approved production release; no localhost/preview/filter/noindex URL may be submitted. Acceptance will never be reported as indexing.

Production release sequence after owner approval: commit, push, PR, hosted CI/preview, merge, main CI, production HTTP verification, then a small priority Search Console follow-up and sitemap refresh where appropriate.
