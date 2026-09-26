# Three-game release review

Owner-approved release candidate, 27 September 2026. The owner visually approved all three games and authorized commit, push, PR, merge, production deployment and Search Console follow-up. The evidence below records the reviewed implementation before release; deployment and indexing outcomes are recorded separately during release.

## Review URLs

- Skuptu Levanta: http://127.0.0.1:3120/pt-br/play/skuptu-levanta
- Liva Samba Drop: http://127.0.0.1:3120/pt-br/play/samba-drop
- Liva Carnaval Gold: http://127.0.0.1:3120/pt-br/play/carnaval-gold

Replace `pt-br` with `en` or `es-mx` for the corresponding localized experience. These are local production-build previews, not deployed public pages.

## Implementation

- Skuptu: accepted real 3D gym, rigged lifter and barbell; synchronized heavy-lift failure and impact; virtual-credit crash with manual/automatic cashout. This continuation preserves the approved motion and grounding. A missing 1200×630 poster was made from the actual approved scene, with a title overlay, for discovery and sharing.
- Samba Drop: 8/12/16 rows, three risk levels, original symmetric payout tables, visible ball path and landing, localized probability table and controls. The outcome and visual path agree; one completed drop settles once.
- Carnaval Gold: 5×3 reels, 20 fixed lines, original symbols, Wilds, Mask-triggered free spins, persistent bonus meter up to ×5, retriggers and bonus summary. Normal/Turbo preserve draws and payouts. A transient bonus-draw failure now exposes the existing retry path without another paid debit or loss of remaining free spins.
- Shared: localized rules/paytables/settings, virtual-credit messaging, synthesized game audio with mute and lifecycle cleanup, existing verified affiliate destinations and market gating. Brazil offers appear only after completed rounds 3/6/9; Mexico receives neither those offers nor the Brazil sponsor.

The model and simulation methodology, all nine Samba payout tables, and Carnaval's one-million-paid-spin result are in [three-game-math.md](three-game-math.md). Carnaval's seeded estimate is 96.856432%; this is a simulation, not a certification or promise of returns. These are free virtual-credit games and PlayLiva accepts no bets or deposits.

## SEO and localization

All nine new pages have a unique public route, H1, title, description, self-canonical, reciprocal PT-BR/EN/ES-MX hreflang plus PT-BR x-default, Open Graph and Twitter metadata, a working 1200×630 image, breadcrumbs, factual VideoGame JSON-LD, indexable robots settings and sitemap entry. Each game has distinct visible explanatory paragraphs and localized rules. No invented ratings, offers or review counts were added.

Discovery includes the play hub, relevant categories, home/related-game placements and searchable Originals cards in the games catalog. Search no longer presents a misleading empty result when an Original matches but the provider reference catalog does not. PT-BR/ES-MX bonus labels and decimal separators were corrected.

Production targets (local implementation verified; post-deployment verification pending):

| Game | PT-BR | EN | ES-MX |
|---|---|---|---|
| Skuptu | https://www.playliva.com/pt-br/play/skuptu-levanta | https://www.playliva.com/en/play/skuptu-levanta | https://www.playliva.com/es-mx/play/skuptu-levanta |
| Samba | https://www.playliva.com/pt-br/play/samba-drop | https://www.playliva.com/en/play/samba-drop | https://www.playliva.com/es-mx/play/samba-drop |
| Carnaval | https://www.playliva.com/pt-br/play/carnaval-gold | https://www.playliva.com/en/play/carnaval-gold | https://www.playliva.com/es-mx/play/carnaval-gold |

## Verification

Exact local toolchain: Node **v24.20.0**, pnpm **10.30.3**. Package manifests, runtime pins and lockfile were not changed to accommodate the machine defaults.

| Check | Outcome |
|---|---|
| Frozen install | Pass |
| Lint | Pass; three pre-existing warnings |
| Typecheck | Pass |
| Unit/integration suite | 453 passed, zero failures |
| Production build | Pass |
| HTTP regression crawl | 414 URLs plus negative/fallback probes passed |
| Focused local SEO audit | 21 passed: nine new pages and 12 prior Original pages |
| Live production audit of prior Originals | All 12 canonical locale pages passed |
| Browser states | Setup/lift/failure for Skuptu; drop/path/landing for Samba; spin/anticipation/bonus/meter/retrigger/summary for Carnaval |
| Responsive coverage | 1440, 430, 390 and 320 widths |
| Affiliate cadence | 54 completed rounds across three games × BR/MX; passed 3/6/9 and inactive-round gating |
| Audio | One context per tested mounted game; mute suspends; unmount closes |
| Console/overflow | No errors or horizontal overflow in tested game scenarios |
| Production catalog search | All three full game names resolve to the correct playable route |
| Secret scan | Passed across 701 tracked and untracked repository files |

Artifacts are under ignored `social/output/three-game/`: `mission-*.log`, `local-all-seo.json`, `production-existing-seo.json`, `offer-browser-report.json`, `readiness/report.json`, `animation/report.json`, and screenshots in `readiness/`, `animation/`, `browser/`.

Browser QA uses desktop Edge with emulated viewport sizes and software WebGL, not physical mobile devices. The accepted Skuptu scene measured 47 draw calls / 32,374 triangles in its animation audit. Runtime character GLB is approximately 1.61 MB; each new share poster is below 300 KB. No new large environment texture was added in this continuation.

Existing warnings remain: effect state updates in `country-context.tsx` and `site-header.tsx`, an unused eslint directive in `json-ld.tsx`, and Next's middleware-to-proxy deprecation notice. The broad crawl reports 104/111 PT-BR entries using the central OG coverage rule; all nine new game share images are separately verified. No lint budget or TypeScript validation was weakened.

## Changed files

The complete uncommitted mission spans the three new `app/[locale]/play/` route folders; `components/originals/three-game-feature.tsx`, `three-game-search.tsx`, and `three-games/`; shared settings/discovery surfaces; `lib/originals/{levanta,samba-drop,carnaval}/`, the three-game audio/copy/definitions/SEO modules; home/product discovery and analytics type integration; sitemap; original source/runtime artwork; focused asset/math/QA scripts; and regression tests/fixtures updated for the new catalog entries and routes.

This continuation specifically added SEO content/schema and its audit/tests, catalog search cards, the Skuptu share poster and reproducible capture script, localized bonus labels/numbers, mobile meter wrapping, a bonus retry UI with regression coverage, and browser state/offer checks. It does not change the accepted Skuptu rig, crash math, settlement contract, affiliate destinations, locale/market separation or audio architecture.

## Release boundary

Repository: `https://github.com/playlivaofficial/playliva.git`; branch: `codex/three-game-mission`; base HEAD: `a573049f166d50a14bb1458db1cef3fa5cbecd88`. Origin was fetched and `origin/main` matched that base during this continuation. The worktree intentionally contains the uncommitted mission.

The required owner review and release approval are complete. At the time of this pre-release record, deployment, live verification and submission of the nine new canonical URLs remain pending. See [three-game-search-console.md](three-game-search-console.md) for the pre-release Search Console audit and post-release procedure. No localhost, query-string, redirect or preview URL has been submitted for indexing. Release hygiene removed workstation-specific source paths from the two asset export scripts; they now read the preserved repository inputs without changing approved runtime assets.

## Exact changed-file inventory

- `app/sitemap.ts`
- `components/catalog/catalog-explorer.tsx`
- `components/originals/capybara-feature.tsx`
- `components/originals/game-settings.tsx`
- `components/originals/island-crash-feature.tsx`
- `components/originals/mines-feature.tsx`
- `components/play-view.tsx`
- `lib/home/spotlight.ts`
- `lib/originals/analytics.ts`
- `lib/originals/discovery.ts`
- `lib/originals/game-help.ts`
- `lib/originals/slot-speed.ts`
- `lib/product-discovery.ts`
- `lib/tracking.ts`
- `tests/betsson-affiliate-ui.test.mjs`
- `tests/crash-routes.test.mjs`
- `tests/discovery.test.mjs`
- `tests/fixtures/redesign-protected.json`
- `tests/m10-product.test.mjs`
- `tests/m11-catalog.test.mjs`
- `tests/power-audio.test.mjs`
- `tests/product-redesign.test.mjs`
- `tests/roulette-integration.test.mjs`
- `tests/routes.mjs`
- `tests/seo-p0.test.mjs`
- `tests/spotlight-carousel.test.mjs`
- `app/[locale]/play/carnaval-gold/page.tsx`
- `app/[locale]/play/samba-drop/page.tsx`
- `app/[locale]/play/skuptu-levanta/page.tsx`
- `assets-source/originals/carnaval-gold/stage.png`
- `assets-source/originals/carnaval-gold/symbols.png`
- `assets-source/originals/levanta/Meshy_AI_Brazilian_Gym_Athlete_01a0df47_e50a_73a2_aa.glb`
- `assets-source/originals/levanta/Meshy_AI_Brazilian_Gym_Athlete_01a0df4b_6fc2_769c_9d.glb`
- `assets-source/originals/levanta/Meshy_AI_Brazilian_Gym_Athlete_01a0df4d_8e5c_7098_ac.glb`
- `assets-source/originals/levanta/poster-scene.png`
- `components/originals/three-game-feature.tsx`
- `components/originals/three-game-search.tsx`
- `components/originals/three-games/carnaval-game.tsx`
- `components/originals/three-games/entry.tsx`
- `components/originals/three-games/levanta-contact.ts`
- `components/originals/three-games/levanta-environment.ts`
- `components/originals/three-games/levanta-game.tsx`
- `components/originals/three-games/levanta-pose.ts`
- `components/originals/three-games/levanta-scene.ts`
- `components/originals/three-games/page-content.tsx`
- `components/originals/three-games/samba-game.tsx`
- `components/originals/three-games/three-games.module.css`
- `components/originals/three-games/use-audio.ts`
- `docs/skuptu-animation-review.md`
- `docs/three-game-math.md`
- `docs/three-game-release-review.md`
- `docs/three-game-search-console.md`
- `lib/originals/carnaval/config.ts`
- `lib/originals/carnaval/engine.ts`
- `lib/originals/carnaval/math.ts`
- `lib/originals/carnaval/simulation.ts`
- `lib/originals/levanta/engine.ts`
- `lib/originals/samba-drop/engine.ts`
- `lib/originals/samba-drop/math.ts`
- `lib/originals/three-game-audio.ts`
- `lib/originals/three-game-copy.ts`
- `lib/originals/three-game-definitions.ts`
- `lib/originals/three-game-seo.ts`
- `public/originals/carnaval-gold/club.webp`
- `public/originals/carnaval-gold/crown.webp`
- `public/originals/carnaval-gold/diamond.webp`
- `public/originals/carnaval-gold/drums.webp`
- `public/originals/carnaval-gold/fan.webp`
- `public/originals/carnaval-gold/heart.webp`
- `public/originals/carnaval-gold/jewel.webp`
- `public/originals/carnaval-gold/macaw.webp`
- `public/originals/carnaval-gold/mask.webp`
- `public/originals/carnaval-gold/note.webp`
- `public/originals/carnaval-gold/poster.webp`
- `public/originals/carnaval-gold/spade.webp`
- `public/originals/carnaval-gold/stage.webp`
- `public/originals/carnaval-gold/tambourine.webp`
- `public/originals/levanta/athlete.glb`
- `public/originals/levanta/manifest.json`
- `public/originals/levanta/poster.webp`
- `public/originals/samba-drop/poster.svg`
- `public/originals/samba-drop/poster.webp`
- `scripts/levanta-animation-qa.mjs`
- `scripts/levanta-motion-audit.mjs`
- `scripts/levanta-poster.mjs`
- `scripts/three-game-art.mjs`
- `scripts/three-game-assets.mjs`
- `scripts/three-game-browser-qa.mjs`
- `scripts/three-game-math-report.mjs`
- `scripts/three-game-offer-qa.mjs`
- `scripts/three-game-readiness-qa.mjs`
- `scripts/three-game-scenario-capture.mjs`
- `scripts/three-game-scenarios.mjs`
- `scripts/three-game-seo-audit.mjs`
- `tests/levanta-pose.test.mjs`
- `tests/three-game-seo.test.mjs`
- `tests/three-games.test.mjs`
