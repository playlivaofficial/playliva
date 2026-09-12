# PlayLiva

Source of truth: https://github.com/playlivaofficial/playliva.

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

The existing `/[locale]/play` discovery page remains; only its category shortcuts
changed. Nested `/[locale]/play/...` routes need no preparatory routing changes.
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
Other unfinished play slugs remain 404/noindex. Existing discovery surfaces
have not been expanded to advertise the game.
