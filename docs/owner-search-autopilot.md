# Search Console and conservative SEO Autopilot

The existing `sc-domain:playliva.com` property supplies **final web-search data**.
The server uses the existing PlayLiva OAuth Desktop application with only
`https://www.googleapis.com/auth/webmasters.readonly`. This integration neither
requests indexing nor changes Google permissions. Keep OAuth credentials separate
from YouTube tokens. Never commit either.

Production-only Vercel variables: `OWNER_SEARCH_CLIENT_ID`,
`OWNER_SEARCH_CLIENT_SECRET`, `OWNER_SEARCH_REFRESH_TOKEN`,
`OWNER_SEARCH_PROPERTY` (must be `sc-domain:playliva.com`), and `CRON_SECRET`
(at least 32 characters). Existing `OWNER_DATABASE_URL` remains unchanged.
Preview cannot invoke the cron or apply public title experiments. Preview owner
storage still requires an isolated `OWNER_STATE_KEY`.

## Daily ingestion and cost bounds

Vercel invokes `/api/cron/seo` once daily at **09:17 UTC**; platform execution may
be delayed. It requires a constant-time checked bearer secret and Production.
No owner-page visit requests Google data. There is no heartbeat or worker.

Each run claims its Pacific-calendar day exactly once. The first run retrieves
56 final days, then subsequent runs fetch the previous final date minus six days
through the newest final date. All older history is retained. A date-only probe
identifies the newest final date; three queries retrieve property totals, page
dimensions, and query/page dimensions. Country and device remain separate.
Normally: one OAuth refresh plus **four Search Analytics requests per day**.
At most three attempts per Analytics request, with 0.5/1-second backoffs for
transient errors only. Each result is capped at 25,000 rows; reaching that cap
fails closed without replacing stored evidence. This bounded import may require
an explicit future capacity change if traffic grows substantially.

One daily Vercel function, a few short Neon reads/writes, and one atomic batch
replacement of the completed overlap. Normalization coalesces only PlayLiva
host/trailing-slash and recognized tracking variants; unknown facets are omitted.
Google can suppress anonymized queries and truncate detailed rows even below the
requested cap. Property totals are separate from page/query totals; comparisons
do not claim missing query rows mean zero. No dollar estimates are assumed.

Migration 003 adds only `seo_state`, `search_daily`, and `search_runs` in the
existing schema. The authenticated cron applies it transactionally once if absent;
`scripts/owner/migrate.mjs` also supports it for normal database setup. The daily
job checks migration version first, without repeating DDL after installation.
No owner session, video, or affiliate history is migrated or deleted.

## Evidence, owner controls and safe editing

Owner SEO defaults to **28D / PT-BR / Brazil**. Language and country are separate.
7/14/28-day comparisons end on Google's latest final date, not today's partial
data. A sync older than 36 hours or data older than seven days is stale. A normal
2–7-day Google lag is delayed, not a production outage. Failed syncs preserve
last-success timestamps and evidence. No-data results do not invent numbers.

Winners require ≥100 impressions in both periods, ≥5 current and ≥3 previous
clicks, ≥5 observed days, ≥25% impression and ≥20% click growth, stable/better
CTR and rank, **in both 7D and 14D**. Only currently indexable sitemap entities
qualify. Low CTR and striking distance require ≥100 impressions over ≥7 days;
positions 4–15 identify striking distance. Decline requires sustained losses in
both short windows. The owner can inspect every reason and comparison.

The hot-page surface sorts measured page evidence by impressions; affiliate
clicks remain a separately labeled consented observation. It does not invent a
universal score, revenue, or an instruction to produce media. Historical indexing
observations retain their dates; accepted requests are never called indexed.

Autopilot starts disabled until enabled by the authenticated owner control.
Once enabled, the daily job can change **one HTML title on one PT-BR `/games/`
information page**, using only the verified catalog name and a factual guide
template. It changes no H1, description, body, links, other locale, affiliate,
GEO, offer, game engine, sitemap, or video system. At most one experiment is active.

Edit gates: two complete 28-day periods, ≥1,000 impressions in each, ≥21 observed
days in each, ≥20 baseline clicks, CTR down ≥30% at rank within two positions,
and corroborating 7/14-day CTR decline with ≥200 impressions in each period.
The ledger stores previous/new title, evidence, baseline, start, status and
measurement results. Full post-change calendar days start on the following
Pacific day. Source metadata changes invalidate the overlay instead of being
overwritten. Concurrent owner changes are protected by a revision check.

Measurement at 7/14/28 days needs ≥1,000 impressions per comparable period,
≥20 baseline clicks and stable rank. CTR and click losses ≥30% at both 7 and
14 days roll back. A 28-day winner needs ≥20% CTR/click gains confirmed at 14D;
otherwise the outcome is inconclusive and the original title is restored.
This is observational evidence, not a causal randomized experiment. A 90-day
page cooldown prevents oscillation. Accepted winner titles are retained and not
automatically re-experimented on. Disabling the owner switch restores all active
and accepted experiment titles while preserving history; ingestion continues.

Public title overlays use a small tagged Next cache (24 hours, invalidated after
changes). Database outages fall back to source metadata without breaking public
pages. The owner ledger and normalized facts are server-only. No credentials or
private evidence enter public metadata.

## Verification and operations

Run the pinned frozen install, lint, typecheck, full tests, production build,
route crawl and `pnpm social:secrets`. `tests/owner-search-autopilot.test.mjs`
covers sync, overlap, duplicates, outages, retry limits, normalization, country
isolation, signal confidence, reversible experiments and video shutdown.

After production release, invoke the authenticated cron once for initial sync;
a same-day replay must skip without additional Google calls or writes. Enable
the owner SEO switch, then allow the next scheduled evaluation (or a controlled
evaluation against the already synced data). Verify all five owner sections,
public metadata and the preserved 313-URL sitemap.

Automatic video generation remains **OFF**, expected daily videos **0**. The
disabled video workflow has no schedule. This SEO path imports no video planner,
render worker, audio, MP4, Blob upload or social publisher.
