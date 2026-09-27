# Owner Growth V1

Historical local-review milestone. Its release restrictions are superseded by the
explicit productionization brief; see [the current runbook](owner-growth-production.md).

Private owner operating dashboard. This milestone stays local until the owner reviews and approves it. No commits, pushes, merges, uploads, publishing or deployment are authorized by this implementation brief.

## Scope and source of truth

The branch is `codex/playliva-owner-growth-v1`, created after fetching clean production main at `34b36804d44e75bbf44260aaa47db1a6dd4fa98d`. Games, public page content, affiliate eligibility and the recurring 3/6/9 offer remain untouched.

The five routes are `/owner/growth`, `/owner/growth/social`, `/owner/growth/seo`, `/owner/growth/affiliate`, and `/owner/growth/content`. `/owner/login` handles owner sign-in. A separate shell, scoped CSS and a small action/video client component keep owner code out of public UI imports.

## Security

Every page data load and every API/media endpoint independently checks an opaque 256-bit session. Only its SHA-256 digest is stored. Sessions expire in eight hours, are revoked on sign-out, and are invalidated by password-hash rotation. The cookie is HttpOnly, SameSite=Strict, Path=/, with Secure and the `__Host-` prefix outside explicit local mode. Mutation requests require a same-origin Origin header and reject cross-site fetches. JSON bodies are bounded at 8 KiB. Passwords use salted scrypt with timing-safe comparison. A persistent, global single-owner throttle allows ten attempts per fifteen-minute window; successful sign-in resets it. There is no public registration, client-only role flag, query bypass or browser-stored password.

All private responses carry no-store/noindex headers. Owner routes are excluded from locale redirects and the sitemap; robots excludes owner/API paths. Clickjacking is blocked with `frame-ancestors 'none'`. Authorization is repeated in the page data layer rather than relying on the shared layout. Provider errors do not expose raw responses or credentials. Owner JSON contains public configuration summaries and private operating data only after authorization, never credentials, session records or raw affiliate destinations.

Implementation references: [Next.js authentication](https://nextjs.org/docs/app/guides/authentication), [cookie attributes](https://nextjs.org/docs/app/api-reference/functions/cookies), and [Upstash REST commands](https://upstash.com/docs/redis/features/restapi). The installed Next.js authentication guide was also inspected.

## Local review

Use Node **24.20.0**, pnpm **10.30.3**. `node scripts/owner/setup-local.mjs` creates a random local password and scrypt verifier in ignored `social/output/owner-growth/`. Existing credentials are never overwritten. The password is in `local-access.txt`, not printed. Start Next with `OWNER_LOCAL_ENABLED=1` and bind to `127.0.0.1`. Local mode is refused on Vercel regardless of that flag. The local cookie is intentionally usable over loopback HTTP; hosted mode always requires HTTPS.

Owner state persists in `social/output/owner-growth/state.json`, independently from historical source manifests. A cross-process exclusive lock plus atomic rename protects local writes. A interrupted writer can leave `state.json.lock`; inspect that no worker/server is writing before manually recovering that generated lock. Never reset the state file to resolve a lock.

Private server configuration names belong in deployment settings or an ignored local environment file, never in `.env.example` or browser code. Supported names (no values are provided here):

| Purpose | Server-only configuration |
| --- | --- |
| Owner login | `OWNER_PASSWORD_HASH` in `salt:hex-scrypt-output` format; optional `OWNER_ORIGIN` (defaults to the canonical production origin) |
| Durable metadata, sessions and rate limit | `OWNER_REDIS_REST_URL`, `OWNER_REDIS_REST_TOKEN` |
| Explicit workstation mode | `OWNER_LOCAL_ENABLED`, optional `OWNER_DATA_DIR` |
| Attach original metadata locally | `OWNER_SOCIAL_MANIFEST` (optional external manifest; checked-in manifest is default) |
| Attach local media | `OWNER_MEDIA_ROOT` (directory corresponding to the old `social/output`) |
| Read-only YouTube | `OWNER_YOUTUBE_CLIENT_ID`, `OWNER_YOUTUBE_CLIENT_SECRET`, `OWNER_YOUTUBE_REFRESH_TOKEN`; locally the existing `YOUTUBE_OAUTH_CLIENT_FILE` / `YOUTUBE_OAUTH_TOKEN_FILE` are supported |
| Read-only Search Console | `OWNER_SEARCH_CLIENT_ID`, `OWNER_SEARCH_CLIENT_SECRET`, `OWNER_SEARCH_REFRESH_TOKEN`, optional `OWNER_SEARCH_PROPERTY` |
| Local analytics export | `OWNER_ANALYTICS_EXPORT` |

Generate the production verifier offline from a strong owner-chosen password using the same scrypt format; do not reuse the review password. Production login fails closed until both the credential and durable store are configured. The Redis REST adapter uses atomic compare-and-swap to avoid losing concurrent actions. Its credentials require access only to the owner key. No cloud database was created or connected in this milestone.

## Data audit, 27 September 2026

- Vercel project settings show **no environment variables**. Storage shows an available team database named `neon-sky-drawer` with a Connect action; no project data connection or credential was present. It was not connected or changed.
- Vercel Web Analytics does have real production traffic. Its completed 30-day report showed **149 visitors, 889 page views, 43% bounce rate**, and **no custom events**. The private dated snapshot includes observed top page/referrer rows and the exact displayed period. These are visitor counts, not additive session counts. No automatic Vercel reporting API is configured.
- Search Console's signed-in `playliva.com` property showed a **28-day** report for **28 Aug–24 Sep 2026** with **3 clicks, 149 impressions, 2% CTR and position 37.4**. The first ten query and page rows are preserved as a separate dated snapshot. No API credentials or query-to-page joins were available. A manual snapshot does not become a live reporting integration.
- The existing event layer pushes consented page/game/cycle/offer/click events to dataLayer and optional GA4. With no GA4 measurement ID configured and no Vercel custom events, a historical game/affiliate event feed cannot be inferred. No public tracking behavior was changed.
- Owner confirmed the old MP4s, thumbnails, voice files, mixes, validation master and YouTube credentials/journals are on another computer under the old `source-audit` workspace. None were regenerated, uploaded or copied into Git.

Snapshots explicitly retain their original periods and do not silently respond to live-report date filters. Fixed top rows are labelled partial. No organic/social sessions or conversion cohorts are synthesized from referrer visitor counts.

## Social Engine and history

The checked-in v2 manifest supplies **50 PT-BR creatives**, all with recorded render/QC evidence. The initial owner ledger preserves **50 needs review**, **0 approved**, **0 published**. Rendering, human review, upload and publication are separate fields. The UI checks actual media availability separately from recorded QC and never substitutes game artwork as a claimed creative thumbnail.

The current checkout contains no later ten-ID upload journal. Owner evidence establishes one remaining private upload: **Island Crash 10 — `l1x4jFmamyw`**. Nine others are recorded as deleted historical uploads with their individual IDs/dates unavailable on this computer. They are never counted as current uploads. The earlier archived proof-of-concept ID remains in its original archive and is not silently counted as another current video.

The owner ledger is a structured Social Engine review overlay consumed by this dashboard and its workstation worker. It deliberately does not rewrite immutable historical manifest rows. Approve/reject persist timestamps, review state, reason and activity. Human review confirmation is required before approval. Approval does not invoke the legacy uploader. The old source-manifest CLI retains its original behavior; do not treat legacy manifest approval or owner approval as upload authorization. This V1 has no upload or publish endpoint or control.

Read-only YouTube sync refreshes credentials server-side, verifies the exact existing PlayLiva channel, checks known IDs in batches of 50, and records availability plus views/likes/comments when returned. A successful authenticated omission means unavailable/deleted, not an invented reason for disappearance. Provider failure preserves the last known observation. Deleted history is retained separately and does not make the future explicit-upload eligibility rule permanently false.

## Media and regeneration

Lists paginate twelve creatives and never create video elements. Review loads media only after the owner chooses Load video preview. Protected local media uses actual manifest paths, realpath containment checks, extension allowlists, streaming and byte ranges. Path traversal and symlink escape cannot read credential files. Missing media stays unavailable. Hosted object storage is explicitly **not connected**; the local adapter is disabled on Vercel. Attach durable private object storage behind the same authenticated media boundary before enabling hosted playback. No fake cloud URLs are used.

Regeneration creates a durable single-creative job and clears human approval. It does not run FFmpeg inside Vercel. The workstation consumer is:

```text
node --import tsx scripts/owner/work-regeneration.mjs --job=<queue-id>
node --import tsx scripts/owner/work-regeneration.mjs --job=<queue-id> --execute
```

The first is a dry run. Explicit execution atomically claims one queued job, invokes the existing voice/capture/QC scripts with `--id`, and records completion or failure. Existing Python/model/FFmpeg/browser dependencies and a local game server are required. External manifest/media attachment mode is read-only for this worker; it refuses to send a different source into the standard render pipeline. It has no uploader. No rendering job was executed during V1 implementation.

## SEO, affiliate and content adapters

Search Console has a real read-only Search Analytics adapter for configured server OAuth, bounded to 1,000 rows and final Google data. Provider failure leaves the historical indexing audit and source sitemap inventory available. Opportunities require at least 100 impressions, with explicit evidence for low CTR, positions 4–15, rising queries, verified missing landing pages or measured weak links. No observed snapshot row meets the threshold, so none is labelled a measured priority. Comparison metrics and link counts are never guessed.

The prior production indexing audit contains seven accepted requests, four PT-BR pages crawled but not indexed, and explicit unknown/quota-pending states. Accepted requests are never presented as indexed. The historical sitemap submission and last-read dates are preserved separately from current source sitemap inclusion.

The local analytics export adapter accepts `{ source, exportedAt, from, to, events }` with daily `date`, `event`, nonnegative integer `count`, and string dimensions `route`, `game`, `locale`, `operator`, `placement`, `geo`, `device`, `source`, `utmContent`. Supported events match existing page/cycle/offer/click tracking. Use a real authorized report, never browser QA events. Reporting is withheld when the requested range exceeds export coverage. These aggregated counts cannot prove visitor identity, sessions or funnel conversion cohorts. Durable hosted analytics reporting remains unconnected.

Operator summaries derive actual status, eligible GEOs, campaign, placements and destination presence from existing configuration. Destination presence is not verified delivery health. FTD, CPA, RevShare, commission and revenue require a future reliable conversion-report provider and stay unconnected.

Content inventory derives from the existing sitemap. Owner plans overlay Idea, Opportunity, Planned, Draft, Review, Published and Refresh Needed states without changing public pages. Published status requires an existing sitemap route. Seven social coverage opportunities are deterministic differences between the twelve-game catalog and five represented games in the imported library. This is a planning ledger, not a publishing CMS.

## Verification and release boundary

Meaningful unit/service tests cover authentication, state persistence/concurrency, manifest/status normalization, deleted-history re-upload eligibility, the remaining private ID, filtering, event dimensions, SEO evidence thresholds and content state constraints. Browser QA visits all five routes at 1440/430/390/320, checks anonymous access, secure cookie properties, cross-origin denial, no secret payloads, filters, review view, absent media and logout. Mutation and playback fixtures use a separate ignored QA store; they never approve or regenerate the actual historical library.

Run the repository gates with pinned tooling. Preserve the existing three lint warnings and middleware deprecation; add no new warnings. Generated QA media and screenshots remain ignored. The final local report records exact results and limitations. Hosted authentication, durable storage and provider credentials are setup dependencies to resolve only after the owner approves the local implementation; no deployment is performed now.
