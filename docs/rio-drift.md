# Liva Turbo Crash (stable Rio Drift route)

Liva Turbo Crash replaces the former skill-driving mode while keeping the
`rio-drift` game ID, analytics identity and `/[locale]/play/rio-drift` route.
The public name, rules, cover art, schema, search aliases and discovery category
now describe a Crash Original. `Rio Drift` remains a search alias. The old
`/arcade` landing page explains the change without inventing another game.

## Round and wallet rules

`lib/originals/rio-drift/crash-engine.ts` owns a single-player local demo. It
samples a fresh cryptographically random crash point using the existing pure
crash-distribution helper. The protected Island Crash engine is unchanged.
The point stays private to the engine closure until the round ends.

- Select 1 / 5 / 10 / 25 / 50 virtual credits. Ignition lasts 850 ms.
- The multiplier grows as `exp(elapsed / 6000)` after ignition. Integer
  hundredths are used for multiplier, stakes and returns.
- Manual cashout is accepted only while running and strictly before the
  crash deadline. Automatic cashout compares its deadline before processing a
  delayed crash tick. Ties lose, including an instant 1.00x crash.
- A round ends at a maximum 25x. It automatically banks the pending return
  only when the sampled crash is strictly beyond 25x. A crash exactly at 25x
  takes precedence. A prior cashout remains locked while the car continues.
- One guarded wallet debit and at most one guarded credit belong to each
  stable round ID. Replay, duplicate actions, re-entrant notifications and
  late callbacks cannot settle twice. Start reserves payout/ledger headroom.
- The 1,100 ms crash/finish reaction ends before the wallet lock releases and
  another round or eligible sponsor offer becomes available. Catch-up from a
  hidden tab checks the original deadlines; the reaction starts when observed.
- Settings and hidden tabs do not pause deadlines. Unmount/reload abandons
  an unsettled local round without a refund. Already credited returns persist.
- All credits are fictional. PlayLiva accepts no bets or deposits and offers
  no money withdrawal or prizes.

The former `engine.ts` and `records.ts` are retained only for old local skill
records. Runtime Turbo gameplay imports neither. No old score is deleted,
converted into money, credited or submitted as a new high score.

## Rendering, audio and commercial integration

The Canvas 2D scene retains PlayLiva's original blue coupe and uses a straight,
fictional waterfront road. The multiplier has one prominent central HUD.
Steering, moving obstacles, distance scoring and combos are removed. Road
travel uses continuous render time, independent of the 40 ms state timer;
reduced motion keeps the environment static. Rendering never settles credits.

The original synthesized electronic loop and car effects use the shared
Music/SFX preferences. Audio starts only after a gesture, stays silent when
hidden/muted and releases its context on unmount. No downloaded audio,
licensed vehicle model or new renderer dependency is added.

Shared promotional cadence still counts complete rounds (3/6/9), never
ignition, active driving or the crash reaction. MX/CO/PE operator approval,
active-state and destination gates remain authoritative; BR/ROW and missing
campaigns remain suppressed. No real campaign is introduced.

## QA

The focused engine tests cover deadlines, exact ties, instant crash, the 25x
cap, delayed ticks, integer payout, double settlement, invalid RNG/input,
reload behavior and preservation of old skill data. Component tests exercise
Start/Cash out/Replay, real wallet persistence, Settings/hidden-tab deadlines,
consented analytics and the shared 3/6/9 promotional cadence.

Run the normal frozen install, lint, typecheck, full tests, production build,
route/SEO crawl and secret scan. Inspect actual gameplay at 1440 / 430 / 390 /
320 widths. Cover art is rebuilt with `node scripts/rio-drift-assets.mjs`.
Automatic social video production remains disabled; this refinement neither
uploads media nor enables the dormant video schedule.
