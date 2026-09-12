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

This removes 94.47% of the source payload. Planned initial game-character load:
7,488,180 bytes; deferred character animations: zero (clips are bundled with
their one reusable rig). Ordinary discovery routes load zero character bytes.
Final browser transfers and rendering QA will be recorded after integration;
structural asset validation is not a claim of completed visual QA.

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

## Continuation

Continue on `codex/m5-island-crash`. Main must remain untouched until final M5
acceptance passes. Complete expanded browser QA (auto, repeated/reload/reset,
all locales, phone/tablet/desktop, animation contact/flight/crash polish), verify
bundle isolation and transfers, complete full gates, and record CI/Preview
evidence. Then update this report and only integrate the fully verified result.
Preserve existing discovery, Sports/LivaSports, GEO and partner attribution.
