# Owner Growth production and Social generation

This milestone extends the existing private dashboard. It does not change public games, odds, settlement, affiliate cadence, GEO rules, SEO copy, routes or analytics. The productionization brief supersedes the previous local-review-only release boundary. Release remains conditional on verified configuration, tests and a controlled production canary.

## Architecture

- Next.js on the existing PlayLiva Vercel project serves the five private owner pages and independently authenticated APIs.
- An isolated Neon Postgres resource holds owner state, sessions, throttle counters, creative reviews, content plans, batches, leases, pins and cleanup history. `playliva_owner.state` uses a revision-checked compare-and-swap; concurrent writers retry rather than overwrite each other. Migration 001 creates only the PlayLiva schema. Version-1 dashboard documents are upgraded to version 2 without discarding existing decisions.
- Private Vercel Blob stores only final H.264 MP4s and JPG posters. The server streams media through the owner authorization boundary, including byte ranges and attachment downloads. Storage paths and credentials are not sent in dashboard data.
- GitHub Actions supplies the scheduler and a Linux CPU worker. It does not run in web requests, on the owner's computer, or inside Codex. Workflow concurrency and per-job renewable leases prevent duplicate claims. There is no social-platform publishing credential in the worker.

## Credentials and isolation

Production configuration names, never values:

| Location | Configuration |
| --- | --- |
| Vercel Production | `OWNER_PASSWORD_HASH`, `OWNER_ORIGIN`, `OWNER_DATABASE_URL`, private Blob connection (`BLOB_STORE_ID` with Vercel OIDC or `BLOB_READ_WRITE_TOKEN`) |
| Vercel branch Preview | separate credential, `OWNER_DATABASE_URL`, `OWNER_STATE_KEY=owner-preview-<branch>`; no worker scheduling |
| GitHub environment `owner-social-production` | `OWNER_DATABASE_URL`, `OWNER_BLOB_READ_WRITE_TOKEN` |
| GitHub repository variable | `OWNER_SOCIAL_WORKER_ENABLED=true` only after the worker/environment configuration is verified |

`prepare-production-access.mjs` creates a random production password and scrypt verifier in ignored local files, never stdout. It refuses to overwrite an existing credential. Transfer the password to the owner's password manager. The worker never receives it. Rotate the verifier to revoke all sessions. Existing opaque-session, secure-cookie, expiration, persistent throttle, no-store, noindex and CSRF controls remain enforced. Preview storage refuses the production owner document key.

The existing LivaSports Neon resource is not the PlayLiva database. Do not connect, migrate, reset or change LivaSports data for this task.

## Schedule and jobs

The workflow wakes daily at `05:00 UTC`, which is **09:00 in Tbilisi**. The valid IANA identifier is `Asia/Tbilisi`; `Europe/Tbilisi` is not an IANA zone. GitHub scheduled jobs can be delayed by runner availability. Dashboard timestamps reflect actual scheduler and worker observations.

Each scheduled start is 72 hours after the preceding scheduled start, at 09:00 Tbilisi. Rendering time does not push a normal batch to a fourth morning. Delayed or failed batches block new work until handled; missed slots are skipped without expensive catch-up bursts. The exact next due timestamp is displayed; this is not a day-of-month `*/3` cron.

The due timestamp is a durable batch key. Duplicate wakes and manual retries reuse the same active batch. A partially completed batch blocks another full batch until its failures are handled. Every eligible entry in the canonical `SPOTLIGHT_GAMES` registry produces three jobs, one per angle: wow, challenge and feature. Twelve games currently derive 36 jobs; the test thirteenth entry produces 39 without a generator change.

The worker claims one queued job at a time, renews a 30-minute lease every minute and fences writes with a unique lease token. A stopped worker's expired job becomes failed. Retry queues only failed jobs, with a three-attempt cap; successful jobs are preserved. Further intervention after that cap requires inspecting the underlying failure, not an automatic expensive loop.

The daily worker also consumes manually queued jobs. The owner UI explicitly says these wait for the next cloud wake-up. An operator can dispatch the workflow for immediate processing. A full batch is not forced to prove a deployment.

## Rendering and voice

One universal 1080×1920, native 30fps MP4 is generated per creative. The worker visits the real PT-BR game route with analytics consent disabled, uses a capture-only branded vertical layout and exercises actual game controls. An offline frame clock advances the game by 33/33/34 ms and captures every rendered frame into a lossless intermediate. Slow CPU rendering affects wall time, not video cadence. No duplicated-frame conversion or interpolation is used. It does not alter repository game math or publish an alternative game implementation. Gameplay remains the visual focus. H.264 high profile targets 10 Mbps with AAC audio and fast-start playback.

Narration uses the existing Kokoro PT-BR `pf_dora` voice on CPU. Python dependencies and CPU Torch are installed explicitly by the worker. Model files are cached outside Git; no TTS subscription, LLM call, ChatGPT session, Codex credit or local owner process is required. The established original procedural music is reused with phase-aligned accents and voice sidechain ducking. Final loudness and peak measurements gate completion. Technical QC never substitutes for human review.

Template hooks use game metadata and mechanic-aware narration. Each choice is checked against the preceding three batches for word overlap; capture variants are also rotated. Exhausting the diversity pool fails closed instead of silently repeating a hook. Random gameplay outcomes are not presented as promised returns. Visible and caption copy states free virtual-credit play with no real-money deposits/bets.

## Review, download and history

The original 50 records are immutable import inputs. Missing bytes remain unavailable. New masters appear newest-first by batch and support authenticated preview, download, approval, rejection and pinning. Approval is an internal quality decision. **There is no automatic platform upload or publication.** The only current old private upload remains owner-confirmed Island Crash 10 (`l1x4jFmamyw`); nine deleted historical uploads are not current inventory.

Private media keys are validated and never accepted directly from a browser. Download filenames include game/date/creative ID. No bucket listing or public blob URL is exposed. Raw render intermediates remain in the transient runner workspace, not Git or public storage. Capture QC also counts actual frame hashes during 3D motion and rejects excessive repeated frames. Each completed/failed attempt removes only its own validated scratch folder, bounding scratch usage to one creative.

## Retention

Retain the newest two fully completed batches plus pinned media. In-progress, partial and failed batches are never cleanup candidates. A completed canary follows the same rule once two newer completed batches exist. Approved media is not permanent unless pinned.

Cleanup atomically claims an eligible unpinned item before deleting bytes. A pin saved before the claim prevents cleanup. Once cleanup is claimed, a later pin request is rejected visibly rather than promising retention of bytes being deleted. A retried cleanup reuses its claim and is idempotent. MP4 and poster bytes are removed; all creative metadata, QC, review decisions, pin history and purge timestamps remain. The dashboard says “Media expired / purged.”

## Operator commands

All commands require pinned Node 24.20.0 and pnpm 10.30.3. Keep real values in authorized secret stores or ignored files.

```text
node --import tsx scripts/owner/migrate.mjs
node --import tsx scripts/owner/cloud-worker.mjs --mode=canary
node --import tsx scripts/owner/cloud-worker.mjs --mode=arm
node --import tsx scripts/owner/cloud-worker.mjs --mode=due
node --import tsx scripts/owner/cloud-worker.mjs --mode=retry
node --import tsx scripts/owner/cloud-worker.mjs --mode=cleanup-dry-run
```

The canary creates one fresh Island Crash creative, not any historical master. Inspect its QC, preview and download before arming. `arm` refuses without a completed canary. To pause scheduling, disable the repository worker variable; queued metadata remains durable. Worker logs include IDs/status/counts, never credentials or raw provider responses.

## Costs and recovery

Recurring resources are Neon compute/storage, private Blob storage/transfer/operations and GitHub-hosted Linux runner minutes. CPU TTS has no per-request API charge. At 10 Mbps, a 20-second master is approximately 25 MB before audio/container overhead: 72 such masters are roughly 1.8 GB, plus posters and pinned exceptions. Longer narration can produce up to 30-second masters. The Windows local 20-second frame-clock canary took approximately seven minutes and produced a 25.45 MB master. This is not a hosted-runner cost measurement. Benchmark the Linux production canary before projecting monthly runner minutes; do not promise free capacity without checking the account allowance. There is one standard worker, no autoscaling, a 360-minute workflow ceiling, a 25-minute capture ceiling per creative and at most three attempts per job.

The existing Neon Launch UI quoted $0.106 per compute-unit hour and $0.35 per GB-month during setup; incremental metered provisioning was explicitly approved by the owner on 27 September 2026. The owner completed Vercel payment verification. The isolated Neon project `playliva-owner-growth` (`spring-forest-94297760`, São Paulo) now uses a fixed 0.25 CU ceiling with five-minute scale-to-zero. Its integration connects only to PlayLiva, with Sensitive variables in Production/Preview and no automatic per-deployment branches. Application code uses the private `OWNER_DATABASE_URL` alias. The private `playliva-owner-social-private` Blob store connects only to PlayLiva Production in IAD1. Cross-region database calls are confined to owner routes. No LivaSports resource or plan should be changed. See [Neon pricing](https://neon.com/pricing), [private Blob pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing), and [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) for current provider terms.

Before infrastructure changes, take a database snapshot/backup using the provider. Recovery restores the owner document without resetting historical IDs. Blob keys are immutable per render attempt; never attach another attempt's object blindly. After a crash, inspect leases/failed jobs, retry failures only, and run retention in dry-run mode first. A database outage fails owner authorization closed and leaves the public site independent. A provider outage must not be represented as a successful generation or deletion.

Production URLs, commit/PR/merge identity, hosted CI results, storage verification and canary results must be recorded only after actual deployment. Source implementation alone is not proof of a live service.
