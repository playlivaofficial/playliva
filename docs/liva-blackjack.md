# Liva Blackjack — M7

The third PlayLiva Original. This document records the game contract; hosted
release evidence is recorded separately after CI and Production verification.

## Central rules and card engine

`lib/originals/blackjack/config.ts` defines six decks, 75% penetration, S17,
natural blackjack profit 3:2, double on initial two-card hands, double after
split, equal-value pairs (including mixed ten/J/Q/K), at most three hands,
one split of Aces and one additional card per split Ace. No insurance,
surrender or resplitting Aces. A split 21 pays 1:1, not natural-blackjack odds.

Cards have unique deck/suit/rank identities. Each local shoe contains all 312
cards, shuffled by Fisher-Yates with crypto.getRandomValues and unbiased
rejection sampling. Draws are sequential; reshuffling happens only between
rounds at the penetration threshold or a conservative complete-round reserve.
The public snapshot never exposes future cards, a concealed dealer card,
remaining-deck telemetry or counting aids. Player totals handle Aces as 1/11;
dealer play is deterministic and stands on soft 17. The initial sequence is
player, dealer, player, dealer hole card. Naturals resolve before actions.

## Accounting, actions and interruption

Pure settlement is separate from shoe generation and the lifecycle engine.
All stakes and wallet mutations are integer hundredths. RETURN means total
credits returned, including stake; PROFIT means return minus wager. At stake
10.00, a win returns 20.00, a push 10.00, a loss zero and a natural 25.00.
Split hands have independent wagers/outcomes; Double adds exactly one wager,
draws one card and stands. Split adds exactly one equal wager. Initial stakes
are 1/2/5/10/25/50 credits, keeping 3:2 exact to a hundredth.

Explicit ready/dealing/player_turn/dealer_turn/settling/result/error phases,
action revision tokens, a short action lock, synchronous reentrancy protection
and a settled-before-credit guard prevent duplicate debit/settlement. Worst-
case balance and ledger headroom are checked before the first debit. The shared
wallet round lock spans all split hands; dealer plays once and each hand credits
at most once. Animation completion never controls payments.

Reload/unmount ends an unfinished hand without refund or resumption. Booked
debits/credits persist. Old callbacks cannot settle an abandoned hand. This is
a local-only virtual-credit demo, not server-authoritative recovery or an atomic
cross-tab wallet. Credits have no monetary value; no certification is claimed.

## Offline verification

`node --import tsx scripts/blackjack-simulate.mjs 1000000 7132026` runs a large
deterministic engine-verification batch. Its simple policy hits below 17 and
otherwise stands, without Double or Split. This is not basic strategy: reported
frequencies are not RTP or house edge. Full Split/Double rules are verified in
deterministic engine and UI scenarios, not inferred from this simple policy.

M7 remains isolated from existing Crash/Capybara engines and assets, provider
records, partner approvals, runtime pins and lockfile. No Roulette/M8 work.
