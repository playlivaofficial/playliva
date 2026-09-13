# M7 — Liva Blackjack

Third PlayLiva Original, at `/en/play/blackjack`, `/pt-br/play/blackjack` and
`/es-mx/play/blackjack`. This is local free play only. Liva Credits have no
monetary value; PlayLiva accepts no bets, deposits or withdrawals. No randomness,
RTP, recovery or commercial/casino certification is claimed.

## Rules and shoe

The centralized definition, rules and pure engine live under
`lib/originals/blackjack/`. Defaults: six decks (312 uniquely identified cards),
dealer stands on hard and soft 17, natural blackjack pays 3:2, Hit/Stand,
Double on any initial two-card hand including after Split, and equal-value pairs
(including different ten-value ranks) may split into at most three hands.
Split Aces may split once, get exactly one card each, and cannot Hit, Double or
resplit. Split 21 is a normal 1:1 win, never a natural. No insurance or surrender.
Both naturals push; a dealer natural resolves before player decisions.

The actual shoe is shuffled at creation, dealt sequentially and reshuffled
between rounds at 75% penetration, or slightly earlier if the conservative
84-card maximum-round reserve requires it. It never shuffles during a hand.
Browser `crypto.getRandomValues` feeds Fisher–Yates with rejection sampling
instead of modulo-biased indexes. Secure randomness failure disables play;
there is no production `Math.random` fallback. No remaining-shoe telemetry or
future/hidden cards enter the public snapshot.

## Lifecycle, settlement and accounting

Explicit states: ready → dealing → player_turn → dealer_turn → settling →
result → ready, plus a recoverable error state. The initial sequence is player,
dealer, player, hole card. Cards reveal at 180ms intervals; actions are locked
for 220ms and dealer cards use 240ms beats. Result remains on the table after
the 420ms result-to-ready transition. Animation does not determine outcomes.

The engine owns the shoe, active split hand, all stakes and settlement. The
pure settlement layer returns blackjack/win/loss/push/bust per hand. Revision
tokens, synchronous mutation guards, timed locks and a pre-credit settlement
guard reject stale/duplicate callbacks. A shared round lock excludes balance
reset and competing rounds. Safe-integer balance/history headroom is reserved.

One credit is 100 integer subunits. A 10-credit natural returns 25 total, a
normal win returns 20, a push returns 10, and a loss returns zero. The interface
labels **RETURN**, not profit. Split debits one equal additional stake for each
new hand. Double debits once, draws exactly one card and stands. All split hands
settle independently, then the dealer has played only once. The completed count
counts rounds, not split hands.

Unmount/reload abandons the current hand: booked debits remain spent, no refund,
no resume and no duplicate payout. Next mount starts ready. Shared local storage
is best-effort demo persistence, not server-authoritative or atomic cross-tab
money accounting. Sound defaults off; optional synthesized cues and supported
haptics reuse shared settings. Reduced motion removes animation, not gameplay.

## Presentation and discovery

Original SVG faces and backs use ivory, navy, gold and standard red/black suit
semantics. The emerald table uses CSS lighting/texture and no external/provider
art, WebGL or new dependency. The game is lazy-loaded; discovery imports only a
small dedicated SVG poster. Mobile split play emphasizes the active hand while
keeping other hands' ranks, totals and stakes visible in compact summaries.
All four decisions use 44px minimum targets. The game route suppresses the
existing fixed mobile bottom navigation; other routes remain unchanged.

EN/PT-BR/ES-MX copy covers all controls, results, help, errors and disclosure.
Play hub/homepage retain Crash and Capybara and add Blackjack third. Table Games
has a separate Originals block, not a provider-game record. Metadata has self
canonicals, reciprocal hreflang/x-default and three new sitemap entries.
Unfinished slugs, including Roulette, remain 404/noindex.

## Truthful Play Real boundary

The CTA explicitly recommends the separately verified external **Blackjack
Live** listing, not Liva Blackjack availability. It requires that exact listing,
selected market, active approved operator and verified destination. Removing
the listing fails closed even if a live-casino category approval remains.
Current BR evidence permits the existing Betsson destination; unsupported
markets show a truthful empty state. Locale is independent of selected GEO.
No operator, partner URL, bonus, approval, attribution or consent rule changed.
The existing `/go` handler revalidates the attributed recommendation at click.

## Offline rule verification

Run `node --import tsx scripts/blackjack-simulate.mjs 1000000 7132026`.
Seed 7132026, 1,000,000 hands, deterministic policy: Hit below 17, otherwise
Stand; no Split or Double in this sample policy. This is **engine verification
only**, not basic strategy, RTP, house edge or expected-return certification.

| Measure | Count | Frequency |
| --- | ---: | ---: |
| Player natural | 47,483 | 4.7483% |
| Dealer natural | 47,417 | 4.7417% |
| Win | 411,121 | 41.1121% |
| Loss (including bust) | 490,722 | 49.0722% |
| Push | 98,157 | 9.8157% |
| Player bust (subset of loss) | 268,000 | 26.8000% |

Deterministic engine tests separately cover Split, resplit, Double After Split,
Ace restrictions, insufficient credits, secure shuffle rejection, penetration,
S17, fixed-point payouts, reentrant/stale actions and repeated/reloaded rounds.
Mounted React/Strict Mode tests verify real controls, concealed hole cards,
legal actions, split returns and interruption without refund. Integration and
route tests cover all locales, discovery, metadata and fail-closed referrals.
All previous Originals tests remain in the full suite.

Local QA scripts are localhost-bound, never imported by the public game. The
timing probe reports first contentful paint and a first-table-RAF proxy (not a
standardized first-meaningful-paint metric), readiness and resource sizes.
Final hosted CI, exact deployment SHA, production screenshots and measured
payload/timings are recorded in the release evidence rather than claimed here
before deployment. Physical low-end-device certification remains out of scope.
