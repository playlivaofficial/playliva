# PlayLiva visual and product UX redesign

Baseline: M9, `f7a5a259182310a4fce0830ee4acb8f2ec395f3c`.
Scope: visual design, informational discovery, free-play navigation, accessibility
and localization. No commercial-funnel optimization or game-engine changes.

## Design and information architecture

- Midnight `#090f20`, layered navy surfaces, blue highlights and restrained lime
  for the free-play hero and selected lobby filters. Existing fonts and game art
  are reused; no dependencies, renderer imports or new asset downloads are added.
- Homepage: two internal hero actions (`/play`, `/games`), Island Crash spotlight,
  four featured Originals and a compact Mines entry, four priority categories,
  a clearly labeled provider catalog and a three-part discovery explanation.
  Existing comparisons, alternatives, market selections, operator block and
  responsibility content remain present. Operator components are unchanged.
- Desktop: Play, Games, Crash, Slots, Live Casino, Instant Games, external Sports;
  secondary pages in More. Compact widths use a two-column menu. Mobile bottom
  navigation: Home, Play, Games, Sports. All five game routes suppress that fixed
  navigation. Sports remains a same-tab link to `https://livasports.com`.
- Play hub: two featured cards above three supporting games at wide sizes;
  responsive single/two-column cards and functional all/type filters. Counts
  are announced, buttons expose selected state and no unfinished games appear.
- Categories: clearer page headers, category navigation and distinct Originals
  and provider sections. Cards show provider and category before the description.
- Game shell: balance and session surfaces, localized back-to-lobby link,
  improved session-control targets. Viewports, game controls, recent activity,
  help, wallet, outcomes and Play Real placement/behavior remain unchanged.
- Localized skip-to-content, focus indicators, Escape menu closure/focus return,
  reduced-motion handling and safe-area spacing supplement the mobile redesign.

## Blackjack taxonomy boundary

`discoveryCategory()` is a presentation-only override for `blackjack-live`.
Catalog filters, visible labels, category membership, breadcrumbs and related
internal category links now lead with Live Casino. Liva Blackjack's Original
feature moves from Table Games to Live Casino and explicitly says it is an
automated free-play demo, not a live dealer.

The indexed Table Games page remains a secondary archive, retaining its provider
content. No game slug, playable path, canonical, hreflang or sitemap URL changes.
The stored provider/Original categories and verified external referral context
remain `table-games`; `affiliateCategory` and every destination remain unchanged.
Never pass the presentation override into an affiliate resolver.

## Protected infrastructure

`tests/redesign-boundary.test.mjs` checks a normalized-text SHA-256 snapshot of
15 M9 files: resolver/data/eligibility, tracking/consent, Original referral
helpers and CTA, operator/outbound components, `/go`, SEO and sitemap. A future
authorized change to those systems needs a separately reviewed snapshot update.
Existing consent, exact-destination, unsupported-context and game-settlement tests
remain intact. The new CSS-only test shim matches the existing game UI harnesses;
it does not replace application logic or any assertions.

## Verification

Pinned toolchain: Node 24.20.0 / pnpm 10.30.3. Frozen install, lint, typecheck,
193 tests, production build, 258-route crawl and whitespace checks are the release
gates. The crawl checks indexed/localized routes, canonical/hreflang, breadcrumbs,
Original/provider separation, locale 404s, renderer isolation, Sports and exact
outbound redirects without following them to an operator.

Actual browser QA covers the production build, not just DOM unit tests:

- Twelve key PT-BR routes at 320×720, 360×800, 390×844 and 1440×900: homepage,
  lobby, catalog, four priority categories and all five Originals.
- The same twelve EN and ES-MX routes at 320px.
- No document horizontal overflow in the 72-route/viewport matrix. The category
  strip has intentional contained scrolling. Primary game actions stay reachable
  and mobile bottom navigation is absent on game routes.
- At 320×720, primary action bottoms measured approximately 700px (Crash),
  637px (Capybara), 594px (Blackjack), 606px (Roulette), 707px (Mines).
- Actual lobby filtering, mobile menu targets (44px minimum), and rendered
  free-play round start/reset were checked. Desktop and mobile screenshots are
  kept with the release evidence outside the source repository.

Hosted CI, deployed SHA and final production evidence are recorded in the final
release report; local gates alone do not prove hosted delivery.

## Limits

Responsive browser testing is not physical-device/low-end-phone certification
or a complete screen-reader/WCAG audit. Provider artwork still follows existing
rights-approval rules; generic Blackjack Live correctly retains its neutral
artwork fallback. Existing affiliate limitations and gameplay mechanics are
intentionally unchanged. No new backend, analytics or operator approval is added.
