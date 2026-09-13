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

## Release status

Math/art checkpoint only. Public UI, integration and release verification are
still in progress; this document does not claim production completion.
