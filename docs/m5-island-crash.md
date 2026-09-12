# M5 — PlayLiva Island Crash

Work branch: `codex/m5-island-crash`. Do not integrate into main until the complete
game, browser acceptance, CI and deployment checks in the approved M5 brief pass.

## Checkpoint 1: assets

All eight original GLBs remain byte-for-byte unchanged. `runtime/manifest.json`
records full SHA-256 hashes, exact sizes and clip mappings. Regenerate derivatives
with Node 24.20.0 / pnpm 10.30.3: `pnpm install --frozen-lockfile`, then
`node scripts/crash-assets.mjs`. Sharp 0.35.4 is a development-only image tool.

Every source contains one mesh, one primitive and one material. The two static
base exports have no skeleton or animation and are unsuitable for direct clip
binding. Each animation export embeds a complete rigged mesh and the same two
textures. Within each character, all node hierarchies/rest transforms, skin
weights, geometry, inverse binds and materials match exactly. The generator
asserts this before combining any clips; no retargeting is performed.

One rigged idle model per character is retained, with 28 joints each. Castaway:
25,604 vertices / 20,847 triangles. Kicker: 30,369 vertices / 26,061 triangles.
Animation names are normalized to idle/react/flying/crash and idle/kick. All
substantive source keyframes are unchanged. The duplicate 0.067-second static
export artifact is excluded. Each named motion has distinct animation data.

The duplicated 2K color and 4K packed metallic/roughness PNGs become 2K quality-85
WebP color and 1K lossless WebP material maps. `EXT_texture_webp` explicitly
declares the decoder requirement. Geometry and skin data are preserved; no
Draco/Meshopt decoder or geometry approximation is introduced.

| Payload | Exact bytes |
| --- | ---: |
| Eight source GLBs | 135,344,240 |
| Runtime castaway, all four clips | 3,725,264 |
| Runtime kicker, both clips | 3,762,916 |
| Runtime total | 7,488,180 |

This removes 94.47% of the source payload. Initial raw game-character load:
7,488,180 bytes; deferred character animations: zero (clips are bundled with
their one reusable rig). Ordinary discovery routes load zero character bytes.
Browser transfer and rendering measurements are recorded below.

## Checkpoint 2/3: route and engine

The three localized `/play/crash` routes reuse M4's provider, wallet, compact
shell and eligible Play Real surface. Only the client game dynamically imports
Three.js 0.186.0 and GLTFLoader. Other discovery pages are untouched. The runtime
supports WebP through its documented `EXT_texture_webp` loader extension.
Unknown play slugs remain 404/noindex; only Crash enters the sitemap.

The engine follows ready → preparing → kick → flying → cashed_out/crashed →
settled → ready. Preparation takes 650ms, kick 1500ms, result 3200ms and reset
transition 600ms. The kick animation runs at 2.1×: its extended-foot contact
near source time 2s aligns with the shared 950ms impact marker. Rendering never
settles money. Normal animation crossfades take 220ms; reduced motion removes
camera shake, flight sway, moving scenery and burst particles.

One uint32 sample from `crypto.getRandomValues` chooses the crash before debit
and flight. `max(100, min(10000, floor(97 / (1 - u))))` gives a demo inverse
survival distribution (roughly 97% / multiplier), with a 100× ceiling. Outcomes
are local, not authoritative or certified. Multipliers use integer hundredths;
payout uses integer multiplication/division and rounds down to whole credits.

Start reserves wallet capacity for the maximum possible return and two history
entries. Invalid inputs/RNG failures spend nothing. A transient M4 wallet round
lock blocks reset and unrelated mutations during risk. Synchronous engine guards
prevent re-entry from wallet notifications, repeated starts/cashouts and stale
round IDs. Terminal state is set before credit. Auto cashout uses absolute
deadlines, so an earlier target still wins if a hidden tab skips the flight.
Equality with the crash point loses. A regression caught and fixed floating-point
subtraction at that equality boundary.

Reload creates a ready engine around persisted M4 credits/transactions: the
spent stake remains spent, no active round resumes and no refund or second
settlement occurs. Session transaction history persists; the 12-flight visual
strip describes only completed rounds in the current visit. No parallel wallet
or persistence schema was added.

Initial browser smoke: both textured characters load, a loss and manual cashout
complete, rejecting optional analytics does not stop play/Play Real, and the
320px compact view keeps the primary button above the existing bottom nav.
No browser renderer errors were logged. Full visual/interaction acceptance and
production performance measurements are still required before main integration.

## Presentation and browser acceptance

The original procedural world uses sunny ocean/beach colors, curved palm leaves,
jungle hills, rocks, unnamed scenic islanders, depth-dependent moving scenery,
wind streaks and restrained leaf/dust bursts. There is no fake player telemetry.
The castaway's supplied dazed clip is grounded using measured mesh lower bounds;
no source animation is edited. A CPU pose regression loads the actual rigs and
checks foot-to-body contact at the shared impact marker. Cashout locks the result
immediately while flight presentation continues briefly. Sound defaults off;
optional short oscillator cues are original, with no downloaded audio. Haptics
are optional/capability-gated. Reduced motion disables camera shake, particles,
wind and scenery movement. Rendering failure never controls settlement.

Actual browser checks covered desktop (1280px), tablet (768px), 390px phone and
320px. The 320px viewport had matching client/scroll widths (305px excluding
the scrollbar) and a 247px-wide, 60px-high primary action. Both textured models
load without an initial T-pose; idle, kick, panic flight and dazed transitions
were inspected. Initial palm shapes, narrow-screen layout and dazed grounding
were corrected within M5. English, Portuguese and Spanish controls/results were
exercised. Portuguese accepts a comma auto target, and displays localized
multiplier separators. Browser round evidence includes natural 1.00x losses,
longer 2.88x flights, manual 1.03x cashout, automatic 1.10x and Spanish 3.00x
cashout (100 stake, exactly 300 returned). Repeated rounds return to ready.

Reset restores 10,000 credits; a 10,001 stake is rejected without spending.
During a 250-credit round, reset/stake controls were disabled; reload retained
the debit and returned ready without refund/resume. Rejecting analytics allowed
gameplay and the approved Play Real link. The Crash conversion copy explicitly
describes real-money crash games and says this Original is not available there.
No operator record, destination, campaign identifier or GEO rule was changed.

## Performance and limits

A fresh local production origin measured 5,484,517 bytes of same-origin transfer
through the first character frame: 4,982,851 encoded character bytes and 365,470
encoded JavaScript bytes. Character decode/load to first rendered frame took
489ms; the first 180 visible frames had a 16.8ms 95th-percentile interval. These
are local desktop measurements, not WAN or physical Android benchmarks. There
are no deferred character clips; all six clips share two rigged runtime models.
The renderer is dynamically imported only by Crash. The production route crawl
checks that ordinary pages do not preload/include its renderer or controller
chunks. Source GLBs are never requested by gameplay.

WebGL and WebP support are required; unsupported/load-error states disable Start
and offer retry. The 7.49MB raw character payload and approximately 47,000
character triangles remain meaningful on slower devices. DPR is capped at 1.5,
shadow maps are avoided, and resources are disposed on unmount. Physical low-end
Android, actual vibration hardware and subjective audio loudness still require
device testing. Reduced-motion behavior is implemented but not verified using a
physical device preference. No claim of universal frame rate or casino readiness
is made. Local DOM performance counters contain no identifiers and are never
sent as analytics.

## Verification and delivery

Node 24.20.0 / pnpm 10.30.3. The complete gates are frozen install, lint,
typecheck, all Node/DOM tests, production build, route/content crawl and
`git diff --check`. The suite preserves all 30 pre-M5 tests and adds asset,
engine, route/copy and actual-rig contact coverage. The crawl covers 246 public,
legal and legacy URLs plus unknown play routes and affiliate fallback probes.
It checks localized canonical/hreflang/x-default, sitemap boundaries, consent
script exclusion, Sports archive rules and runtime bundle isolation.

Known baseline warnings remain: three ESLint warnings (country context/header
effects and an unused JSON-LD suppression), Next's middleware deprecation and
pnpm's blocked optional dependency build scripts. No warning budget or quality
gate was weakened. Added dependencies are Three.js 0.186.0, development types
0.186.0 and development Sharp 0.35.4; no broad game framework was added.

Checkpoint `97605ac38c855e6d82b4c33f643dc6eee5a9922b` passed hosted CI run
34695105113 and Vercel Preview deployment 2TtqBJJUVqEEYxU5utPWqgSb3wTt.
Final commit/CI/production evidence is provided in the delivery report because
the final commit cannot contain its own SHA. Review PR: #19.

Future real-money/casino work would require an authoritative server, secure
account/ledger and settlement, validated outcome/RTP design, independent game
testing, legal/regulatory review and operational security. None is implied by
this local entertainment game. Do not add deposits, withdrawals, multiplayer,
autoplay, additional games or certification claims under M5.

## Exact M5 file scope

- `app/[locale]/play/crash/page.tsx`
- `app/sitemap.ts`
- `components/originals/crash/crash-game.module.css`
- `components/originals/crash/crash-game.tsx`
- `components/originals/crash/island-scene.ts`
- `components/originals/play-game-shell.tsx`
- `components/originals/play-real-cta.tsx`
- `docs/m5-island-crash.md`
- `lib/originals/copy.ts`
- `lib/originals/crash/copy.ts`
- `lib/originals/crash/definition.ts`
- `lib/originals/crash/engine.ts`
- `lib/originals/crash/presentation.ts`
- `lib/originals/session.ts`
- `package.json`
- `pnpm-lock.yaml`
- `public/originals/crash/runtime/castaway.glb`
- `public/originals/crash/runtime/island-kicker.glb`
- `public/originals/crash/runtime/manifest.json`
- `README.md`
- `scripts/crash-assets.mjs`
- `tests/crash-assets.test.mjs`
- `tests/crash-contact.test.mjs`
- `tests/crash-engine.test.mjs`
- `tests/crash-routes.test.mjs`
- `tests/routes.mjs`
