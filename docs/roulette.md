# M8 — Liva Roulette: Golden Orbit

European single-zero free-play Original. Implementation and QA are in progress on
`codex/m8-liva-roulette`; this document does not claim a production release.

## Engine contract

- Central identity, canonical 37-pocket wheel, colors, chips and timing live in
  `lib/originals/roulette/config.ts`.
- `bets.ts` defines 155 immutable wagers: 37 straight, 60 adjacent splits
  (including 0–1, 0–2, 0–3), 12 streets, 22 corners, 11 six-lines, first four,
  three dozens, three columns and six even-money bets. No zero trios, call bets,
  racetrack, double zero, la partage or en prison.
- Profit odds: straight 35:1; split 17:1; street 11:1; corner/first four 8:1;
  six-line 5:1; dozen/column 2:1; red/black/odd/even/low/high 1:1. A winning
  return includes the stake. Ticket profit subtracts all stakes, including losses.
- One credit = 100 integer units. Chip values: 1, 2, 5, 10, 25, 50, 100 credits.
  A ticket is limited to 10,000 credits and 250 placements. Overflow is rejected.
- Placement, Undo and Clear reserve credits without ledger writes. Spin rechecks
  funds, history/balance headroom and shared-round ownership, then books one
  aggregate debit. Immutable settlement books at most one aggregate credit.
- Secure `crypto.getRandomValues` rejection sampling selects 0–36 before motion.
  The small random interface is replaceable; unavailable entropy fails closed.
- States: betting → closing (160ms) → spinning (3,800ms) → settling (120ms) →
  result (850ms minimum) → betting. A timer, not the renderer, settles the ticket.
- Presentation only reads an orbit plan. Opposite wheel/ball rotation decelerates
  continuously and radial pocket entry ends at the exact predetermined pocket.
  Repeated spins start at the previous final angles/radius. Reduced motion uses
  a stationary wheel and a timed reveal, without changing results or settlement.
- Reload/unmount after debit leaves spent virtual credits spent. The unfinished
  spin does not resume and receives no automatic refund or duplicate payout.
  This is a local demo, not server-authoritative recovery or a secured casino.

## Developer verification

`node --import tsx scripts/roulette-simulate.mjs 1000000 8132026`

The simulator checks pocket/color/parity/dozen/column frequencies. It is not
production entropy or certified RTP. For every implemented bet, summing returns
over all 37 pockets gives `covered pockets × (profit odds + 1) = 36`, hence
theoretical return `36/37 = 97.297297…%`, edge `1/37 = 2.702702…%`. This mathematical
derivation, not a small sample, establishes the configured return. Keep it in
developer documentation/tests, not public marketing.

Standard profit payouts were cross-checked against the official
[Casino Estoril roulette rules](https://casino-estoril.pt/en/game/roulette).
This reference is not an endorsement, certification or affiliate approval.

Seed `8132026`, 1,000,000 draws: zero 26,974; red 485,999; black 487,027;
odd 486,057; even 486,969. Dozens: 324,042 / 324,205 / 324,779.
Columns: 324,541 / 324,315 / 324,170. Individual pocket counts range from
26,616 to 27,412 (uniform expectation ≈27,027). All 155 bets independently
derive the same exact 36/37 theoretical return.

## Public integration

- Localized EN/PT-BR/ES-MX route `/[locale]/play/roulette`, reciprocal metadata,
  canonical/hreflang/x-default and sitemap. Unfinished slugs remain 404/noindex.
- Fourth Original on Play hub/homepage; separate Table Games block and clearly
  non-live demo context on Live Casino. No provider-game registration.
- Play Real explicitly recommends the separately verified external
  `lightning-roulette` game through existing Live Casino/market eligibility.
  It never claims Liva Roulette is available at that operator. Category approval
  alone, unverified exact game, unsupported GEO or paused partner fail closed.
- Code-owned SVG wheel and poster, CSS table, no WebGL/3D framework or new runtime
  dependency. Discovery never imports the renderer/simulator. SVG trig coordinates
  are quantized to four decimal places to prevent cross-platform hydration drift.
- Mobile separates Outside / Numbers / Inside. Number pages retain a zero target;
  precise group buttons list exact covered numbers. Inside lists scroll vertically,
  not the whole page horizontally. Spin/chip/total/Undo/Clear/Repeat stay together.
- Shared wallet, optional sound/haptics, consent-aware events, fullscreen and
  truthful demo boundaries are retained. No previous game's engine is changed.

## Local visual evidence (in progress)

Actual-browser checks of the real component used a separate, localhost-only
scenario server. Captured 25%, 70%, 90% and final wheel frames: opposite motion,
continuous radial entry and exact 23 landing. Seven simultaneous winning bets
debited 70 credits once and returned 730 once. A zero straight plus losing red
ticket debited 20 and returned 360. Complete-loss red produced no credit.
Repeat restored the completed ticket without spending; interrupted reload kept
the spent debit and started empty. Insufficient credits placed nothing.

At 320×720, precise Corner targets measured 122×44px, Spin bottom 643px for the
Inside view and 627px on zero result. No horizontal overflow. Final production
build, remaining viewport/locales, performance and hosted release QA follow.
