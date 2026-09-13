# M10 — Full product and visual redesign

M10 continues the released design foundation `fa93f083ca042ff25c22c57f10950757cac97c00`
on `codex/m10-playliva-redesign`. It does not discard or repeat that work.
The five Originals are retained; no playable Plinko or M11 catalog expansion.

## Architecture before / after

The M9-era homepage used the previous generic hero/card hierarchy. The released
foundation replaced it with a midnight/navy visual system, a composed free-play
hero, four prominent Original posters plus compact Mines, categories, a separate
provider catalog, discovery explanation and preserved editorial/operator areas.
M10 carries that structure forward and completes the editorial design layer.

- Homepage: two internal hero actions (Play Free / Explore Games), one Original
  spotlight, distinct Original and provider card treatments, and richer comparison
  cards. Existing editorial facts and approved operator surfaces are retained.
- Navigation: Play, Games, Crash, Slots, Live Casino, Instant Games, Sports;
  secondary links under More. Mobile uses Home / Play / Games / Sports and
  suppresses fixed bottom navigation on all five Original game routes.
- Lobby: five real games, curated responsive grid, filters, announced counts;
  larger disclosure text and consistent card-footer spacing.
- Categories: separate Original and provider sections, with Blackjack and Roulette
  in Live Casino discovery. Blackjack technical/commercial taxonomy remains
  `table-games`; the existing exact-game commercial exception remains unchanged.
- Provider detail: artwork now sits with game identity on small screens instead
  of below the entire hero. Desktop uses a larger two-column composition. Existing
  H1/editorial facts, internal paths, disclosure and outbound context are preserved.
- Local guide navigation links to overview, facts and similar games. Reading cards
  distinguish explanatory text from clickable Original/provider/comparison cards.
- Provider cards become readable artwork-plus-text rows below 360px; other widths
  keep an editorial grid. Provider metadata is larger and descriptions remain
  visible on narrow phones. Catalog search precedes the category filters on mobile.
- Comparison cards pair both existing approved artworks. Comparison and alternatives
  pages use shared reading surfaces without rewriting their editorial facts.
- Operator directory filter/select targets grow from 34–36px to at least 44px;
  result counts have a status role. Existing OperatorCard remains its protected,
  distinct variant; eligibility, destinations and action placement are unchanged.

## Localized presentation corrections

Provider game type/mechanics now use the existing localized editorial fields,
instead of their raw English data values. Device labels use language-specific
display names, leaving supported-device facts unchanged. The Spanish footer's
`18 a��os` is corrected to `18 años`; a damaged English trust-note separator is
also repaired. No commercial facts or claims changed.

## Protection and checks

The existing 15-file M9 snapshot protects affiliate/data/consent/tracking,
Original referral helpers, operator/outbound components, `/go`, SEO and sitemap.
M10 adds a normalized-content checksum over all **60** Original engine, wallet
and game-renderer files. These checks do not permit silently changing protected
behavior to accommodate a visual redesign. Source assets and game routes are
unchanged; only a stale shell comment was corrected.

Six M10 tests add provider-identity/editorial preservation, localized facts,
exact existing outbound context/attribution, comparison presentation, footer
encoding and unchanged-engine coverage. The route crawl also checks guide anchor
targets, provider identity art and footer encoding on every public route.

First stable checkpoint gates: frozen install, lint, typecheck, **199 tests**, build,
**258-route crawl** and whitespace checks passed with Node **24.20.0** /
pnpm **10.30.3**. Three baseline lint warnings, ignored dependency scripts and
Next middleware deprecation remain unchanged. Hosted and final live evidence is
recorded separately after release verification; local gates alone do not prove it.

## Delivery measurement

`scripts/m10-performance-qa.mjs` is a local-only no-cache/gzip proxy on :3111 for
an unchanged production preview on :3102. It appends a visible report after load;
it never ships in a route. Baseline and M10 samples use 390×844 without CPU/network
throttling. Encoded sizes below count unique image URLs so repeated no-cache
preload/lazy requests do not masquerade as new artwork.

| Page | Baseline JS gzip | M10 JS gzip | Baseline images | M10 images |
| --- | ---: | ---: | ---: | ---: |
| PT-BR homepage | 238,919 B | 239,284 B | 240,826 B | 242,164 B |
| Play hub | 231,884 B | 232,021 B | 242,067 B | 242,067 B |
| Crash category | 238,146 B | 238,541 B | 626,536 B | 626,536 B |

CSS gzip: 15,911 → 17,088 B. Route JavaScript increases by less than 0.2%.
No dependencies, large new assets or animation libraries were added. Native lazy
loading and route-only game engines are preserved. Current image configuration
still uses existing static derivatives; image-optimization infrastructure is not
changed by this milestone.

Single-sample local LCP proxies: homepage 276→416ms, lobby 1548→188ms, Crash
268→280ms; CLS proxy was 0 in every sample. These timing differences are noisy,
not a claimed speedup or a field Core Web Vitals certification. Cold proxy image
request totals vary with preload reuse and native lazy-loading thresholds.

## Remaining verification / limits

Full four-size, three-locale visual checks and hosted release verification follow
the stable checkpoint. Browser resizing is not physical low-end-phone testing;
keyboard/focus checks are not a complete screen-reader/WCAG audit. Provider artwork
continues to require existing rights approval; generic Blackjack Live retains the
neutral fallback. Existing gameplay, affiliate and legacy Sports limitations are
unchanged. No new operator relationship, backend, analytics or external capability.
