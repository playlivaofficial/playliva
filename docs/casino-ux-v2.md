# Casino UX V2 — local owner review

Branch: codex/casino-ux-v2. Base: 3225d3978319e6b6b3d4025f259951adab7fdaf5 (production main, PR #40).
Owner approved local UX V2; final release adds only the requested toolbar placement of Reset Balance. Other worktrees and Social/Content Engine work were left untouched.

## Shared experience

One GameSettings component in PlayGameShell serves all nine Originals. A gear above the game opens a native modal with localized Settings/Rules, plus Paytable for the two slots. Native modal focus isolation, Escape, explicit close and focus return are retained. The close header stays visible while long rules scroll. The dialog fits 320px; numeric paytable rates stay on one line. Opening settings does not pause gameplay; speed is locked during a round. Settlement closes the panel so the existing affiliate offer can take focus.

Music, SFX and haptics use the existing session store and storage key. Legacy sound preferences migrate without losing the wallet or transactions. Slot speed is shared across slots, Normal by default. Fullscreen and haptics appear only when supported by the existing shell. Reset Balance sits beside Settings in one compact responsive toolbar, with exactly one trigger. Its existing confirmation, cancel, wallet safety lock and analytics are unchanged; the old session-panel placement was removed.

A shared useGameAudio hook applies independent preference gates to the music and SFX buses. Trusted interaction unlocks a single context for the mounted game. Gain automation/ducking cannot bypass a disabled preference. Engines retain their own procedural themes and timing. No new audio downloads, licences, packages or external services. Visibility, mute and unmount stop schedulers and dispose/suspend audio; preferences persist across games.

## Game changes

| Game | Refinement |
| --- | --- |
| Island Crash | Shared controls/rules, independent music/SFX and hidden-tab handling; launch/contact/cashout/landing logic and scene unchanged. |
| Liva Ginga | Shared controls/rules and bus preferences; football groove, contacts, grounding and crash reaction unchanged. |
| Capybara Gold | Normal default/Turbo, lazy paytable, existing tropical bonus cues plus quieter base music. |
| Liva Golaço | Same speed convention, lazy paytable, quieter stadium base music and stronger bonus music; crowd bed follows Music. |
| Traditional Blackjack | Card/reveal transitions, active-hand and result treatment, classic table ambience and card/chip/action/result cues. Avoid duplicate Hit/Split card cues; aggregate returns determine win/loss cue. No new game mechanics. |
| Liva 21 Brasil | Shared settings and structured localized rules; Power Rank, payouts and established sound identity retained. |
| Golden Orbit | Larger mobile wheel, usable controls/tabs, chip placement motion, decelerating tick schedule and last-ten result strip; original landing/result geometry preserved. |
| Liva Raio | Shared controls/rules; compact mobile wheel/boost board, 44px chip controls and four-column number layout at 320px. Electric feature unchanged. |
| Jungle Gold Mines | Shared controls/rules, distinct low tropical ambience and start/reveal/mine/cashout cues; risk and payout math unchanged. |

### Slot presentation timing

Times are milliseconds. Neither mode changes grid draws, awards, rounding, ledger entries or completed cycles.

| Timing | Normal, both slots | Capybara Turbo | Golaço Turbo |
| --- | ---: | ---: | ---: |
| First reel stop | 1200 | 800 | 700 |
| Gap between reels | 250 | 150 | 150 |
| Fifth stop before anticipation | 2200 | 1400 | 1300 |
| Additional anticipation | 720 | 560 | 620 |
| Base result hold | 850 | 400 | 400 |
| Bonus result hold | 1000 | 700 | 650 |
| Bonus win hold | 1600 | 1200 | 1150 |

Bonus intros remain 2200ms/2100ms. Timing is captured at the paid spin and retained throughout its bonus. Changing stored settings mid-series cannot retime that series. Turbo preserves the prior fast engine timing; Normal reel motion is slower.

## Rules consistency audit

Help is built from each game's existing localized runtime copy. Paytable numbers come directly from its frozen config, divided by the configured pay scale. Long text is split into readable points; both blackjacks explicitly explain card values and dealer behavior. Roulette bet coverage is explained separately from payouts. All text supports EN, PT-BR and ES-MX.

- Capybara: 5×4/1024 ways; normal Wild multiplier tiers; 3/4/5+ Suns award 8/12/20 spins; bonus Gold Multiplier capped at ×5; each bonus Sun adds one spin up to 50; per-spin cap 1000×.
- Golaço: 5×3/243 ways; Camisa Wild; 3/4/5+ Trophies award 8/12/20; Golden Ball raises persistent Goal Streak up to ×5; Trophy retriggers capped at 40 spins; per-spin cap 1000×.
- Traditional blackjack: six decks, soft-17 stand, 3:2 natural, split/double/ace restrictions and independent split settlement; all returns explicitly distinguish stake-inclusive amounts.
- Brasil 21: six freshly shuffled decks, dealer soft-17 stand, Hit/Stand/Double, normal natural 6:5 profit, qualifying Power Rank natural 3:1 profit, push returns stake; no split/insurance/surrender.
- Golden Orbit: European single zero, all implemented inside/outside bets, profit odds and stake-inclusive return distinction, ticket limits and repeat semantics.
- Raio: four boosted numbers independent of outcome; only winning straight bets qualify; ordinary straight return 32× and boosted total replaces it; other bets retain documented total returns. No certified RTP claim added.
- Island Crash/Ginga: virtual stake, pre-crash cashout/auto cashout, 100× cap and equal-crash cashout loses; game-specific themes retained.
- Mines: existing mine-count/risk, cashout, multiplier and interruption rules reused from the implementation.

SEO titles, routes, canonicals, hreflang, sitemap, JSON-LD, names, commercial data, destinations and GEO rules are unchanged. Existing below-game rules remain for continuity; the shared panel makes them available without leaving gameplay.

## Verification

Runtime: Node 24.20.0; pnpm 10.30.3.

- Frozen install: passed; no dependency or lockfile change.
- Lint: passed, only the three existing warnings (country-context effect, site-header effect, json-ld unused disable). No added suppression or warning-budget change.
- Typecheck: passed, no build bypass.
- Full suite: 416 passed, zero failed/skipped.
- Production build: passed; 414 generated pages. Existing Next middleware convention deprecation warning remains.
- Production route/content crawl: 405 public/legal/demo URLs plus localized 404 and affiliate fallback probes passed. Canonical/hreflang/indexability/localized links covered by the established crawl. Existing PT-BR OG coverage is 101/108.
- Secret scan and diff hygiene: passed.

Focused coverage includes settings migration/persistence and untouched wallet ledger; independent music/SFX gates; Escape/focus return and settlement closing; 27 game/locale rules combinations; config-derived slot tables; equal Normal/Turbo full-bonus+retrigger outputs/payouts/cycles; and byte-for-byte preservation of 19 production math/config/settlement files.

Audio lifecycle tests cover all nine engines: one context, repeated-round scheduling, mute/unmute, hidden/resume and disposal. Existing cue-level slot/crash tests remain. Table engines exercise 50 start/stop cycles; slots/crash/ginga exercise 20. Shared affiliate regressions continue to cover settled 3/6/9 cadence, dismissal/reappearance, active-play suppression, GEO/consent and attribution. No second offer store or popup exists.

### Browser matrix and limits

All nine games were rendered and interacted with in the local production build. Each was visually inspected at **1440, 430, 390 and 320px** (36 viewport checks): no horizontal overflow, game controls and compact sponsor present. Settings and rules opened per game; both slot paytables reviewed at 320px; long-rule close remains visible after scrolling. English and Spanish blackjack panels also checked.

Real-round observations: both crash games start/auto-cashout 1.10×/finish; both slots Normal and Turbo spins; both blackjack variants deal/stand/settle; both roulette variants bet/spin/settle, classic recent result visible; Mines safe reveal/cashout. Capybara's settled third-cycle affiliate offer was seen and dismissed. Speed controls were disabled during a live spin. No console errors were observed in these interactions.

Rare random outcomes (natural blackjack, dealer/player bust, every bonus and losing mine) are covered deterministically by the existing full game suites, not claimed as all randomly witnessed in the browser. Audio graph tests verify lifecycle/mixing; physical listening quality and real iOS Safari/haptics still need owner/device review. This desktop browser is not an iPhone test.

### Performance review

The shared settings shell is small and has no animation loop. Rules loader is imported only on first Rules/Paytable use; it dynamically imports the selected game's copy/config only. No cross-game renderer/audio imports were introduced. Preferences use the existing external store. Gesture listeners are removed on unmount. Engine scheduler counts are tested. No claim of measured production transfer-size improvement: no identical baseline browser/network run was performed.

Final owner-approved toolbar QA: Settings and one Reset Balance trigger sit side by side at 1440/430/390/320px, both at least 44px tall. All nine routes checked at 320px with no overflow. Existing confirmation/cancel and active-round protection pass focused tests.

## Owner review

Local server: http://127.0.0.1:3118 . Use Settings to enable Music/SFX. Review each game's sound character, Normal/Turbo, rules/paytable and narrow layouts before authorizing release.

| Game | PT-BR URL |
| --- | --- |
| Island Crash | http://127.0.0.1:3118/pt-br/play/crash |
| Liva Ginga | http://127.0.0.1:3118/pt-br/play/liva-ginga |
| Capybara Gold | http://127.0.0.1:3118/pt-br/play/capybara-gold |
| Liva Golaço | http://127.0.0.1:3118/pt-br/play/golaco |
| Liva Blackjack | http://127.0.0.1:3118/pt-br/play/blackjack |
| Liva 21 Brasil | http://127.0.0.1:3118/pt-br/play/liva-21-brasil |
| Golden Orbit | http://127.0.0.1:3118/pt-br/play/roulette |
| Liva Raio | http://127.0.0.1:3118/pt-br/play/liva-raio |
| Jungle Gold Mines | http://127.0.0.1:3118/pt-br/play/mines |

Replace pt-br with en or es-mx for the other supported locales.

## Exact changed files (39)

- components/originals/blackjack/blackjack-game.tsx
- components/originals/blackjack/blackjack.module.css
- components/originals/capybara/capybara-game.tsx
- components/originals/capybara/capybara.module.css
- components/originals/crash/crash-game.tsx
- components/originals/embaixadinha/embaixadinha-game.tsx
- components/originals/game-settings.module.css
- components/originals/game-settings.tsx
- components/originals/golaco/golaco-game.tsx
- components/originals/golaco/golaco.module.css
- components/originals/mines/mines-game.tsx
- components/originals/play-game-shell.tsx
- components/originals/power/power.module.css
- components/originals/power/use-table-audio.ts
- components/originals/roulette/roulette-game.tsx
- components/originals/roulette/roulette.module.css
- components/originals/use-game-audio.ts
- docs/casino-ux-v2.md
- lib/originals/audio-mix.ts
- lib/originals/capybara/audio.ts
- lib/originals/capybara/engine.ts
- lib/originals/crash/audio.ts
- lib/originals/crash/copy.ts
- lib/originals/embaixadinha/audio.ts
- lib/originals/embaixadinha/copy.ts
- lib/originals/game-help.ts
- lib/originals/golaco/audio.ts
- lib/originals/golaco/engine.ts
- lib/originals/power-audio.ts
- lib/originals/power-copy.ts
- lib/originals/session.ts
- lib/originals/settings-copy.ts
- lib/originals/slot-speed.ts
- lib/originals/synth.ts
- tests/casino-ux.test.mjs
- tests/island-crash-polish.test.mjs
- tests/m10-product.test.mjs
- tests/originals-ui.test.mjs
- tests/power-audio.test.mjs

Local gate logs under ignored social/output/casino-ux-v2 are QA artifacts only. They are not Social Engine product changes and must not be committed.
