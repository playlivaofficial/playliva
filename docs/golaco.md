# Liva Golaço

A PlayLiva Original football slot, free to play with virtual Liva Credits only.
It is not a provider game or a Capybara Gold reskin, and it is not certified,
audited, regulated or provably fair. Credits have no monetary value. Route:
`/[locale]/play/golaco` (en, pt-BR, es-MX).

## Math contract

Five reels, three rows, **243 ways**. A normal symbol pays for its longest run
of 3, 4 or 5 adjacent reels from the left. The number of matching cells on each
reel is multiplied to give the ways, and ways × paytable rate is summed.
Rates are fractions of the spin stake with a denominator of 10,000. The actual
multiplier is applied, then the result is floored once to a credit hundredth.
Every spin is capped at 1,000× stake.

| Symbol | Role | 3 | 4 | 5 |
| --- | --- | ---: | ---: | ---: |
| Chuteira de Ouro | high | 1.3× | 3.4× | 10.8× |
| Luvas | high | 0.95× | 2.4× | 6.9× |
| Apito | high | 0.73× | 1.7× | 4.7× |
| Medalha | high | 0.6× | 1.4× | 3.4× |
| Bandeira | low | 0.3× | 0.69× | 1.72× |
| Cartões | low | 0.26× | 0.6× | 1.5× |
| Refletor | low | 0.215× | 0.52× | 1.3× |
| Cone | low | 0.195× | 0.43× | 1.08× |

- **Camisa 10 (Wild)** lands on reels 2–5 only. It substitutes for normal
  symbols, not for the Trophy or the Golden Ball.
- **Troféu (Scatter).** 3 / 4 / 5+ anywhere on a paid spin, with no adjacency
  needed, award **8 / 12 / 20** free spins at the triggering stake. A paid spin
  pays its ways first; free spins never debit.
- **Final de Ouro bonus.**
  - A 2.1 s intro plays (trophy flash, whistle, crowd, counter).
  - Free-spin reels add the **Bola de Ouro**. It never appears on paid reels:
    its weight there is 0, and `validateGolacoConfig` enforces that.
  - Each Golden Ball that lands scores a GOAL and raises the **Goal Streak**
    by one: it starts at ×1 and caps at ×5.
  - The streak is updated *before* that spin pays. It persists for the rest of
    the bonus and multiplies every win.
  - Each Trophy in a free spin adds +1 spin, with at most **40** free spins per
    bonus including the award, so retrigger chains are always finite.
  - A new bonus always restarts at ×1.

Reel weights, paid / free:

| | Camisa | Troféu | Gol | Chuteira | Luvas | Apito | Medalha | Bandeira | Cartões | Refletor | Cone |
| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| Paid | 34 | 27 | 0 | 52 | 64 | 78 | 90 | 128 | 140 | 152 | 166 |
| Free | 58 | 13 | 22 | 56 | 66 | 78 | 90 | 126 | 138 | 150 | 162 |

Camisa has no weight on reel 1 in either set.

`config.ts` holds the frozen configuration and its validator. `math.ts`
generates grids with unbiased crypto rejection sampling and evaluates them.
`engine.ts` alone owns debits, settlement and bonus state.

## Verification

`node --import tsx scripts/golaco-simulate.mjs 1000000 20260924` gives:

| Measure | Value |
| --- | ---: |
| Exact base-game return (analytic, all reel combinations) | 69.39% |
| Bonus trigger (exact) | 1 in 114.67 (3: 0.795%, 4: 0.072%, 5+: 0.005%) |
| 1,000,000 paid spins: total return | 94.74% |
| — base / bonus contribution | 69.3% / 25.4% |
| Hit rate (any win on a paid spin) | 40.2% |
| Bonuses (3 / 4 / 5+) | 8,772 (7,999 / 723 / 50) |
| Mean bonus length incl. retriggers | 10.59 spins |
| Mean final Goal Streak | ×4.02 |
| Largest win | 423.5× |
| Capped spins | 0 |
| Decomposition (exact base + trigger odds × 100k-bonus value) | 94.53% |
| Mean bonus value for 8 / 12 / 20 spins | 26.7× / 47.9× / 95.5× |

The two totals agree to within 0.2 pp of sampling noise.
`tests/golaco.test.mjs` asserts the following:

- the exact base return and trigger odds;
- award sizes and scatter adjacency;
- Wild rules and the streak cap;
- per-reel disclosure and anticipation;
- a full bonus with retrigger;
- a single debit and exactly one credit per paying spin;
- the 40-spin cap, copy parity and SERP lengths.

## Presentation, audio and assets

- **Reel landing.** Reels land left to right: the first at 700 ms, then one
  every 150 ms. Two visible Trophies stretch each remaining stop to 620 ms, as
  anticipation. The drawn grid never changes.
- **Symbols, GOL pops and payout timing.** The LED scoreboard shows the
  remaining spins, the ×1–×5 streak with net balls, and GOL / +1 pops as each
  reel lands. The payout books once, on the last stop.
- **Audio.** All sound is procedural Web Audio from the shared kit
  (`lib/originals/synth.ts`), with no samples and no licensed music.
  - The kit runs one lazy AudioContext per mounted game, with a limiter and
    separate SFX and music buses.
  - The bonus theme is an original marching-band tune in B♭ at 124 BPM.
  - The cues are: boot-kick spin start, reel thuds, a trophy bell per reel,
    anticipation riser, GOL horn and crowd, retrigger whistle, tiered win
    fanfares and the final whistle.
  - Sound OFF silences and suspends everything; a hidden tab suspends the
    clock; unmount closes the context. The loop scheduler never stacks.
- **Art.** `node scripts/golaco-assets.mjs` renders code-owned SVG to WebP:
  - 11 symbols at 192 px (4.5–20.6 KB each);
  - `stadium.webp` (1280×720, 93 KB);
  - `poster.webp` (1200×675, 109 KB).

  Everything is original. The kit, boots and trophy are generic, with no club,
  federation, competition or sportswear marks. The boot laces are deliberately
  drawn as ladder rungs, not stripes.

## QA

`node scripts/golaco-visual-qa.mjs` serves isolated deterministic scenarios of
the real component on localhost:3114: loss, small, wild, big, near-miss,
bonus, bonus-12, bonus-20, bonus-rich and insufficient. It needs `pnpm build`
first for the CSS. The public route has no outcome override.
