# Pan-LATAM Originals refinement

This refinement keeps one PlayLiva catalogue for Mexico, Colombia and Peru.
Country, content language and commercial eligibility remain independent. No
affiliate registrations, approval flags, destinations or GEO gates are changed.

## Featured priority

`lib/originals/featured.ts` owns editorial priority for MX, CO, PE and the neutral
fallback. All three markets start with the same quality order:

1. Island Crash
2. Liva Ginga
3. Liva Capybara Gold
4. Liva Ritmo Drop
5. Skuptu Levanta
6. Liva Golazo
7. Liva Fiesta Gold
8. Liva Blackjack
9. Liva Roulette: Golden Orbit
10. Liva Mines: Jungle Gold
11. Liva Rayo
12. Liva 21 Royale
13. Liva Skyline
14. Liva Turbo Crash

The carousel, Originals hub and featured shelves use this shared order. A shelf
can contain a relevant subset. Search retains query relevance. Future reorder
changes belong in the central configuration; they do not require component
changes. There is no new public ordering API or owner permission surface.

## Identity and route continuity

| Previous display name | Current display name | Existing route suffix |
| --- | --- | --- |
| Avia de Janeiro | Liva Skyline | `/play/avia-de-janeiro` |
| Liva Golaço | Liva Golazo | `/play/golaco` |
| Liva Raio | Liva Rayo | `/play/liva-raio` |
| Liva 21 Brasil | Liva 21 Royale | `/play/liva-21-brasil` |
| Liva Samba Drop | Liva Ritmo Drop | `/play/samba-drop` |
| Liva Carnaval Gold | Liva Fiesta Gold | `/play/carnaval-gold` |
| Rio Drift | Liva Turbo Crash | `/play/rio-drift` |

Internal game IDs and these locale-prefixed URLs remain stable. Metadata,
headings, structured data and new catalogue labels use current display names.
Old names remain search aliases. No new duplicate routes or redirect chains are
introduced. Historical social records and local skill records remain historical
records; their labels and values are not rewritten into new results.

Island Crash and Liva Ginga keep their names, art, engines and core identity.
The other unchanged names are Skuptu Levanta, Capybara Gold, Blackjack, Golden
Orbit and Jungle Gold. Their established free-play mechanics remain intact.

## Art direction

Skyline uses a fictional coastal landscape rather than a Rio landmark.
Golazo uses a club-neutral football palette; Rayo and 21 Royale use updated
table wordmarks. Ritmo and Fiesta use broader rhythm/festival presentation.
The existing owned art pipelines regenerate the affected poster lettering.
Skuptu's gym gains warm clay and teal wall accents; character rig, shoe contact,
mat geometry, camera, lifting and failure animation remain unchanged.

## Turbo Crash

The existing Rio route now presents a classic virtual-credit crash game:
start, watch the multiplier, cash out before failure. Steering, traffic avoidance,
drift combos and score-based rewards are absent from the active game. The
renderer cannot decide settlement or reveal the future crash point.

A round has a short ignition, a running multiplier and a complete failure or
finish reaction. Cashout must precede the sampled deadline; a timing tie loses.
At 25×, automatic settlement occurs only if the crash point lies beyond the cap.
Credits, controls and rules describe this bounded demo clearly. Settings and
background tabs cannot pause the outcome clock. Eligible promotional cadence
continues only after a completed round, never during it.

## Release validation

Run the pinned frozen install, lint, typecheck, full tests, production build,
route crawl, SEO audit, secret scan and diff hygiene. Check the homepage,
Originals hub and revised game routes at 1440, 430, 390 and 320 pixels. Verify
all three owner previews, language/currency independence and Real GEO reset
against production after deployment. Release evidence stays in ignored
`social/output/originals-refinement/`; no credentials or media secrets belong
in these reports.
