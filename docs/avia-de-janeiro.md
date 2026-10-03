# Avia de Janeiro — approved release candidate

Base: `470727d32a387f7a10957b7ed1b83f6fcbc21dd8`. Branch: `codex/avia-de-janeiro`.
Owner visual/gameplay approval, including Ipanema Grand Tourer, was granted on 2026-10-03.
The complete PR/CI/Preview/merge/Production verification workflow is authorized.

## Play and review

Use the pinned Node 24.20.0 and pnpm 10.30.3, frozen install, then `pnpm dev`.
Open `/pt-br/play/avia-de-janeiro`; English and Mexican Spanish use `/en` and `/es-mx`.
The running approval preview uses port 3133 and the production build, with isolated local storage.
Settings contains Music, SFX and Rules. Reset Balance retains the shared confirmation flow.
The automatic cycle is boarding (6.5 seconds), flight, result (at least 2.8 seconds), then boarding.
One optional wager per flight, 1–50 virtual credits; optional auto cashout from 1.01× to 100×.
There is no steering, automatic betting, deposit or real-money payout.

The owner selected candidate C, Ipanema Grand Tourer, for local integration on 2026-10-03.
Its original AI-generated transparent master remains byte-for-byte intact in
`assets-source/avia-de-janeiro/aircraft-ipanema.png`; the runtime transparent WebP is
`public/originals/avia-de-janeiro/aircraft-ipanema.webp` (177,174 bytes, 1536×1024).
The selected pearl/teal jet uses dimensional painted materials; it is a 2.5D sprite,
not a runtime 3D model. The original Rio scenery and procedural audio remain unchanged.
Flight presentation uses smooth forward acceleration, bounded subtle banking and two
faint engine-local trails, with reduced-motion support. Presentation never settles a round.
Artwork: `public/originals/avia-de-janeiro/poster.webp` (50,092 bytes) and its SVG source.
Only the aircraft illustration changed in the existing card/share composition; metadata,
URLs, Rio background, branding text and layout remain unchanged.
`node --import tsx scripts/avia-assets.mjs` deterministically rebuilds the runtime WebP
and card/share artwork from the preserved master. The lazy-loaded game adds no dependencies,
third-party models, video or downloaded audio. The final in-game aircraft is owner-approved.

## Authority, persistence and limitations

`lib/originals/avia/engine.ts` reuses existing crash distribution, growth and integer-credit
payout primitives. The server chooses the crash point before takeoff. Future crash point and
deadline never appear in responses. Server processing time decides manual cashout; equality
with the crash deadline loses. Auto cashout below the crash point wins by its deadline even
when the next request arrives after the crash. Auto and manual settlement are idempotent.

Production uses the existing Neon connection (`OWNER_DATABASE_URL`) and a separate
`playliva_owner.avia_sessions` table, with database time and optimistic revision checks.
No owner/SEO/social document is changed. Vercel Preview and Production use separate row scopes.
The idempotent build preflight provisions only the Avia table/index in Vercel, where the
existing write-only database secret is available. It fails the deployment if provisioning
fails. Local/GitHub builds skip this operation and do not require database credentials.
The HttpOnly, SameSite Strict guest cookie is opaque and Secure on Vercel; the database stores
its SHA-256 key. Requests require the expected origin. Production fails closed if storage is
unavailable; it never falls back to process memory. A non-Vercel workstation uses ignored
`.local/avia` documents and exclusive file locks. No new environment variable or secret is needed.

The **existing demo wallet remains browser-local**, shared with other Originals; it is not a
server-backed account or an anti-cheat balance. The server alone decides Avia outcomes and
issues sequenced receipts. Wallet balance and receipt cursors persist atomically; Web Locks
serialize Avia receipts across supported browser tabs. Existing cross-tab/memory-only wallet
limitations remain. Clearing browser storage/cookies does not preserve an account balance.
The API retains the latest 100 receipts and 12 round results; missing receipt history fails
closed instead of inventing a payout. Guest session rows are not automatically purged.

Offline manual cashout cannot succeed. Confirmed automatic targets remain effective, with
settlement materialized on the next server request. Interpolated flight visuals freeze on a
stale connection and cannot award credits. This is a single-player guest flight stream, not
a multiplayer synchronized room. There is no fairness certification or cryptographic proof UI.

## Shared integrations

- Same shell, balance, settings, reset safety and localized Rules as current Originals.
- The existing eligible Brazil sponsor/offer and `/go` attribution are reused without
  changing operator data, campaign configuration or partner destinations.
- The existing engagement trigger holds the next flight at settled 3/6/9 boundaries.
  Dismissal releases the hold; future milestones remain enabled. Settings can also hold the
  next flight, but never pause a flight in progress. No second popup store was added.
- Existing consent-controlled game and commercial analytics carry the Avia slug, locale,
  category and round/milestone context. GEO Preview events retain existing QA isolation.
- Catalog/search, Play hub, crash category, spotlight, related games and provider discovery
  include Avia. Search resolves “Avia”, “Janeiro” and the full name in all locales.
- Three indexable localized pages have unique titles/descriptions, canonical/hreflang,
  original share artwork, visible rules/content, BreadcrumbList and factual VideoGame schema.
  Sitemap total: 316. No ratings or real-money claims were invented.
- Owner Growth inventory and game filters contain 13 Originals, including Avia. The SEO
  opportunity engine uses the same inventory rules as other Originals; no experiment was
  created and the existing provider-page-only automatic title policy was not expanded.
- Automatic video production remains OFF, expected daily videos zero. Avia is excluded from
  even the dormant 12-game generation catalog. No render, upload or social job was started.

## Verification evidence

Local checks completed on 2026-10-02:

- Frozen install, lint, typecheck, full tests (559/559), production build.
- Route crawl: 417 public/legal/demo URLs plus locale 404, affiliate fallback and Owner GEO checks.
- Complete rendered sitemap audit: 316/316, zero failures, duplicate metadata or orphan pages.
- `node scripts/avia-qa.mjs`: localized SEO, share images, inbound links and local HTTP security/
  idempotency checks; eight parallel identical bet requests produce one debit.
- `tests/avia-server.test.mjs`: 16 concurrent cashouts produce one durable payout.
- Engine/receipt tests cover exact crash equality, stale IDs, input bounds, delayed reconnect,
  manual/auto races, duplicate settlement, wallet reload/reset and independent guest cursors.
- Shared offer tests cover 3/6/9 and non-BR suppression. Actual Brazil preview showed cycles
  3/6/9 as exposures 1/2/3, all in result state, with next flight held until dismissal.
  Instant 1.00× flights also count through the same trigger; no visible flight frame is needed.
- Browser widths 320/390/430/1440: no document overflow; readable plane/HUD; settings/reset
  adjacent; mobile buttons 44px high and text inputs 48px high. Rules and 320px offer fit.
- Browser manual cashout, auto cashout (10 credits → 12 credits at 1.20×), boarding reload,
  active-flight reload, no duplicate debit/payout, reset cancel/confirm and audio toggles checked.
- Audio lifecycle regression covers separate mix switches, repeated rounds, hiding and disposal.
- All three languages rendered in the browser without overflow. Non-BR public pages expose
  no commercial ad elements; final production-mode browser logs contain no errors. Reloading
  an already-started flight does not emit another analytics start event.
- Local HTTP response samples for the three game pages: 24–29ms, 61–63KB HTML. These are warm
  workstation measurements, not mobile-network benchmarks or Core Web Vitals field data.

Evidence stays ignored in `.local/avia-qa`, gate logs in `.local`, and the full crawl report in
`social/output/seo-v2/avia-local-audit.json`. No secrets belong in any tracked report.
Baseline warnings remain: three existing ESLint warnings, Next middleware deprecation and
four existing owner-server filesystem tracing warnings. No new warning or suppression added.

Repeat checks: `pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test:routes`,
`pnpm social:secrets`, `git diff --check`. Set `AVIA_QA_URL` for the focused HTTP script and
`SEO_AUDIT_URL`/`SEO_AUDIT_NAME` for `node scripts/seo-discovery-audit.mjs`.

## Candidate C integration — 2026-10-03

Incremental files for the aircraft revision (all earlier Avia work was preserved):

- `assets-source/avia-de-janeiro/aircraft-ipanema.png`
- `components/originals/avia/art.tsx`
- `components/originals/avia/aircraft-motion.ts`
- `components/originals/avia/avia.module.css`
- `components/originals/avia/game.tsx`
- `public/originals/avia-de-janeiro/aircraft-ipanema.webp`
- `public/originals/avia-de-janeiro/poster.svg`
- `public/originals/avia-de-janeiro/poster.webp`
- `scripts/avia-assets.mjs`
- `tests/avia-aircraft.test.mjs`
- `docs/avia-de-janeiro.md`

Five new checks cover continuous takeoff, bounded speed/banking, departure continuity,
reduced motion and the exact approved master hash/transparent runtime margins.
All 18 focused aircraft/Avia tests and the final full suite (564/564) pass. Frozen install,
lint, typecheck, production build, 417-route crawl, 316-page SEO audit, secret scan and
diff hygiene pass on Node 24.20.0 / pnpm 10.30.3. Existing lint/build warnings remain.
One full run hit the unchanged randomized Capybara pitch test's rounding assertion;
its isolated rerun and the subsequent full suite passed. No unrelated test was altered.

Browser QA at 1440/430/390/320 confirms loaded artwork, no horizontal overflow,
44px-or-larger visible buttons and 48px inputs. The aircraft-only mobile placement and
bounded climb leave the upper wing clear of the HUD. A live flight through 30.18× showed
banking, speed response, settled departure and cleared exhaust, with no current-preview
console errors. A hash comparison of all 871 pre-revision source files found changes
only in the seven intended existing aircraft/artwork/documentation files; the four new
files account for the remainder. Rio source, API request/receipt/settlement flow, action
controls, procedural audio, analytics, affiliate configuration and SEO metadata are intact.
Local screenshots, source snapshots and scope/browser/flight evidence are ignored under
`.local/avia-aircraft-review`. No commit, push, PR, migration or deployment was performed.
The owner subsequently approved this integrated game for release on 2026-10-03.

## Deployment compatibility

Vercel's existing `OWNER_DATABASE_URL` is write-only outside deployments. The release
therefore runs `scripts/avia-build-preflight.mjs` before the normal build, reusing the
approved table/index migration with `CREATE ... IF NOT EXISTS`. It does not weaken
secret protection, copy credentials locally, modify existing owner data or add a public
migration endpoint. Four focused checks cover local/CI skipping, missing-config failure,
Preview/Production connection selection and the exact two additive DDL statements.
All 22 focused aircraft/game/storage/preflight tests and the final full suite (568/568)
pass. Frozen install, lint, typecheck, production build, 417-route crawl, secret scan and
diff hygiene also pass on Node 24.20.0 / pnpm 10.30.3. Hosted release checks follow below.

## Release sequence after explicit owner approval

1. Review the diff and gates; commit/push only this branch; open the normal PR.
2. Vercel's build preflight uses the existing database environment to create only the
   isolated Avia session table/index, without replacing or resetting existing data.
   Verify successful provisioning in Preview before merge and again in Production logs.
   The explicit `scripts/avia-storage-setup.mjs --apply` remains available where the
   authorized database environment is already accessible; do not weaken write-only secrets.
3. Require hosted CI and Vercel Preview, including live durable API/reconnect/concurrency
   checks. Local file-adapter tests do not substitute for real hosted Neon verification.
4. Merge using the normal merge commit workflow; verify main CI and Ready/Current Production
   on the exact merge SHA. Smoke all three routes, GEO/offer cadence, discovery and Owner.
5. Run production SEO audit; inspect PT-BR canonical in existing Search Console integration.
   Request conservative indexing only after production is live; record accepted separately
   from indexed. No mass submission or unrelated sitemap variant.

Production verification, hosted performance, database persistence and Google inspection are
release checks required after deployment. Nothing is claimed indexed before Google confirms it.
