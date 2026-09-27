# Betsson BR campaign funnel — "Ganhe 100 Giros!"

Evidence inspected 21 September 2026 in the authenticated Betsson Group
Affiliates Media Gallery (`mediastore.affiliates.betssongroupaffiliates.com`).
This milestone turns the generic Betsson sponsor/logo placements into one
central, GEO-gated promotional funnel for the current official Betsson BR
Casino campaign. No engine, wallet, session, renderer, catalog or operator
record changed; the existing `/go` resolver, BR authorization evidence and ad
warning treatment remain the gates for every new surface.

## Verified campaign facts

| Item | Verified value | Where |
| --- | --- | --- |
| Campaign | `Betsson BR \| Ganhe 100 Giros!` | Media Gallery › Direct Links (Brand Betsson BR, Product Casino, Language Brazilian), setup id 13853 |
| Headline used | `Ganhe 100 Giros!` (verbatim campaign title; banners read `GANHE 100 GIROS`) | Direct Link name and banner set `Studio_66626 - Betsson BR Casino Banners - BR` (media ids 209842–209856) |
| Tracked affiliate link | `playliva-affiliate:betsson-br-promo` | Direct Link tracking link for this affiliate account |
| Landing page | `https://ofertas.betsson.bet.br/100giros-tigre-sortudo` | Landing Page Preview of the Direct Link |
| Official creative CTA | `APOSTE E GANHE` (banner); PlayLiva uses the neutral `Jogar na Betsson` / localized "Play at Betsson" | Banner text layer |
| Terms / conditions | **Not verifiable** from outside Brazil: the landing page 302-redirects to `ge.betsson.com` and the operator domain is blocked in the review browser | — |

Because no condition could be read, the published offer is deliberately
minimal: headline + CTA + tracked link + terms access (the same tracked link,
which lands on the official campaign page) + existing disclosure and Brazilian
ad warning. No deposit, wagering, spin value, eligible game, expiry or
registration wording was added anywhere. The banner artwork features the
provider game "Tigre Sortudo"; PlayLiva does not name that game or imply the
spins apply to any game.

### Creative decision

The eight official banners are Bannerflow HTML5 script embeds
(`c.bannerflow.net/a/…`), each with its own media-specific tracking link. There
is no static file in the gallery; the Bannerflow render endpoint returned
HTTP 530 during inspection, and the creative's component assets are the game
provider's key art. Embedding a third-party ad script on gameplay pages is
outside the site's privacy/CSP posture, so the funnel renders a
**PlayLiva-native card** using only the approved Betsson logo already on
file, the verbatim headline (with `lang="pt-BR"`), the official CTA wording,
the tracked link and the existing disclosure/warning treatment. The config
keeps a `creative` slot so an approved static banner can be dropped in later.

## Central configuration

`lib/affiliates/betsson-promo-config.ts` is the single record: enabled,
promoId, brand, market, campaign name, headline, optional subheadline, CTA
label, affiliate URL, landing page, terms URL, creative + neutral logo,
validFrom/validUntil, eligible placements, per-session frequency cap,
engagement rule (rounds before offer, settle delay), verified terms list and
provenance. It is dependency-free so `lib/data.ts` derives the public Offer
record (`BETSSON_PROMO_OFFER`) from it, which is how the campaign also passes
`isOfferEligible`, `hasCurrentOfferEvidence`, the licensed-domain allow-list
and `/go?offer=` resolution. `lib/affiliates/betsson-promo.ts` resolves a
GEO-gated model per placement; every surface calls it instead of repeating
copy or links. Replacing the campaign means editing the config only.

Placements: `originals_header`, `originals_engagement_offer`,
`discovery_game_offer`, `offers_page`. The existing sitewide compact banners
also read the config: when the campaign is live for the selected market they
show the headline and link to the campaign offer, otherwise they fall back to
the generic brand treatment.

## Surfaces

- **Originals (crash, capybara-gold, blackjack, roulette, mines).** The compact
  header sponsor stays and carries the short campaign headline and CTA. A
  contextual offer (`components/affiliates/betsson-engagement-offer.tsx`)
  mounts in the shared shell *after* the game unit as a fixed overlay: desktop
  centered card, mobile bottom sheet. **Recurring cadence:** it opens after
  every third completed gameplay cycle (3, 6, 9, 12 …), 650 ms after the
  cycle settles, and is cancelled if a new cycle starts first. Exactly one
  offer per milestone; dismiss (X, backdrop, Escape, "keep playing") never
  resets the counter and never suppresses the next milestone; starting a
  cycle while it is open closes it. There is no session cap. The popup is the
  **only** surface that states the verified R$20 selected-games condition
  (`engagement.copy` per UI language in the config); every compact placement
  keeps the short headline. Focus moves to the close button, Tab is trapped,
  focus is restored on close. No audio, no countdown, no layout shift.
  Betsson remains the only commercial partner on gameplay routes.

  The completed-cycle concept is shared: `lib/engagement/gameplay-cycle.ts`
  turns the shell's `roundActive` true → false edge into a cycle count, so
  every engine feeds the same counter without engine changes. Per Original:
  Island Crash = one fully settled flight (phase back to `ready`); Capybara
  Gold = one settled spin (a triggered bonus stays one cycle until its
  summary); Blackjack = one hand after final settlement; Roulette = one spin
  after the result window; Mines = one cashed-out or lost board. Discovery,
  catalog, sports-archive and Offers pages have no observable gameplay, so
  they keep their static compact placements and never fake a counter. No
  Plinko, provider slot or live-casino demo route exists in this repository.
- **Discovery / game pages.** In Where to Play (game detail, where-to-play,
  category, games-like, comparison and best-list grids) the Betsson operator
  card is swapped for the campaign card (`betsson-discovery-offer.tsx`) when
  the promo resolves; other operators and the multi-operator grid are
  unchanged. The card states it is a Betsson casino promotion that does not
  refer to the game being viewed. The hero "JOGAR NA BETSSON" CTA keeps the
  verified exact-game / category deep link.
- **Offers page.** The derived offer renders as a real offer card: brand mark,
  headline, boundary line, CTA "Jogar na Betsson" (localized elsewhere),
  terms access, disclosure and BR warning, under the Verified Offers heading.
  Featured offers are not duplicated in the category sections.
- **Social landings.** `/[locale]/play/<slug>` routes need no homepage hop.
  `components/analytics/attribution-capture.tsx` stores the landing UTMs or a
  known referrer class (tiktok, instagram, youtube, …) in `sessionStorage`
  once per session, only with analytics consent, and every promo event
  carries it. UTMs are never forwarded to the partner link.

## Analytics

New events `offer_impression` and `offer_dismiss` join `affiliate_click`
through the existing consented, allow-listed `track()` layer. Promo events
carry `promoId`, `brand`, `placement`, `surface` (originals / discovery /
offers), route (`url`, query-stripped), `gameSlug` / `originalId` /
`category`, `language`, `country`, device class, `trafficSource`,
`utmSource/Medium/Campaign/Content/Term` and, for the gameplay popup,
`completedCycleNumber` (3, 6, 9 …), `triggerMultiple` (3) and
`exposureNumber` (1, 2, 3 …), stringified for the allow-list. Values are allow-listed by character class and length; no
wallet, identifier, referrer path or free text is collected. The Offers page
CTA mirrors its affiliate impression as `offer_impression`.

## GEO and compliance

Every surface resolves through `getBetssonPromo` / `resolveDestination`, so
the campaign requires: selected market BR, `enabled`, the validity window,
the placement being listed, the approved operator, current dated BR
authorization evidence, the licensed `betsson.bet.br` domain and the offer's
market-specific compliance record. Any failure hides the surface and `/go`
falls back to the operator page. Non-BR markets see no campaign, no offer and
no engagement dialog. Existing disclosure, `BrazilAdWarning`, 18+ and
evidence-state hydration gating are reused unchanged.

**Review before 2026-10-14 00:00 UTC** (config `validUntil`, offer
`reviewBy`, and the existing BR authorization deadline): recheck the Direct
Link, landing page and campaign status in the portal, update `verifiedAt`
and dates explicitly, rerun the gates and redeploy. The offer fails closed
automatically after that date and 30 days after `verifiedAt`.

## Tests

`tests/betsson-promo.test.mjs` covers the config invariants (no invented
conditions, licensed link), offer derivation and eligibility, the resolver's
GEO/placement/date gates, the engagement trigger state machine, attribution
parsing and the analytics allow-list, a mounted Originals shell (opens only
after three settled rounds, outside the game unit, impression/click/dismiss
events with preserved UTMs, once per session), non-BR suppression, the
discovery card and the Offers card. Existing suites were updated only where
the change is intentional: the Originals header placement is now
`originals_header`, the Betsson Where-to-Play card is the campaign card, the
public BR offer list contains the verified campaign, and the protected hashes
for `lib/data.ts`, `lib/tracking.ts`, `components/affiliate-button.tsx` and
`components/where-to-play.tsx` were rebased.

## Homepage "In the spotlight" carousel

`lib/home/spotlight.ts` is the canonical spotlight catalog (one entry per
playable Original, Play-hub order, posters and localized labels from the
existing discovery copy); `components/home/spotlight-carousel.tsx` renders
one slide per entry with native horizontal scroll-snap (finger swipe,
trackpad), mouse drag-to-scroll with an 8 px tap/drag threshold that
swallows only the click produced by a drag, previous/next controls, arrow
keys and a live `01 / N` indicator derived from the catalog length. Each
slide links directly to `/[locale]/play/<slug>`, preserving the locale and
forwarding inbound `utm_*` parameters. Adding an Original means adding a
catalog entry; the component never hardcodes a count.
