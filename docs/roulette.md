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
