# Liva Mines: Jungle Gold — M9

Fifth PlayLiva Original. Public identity is centralized in `config.ts`; the
localized routes are `/en/play/mines`, `/pt-br/play/mines`, `/es-mx/play/mines`.
Local virtual-credit demo only: no deposits, withdrawals or monetary value.

## Board, randomness and state

The 25-cell board supports 1/3/5/7/10 mines, default 3. Stake presets are
1/2/5/10/25/50 credits, stored as 100/200/500/1000/2500/5000 integer subunits.
Before debit and active play, partial Fisher–Yates selects an exact immutable
mine subset. Each bounded draw uses browser `crypto.getRandomValues` and rejects
the Uint32 modulo tail. Each subset has mathematical probability `1/C(25,m)`.
Invalid/unavailable entropy fails before spending credits, without Math.random.

The closure-private layout is not included in active snapshots or DOM. Picks
cannot influence it. Frozen snapshots expose ordered safe picks only. Terminal
snapshots reveal mines. Reveals, sounds and animation never decide settlement.

Flow: ready → active → cashed_out / mine_hit → result → ready. Safe selections
publish immediately with no animation lock. Duplicate/stale picks cannot advance
the multiplier. Zero-pick cashout is forbidden; the final safe cell automatically
secures the treasure. A mine loses immediately without credit. Presentation is
260ms impact/result and 600ms total until Play Again, not an outcome delay.
The last result/board stays readable until the next Start.

## Exact probability and payout

For `N=25`, mine count `m`, and `k` safe picks:

```
P(m,k) = C(25-m,k) / C(25,k)
       = C(25-k,m) / C(25,m)
fair multiplier = 1/P(m,k)
Q = 1,000,000
configured integer multiplier = floor(9700 * C(25,k) * Q / (10000 * C(25-m,k)))
returned credit subunits = floor(stake subunits * configured multiplier / Q)
```

One centralized 0.97 return factor applies once, not on every pick. Zero picks
show a non-cashable 1.00× preview. Combinations and critical multiplication use
BigInt; bounded results convert to safe integers. Display labels floor to two
decimals, but the Cash Out amount uses the full six-decimal multiplier. Public
rules explain this distinction. Return includes the stake; profit subtracts it.
Example: 10 credits, 3 mines, 1 safe pick → 1.102272× → 11.02 credits returned,
while the large label displays 1.10×. Maximum preset terminal case: 10 mines,
15 safe picks, 50-credit stake → 3,170,697.20× and 158,534,860.00 credits.

The unrounded mathematical factor is 97% for a fixed safe-pick cashout target.
Integer flooring reduces this slightly; it is not a sampled RTP promise or a
certification/provably-fair claim. A player's selected risk path affects variance.

## Wallet, lifecycle and safety

The shared fixed-point local wallet owns balance/history. Start validates mode,
stake, balance, maximal payout headroom, history sequence, entropy and unique
round ID, acquires its shared round lock and debits once. A busy guard blocks
reentrant actions. Settlement is marked before wallet notification and credits
at most one aggregate return; duplicate cashouts are rejected. Mine losses
never create a credit. Frozen mode/stake and round-ID/revision checks protect
against delayed controls. Existing four game engines are unchanged.

Unmount/reload releases the in-memory round, keeps the already booked debit
spent and never resumes/refunds/pays unfinished rounds. A new visit begins
ready. Competing-tab/storage limitations remain the existing local-demo policy;
this browser-owned state is not suitable for real money or prizes.

## Presentation and integration

Owned CSS stone bevels, emerald/gold SVG treasure, leaf shapes and light shafts
provide the jungle scene. The pointer-inert SVG polyline joins safe cell centers
in selection order; gems sit above it. Cashout strengthens the trail and tile
glow. Mine impact uses a brief stone crack, amber pulse and dust/leaf flecks.
There are no purchased/provider images, fake players or jackpots. The loading
poster is code-owned SVG. The SSR board is visible before hydration; Start stays
disabled until the wallet is ready. Rendering is explicitly lazy per route.

Sound defaults off and uses short owned oscillator cues only after interaction.
Haptics use the shared optional setting and capability check. Reduced motion
removes reveal/impact transitions without altering gameplay. Semantic labelled
buttons, native selects and visible keyboard focus remain available.

EN, natural PT-BR and ES-MX copy covers all controls/results/rules and metadata.
The product name and Liva Credits are retained proper names. Canonicals,
reciprocal hreflang, PT-BR x-default and three sitemap entries use existing SEO.
Hub/home/Instant Games have separate lightweight Original cards. All existing
Originals and provider records remain unchanged. Plinko is still 404/noindex.

Play Real uses Instant Games category eligibility only. No currently approved
destination exists, so all supported markets show the truthful empty state.
No provider Mines identity mapping or roulette/blackjack referral is borrowed.
Existing affiliate attribution and consent-aware analytics are preserved.

## Local validation and measured performance

Pinned Node 24.20.0 / pnpm 10.30.3. Frozen install, lint, typecheck, 186 tests,
production build, 258-route crawl and whitespace check passed during M9 QA.
Existing three lint warnings, ignored dependency build-script warnings and
Next middleware convention deprecation remain; no warning budget was changed.

Twenty engine tests plus two integration and three mounted-UI tests cover RNG,
every mode/terminal pick, fixed-point edge/payout, reentrancy, duplicate start/
pick/cashout, errors, hidden layouts, shared lock, interruption, trail growth,
localization, SEO, discovery and category-only affiliate behavior.

Seed 9132026, 100,000 layouts per mode (500,000 total), developer xorshift only:

| Mines | Expected hits per cell | Observed min–max |
| --- | ---: | ---: |
| 1 | 4,000 | 3,917–4,185 |
| 3 | 12,000 | 11,780–12,195 |
| 5 | 20,000 | 19,803–20,217 |
| 7 | 28,000 | 27,720–28,317 |
| 10 | 40,000 | 39,709–40,251 |

Exact counts/no duplicates and combinatorial progression/monotonicity passed.
These are sampled verification frequencies, not certification of randomness.

Browser checks used the actual build plus an isolated visible scenario harness.
Verified 1/3/5/10 mines, immediate hit, one safe cashout, many/long safe picks,
high-value cashout, maximum terminal auto-secure, insufficient funds, repeated
rounds and reload-with-spent-stake. Clock controls confirmed not ready at 599ms
and ready at 600ms. No game-console errors were observed.

At scroll position zero with a 15px desktop-emulation scrollbar:

| Viewport | Tile width | Board bottom | Primary action bottom |
| --- | ---: | ---: | ---: |
| 320×720, actual build | 46.3px | 552.8px | 707.0px |
| 360×800, long trail | 54.3px | 568.3px | 723.9px |
| 390×844, five mines | 60.4px | 598.7px | 754.3px |
| 1280×720, actual build | 62.5px | 569.6px | 694.4px |

1440×900 uses a 470px board, large multiplier and full visible controls. The
largest terminal balance/return also fits 320×720 (action bottom 709.0px).
No horizontal overflow or fixed bottom navigation obstructs the play route.

Measured production-build resource set before release:

| Payload | Raw bytes | gzip bytes | Brotli bytes |
| --- | ---: | ---: | ---: |
| Entire observed route JS, including shared Next/site/wallet code | 709,192 | 214,614 | 184,278 |
| Lazy game chunk `1y-b8b7kl078n.js` | 56,307 | 19,068 | 16,595 |
| Owned poster SVG | 3,522 | 1,236 | 1,086 |

The board has no network art/model/audio payload. Its art is inline SVG/CSS.
Compressed figures are offline encoding sizes, not promised Vercel wire sizes.
The local proxy removes upstream compression when reporting browser resources.
No Three.js, framework or new dependency was added for Mines.

Unthrottled in-app Chromium, local production preview through the visible :3110
probe, one new-origin run and one repeat navigation: cold FCP 644ms, first-board
meaningful-paint proxy 644ms, wallet/control readiness 776ms; warm FCP/board
proxy 196ms and DOM readiness 183ms. The board proxy is the maximum of FCP and
the first board-observed animation frame, not a standardized performance metric.
DOM readiness can precede first paint. Shared cache/host load influence these
samples; they are not low-end-phone, network-throttled or field-percentile data.

## Release evidence and limitations

The final exact-SHA hosted CI, Vercel Production and production smoke evidence
is recorded in the release handoff after verification. Do not infer a release
from this source document or a local green build alone.

Remaining limitations: local editable credits, no cross-device/cloud recovery,
no certified randomness/RTP, no physical low-end-phone certification, shared
site runtime larger than the game chunk, no approved Instant Games partner
destination yet, and optional browser-dependent audio/haptics/fullscreen.
