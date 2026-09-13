# M11 selection matrix — before import

Baseline: `a7387f9515becf656e4b448a80ab35d7c53b318c`. Research date: 2026-09-13.
Scope: factual game reference only, no new referral or availability surfaces.

## Evidence and selection standard

Official provider pages establish title, provider, category and the specific
mechanics described. HIGH means useful coverage of an existing catalog gap;
MEDIUM means a documented series variation worth distinguishing. These are
editorial priorities, **not popularity, search-volume or Brazilian sales ranks**.

Brazil relevance below is an editorial coverage rationale for a PT-BR-first
reference catalog. It does not assert market eligibility or operator inventory.
Betsson BR public homepage is accessible but no exact new-title inventory has
yet been independently confirmed in its current rendered catalog. Search has
an older Sugar Rush listing; that alone does not establish current availability.
All new records therefore start unverified for operator/GEO availability.
No authenticated partner media portal was present in the available browser tabs.

All selected artwork is **fallback / pending-rights**. Official public visibility
is not redistribution permission. Play’n GO and Evolution explicitly reserve
graphic reuse for written consent. No logos, demo embeds or third-party images
will be downloaded for this batch. Existing approved art stays unchanged.

| Game | Provider | Category | Brazil relevance / coverage rationale | Betsson BR evidence | Artwork | Source quality | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Fruit Party | Pragmatic Play | Slots | Cluster structure alongside existing candy slots | Unverified | Fallback | Official game page | HIGH |
| Sugar Rush | Pragmatic Play | Slots | Position multipliers; PT-BR reference gap | Older indexed listing only | Fallback | Official game page | HIGH |
| Sugar Rush 1000 | Pragmatic Play | Slots | Distinguish named variant from Sugar Rush | Unverified | Fallback | Official game page | MEDIUM |
| The Dog House | Pragmatic Play | Slots | Fixed-line / sticky-wild contrast | Unverified | Fallback | Official game page | HIGH |
| The Dog House Megaways | Pragmatic Play | Slots | Variable reels and two bonus modes | Unverified | Fallback | Official game page | MEDIUM |
| Gates of Olympus 1000 | Pragmatic Play | Slots | Distinguish existing Gates of Olympus record | Unverified | Fallback | Official game page | HIGH |
| Sweet Bonanza 1000 | Pragmatic Play | Slots | Distinguish existing Sweet Bonanza record | Unverified | Fallback | Official game page | HIGH |
| Starlight Princess | Pragmatic Play | Slots | Pay-anywhere versus connected clusters | Unverified | Fallback | Official game page | HIGH |
| Starlight Princess 1000 | Pragmatic Play | Slots | Documented named-variant distinction | Unverified | Fallback | Official game page | MEDIUM |
| Wolf Gold | Pragmatic Play | Slots | Respin / money-symbol coverage | Unverified | Fallback | Official game page | HIGH |
| Wild West Gold | Pragmatic Play | Slots | Sticky multiplier wilds | Unverified | Fallback | Official game page | HIGH |
| Big Bass Splash | Pragmatic Play | Slots | Collector mechanics; existing series context | Unverified | Fallback | Official game page | HIGH |
| Hot Fiesta | Pragmatic Play | Slots | Fixed paylines and piñata wilds | Unverified | Fallback | Official game page | MEDIUM |
| Madame Destiny Megaways | Pragmatic Play | Slots | Bonus allocation wheel / variable reels | Unverified | Fallback | Official game page | MEDIUM |
| Rich Wilde and the Book of Dead | Play’n GO | Slots | Expanding-symbol reference, second slot provider | Unverified | Fallback | Official guide and walkthrough | HIGH |
| Reactoonz | Play’n GO | Slots | Charged-feature grid slots | Unverified | Fallback | Official game page and review | HIGH |
| Reactoonz 100 | Play’n GO | Slots | Documented recent series variant | Unverified | Fallback | Official review and release article | MEDIUM |
| Dr. Toonz | Play’n GO | Slots | Quantumeter / reel-multiplier contrast | Unverified | Fallback | Official game page | MEDIUM |
| Moon Princess | Play’n GO | Slots | Character effects and grid-clear bonus | Unverified | Fallback | Official game page | HIGH |
| Rise of Olympus | Play’n GO | Slots | Mythology grid, distinct from Gates | Unverified | Fallback | Official game page | HIGH |
| Dream Catcher | Evolution | Live Casino | Money-wheel reference | Unverified | Fallback | Official game page | HIGH |
| MONOPOLY Live | Evolution | Live Casino | Wheel-to-board bonus structure | Unverified | Fallback | Official game page | HIGH |
| Immersive Roulette | Evolution | Live Casino | Camera/presentation variant | Unverified | Fallback | Official game page | HIGH |
| Lightning Baccarat | Evolution | Live Casino | Card multipliers and explicit extra fee | Unverified | Fallback | Official game page | HIGH |
| Speed Baccarat | Evolution | Live Casino | Face-up dealing / reduced presentation time | Unverified | Fallback | Official game page | HIGH |
| Infinite Blackjack | Evolution | Live Casino | Shared initial hand, individual decisions | Unverified | Fallback | Official game page and category guide | HIGH |
| Bac Bo | Evolution | Live Casino | Official PT-BR documentation; dice/card distinction | Unverified | Fallback | Official EN and PT-BR game pages | HIGH |
| Balloon | SmartSoft | Crash | Different visual metaphor from existing aircraft games | Unverified | Fallback | Official game page | HIGH |
| CarX | SmartSoft | Crash | Cash-out and range modes, road presentation | Unverified | Fallback | Official game page | MEDIUM |
| Dice | SPRIBE | Instant Games | Threshold comparison, not a crash trajectory | Unverified | Fallback | Official rendered game page | HIGH |
| Keno | SPRIBE | Instant Games | Number draw, distinct from Mines / Plinko | Unverified | Fallback | Official rendered game page | HIGH |
| Deal or No Deal Live | Evolution | Live Casino | Potential game-show coverage | Unverified | Fallback | Official detail unavailable during audit | DEFER |

Selected: **31** (20 Slots, 7 Live Casino, 2 Crash, 2 Instant Games).
Providers: Pragmatic Play 14, Play’n GO 6, Evolution 7, SmartSoft 2, SPRIBE 2.
Exact per-record URLs and original localized summaries accompany the catalog
records. No RTP, volatility, release date or maximum-win field is required;
omit unneeded or ambiguous numerical claims rather than fill a template.

## Separation from protected infrastructure

New reference records must not enter `lib/data.ts`'s commercial game registry.
The existing `/where-to-play` loop remains limited to its original records.
New `/games`, selected `/games-like`, `/compare` and `/providers` routes receive
explicit sitemap entries only. Existing outbound logic, original game code,
operator records and eligibility snapshots remain protected. The sitemap's
M10 snapshot may change solely for these explicitly authorized additions, with
an additional regression assertion preserving the complete M10 URL set.
