# Liva Ginga

Free-play football crash Original using virtual Liva Credits only. No real-money wagering, withdrawals or certified fairness claims.

## Public routes and compatibility

Canonical routes: /en/play/liva-ginga, /pt-br/play/liva-ginga, /es-mx/play/liva-ginga.
Middleware sends the corresponding legacy /play/embaixadinha URLs to the new routes with HTTP 301, retaining locale and query/UTM parameters. The legacy page fails closed with noindex if middleware is bypassed. Sitemap, canonical, hreflang, social metadata, breadcrumbs and discovery links use the new slug.

Internal module names, asset directories, input IDs, performance marks and the historical analytics/wallet ID liva-embaixadinha intentionally remain stable. They are implementation compatibility identifiers, not the public product name. Supplied Meshy filenames remain verbatim. Historical scripts/tests can retain the previous technical name.

## Character and motion

The supplied Meshy footballer replaces the earlier castaway-derived model. Six original GLBs are preserved byte-for-byte in assets-source/originals/embaixadinha/meshy. scripts/embaixadinha-meshy-assets.mjs packages the base geometry/textures once with Idle_9, Kick_a_Soccer_Ball and Stumble_Walk animation tracks. Walking/running remain source-only. Runtime footballer.glb is 9,058,984 bytes; its manifest records source and output hashes.

The character is normalized to 1.70m. The approved yellow/green/blue kit and face are retained. The court, camera and environment are preserved.

meshy-player.ts samples source tracks directly each frame, avoiding mixer cache accumulation. Idle supplies base posture; a light upper-body kick segment supplies balance. Stable two-bone leg IK creates low alternating contacts with hip counterbalance and a lowered gaze. Touch profiles include the initial scoop, right/left instep taps and softer cushion touches. No repeated full-power kick is played.

Ball endpoints are calibrated from deformed instep vertices at each actual contact pose. Exact parabolas join contacts continuously. The active foot is still rising at contact, then recovers. Every frame evaluates deformed sole/stud vertices and places the lowest support point 3mm above the court. The opposite support leg remains planted; mesh scale is constant.

## Pace and immutable gameplay

The existing 73-touch schedule remains unchanged: 420–620ms between contacts, ending at 37,010ms. Alternating feet gives each leg 840–1240ms between its touches, with a 190ms preparation and 280ms recovery. This keeps the existing multiplier curve, sampled outcomes, expected returns and cashout boundaries intact. No global slowdown or settlement change.

## One crash frame

The renderer ticks the existing engine, then samples its snapshot once per animation frame. At crashAt it switches immediately to an outside-foot slip (outward and downward velocity), blends a trimmed upper-body Stumble_Walk reaction, freezes the HUD and dispatches crash audio before rendering that same frame. There is no separate React animation timer. The loss overlay waits for the rendered dropped phase. Later successful touches are not presented. A small recovery step keeps the body grounded.

Optional local trace callbacks record contact, stumble, ball escape, HUD freeze, cue dispatch and render times. Throttled frames dispatch only the latest contact, never a burst of missed sounds. Historical performance mark embaixadinha:crash-frame is retained.

## Audio

Existing procedural Web Audio: original 104BPM samba-style percussion/bass/plucked tones, varied soft contact sounds, whistle, cashout bells/cheer and bad-touch/fail sting/crowd reaction. No third-party recordings. A single context and music scheduler are reused. Sound OFF, hidden tabs and disposal silence/park or close audio. Unmuting during juggling resumes music on the next contact.

Cue dispatch shares the render event. The synth uses a 5ms Web Audio scheduling buffer; actual speaker/device latency is browser-dependent and is not claimed to be zero. Mobile Safari hardware still needs device listening review.

## QA and review

- tests/embaixadinha-character.test.mjs: actual GLB skinning, every contact and stumble grounding, contact trajectory continuity, immediate escape, alternating schedule and no premature failure pose.
- tests/liva-ginga-migration.test.mjs: localized 301/query retention, direct links, sitemap and metadata migration.
- tests/embaixadinha.test.mjs: existing outcomes, exact-deadline cashout, auto-cashout and settlement contracts.
- tests/football-audio.test.mjs: single context/scheduler, sound-off, hide/resume, mid-round unmute and disposal.
- scripts/embaixadinha-visual-qa.mjs: local-only frozen-clock real renderer on port 3113. No public outcome override.
- scripts/liva-ginga-timing-qa.mjs: 12 rounds at 1440/430/390/320, fail contacts 2/20/55, contact/crash/audio traces and screenshots.
- scripts/embaixadinha-character-qa.mjs: actual production-build game flow, invalid input, cashout, HUD freeze, overflow and network/console checks.

Evidence is intentionally local under social/output/embaixadinha-qa. Inspect actual mobile/desktop contact, apex, bad-touch and recovery frames before approving release. Source model is intentionally not aggressively optimized: future texture resizing/compression and compatible mesh compression require visual approval. The current motion uses feet/cushions rather than pretending a supplied power kick is a genuine thigh juggling clip.
