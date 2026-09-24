# Liva Capybara Gold — M6

Original free-play slot; never a provider game. It shares the existing local
demo wallet/settings/Play Real boundary. Nothing here is certified, audited,
regulated or provably fair. Credits have no monetary value.

## Math contract

The requested five reels and four rows have **1,024 adjacent ways**, not 243.
Each normal symbol pays for its longest run of 3, 4 or 5 adjacent reels starting
on the left. Multiply the number of matching cells on each reel; sum the
resulting ways × paytable rate. Rates are fractions of the total stake with
denominator 10,000. Apply the actual multiplier, then floor once to a credit
hundredth using BigInt intermediates. Each spin is capped at 1,000× stake.

Wilds occur on reels 2–5 and substitute for normal symbols only. A normal
first reel anchors each way; there are no ambiguous all-Wild combinations.
The number of distinct Wild cells participating in any paying combination
selects a single multiplier on the entire spin: 0 → ×1, 1 → ×2, 2 → ×3,
3 → ×5, 4+ → ×10. Wilds and Scatters do not pay independently.

**Jungle Gold Bonus.** Golden Sun Scatters count anywhere on a paid spin,
with no adjacency: exactly 3 award 8 free spins, exactly 4 award 12, and 5 or
more award 20, all at the triggering stake. Each visible Capybara Wild in a
free spin adds one to the persistent Gold Multiplier (starts ×1, caps ×5),
including non-winning Wilds. The updated multiplier applies to that spin and
the rest of the bonus, replacing—not stacking with—the base Wild ladder. Each
Sun in a free spin adds one free spin (retrigger), with a hard ceiling of 50
free spins per bonus including the initial award, so a retrigger chain is
always finite. Free-spin reels use their own Wild weight (22) and Sun weight
(8); every other weight and the paid reels are unchanged.

`config.ts` centralizes symbol weights, paytable, Wild ladder, bonus probability
inputs and limits. `math.ts` owns unbiased crypto generation and evaluation.
`engine.ts` alone owns debit/settlement and bonus state. Animation callbacks
never pay. Repeated/reentrant clicks cannot create a second spin. Free spins
share the wallet's series lock and never debit. Worst-case balance/sequence
headroom is reserved before a paid spin. Outcomes are hidden until settlement.

Reload/interruption policy matches the local-only Originals foundation:
booked debits and credits persist, but pending outcomes and unused free spins
do not resume or refund. This must be disclosed in the localized rules.
No backend or cross-tab transactional guarantee is added.

## Offline simulation

Run `node --import tsx scripts/capybara-simulate.mjs 1000000 6242026 100000`
with the pinned runtime. Seeded xorshift is test-only; production uses crypto
entropy. The optional third argument adds a lower-variance decomposition:
exact paid-spin Sun odds (every cell is an independent weighted draw) × the
simulated mean value of 100,000 bonus sessions per award size, plus the
simulated base game.

Exact trigger odds (unchanged, because the paid reels are unchanged):
3 Suns 0.836039%, 4 Suns 0.080093%, 5+ Suns 0.006118%; any bonus 0.922250%
(1 in 108.43 paid spins).

Before/after (stake 1.00; estimates, never certified RTP):

| Measure | Before (8 spins, ×20 cap, no retrigger) | After (8/12/20, ×5 cap, +1/Sun ≤50) |
| --- | --- | --- |
| Base-game RTP | ≈72.0% | ≈72.0% (identical reels and paytable) |
| Bonus contribution | ≈20.43% | ≈20.50% |
| Mean bonus value, 3 Suns | 22.15× stake | 20.60× stake |
| Mean bonus value, 4 / 5+ Suns | 22.15× stake | 35.67× / 68.52× stake |
| Mean spins played (8 / 12 / 20 award) | 8 | 9.53 / 14.29 / 23.83 |
| Mean final multiplier (8 / 12 / 20 award) | ×4.78 (8) | ×3.88 / ×4.56 / ×4.95 |
| Total, decomposition | ≈92.46% | 92.32% |
| Total, 1M paid-spin sample | 91.80% | 92.34% |

The narrower ×5 cap alone would have cut the bonus value; the retrigger and
larger 4/5-Sun awards would have raised it (with unchanged free-spin reels the
bonus contribution measured ≈41.8%, total ≈114%). Lowering the free-spin Wild
weight from 30 to 22 and giving free spins their own Sun weight of 8 (was the
paid weight, 22) brings the bonus contribution back to its previous share.
The "before" decomposition used the same method on the previous rules
(1M base spins, 40,000 eight-spin sessions).

The one-million-paid-spin sample now reports: estimated RTP 92.342872%,
paid-series hit rate 60.6174%, 9,221 bonuses (8,365 / 797 / 59 by 3 / 4 / 5+
Suns), 92,492 free spins of which 14,828 came from retriggers, 4,236 bonuses
ending at ×5, maximum observed paid-series return 350.4× stake, 0 capped spins.
A paid series includes its awarded bonus. These estimates are not public
marketing promises. Tune only centrally and rerun deterministic tests and
simulation after any math change.

## Artwork

Ten original images generated with built-in imagegen, no provider references.
`assets-source/capybara-gold/manifest.json` records exact prompts/provenance;
full PNG sources are outside `public`. `scripts/capybara-assets.mjs` produces
alpha-preserving WebP derivatives. Runtime art totals 267,670 bytes: nine
160px symbols, a 384px mascot and a 1200px river backdrop. No audio downloads,
game framework, WebGL or 3D model are needed. Review readability in the actual
cabinet at all target widths; do not infer quality from source resolution.

## UI and integration

The actual slot is lazy-loaded only on the three localized Capybara routes.
The shared shell owns wallet, settings, fullscreen, history and the truthful
Slots Play Real CTA. Sound defaults off; haptics are optional and
capability-gated.

## Audio

`lib/originals/capybara/audio.ts` synthesizes every cue and the bonus music
with the Web Audio API at runtime. It is original PlayLiva work: no sample,
recording, download or third-party asset, so there is no licence or
attribution and zero audio bytes ship. Cues fire in the same render as the
engine state they describe (`components/originals/capybara/slot-sound.ts`).

- Spin start: button click, reel-release clunk, rising swoosh and a ratcheting
  reel-roll loop that thins as reels land and ends on the last stop.
- Reel stop: low "chunk" + click + wooden tick, with a fixed per-reel pitch and
  a small random drift so five stops never sound identical.
- Golden Sun: an inharmonic bell pair plus shimmer that climbs a major third
  with each Sun in the spin.
- Anticipation: a filtered riser with accelerating tremolo and heartbeat taps
  until the engine's already-scheduled final stop.
- Wins by tier: small two-note marimba; medium arpeggio + sparkle; big brass
  stabs, bells and coin shimmer; super/mega a longer three-chord lift.
- Bonus trigger: timpani, rising brass arpeggio (one more step for 4 and 5
  Suns), cymbal swell and sun bells.
- Gold Multiplier step: a two-squeak Capybara chirp and a bell step that rises
  with the multiplier. Retrigger: bell run + upward glide.
- Bonus music: 128 BPM G-major steel-pan, marimba, conga and shaker loop,
  distinct from Island Crash (112 BPM, C major) and absent from the base game.
- Bonus end: final brass chord and bell cascade while the music fades.

One AudioContext per mounted game is created only inside a gesture (Spin,
bonus Start, or turning Sound on), guarded by a limiter with SFX above a
low-gain music bus that ducks under cues. Sound OFF ramps the master to zero,
stops every voice, loop and the music scheduler, and suspends the clock. The
clock suspends while the tab is hidden; unmount closes the context. Reduced-motion preferences
disable decorative animations. Symbols remain the same deterministic outcome.

Reels stop left to right at 800 + 150ms × reel, so an ordinary spin still
settles at 1,400ms and the next paid spin unlocks at 1,800ms. The engine
discloses each reel's already-fixed symbols at its own stop and books the
payout once, on the last stop. When two Suns are already visible on a paid
spin, each remaining reel stops 560ms apart instead (anticipation). That
timing reacts to landed symbols; the outcome was drawn before the first reel
moved and is never altered. Free spins never anticipate. The Gold Multiplier
and +1 retriggers step up as the reel carrying the Capybara/Sun lands.
A triggering spin highlights its Suns, then shows the Jungle Gold Bonus intro
(award, rules line, Start button) and starts free spins on its own 2.2s after
settlement. Bonus spins advance after a 700ms result beat (1,200ms after a
win). The summary shows total, spins played and final multiplier; Spin
dismisses it directly. A compact count-up lasts 280ms. Celebrations use actual
return/stake thresholds: medium ≥2×, big ≥10×, super ≥25×, mega ≥50×. Smaller
returns use only a compact highlight and amount, never a big-win label.

Original generated mascot/river artwork is composed into lightweight discovery
cards on the Play hub, homepage and Slots category. Island Crash remains first
and unchanged. EN/PT-BR/ES-MX rules, controls, symbol names, bonus, paytable,
errors, titles and descriptions are complete; canonical/hreflang/x-default and
sitemap include only the two implemented Originals. No provider game records,
partner links, GEO rules, lockfile, runtime pins or Crash gameplay changed.

## Local verification

Pinned Node 24.20.0 / pnpm 10.30.3. Frozen install, lint (the existing three
warnings), types, the full test suite, production build and route crawl pass
(see the release report for exact counts).
Baseline ignored dependency build-script and middleware-deprecation notices
remain; no warning budget, suppressions or TypeScript validation were weakened.

Browser QA uses the actual production build plus isolated local scenarios:
loss, 0.04-credit small win, one Wild ×2, multi-Wild ×3 (2.01-credit return),
two-Scatter near miss, three-Scatter bonus, all eight free spins, capped
50,000-credit win at 50.00 stake, insufficient balance and repeated spins.
Both controlled stepping and an uninterrupted automatic eight-spin sequence
finish with one paid debit, eight correctly booked returns and multiplier ×9.
No separate UI win generator exists. A mounted-cabinet test verifies hidden
outcomes, exact highlights, localized states and restrained win tiers.

The Jungle Gold Bonus polish added `bonus-12`, `bonus-20` and `bonus-rich`
scenarios to `scripts/capybara-visual-qa.mjs`. `bonus-rich` scripts free spins
with a Capybara, a retrigger Sun, a blank, a double Capybara and a capped
1,000× win. At 1440, 430, 390 and 320px widths it plays 10 free spins
(8 + 2 retriggers), reaches ×5, books one debit and one credit per winning
spin. There is no horizontal overflow, the HUD sits above (never over) the
reels and Spin stays visible. An instrumented Chromium run confirmed no
AudioContext before a gesture, one while playing, and a closed context after
unmount. `tests/capybara-audio.test.mjs` drives a full engine bonus through the
cue mapper and asserts each cue plays exactly once.

320×720, 360×800, 390×844 and desktop are the release viewport matrix. Desktop
cells are height-aware with contained, centered artwork so Spin stays visible;
mobile bonus labels use a two-line treatment. The real production release
must still independently verify these dimensions, discovery/Play Real, hosted
CI, Vercel Ready/Current Production and exact source SHA. Final external
evidence is recorded in the task release report rather than causing an extra
post-verification deployment solely to add its own commit SHA here.

## Limitations

This is a local-only virtual-credit demo, not a regulated/certified slot. The
sample RTP is not a theoretical guarantee. Reload ends pending spins/unused
free spins as disclosed; there is no account, server recovery, cross-tab atomic
wallet or physical low-end-phone certification. Raster mascot reactions are
restrained 2D transforms, not a rigged character. No M7 work is included.
