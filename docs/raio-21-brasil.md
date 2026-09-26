# Liva Raio and Liva 21 Brasil — local review

Two independent, virtual-credit Originals. Classic Roulette, classic Blackjack,
Ginga, Golaço, other Originals and the Social Engine remain unchanged.
No third-party art/audio, added dependencies, real-money play or backend.
Owner visual/gameplay approval is required before commit, push or deployment.

## Routes and integration

- `/en/play/liva-raio`, `/pt-br/play/liva-raio`, `/es-mx/play/liva-raio`
- `/en/play/liva-21-brasil`, `/pt-br/play/liva-21-brasil`, `/es-mx/play/liva-21-brasil`

Each route has its own H1, metadata, canonical, reciprocal hreflang, rules,
breadcrumb JSON-LD, original poster and JPEG social preview. Both are appended
to the Originals hub and homepage spotlight without reordering existing games.
Relevant table discovery sections and internal recommendations link to them.
Provider-game records are not used to imply that these Originals exist at a partner.

The existing `DemoSessionProvider` and `PlayGameShell` own wallet, balance,
settings, sponsor and engagement UI. Credits are integer hundredths; no deposits,
withdrawals or monetary value. A round locks the wallet until its result beat
finishes. Interrupted rounds are not resumed/refunded, matching existing policy.

## Liva Raio math and presentation

- Uniform European wheel, 37 pockets, single zero. Outcome is sampled before
  the independent feature draws. Animation never selects/changes the outcome.
- Four distinct numbers are selected uniformly after the ticket is locked.
- Each gets a total-return multiplier: 40× with probability 50%, 80× with 40%,
  160× with 9%, or 260× with 1%. Mean multiplier: **69×**.
- A winning ordinary straight returns **32× including stake**. A winning
  boosted straight returns its displayed multiplier **instead**, never in addition.
- Straight expected return: `(33×32 + 4×69) / 37² = 36/37 = 97.297297…%`.
- A particular straight gets a boosted win with probability `4/1369`, about
  **0.292184% per spin**. Selected-number frequency is `4/37`.
- Other total returns: split 18×, street 12×, corner/first-four 9×, six-line 6×,
  dozen/column 3×, red/black/odd/even/low/high 2×. Each returns 36/37 in expectation.
- Mixed tickets add settlements linearly. Partial returns are distinguished
  from a net win; the result shows returned credits and signed net result.
- Chips: 1, 5, 10, 25, 50 credits; maximum ticket 10,000 credits. Undo, clear and
  repeat-last-ticket are available before locking.

Charge lasts 1,000ms; spin 4,200ms. One clock drives the SVG ball/wheel pose and
engine landing deadline. The SVG lands before the engine publishes/credits the
result in that frame. Result presentation then stays active for at least 1,200ms,
including after a delayed/background frame. Reduced-motion poses retain the same
settlement deadline. RAF sleeps while idle and is cancelled on unmount.

## Liva 21 Brasil rules and simulation

Fresh six-deck shoe each hand; one player hand; dealer stands on all 17s (S17).
Aces are 1/11; figures 10. Dealer natural is checked before player decisions.
Hit, stand and double are supported. Double requires two initial cards and enough
balance, takes an equal additional stake, draws exactly once and ends the turn.
No splits, insurance or surrender.

A uniformly independent **Power Rank** is chosen from A, 2–10, J, Q, K.
Only a winning initial two-card blackjack containing that rank gets the bonus:

| Result | Profit | Total return |
| --- | --- | --- |
| Ordinary win | 1:1 | 2× stake |
| Ordinary initial blackjack | 6:5 | 2.2× stake |
| Power Rank initial blackjack | 3:1 | 4× stake |
| Push, including simultaneous naturals | 0 | Stake |
| Loss / player bust | −stake | 0 |

Three-or-more-card 21 never gets the natural bonus. Player bust loses even if
dealer busts. The hidden hole card is absent from public snapshots until reveal.
Cards deal at 210ms steps; hole reveal takes 360ms; settled result holds 1,300ms.
Error states are unresolved, so they cannot trigger a completed-cycle offer.

Reproduce with `node --import tsx scripts/power-math.mjs`. The deterministic
300,000-hand run (seed `0x214b2026`) returned **99.0141% per credit wagered**.
Net loss per initial stake was **1.07513%**, with an approximate 95% sampling
interval of **0.67688%–1.47339%**. The distinction accounts for doubles.
Power wins occurred in **0.68767%** of hands; initial naturals in **4.74633%**.

This is a simulation of the explicit hard/soft hit/stand/double strategy in the
script, not optimal-strategy proof, a certified RTP, or a session guarantee.
The script samples without replacement from a fresh six-deck pool and settles
through the actual new-game payout function. Assumptions and seed are recorded
in `social/output/power-qa/math.json` (ignored generated output).

## Audio, affiliate cadence and analytics

Both use the existing procedural synth kit: one lazy AudioContext per mounted
table, one scheduler, no downloaded audio. Raio uses a restrained electric pulse,
chip/tick/charge/landing cues and stronger feature wins. Brasil21 uses a soft
pitched table bed, card/flip/action cues, bust/push/win and Power Rank fanfare.
Mute stops voices and scheduler, unmute resumes only a wanted loop, hidden tabs
park audio, and navigation closes the context. No idle game timer/RAF loop.

There is **no new popup, store, campaign config or affiliate destination**.
The existing shell observes `roundActive` through spin/deal, decisions, settlement
and result animation. It opens its one shared engagement offer at completed
cycles **3, 6, 9, …**. Dismissal does not cancel future boundaries. Existing BR
eligibility and non-BR suppression apply independently of interface language.

The existing offer payload includes slug, locale, device/source, cycle, exposure,
and click attribution. UTM preservation and Betsson destination are untouched.
The new coarse allowlisted events are `demo_table_action`, `demo_table_feature`
and `demo_table_result`, alongside existing open/start/complete/sound events.
Analytics rejection blocks measurement; functional partner attribution survives.
No stakes, balances, card values, user text or persistent identifiers are added.

## Verification

Focused engine, integration, audio and shared-popup tests cover settlement,
power probabilities, dealer decisions, exact-once wallet settlement, delayed
landing, unresolved errors, consent and locale metadata. The actual shared shell
is mounted for both new definitions to check cycles 3/6/9, dismissal, event counts,
UTM/click payloads, BR warnings and non-Brazil suppression.

Browser review uses real virtual-credit rounds, desktop 1440 and mobile
430/390/320 widths. Local reports/logs belong under `social/output/power-qa/`.
They are not public routes or production diagnostics. Owner review remains the
final gate for visual/gameplay/audio feel; no release is authorized yet.

### Verified locally, 26 September 2026

- Node **24.20.0**, pnpm **10.30.3**; frozen install, typecheck and build passed.
- Lint: zero errors, the same three pre-existing warnings; no new suppressions.
- **377/377 tests passed**. Production HTTP crawl: **405 URLs**, plus locale
  404 and affiliate-fallback probes. All six new localized URLs independently
  returned 200 with the correct canonical/hreflang, JPEG OG preview and shell.
- Actual browser rounds on each game showed no offer on cycles 1–2/4–5,
  offer 3/exposure 1, dismissal, then offer 6/exposure 2. No offer interrupted
  active play. Blackjack hit, stand, double and reveal were exercised.
- Desktop 1440 and mobile 430/390/320 had equal document/client scroll widths:
  no horizontal overflow. At 320, blackjack action buttons retained 78px width
  and 48px minimum height. These are desktop-browser responsive checks, not
  physical iOS/Android performance measurements.
- Final browser smoke run produced no new console errors. Earlier missing
  provider and development-origin issues were corrected before this build.
- New dynamic gameplay chunks: Raio **47,499 bytes / 16,219 gzip**; Brasil21
  **40,195 bytes / 13,425 gzip**. These are individual game chunks, not total
  route transfer sizes; common framework/shell chunks are additional.
- Original SVG posters: **10,879 + 2,031 bytes**. JPEG social previews:
  **98,486 + 51,884 bytes**. Total new art: **163,280 bytes**. Audio assets: **0**.
- Headless engine stress: **5,000 completed rounds each**, about **0.0137ms**
  per Raio round and **0.0520ms** per Brasil21 hand on this machine. Histories
  stayed capped at 12/8, wallet ledger at 50. Retained heap growth was about
  0.61MB/0.49MB including the intentional per-session used-round-ID sets;
  post-disposal deltas were about 0.26MB/0.09MB (GC/JIT-dependent, not a leak proof).
- Orbit interpolation: 100,000 samples in about **7.7ms**. This measures math
  cost, not browser painting/GPU FPS. Audio tests repeatedly exercise 50 cycles,
  mute/hide/resume and disposal with one context and at most one scheduler.
- Secret scan and `git diff --check` passed. No commit, push or deployment.

Known presentation tradeoff: the full roulette ticket sits below the wheel on
narrow screens; inside combinations use an explicit selector, rather than tiny
touch hotspots between numbered cells. The existing shared sponsor and settings
layout is preserved. Review musical taste, visual identity and pacing locally
before release; physical-device audio/render profiling remains advisable.

## Changed-file inventory

- `app/[locale]/play/liva-21-brasil/page.tsx`
- `app/[locale]/play/liva-raio/page.tsx`
- `app/sitemap.ts`
- `components/mobile-bottom-nav.tsx`
- `components/originals/blackjack-feature.tsx`
- `components/originals/power-feature.tsx`
- `components/originals/power/brasil-game.tsx`
- `components/originals/power/entry.tsx`
- `components/originals/power/page-content.tsx`
- `components/originals/power/power.module.css`
- `components/originals/power/raio-game.tsx`
- `components/originals/power/raio-wheel.tsx`
- `components/originals/power/use-table-audio.ts`
- `components/originals/roulette-feature.tsx`
- `components/play-view.tsx`
- `docs/raio-21-brasil.md`
- `lib/home/spotlight.ts`
- `lib/originals/analytics.ts`
- `lib/originals/brasil21/definition.ts`
- `lib/originals/brasil21/engine.ts`
- `lib/originals/discovery.ts`
- `lib/originals/power-audio.ts`
- `lib/originals/power-copy.ts`
- `lib/originals/raio/definition.ts`
- `lib/originals/raio/engine.ts`
- `lib/originals/raio/math.ts`
- `lib/product-discovery.ts`
- `lib/seo-images.ts`
- `lib/tracking.ts`
- `public/originals/brasil21/poster.svg`
- `public/originals/brasil21/share.jpg`
- `public/originals/raio/poster.svg`
- `public/originals/raio/share.jpg`
- `scripts/power-math.mjs`
- `scripts/power-posters.mjs`
- `tests/betsson-promo.test.mjs`
- `tests/crash-routes.test.mjs`
- `tests/fixtures/redesign-protected.json`
- `tests/m10-product.test.mjs`
- `tests/m11-catalog.test.mjs`
- `tests/power-audio.test.mjs`
- `tests/power-games.test.mjs`
- `tests/power-integration.test.mjs`
- `tests/product-redesign.test.mjs`
- `tests/redesign-boundary.test.mjs`
- `tests/roulette-integration.test.mjs`
- `tests/routes.mjs`
- `tests/seo-p0.test.mjs`
- `tests/spotlight-carousel.test.mjs`
