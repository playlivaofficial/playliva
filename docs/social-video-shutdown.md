# Automatic social video production shutdown

Automatic video production is intentionally **off**. Expected automatic daily
videos: **0**. This does not mean twelve missing videos need recovery.

## Boundaries

| Component | Classification | Shutdown behavior |
| --- | --- | --- |
| Owner Social GitHub schedule, planner, render matrix | Video only | Schedule removed; both jobs disabled; repository workflow disabled and worker flag false |
| Generation, regeneration, retries, lease claims/renewals, completion, cleanup | Video only | Rejected before video state transactions or provider calls |
| Chrome capture, narration/music and FFmpeg worker entrypoints | Video only | Exit disabled before rendering or dependency work |
| Private Blob upload/delete | Video only | Blocked; existing objects retained |
| Owner state in Neon | Shared | Auth, review/pin, content and history retained; no video queue/heartbeat/retry writes |
| Owner Growth data loading | Shared | Metadata only by default; no library-wide Blob scan. One explicitly selected creative is checked on demand |
| Owner media preview/download | Shared | Authenticated historical reads retained |
| SEO, analytics, affiliate, discovery, public games | Core | Unchanged |

The source-controlled `video-production.ts` policy is disabled independently of
environment flags. A stale worker or manual dispatch cannot re-enable production.
Historical test fixtures mock the policy only inside isolated tests; there is no
runtime environment override. CI/CD stays enabled.

Historical job states, attempts, approvals, pinned records and batches are not
rewritten. `STORED` is a metadata projection, **not** a claim of live availability.
`READY` still requires on-demand private-media checks. No placeholder files,
purges, migrations, new render service, social uploads or publishing are involved.

## Existing SEO integration limits

The pre-release production baseline has 42 provider games, 12 Originals, and 313
sitemap URLs. Owner SEO displays structural/indexability checks, opportunities,
and dated Search Console snapshots. Live Search Console reports **Not connected**;
the server-side read connection is not configured. No autonomous SEO editing or
experiment scheduler exists in this checkout. This shutdown preserves the
existing adapters and opportunity rules, but does not claim to enable absent
integrations. Traffic and affiliate collection are independent of video workers.

## Operations

Do not retry historical failed/pending videos to resolve the disabled state.
Owner-selected external manual creative work is separate from this application.
Re-enabling production would require a separately approved code/config change.
Observe workflow status and historical batch/job counts after deployment. Report
stopped workloads, not estimated dollar savings without billing evidence.
