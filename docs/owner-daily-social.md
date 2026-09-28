# Daily Social video factory

## Production audit (28 September 2026)

The owner API listed 51 creative records. Authenticated range-preview and full-download requests verified only one usable production MP4: the 20-second Island Crash canary (25,821,305 bytes). All 50 historical manifest records returned missing media. They reference `social/output` workstation files; production deliberately disables that local adapter. The original files were not migrated to private Blob. Historical QC labels were imported as metadata, and the UI counted those records as inventory. Generated availability also trusted a database flag and configured storage without reading the object.

The correction preserves every historical record, review, upload ID and publication state in the archive. Nothing is reseeded or deleted. Default inventory and its counts include verified READY files only. Private thumbnails bypass the public image optimizer so the owner's authenticated request reaches the protected thumbnail endpoint.

## Daily identity and scheduling

The existing `SPOTLIGHT_GAMES` registry supplies canonical IDs, current routes, titles and eligibility (`enabled !== false`). No fixed game count exists in production code. The existing timezone remains **Asia/Tbilisi**; a generation date is that local calendar day, with the single existing scheduler waking at **09:00 / 05:00 UTC**.

Each slot is `daily-YYYYMMDD-<canonical-game-id>`. Route/title changes do not change its identity. CAS creates missing slots exactly once, including games enabled after the first run that day. A new day creates new slots. Disabled games receive no new jobs and are not claimed. Old incomplete batches cannot prevent a new day's work.

Workflow planning creates/reconciles the day's slots before calculating its bounded matrix. Workers process at most three jobs each, sequentially, under the existing workflow concurrency group. A repeated workflow skips completed, verified slots. Failed or definitively missing media retries use the SAME job ID (up to three attempts); transient storage failures do not overwrite completed references. Operator retry queues only failed slots, including earlier daily slots. An operator can dispatch the existing workflow with `today` for immediate production or `retry` for recovery. The owner UI queues missing work and truthfully states that execution waits for a cloud wake-up/dispatch.

There is no second scheduler, platform upload, or automatic publication. Daily history is retained; the old latest-two-batches deletion does not run for daily production. Storage therefore grows with retained daily videos and must be monitored.

After all attempts, persistence and scratch cleanup finish, the CLI flushes its final report and explicitly exits with success/failure status. Leftover third-party process handles must not retain the workflow concurrency lock after completed work.

The CPU capture budget is 25 minutes, with 60 minutes for Liva Ginga: its first production 600-frame capture took almost 25 minutes. This headroom changes only render wall time, never native resolution, frame cadence or gameplay. The enclosing worker retains its existing six-hour limit.

Visual QA also checks captured game layout. The capture-stage header/footer styles apply only to the stage's direct children, never to a game's nested cabinet headers. For a demonstrated visual-QC defect, an operator may dispatch `retry` with explicit `repair_ids`. Only today's completed, unapproved, unpinned, unpublished masters qualify. Their old private media references are retained in `mediaHistory`; the same daily slots are recovered. Repeating the repair on the same commit is idempotent. Normal daily reruns never invalidate successful masters.

## Actual media is authoritative

Flow: lease → game-specific live gameplay capture → PT-BR narration/original procedural audio → 1080×1920 native 30fps QC → private immutable MP4/poster upload → full persisted MP4 checksum/size verification plus preview/download/poster reads → CAS completion, fenced by lease.

Every inventory request rechecks the live range preview, download readability/length and JPEG thumbnail in bounded groups. Only a completed, QC-passed, non-empty valid MP4 with successful reads becomes READY. No provider URL, credential or storage key is sent to the browser. Browser previews/downloads use the same private storage reader behind the unchanged owner authorization boundary. Missing or unavailable files cannot contribute to the daily or library count. Local historical metadata is ARCHIVED.

The existing gameplay renderer is reused, with game-specific routes, controls, artwork and phases. Daily angle, hook and capture variant selection avoids the previous three batches' near-duplicate hooks for the same game. Existing virtual-credit/18+ disclosures remain. Technical QC does not replace human creative review.

Skuptu's existing settled cash-out banner uses "Retorno garantido" wording. Capture-only CSS omits that banner from standalone social footage to avoid a guaranteed-return claim outside the game's context. Public game UI, settlement and virtual-credit disclosures remain unchanged.

Motion continuity is measured on visible gameplay, excluding the intentional final 1.8-second branded end card. Otherwise a long flight continuing behind that static card can falsely fail as repeated gameplay. Frozen visible gameplay still fails the unchanged repeat threshold, and failures report safe frame counts for diagnosis.

Skuptu motion classification reads the visible lift HUD. Its cashout button becomes disabled and changes text after settlement while the actual lift continues; using that button as the motion signal incorrectly excluded those frames and caused false insufficient-motion failures. Capture actions, outcomes, frame thresholds and public gameplay are unchanged.

Capture startup waits for an enabled gameplay control, then pauses with 30 seconds of idle headroom before its first game action. The previous 100ms pause deadline reproducibly throws “Cannot fast-forward to the past” under a delayed control round-trip. Readiness replaces a fragile global network-idle/fixed-delay assumption. Stage-only progress and sanitized capture-stage errors expose failures without provider responses or secrets. A failed slot at its automatic attempt cap may receive one explicit additional allowance per repair commit through `repair_ids`; cumulative attempts and activity history are preserved. Repeating that repair version grants nothing further, and normal scheduler retries remain bounded.

## Verification and recovery

Run frozen install, lint, typecheck, full tests, build, route checks and secret scan. Daily tests cover concurrent deduplication, timezone boundaries, canonical identity, new/disabled games, actual bytes, missing/zero/corrupt objects, checksum, preview/download failures, failed persistence, partial recovery and archive exclusion.

After deployment, dispatch `Owner Social generation` with `mode=today`. Verify each day's expected game appears once, download every READY video from the authenticated production endpoint, decode/probe each MP4 and inspect its gameplay frame. Check preview, thumbnail, logout/login and reload. Dispatch the same day again and compare IDs/completed timestamps: no new render may occur. Never call metadata completion proof of production media.
