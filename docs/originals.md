# PlayLiva Originals foundation (M4)

M4 provides shared infrastructure only. No game is registered, playable or
published. Existing discovery pages, Sports network navigation, affiliate data,
SEO metadata and sitemaps retain the approved M3 behavior.

## Composition and future route contract

- `OriginalGameDefinition`: stable Original ID/slug, localized titles, and one
  existing discovery category. These are not provider/operator game identities.
- `DemoSessionProvider`: mount once around the future play platform, under the
  existing `CountryProvider`. `useDemoSession()` exposes a stable snapshot,
  readiness/storage status, settings and wallet operations. Never mount this
  provider in the site root or existing editorial/discovery pages.
- `PlayGameShell`: title, Originals branding, compact GEO-gated Betsson header
  placement, credit balance, supplied viewport and controls, settings, history
  and reset confirmation. Play Real affiliate CTAs stay unmounted on `/play/*`
  gameplay routes; nothing commercial may sit between viewport and controls.
- `PlayRealCTA`: category-level approved operator referrals, retained for
  commercial/isolated use and not mounted on Original gameplay routes.

M5 may introduce `/[locale]/play/[gameSlug]` only when an approved game actually
exists. Unknown slugs must use `notFound()`; keep unfinished pages absent from
the sitemap and out of search. The current `/[locale]/play` page is unchanged.
No new layout or dynamic route is necessary in M4.

At the future route's client entry, load each game using an explicit dynamic
import (React `lazy`/`Suspense` or Next's existing dynamic loader). Use a literal
import per approved slug; never a broad import of every engine. Import the
provider/shell only inside the play subtree. Definition types use type-only
imports; translations are in a separate Originals module. No Canvas, WebGL,
audio engine or game framework is installed now.

The route must pass implemented viewport/controls to the shell. It must not
start a round until storage status is no longer `loading`; native controls
are also disabled during hydration. Supply `roundActive` while a round is in
progress to disable UI reset. M5 must handle engine-level reset/settlement
ordering and duplicate settlement prevention; the raw credit API is not a
round engine. Sound/haptics default off. Future engines must read those settings
before producing audio or vibration and tolerate unsupported browser APIs.
Fullscreen and haptics controls appear only when browser capabilities exist;
fullscreen rejection produces a localized non-fatal message.

## Guest wallet and storage

Storage key: `playliva.originals.session`. Current schema version: `2` (M5.4).
The method and field names are unchanged; every amount is now an integer subunit,
with **100 subunits = 1 Liva Credit**. See the [M5.4 report](m5.4-continuous-cashout.md).

```ts
{
  version: 2,
  balance: number,        // integer subunits, 0..100,000,000,000
  sequence: number,       // safe integer, monotonically increasing
  settings: { sound: boolean, haptics: boolean },
  transactions: [{        // at most 50, oldest entries evicted first
    sequence: number,
    kind: 'debit' | 'credit' | 'reset',
    amount: number,
    balance: number,      // resulting balance
    at: number,          // local timestamp
    gameId?: string,     // Original ID, not a provider game ID
    roundId?: string     // local round correlation, no player information
  }]
}
```

Initial and reset balance: **10,000.00 Liva Credits / 1,000,000 subunits**.
Debit/credit accept positive safe integer subunits only. Insufficient credits, invalid context, overflow and exhausted
sequence numbers return explicit failures without changing balance/history.
Reset records the new allocation (not a monetary payout), preserves settings and
retains bounded history. No arbitrary balance setter exists. Zero payouts require
no credit transaction; M5 can correlate round events with optional round IDs.

Snapshots are immutable. The store hydrates after React subscribes, with a stable
server snapshot. It rebuilds only known schema fields and validates settings,
numbers, history length, sequencing and balance continuity. Empty/missing storage
starts a guest session. M5.4 explicitly validates the entire v1 ledger in its
original whole-credit units, then multiplies balance and transaction amounts/
balances by 100. Settings, sequence numbers, timestamps and round/game identifiers
are preserved. Valid bounded history is retained; v2 reloads never scale again.
Malformed/oversized data and unknown versions reset to the initial session with
a visible recovery notice. There is no speculative migration for other versions.

Unavailable storage and quota failures keep the wallet usable in memory and show
that saving is unavailable. Multiple components share one provider/store. Tabs
do not actively synchronize; a detected competing storage write detaches the
stale tab's saving until reload rather than overwriting the newer saved state.
This is best-effort local persistence, not atomic cross-tab accounting. Local
data can be edited/cleared by the browser user and is never trusted for money,
rewards or operator credit. No guest fingerprint, account or database exists.

Every shell says FREE PLAY / DEMO, labels credits without currency symbols, and
states that they have no monetary value and PlayLiva accepts no bets/deposits.
English, PT-BR and ES-MX copy is supplied without changing the existing legal
architecture. Nothing adds withdrawals, bonuses or real-money balances.

## Play Real boundary

`getPlayRealOptions(country, category, locale)` requires an existing category
and delegates eligibility/destination validation to the M2/M3 resolver. It
returns only operator labels and internal `/go` links. Selected GEO is independent
of language. Pending, paused, inactive, unverified, mock, unsupported and invalid
contexts fail closed. Current Table Games and Instant Games have no blanket
commercial approval and therefore show the truthful empty state.

No Original ID/slug is passed as `game` or used to borrow a provider game's
verified availability. Copy explicitly says a category referral does not mean
the PlayLiva Original is available there. Operator records, destination URLs,
terms, offers and required partner attribution remain unchanged. The existing
`/go` route resolves the destination again at navigation time. Links use the
existing affiliate new-tab convention and sponsored/noopener/noreferrer.

M7 adds an explicitly labelled exception to category-only recommendations:
Liva Blackjack may recommend the separately verified external `blackjack-live`
listing. This is not an Original/provider identity mapping. The resolver must
verify that exact external listing, market, operator and destination; a generic
live-casino/category approval alone cannot enable it. The Original's ID/slug is
never passed as the external game. Player-facing copy names the separate listing
and disclaims Original availability. Table Games still has no blanket approval.

M8 applies the same boundary to Liva Roulette: the separately verified external
`lightning-roulette` listing retains its existing Live Casino classification.
Exact game/market/operator/destination checks remain mandatory. Public copy
states this is not Liva Roulette and has different rules/payouts. No provider
record, partner approval or affiliate destination was changed.

M9 Liva Mines remains category-only: `instant-games` passes through the existing
category/GEO resolver. No approved category destination exists today, so its
Play Real section shows the localized empty state. The separately catalogued
provider Mines game is preserved and never used to borrow eligibility. No
Blackjack/Roulette exact-listing exception applies. See [M9 details](mines.md).

Navigation is a normal anchor independent of consent. M2 continues to preserve
functional partner tracking while gating optional measurement. Do not put
required campaign IDs in the optional analytics template.

## Analytics contract

`trackFreePlay` delegates to the existing consent-aware `track` function:

| Event | Owner/trigger |
| --- | --- |
| `free_play_open` | Shell mount, once per Original per mount |
| `demo_round_start` | Future engine after successful round start |
| `demo_round_complete` | Future engine after settlement |
| `demo_balance_reset` | Successful confirmed shell reset |
| `play_real_view` | Approved CTA enters the viewport |
| `play_real_click` | Approved CTA activation |

Payload is restricted to Original/category identifiers, selected country,
language, optional local round ID/operator slug and a constructed localized
play path. No query strings, arbitrary metadata, wallet histories, balances,
personal data or persistent guest identifiers are sent. Consent is checked at
each event; rejected events are discarded, never replayed on acceptance.
Revocation blocks subsequent events. No vendor, GTM tag or analytics ID is added.

## Validation and M5 handoff

Run the repository's full quality gates, building before the production crawl.
The test-only DOM harness checks shell controls and consent without loading
third-party scripts or registering a route. Wallet tests cover persistence,
invalid/corrupt storage, bounds, safe failure and competing writes. Play Real
tests reuse exact configured destinations and verify category/GEO/status gates.
The 243-URL crawl additionally requires future game/harness URLs to remain 404.

M5 remains responsible for the first real game, deterministic round lifecycle,
settlement idempotency, interruption/reload policy, accessible game controls,
game-specific loading/performance and approved route metadata. No gameplay,
RNG, accounts, network multiplayer or homepage Free Play redesign belongs to M4.
