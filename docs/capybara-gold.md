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

At least three Scatters anywhere on a paid spin award eight free spins at the
triggering stake. There is no retrigger. Each visible Wild in a free spin adds
one to the persistent bonus multiplier (starts ×1, caps ×20), including
non-winning Wilds. The updated multiplier applies to that spin and subsequent
free spins, replacing—not stacking with—the base Wild ladder.

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

Run `node --import tsx scripts/capybara-simulate.mjs 1000000 6242026` with the
pinned runtime. Seeded xorshift is test-only; production uses crypto entropy.
The one-million-paid-spin sample (stake 1.00) returned:

- Estimated RTP: 91.798993% (sample estimate, not theoretical/certified RTP).
- Paid-series hit rate: 60.6173% (any return, including returns below stake).
- Bonus frequency: 0.9222%, 9,222 bonuses / 73,776 free spins.
- Average total return per paid series: 0.91798993 credits.
- Average return among hit series: 1.51440254 credits.
- Maximum observed paid-series return: 644.35× stake; capped spins: 0.

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
Slots Play Real CTA. Original short synthesized cues are opt-in; sound defaults
off, haptics are optional and capability-gated. Reduced-motion preferences
disable decorative animations. Symbols remain the same deterministic outcome.

Spin presentation is 1,400ms, with a 160ms stagger across the five stop reveals;
the next paid spin unlocks at 1,800ms. Bonus spins automatically advance after
a 700ms result beat. A compact count-up lasts 280ms. Celebrations use actual
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
warnings), types, **105 tests**, production build and **249-route** crawl pass.
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
