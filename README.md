# PlayLiva

Source of truth: https://github.com/playlivaofficial/playliva.

[M10 product redesign](docs/m10-product-redesign.md) continues the released visual
foundation with provider/editorial layouts, localized detail metadata, compact
catalog cards, delivery measurements and explicit unchanged-game regression checks.

The current [visual and product UX redesign](docs/product-ux-redesign.md) separates
the free-play lobby from provider discovery, refreshes responsive navigation and
uses a display-only Live Casino classification for Blackjack. Older milestone
notes below describe their original release states. Commercial infrastructure,
game engines and existing SEO URLs are unchanged by this redesign.

Next.js 16.3.0 App Router, React 19, TypeScript and Tailwind CSS 4. Application
routes live in `app/`, UI in `components/`, static data/content in `lib/`, and
runtime assets in `public/`. Immutable authoring inputs that must not be served
live under `assets-source/`. Read `AGENTS.md` before making changes.

## Setup

Use **Node.js 24.20.0** (`.nvmrc`) and **pnpm 10.30.3** (`packageManager` in
`package.json`). Node version managers that support `.nvmrc` can use `nvm use`;
on Windows, select `nvm use 24.20.0` after installing that version. Install the
pinned package manager with `npm install --global pnpm@10.30.3`, or use an
existing Corepack installation that honors `packageManager`. Check which
executable is on PATH if the reported version differs. Do not use pnpm 11 for
this checkout: its override configuration format differs from this lockfile.

```sh
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:3000. No environment file is required. `.env.example`
documents only the three known optional public variables; it intentionally
contains no active assignments. If needed, copy it to `.env.local` and supply
authorized values. Keep the site URL unset to preserve the existing default;
an empty assignment is not equivalent to an unset variable. Never commit local
environment values. Variables prefixed `NEXT_PUBLIC_` are public, not secrets.

## Quality gates

Run in this order, including before proposing a commit:

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:routes
git status --short
```

Typecheck first generates Next.js route declarations, so it works on a fresh
checkout before the first dev/build run. Production builds also validate
TypeScript; there is no error bypass. The build needs network access to Google
Fonts for the existing font configuration. Do not change fonts to work around
a restricted environment. `pnpm start` serves the production build locally.

ESLint uses the Next.js Core Web Vitals and TypeScript flat presets, with
`eslint-config-next` pinned to the framework version. ESLint 9 is used because
the bundled React and accessibility plugins declare compatibility through 9,
not 10. The registry currently marks this ESLint release deprecated; reassess
the compatible tooling stack in a dedicated dependency maintenance task.

The baseline has **three visible warnings** and a maximum-warning budget of
three: synchronous effects in `country-context.tsx` and `site-header.tsx`, and
an existing unused suppression in `json-ld.tsx`. Only those two component files
downgrade `react-hooks/set-state-in-effect` to warning; all other preset errors
remain blocking. Resolving these warnings is follow-up work, not permission to
change GEO or navigation behavior. Do not raise the warning budget to pass CI.

GitHub Actions runs the quality gates on pull requests, pushes to `main`, and
manual dispatch, with the same Node/pnpm pins. It does not deploy or require
application secrets. Repository administrators must separately configure any
required branch checks. A local green run does not prove a hosted CI run.

`pnpm test` runs isolated Node/DOM trust checks for affiliate eligibility,
consent transitions, contact drafts and metadata. JSDOM does not execute or
download third-party analytics scripts; its opaque test sentinel is never an
application GA ID. `pnpm test:routes` starts/stops a local production server,
crawls all sitemap/legal/sports URLs, checks content tokens, canonicals,
localized breadcrumbs, noindex/404s and safe affiliate fallbacks. It never
follows outbound affiliate redirects. Both checks also run in CI.

Analytics is opt-in: GA4, Vercel Analytics and custom events require analytics
consent. Reopen Cookie preferences in the footer to change it. Revocation
blocks future events; events discarded without consent are not replayed.
Marketing preferences remain stored, but no advertising/GTM tags are introduced.
Partner navigation and required commission attribution work without analytics.
Configured base/category/offer URLs and partner-issued `trackingTemplate`
parameters are functional and retained regardless of consent. Put only optional
measurement in `analyticsTrackingTemplate`, which requires analytics consent;
never put required affiliate/campaign IDs there or reuse functional parameter
keys. Both templates support the documented context tokens. No operator has an
analytics template configured currently. Existing partner records remain unchanged.
Google revocation uses its documented [opt-out flag](https://developers.google.com/tag-platform/security/guides/privacy),
alongside consent updates. Vercel's `beforeSend` callback checks the current
choice even if its script was previously loaded.

`node_modules/`, `.next/`, `next-env.d.ts` and TypeScript build caches are
generated and ignored. Keep `pnpm-lock.yaml` committed. Update it with the
pinned pnpm only when intentionally changing dependencies; use frozen installs
for normal development/CI. pnpm may report blocked build scripts for transitive
`msw`/`unrs-resolver`; the verified gates do not need those scripts, and they
must not be broadly enabled just to silence the notice.

Vercel manages Node minor/patch releases within the selected major version.
`engines.node` therefore declares `24.x` compatibility; `.nvmrc` and GitHub CI
still pin Node 24.20.0 for reproducible development. Keep pnpm pinned to 10.30.3
and keep `.npmrc` strict checks enabled. An exact Node patch in `engines.node`
blocks Vercel installs when its managed Node 24 release differs.

## Current boundaries

URL locales are `/en`, `/pt-br` and `/es-mx`; selected market is independent.
Affiliate redirects use `/go`, static operator eligibility and source data.
Legacy PlayLiva Sports pages remain an unpromoted demo archive. The contact form opens a draft in the visitor's email
app and has no delivery backend or sent-message confirmation. Do not
mistake those existing limitations for a request to implement product changes.
Vercel project/environment/domain settings are managed outside this repository;
the canonical-host redirect is owned there. No deployment is part of setup.

## M3 structure and transition boundaries

Discovery categories are Crash, Slots, Live Casino, Table Games and Instant
Games. Mines/Plinko are Instant Games; Blackjack Live is Table Games. Game
slugs remain stable. Blackjack retains its verified live-casino commercial
classification via `affiliateCategory`; discovery changes do not grant new
operator/category approvals or alter partner URLs.

Sports in desktop/mobile navigation and the fourth homepage card links directly
to `https://livasports.com` in the same tab, without locale paths or affiliate
tracking. It is a cross-network entry, not an internal discovery category.
Table Games and Instant Games remain available through navigation and the game
explorer. Legacy Sports pages have no betting actions. Existing
localized Sports landing and detail pages remain HTTP 200/noindex and outside
the sitemap. Crawlers can still access them to read the noindex directive. All
show archive/demo notices. Their URLs are preserved for a future explicit
LivaSports redirect; a verified target and route mapping require separate approval.

M3 preserved `/[locale]/play`; M5.2 now makes it the dedicated Originals hub.
Nested `/[locale]/play/...` routes need no preparatory routing changes.
No public free-game placeholders, balances, Play Real flows, Originals sections,
or M11 homepage features were added by M3 or M4.

## M4 shared Free Play foundation

Read [the Originals integration contract](docs/originals.md) before building a
game. Reusable wallet/session logic lives in `lib/originals/`; the isolated
provider, game shell and Play Real component live in `components/originals/`.
M4 itself registered no games or public play URLs. M5 now reuses this foundation
for the three localized `/play/crash` routes, with a route-only Three.js renderer.
Read [the Island Crash implementation report](docs/m5-island-crash.md) for the
round engine, asset regeneration, verification and local free-play limitations,
and [the M5.1 hardening report](docs/m5.1-island-crash-hardening.md) for the
production-oriented visual and delivery pass.
Other unfinished play slugs remain 404/noindex.

## M5.2 Originals discovery and sky flight

The localized `/play` hub features exactly one playable Original, Island Crash.
The homepage hero and feature section, desktop/mobile Play navigation and the
separate Crash category block lead to the existing localized game. Lightweight
poster-only discovery never imports the game renderer or provider-game data.
The same milestone synchronizes contact and launch, strengthens upward flight
and follows the castaway into the sky without changing RNG, multiplier math or
wallet settlement. See [the M5.2 implementation and QA report](docs/m5.2-discovery-and-flight.md).

## M5.3 final Island Crash polish

M5.3 refines the actual foot-contact marker, immediate upward blast, continuous
visual fall and 220ms impact-to-ready beat. The outcome and payout are already
frozen during the fall. New runtime derivatives retain source rigs/keyframes
and reduce the two models to 4.42 MB raw / 2.78 MB gzip, with a lightweight
tropical loading poster. Discovery and the shared wallet remain unchanged.
See [the M5.3 implementation and QA report](docs/m5.3-final-crash-polish.md).

## M5.4 continuous round and decimal credits

Cashout now settles only the player's wager. The visible round keeps flying to
its original crash point, followed by the unchanged M5.3 fall/impact/reset.
The action shows a live two-decimal return and then a disabled, locked payout.
Wallet schema v2 uses integer hundredths with a validated, one-time v1 migration;
no floating-point balance accounting is introduced. See the
[M5.4 implementation and QA report](docs/m5.4-continuous-cashout.md).

## M6 Liva Capybara Gold

The second playable Original lives at `/[locale]/play/capybara-gold` and joins
Island Crash in the Play hub and homepage. The Slots category has a separate
Originals block; no provider data or partner approvals are changed. Its 5×4
grid uses 1,024 adjacent ways, deterministic Wild multipliers and eight Jungle
Bonus free spins with a persistent multiplier. It reuses the local fixed-point
wallet and truthful Slots Play Real boundary. See [the math, artwork and QA
report](docs/capybara-gold.md). Offline tools:

- `node --import tsx scripts/capybara-simulate.mjs 1000000 6242026`
- `node scripts/capybara-assets.mjs` regenerates small WebP derivatives.
- `node scripts/capybara-visual-qa.mjs` serves isolated deterministic scenarios
  on localhost:3103, using the real game component with test-only outcomes.
- `node scripts/capybara-performance-qa.mjs` proxies a local production preview
  on :3102 to :3104 and adds a visible, local-only timing/resource report.

No public debug/simulation UI is shipped. Unknown unfinished play slugs remain
404/noindex. Existing Island Crash gameplay and character assets are unchanged.

## M7 Liva Blackjack

The third Original is available at `/[locale]/play/blackjack`, with separate
Play hub, homepage and Table Games discovery. Its actual six-deck local shoe
uses secure Fisher–Yates, S17, natural 3:2, Double After Split and at most three
hands. Code-owned SVG cards/table art keep the lazy game lightweight. All
wagers use the shared integer-credit wallet; unfinished reloads are not refunded
or resumed. See [the rules, architecture and verification report](docs/blackjack.md).

- `node --import tsx scripts/blackjack-simulate.mjs 1000000 7132026` runs seeded,
  offline engine verification, not an RTP/basic-strategy certification.
- `node scripts/blackjack-visual-qa.mjs` serves the real component with isolated
  deterministic scenarios on localhost:3105. No public outcome override exists.
- `node scripts/blackjack-performance-qa.mjs` adds a visible local timing report
  on :3106 to an existing production preview on :3102.

Blackjack Play Real explicitly recommends the separately verified external
Blackjack Live listing where approved. It does not claim the Original exists
at an operator or grant blanket Table Games eligibility.

## M8 Liva Roulette: Golden Orbit

The fourth Original uses European single-zero roulette on `/[locale]/play/roulette`.
The Play hub, homepage, Table Games and an explicitly non-live Live Casino context
link to the free-play demo without adding provider records. A lightweight owned
SVG wheel presents predetermined cryptographic outcomes; 155 canonical bets use
the shared integer wallet with one debit and at most one return per ticket.
Mobile uses separate outside, paged-number and precise inside-bet surfaces.
See [the rules, architecture and verification report](docs/roulette.md).

- `node --import tsx scripts/roulette-simulate.mjs 1000000 8132026` runs seeded
  developer verification and all-bet mathematical return derivation, not certification.
- `node scripts/roulette-visual-qa.mjs` serves isolated real-component scenarios
  and visible frame-step controls on localhost:3107. No public overrides exist.
- `node scripts/roulette-performance-qa.mjs` adds visible local timing/resource
  evidence on :3108 to an existing production preview on :3102.

Play Real only recommends the separately verified external Lightning Roulette
listing where the existing operator, exact game, Live Casino and selected GEO
approvals permit it. No Liva Roulette availability is claimed at any operator.
Plinko and other unfinished slugs remain 404/noindex.

## M9 Liva Mines: Jungle Gold

The fifth Original is playable at `/[locale]/play/mines`. Its 5×5 jungle board
supports 1/3/5/7/10 mines, immediate safe reveals, an ordered golden Treasure
Trail and a live Cash Out return. All mine positions are generated before play
using cryptographic rejection sampling and partial Fisher–Yates. Exact
combinatorial probability, one centralized 3% demo edge and integer-credit
settlement stay outside rendering. The next round is ready 600ms after a result.

The Play hub, homepage and separate Instant Games block include localized
discovery and owned lightweight SVG art. Instant Games has no approved category
destination today, so Play Real truthfully shows no eligible operators. It does
not borrow the provider Mines listing or the Blackjack/Roulette exceptions.
See [the math, architecture, payload and QA report](docs/mines.md).

- `node --import tsx scripts/mines-simulate.mjs 100000 9132026` verifies 100,000
  layouts per mode, position frequency and exact combinatorial progression.
- `node scripts/mines-visual-qa.mjs` serves local-only real-component scenarios
  and visible presentation-clock controls on :3109. No public overrides exist.
- `node scripts/mines-performance-qa.mjs` adds a visible timing/resource report
  on :3110 to an existing production preview on :3102.

Reloading an active round keeps the stake spent, drops the unfinished board and
starts ready without refund/resume/payout. No new dependencies or runtime pin
changes were needed. Plinko/M10 is not included.
