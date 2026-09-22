# PlayLiva YouTube Shorts publisher

This system creates reviewable PT-BR Shorts from PlayLiva-owned Originals, preserves the existing consented UTM attribution path, and uploads only through the official YouTube Data API. It does not publish to TikTok or Instagram and does not add public application routes. The current 50-video production workflow is documented in [`social-shorts-library.md`](social-shorts-library.md).

## Current channel and platform baseline

- Authorized channel: **PlayLiva**
- Channel ID: `UC66mms712dnc7_2O6R_jqyg`
- Handle: `@PLAYLIVA`
- The channel is publicly visible, has no uploaded videos or Shorts, and standard upload features are enabled.
- Intermediate and advanced features are currently eligible rather than enabled.
- No active strike or upload restriction appeared in the dashboard, content notices, or feature-eligibility screen.
- The channel-level audience setting is **review each video**. The uploader therefore always sends `selfDeclaredMadeForKids: false` for this adult-oriented batch.
- YouTube Studio shows that two-step verification is not enabled for the Google account. This sprint does not change account security settings.

The uploader uses the isolated Google Cloud project **PlayLiva YouTube Automation** (`playliva-youtube-automation`, project number `855159475796`). The pre-existing **LivaSports** project is not reused or modified. Only YouTube Data API v3 is required by this implementation.

## Content and review workflow

The source manifest is `social/content/youtube-shorts-br.json`. Every item has a unique `contentId`, an exact Original route, a unique `utm_content`, review state, YouTube ID, timestamps, and a performance state. The prior five-item validation manifest is archived at `social/content/youtube-shorts-br-v1-archive.json`.

```text
content manifest -> PT-BR narration -> live browser capture -> 1080x1920 master -> QC -> human review -> YouTube adapter
```

Commands:

```bash
pnpm social:capture
pnpm social:voice:setup
pnpm social:voice
pnpm social:inspect
pnpm social:review
pnpm social:review -- --json
pnpm social:review -- --approve=yt-br-island-crash-01
```

Capture uses local PlayLiva gameplay, moves only the live game unit into a vertical safe-zone stage, and records native browser motion before one final H.264 encode through the pinned FFmpeg binary. Masters are 1080×1920 at 30 fps with PT-BR narration, generated music, game-specific synthesized cues, and AAC audio. Browser chrome, account data, developer controls, affiliate URLs and third-party footage are excluded. Generated model files, raw captures, MP4s and thumbnails are ignored by Git.

Automated QC never approves content. Approval requires both a passed QC record and an explicit human review; it does not upload or publish anything.

## Attribution and analytics

The tracked target scheme is:

```text
utm_source=youtube
utm_medium=organic_social
utm_campaign=playliva_originals_shorts
utm_content=<contentId>
```

All links stay on the exact PT-BR Original route. Existing `lib/attribution.ts` captures the values per browser session after analytics consent and attaches them to allowed free-play, offer-impression and affiliate-click events. Functional operator attribution remains owned by `/go` and is not altered. `utmContent` supplies the content-level join key for landing sessions, game opens, completed demo cycles, offer impressions and affiliate clicks.

## OAuth and secrets

The authorization helper requests exactly:

```text
https://www.googleapis.com/auth/youtube.upload
https://www.googleapis.com/auth/youtube.readonly
```

The upload scope creates videos and sets their metadata. The read-only scope is required to verify the authenticated channel with `channels.list(mine=true)` before every upload and to inspect processing status without granting broader account-management access.

Offline access is requested because later scheduling is an explicit goal. The client JSON must be stored in the ignored local path `.youtube-oauth/client_secret.json`; refresh/access tokens are written to `.youtube-oauth/token.json`. Neither file is printed or committed. The Desktop app flow uses the Google-supported loopback redirect `http://127.0.0.1:53682` with PKCE. Desktop clients do not require a manually registered web redirect URI.

Authorization and every upload verify the authenticated channel through `channels.list(mine=true)` and block unless it is the existing PlayLiva channel (`UC66mms712dnc7_2O6R_jqyg`). No API key, YouTube Analytics scope or broad YouTube account-management scope is requested.

The External OAuth app is **In production** and its branding uses the public PlayLiva home, privacy and terms pages plus the authorised `playliva.com` domain. This removes the Testing-mode seven-day refresh-token limitation. The existing token was refreshed successfully after the status change. Google still marks the sensitive YouTube scopes as requiring app verification; until that review is complete, the app remains an unverified single-owner workflow subject to Google's user cap. See [Manage App Audience](https://support.google.com/cloud/answer/15549945) and [Google OAuth production readiness](https://developers.google.com/identity/protocols/oauth2/production-readiness/overview).

Revoke access from the Google Account third-party connections page, delete `.youtube-oauth/token.json`, and disable/delete the OAuth client in Google Cloud if the publisher is retired or compromised. Rotate the client credential and re-authorize after any suspected exposure.

## YouTube upload and scheduling

After explicit approval of one reviewed item:

```bash
pnpm social:youtube:auth
pnpm social:youtube:upload -- --id=yt-br-island-crash-01 --privacy=private --confirm-upload
pnpm social:youtube:verify -- --id=yt-br-island-crash-01
```

The uploader uses `videos.insert` with a resumable session, progress reporting, bounded retry for transient responses, the PT-BR title/description, category `20`, the not-made-for-kids declaration, and processing-status polling. It refuses non-approved or previously uploaded content. Public privacy requires a separate `--confirm-public` guard.

The first Island Crash validation Short was uploaded to the verified PlayLiva channel as **Private**. API verification confirmed successful processing, the exact approved title and PT-BR description, the PlayLiva free-play URL with its unique UTM values, and the not-made-for-kids setting. YouTube Studio classified it as a Short and showed no content notice. It has not been published publicly.

YouTube only accepts `publishAt` for a private, never-published video and a future ISO timestamp. The manifest supports scheduling, but no unattended public schedule is enabled in this sprint. See the official [video resource documentation](https://developers.google.com/youtube/v3/docs/videos).

Projects created after 28 July 2020 that have not passed the YouTube API compliance audit have API uploads locked to private. A new PlayLiva project should be treated as private-only until a real test confirms the behavior and Google completes the required audit. See [`videos.insert`](https://developers.google.com/youtube/v3/docs/videos/insert) and [quota/compliance audits](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits).

## Policy boundary

The videos show free-play casino-themed games using Liva Credits and may still be age-restricted by YouTube. YouTube’s regulated-goods policy applies to external links and may age-restrict depictions or promotion of online gambling and social casinos. It also prohibits guaranteed-return claims and directing viewers to uncertified gambling services. See [Illegal or regulated goods or services](https://support.google.com/youtube/answer/9229611) and YouTube’s [online-gambling policy update](https://support.google.com/youtube/thread/328728041).

This batch avoids earnings claims, guaranteed outcomes, real-money balance presentation, direct operator URLs, affiliate links and operator branding in the rendered game area. Its only CTA is the relevant PlayLiva free-play route. Before public publishing, review the final video, description and landing page together because the PlayLiva landing experience contains separate commercial disclosures and offers outside the captured game unit.

## Future unattended mode

Keep public scheduling disabled until all of the following are true:

1. The dedicated Cloud project, YouTube Data API and least-privilege OAuth client are configured.
2. Google completes OAuth verification for the sensitive YouTube scopes.
3. The YouTube API project has completed any audit needed for public uploads.
4. A private Island Crash test upload finishes processing with no copyright or policy warning.
5. Public-link and age-restriction treatment is reviewed for the current PlayLiva landing page.
6. The first public Short receives explicit approval.

After that, add a scheduler around the existing manifest fields (`scheduledAt`, game rotation, duplicate checks and minimum gap) and move token storage to an approved secret store. Do not put OAuth credentials in Vercel public variables or browser code.
