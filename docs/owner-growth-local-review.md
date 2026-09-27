# Owner Growth V1 — local review report

This is the historical V1 local-review snapshot. Current hosted configuration and release status are documented in [the production runbook](owner-growth-production.md).

Branch: `codex/playliva-owner-growth-v1`
Base: `34b36804d44e75bbf44260aaa47db1a6dd4fa98d`
Review date: 27 September 2026
Release state: **local only; owner approval required before commit, push, merge or deployment.**

## A. Security

Server-side page/data authorization and independent API/media authorization; random revocable eight-hour sessions; HttpOnly/SameSite=Strict cookies; Secure `__Host-` cookies in hosted mode; salted scrypt password verification; persistent sign-in throttling; same-origin mutation checks; bounded JSON bodies; private no-store/noindex headers. There is no URL flag, localStorage role, upload endpoint or public publishing control. Production fails closed until a real credential and durable store are configured.

## B. Routes

One private owner shell serves Overview, Social, SEO, Affiliate and Content. Owner paths bypass locale redirection, stay outside the sitemap and carry noindex directives. All public routes and game code are preserved.

## C. Real data available

- Existing configuration supplies all **12 Originals**, the public sitemap inventory and actual operator/campaign status.
- Checked-in Social Engine records supply **50 PT-BR creatives** and their recorded QC evidence.
- Dated Vercel production snapshot: **149 visitors, 889 page views, 43% bounce rate** over its displayed 30-day range. Top pages and referrers are preserved as visitor counts.
- Dated Search Console snapshot: **3 clicks, 149 impressions, 2% CTR, position 37.4**, for **28 Aug–24 Sep 2026**. Ten observed query rows and ten observed page rows are available.
- Historical URL-inspection and sitemap evidence is imported separately.

Snapshots are labelled manual and keep their original periods. They do not masquerade as live connections or respond to unrelated date filters.

## D. Data not connected

Continuous Vercel/GA4 reporting, historical game-cycle and affiliate events, organic/social sessions, server Search Console OAuth, server YouTube OAuth, TikTok, Instagram and partner conversion reporting are not connected. Vercel showed no custom events and no project environment variables. Missing values remain unavailable, rather than becoming zero.

## E. Social library count and status

Initial imported ledger: **50 records; 50 needs review; 0 approved; 0 rejected; 50 recorded renders with QC; 0 published**. Media bytes are absent. List filters include creation date, game, locale, platform, review, render, upload and publish states; search covers ID/title/hook. Lists paginate twelve records and never preload video. Review actions persist in the structured owner/Social Engine overlay with timestamps and activity.

## F. YouTube reconciliation

**Island Crash 10 — `l1x4jFmamyw`** is the one owner-confirmed remaining private upload. **Nine historical uploads are deleted**, with their IDs and individual dates unavailable on this computer. They are not counted as current uploads, and no IDs were invented. The old proof-of-concept archive is preserved separately. Approval, upload and publication remain independent. Read-only sync verifies the existing PlayLiva channel before checking known IDs; no real sync was possible without the old OAuth state. No upload or publish operation ran.

## G. SEO data and opportunities

The live Search Analytics adapter is implemented but unconnected. The manual performance snapshot is visible alongside the dated 21-page indexing watchlist. Seven prior requests were accepted; four recent PT-BR pages were crawled but not indexed; other observations remain unknown or quota-pending. Acceptance is never labelled indexing.

Deterministic opportunities require evidence and at least 100 impressions. None of the observed snapshot rows meets that threshold, so **zero measured SEO opportunities** are fabricated. Rising-query, confirmed missing-landing and weak-link rules require their additional input evidence. A bounded top-page API response does not turn omitted pages into zero-performance claims.

## H. Affiliate data

Configuration-driven operator/GEO/destination/campaign/placement summaries are available. Event aggregation supports date, game, route, operator, placement, locale, GEO, device, source and creative UTM dimensions when a real dated export is connected. The funnel stops at affiliate click; it describes event counts, not a unique-user conversion cohort. FTD, CPA, RevShare, commission and revenue stay not connected. The live 3/6/9 cadence and GEO logic are unchanged.

## I. Content pipeline

**313 published sitemap routes** form the initial inventory. Seven Originals have no Short in the imported library and become evidence-based social coverage opportunities. The planning ledger supports Idea, Opportunity, Planned, Draft, Review, Published and Refresh Needed. Saving a plan never publishes a page. Published status requires a real existing sitemap route.

## J. Media storage

Protected local filesystem access supports metadata checks, stream/range playback and realpath containment. Missing files are clearly unavailable. Production private object storage is not connected. No MP4, voice, mix or thumbnail library is added to Git. The 50 historical videos were not regenerated. The existing workstation pipeline has a durable single-creative queue consumer and an explicit dry-run/execute boundary.

## K. Performance and deployment boundaries

Owner modules are isolated from public UI imports. Video loads only when requested in the review view; no chart library or new package was added. All tested widths have no page-level horizontal overflow, while wide tables scroll independently. Deployment tracing explicitly excludes runtime owner files and media; the boundary check inspected 59 deployment traces and 105 client JavaScript chunks and found no private runtime files or owner secret configuration names bundled into client code.

## L. QA and tests

- Exact tooling: **Node v24.20.0 / pnpm 10.30.3**.
- Frozen install, lint, typecheck, full tests and production build pass.
- **463 tests pass**, including ten owner test cases covering multiple authorization, persistence, concurrency, status, provider-failure, filtering, aggregation and content assertions.
- Public crawl: **414 public/legal/demo URLs**, plus localized 404 and affiliate fallback probes; **313 sitemap URLs** remain unchanged. Existing PT-BR OG coverage is 104/111.
- Browser coverage: all five routes at **1440 / 430 / 390 / 320**, anonymous redirects, authenticated navigation, filters, review, missing-media state, CSRF denial, no secret payloads and session revocation; **zero console errors**.
- A separate ignored QA store verifies persisted approval/rejection, content creation, queue creation and approval blocking. A two-second solid-color QA asset verifies lazy playback and byte ranges. It is not a regenerated historical creative.
- Workstation queue consumer dry run passes; no rendering stage was executed.
- Secret scan, deployment/client boundary scan and diff hygiene pass. Existing localization/game/affiliate regression checks pass.
- No new lint/build warnings. The existing three lint warnings and Next.js middleware deprecation remain.

## M. Local review links

- [Overview](http://127.0.0.1:3122/owner/growth)
- [Social](http://127.0.0.1:3122/owner/growth/social)
- [SEO](http://127.0.0.1:3122/owner/growth/seo)
- [Affiliate](http://127.0.0.1:3122/owner/growth/affiliate)
- [Content](http://127.0.0.1:3122/owner/growth/content)

Sign in using the generated local review password in ignored `social/output/owner-growth/local-access.txt`. Credentials are not included in this report. The actual review ledger contains no QA approvals, plans or regeneration requests.

## N. Real blockers and changed files

Local implementation and review are ready. Hosted operation still requires an owner production credential and durable metadata/session storage. Hosted playback needs private media storage and migration from the old computer. Live YouTube/Search Console reporting needs authorized server OAuth credentials; historical affiliate/game performance needs a real reporting feed. These are explicit disconnected states, not reasons to regenerate media or invent analytics.

Tracked-file changes are limited to `README.md`, private-route robot exclusions, the owner middleware pass-through and private response/deployment settings in `next.config.mjs`. New files are under `app/owner`, `app/api/owner`, `components/owner`, `lib/owner`, `data/owner`, `scripts/owner`, the owner tests and these owner docs. No game, public locale content, affiliate destination, Social Engine historical manifest, dependency manifest or lockfile changed.

Nothing has been committed, pushed, merged or deployed. Owner visual review is the next step.
