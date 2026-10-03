# Rio Drift

Rio Drift is the first skill-based Arcade Original. Runs never debit or award
Liva Credits. Points are not wagers, returns or prizes. There is one endless
score-attack mode, no account requirement and no global leaderboard.

## Gameplay and rendering

- `lib/originals/rio-drift/engine.ts` owns fixed 120 Hz steering, slip, traction,
  deterministic 300 m track sections, obstacle spacing and score settlement.
  Frame deltas are capped at 100 ms; hiding the tab or opening Settings pauses
  the run. Resume clears held inputs. Reload abandons an unfinished attempt.
- `components/originals/rio-drift/scene.ts` draws the original coupe, coast,
  palms, fictional traffic, city and tunnel with Canvas 2D. No external models,
  renderer dependency, audio samples or licensed vehicle designs are used.
- Controls: arrows/A-D while the game has focus, horizontal road dragging,
  or the two touch arrows. Pointer cancellation releases held steering.
- Distance awards 1.4 points/metre. Controlled drift awards
  `(40 + abs(angle) × 160) × combo` points/second. Every 1.4 seconds of drift
  increases combo up to 5×. Clean corners award `150 × combo`; near misses
  award `125 × combo`. Losing the clean line breaks combo.
- `records.ts` stores only a bounded local best, combo, distance and completed
  run count. It merges another tab's best and settles a run ID once. Blocked
  storage falls back to the current session. Shared Reset Balance preserves
  these separate arcade records.
- `audio.ts` uses the existing shared synthesis and Music/SFX settings. Its
  original 116 BPM syncopated electronic loop, engine, tires, tunnel, collision
  and result cues share one gesture-created context and one scheduler.

## Integrations and boundaries

Public routes are `/[locale]/play/rio-drift` and `/[locale]/arcade` for the
existing EN, PT-BR and ES-MX locales. Discovery includes one Original with
Arcade category and Racing/Skill format. Operator categories stay separate;
Arcade never claims that a partner offers Rio Drift. Existing BR header sponsor
and shared offer remain subject to trusted GEO and the current approved
campaign configuration. Offers count fully settled runs, after impact, at
3/6/9. Dismissing preserves future cadence.

Existing consented analytics emit open/start/complete and a best-score update.
Score context is limited to `under-1k`, `1k-5k`, `5k-10k`, `10k-plus`; no exact
records or balance are sent. Start/complete and affiliate events enter the
existing Owner Growth feed. Sitemap inventory supplies the localized SEO and
content views; there is no new owner subsystem.

SEO Autopilot explicitly permits the PT-BR Rio Drift title only, alongside its
existing provider targets. It retains Brazil/locale filtering, 56-day evidence,
sample and CTR-decline gates, one active experiment, 7/14/28-day measurement,
90-day cooldown and baseline rollback. No experiment is created by launch.
The normal cached title override applies only when the source baseline matches;
Preview and database outages retain source metadata.

Rio Drift is explicitly excluded from the dormant video-generation catalog.
The automatic video shutdown remains in force: no jobs, workers or uploads.
Its cover art can be rebuilt using `node scripts/rio-drift-assets.mjs`; the SVG
source and two WebP outputs are version-controlled together.

## Verification and release gate

Run the repository's frozen install, lint, typecheck, full tests, build,
`test:routes` and `social:secrets`. The Rio Drift focused tests cover physics,
cadence, inputs, local records, audio, consent, owner/discovery, localization,
SEO evidence gates and video shutdown. Browser review covers 1440/430/390/320
layouts and the real rendered gameplay. Use the existing read-only
`scripts/seo-discovery-audit.mjs` against a local production build to inspect
sitemap pages, duplicate metadata and links.

Owner approval is required before commit/push/PR/deployment. After approval,
follow the normal PR, hosted CI, Preview, merge-commit and Production workflow.
Only after Production is Ready on the merged SHA: inspect the PT-BR canonical
in Search Console, confirm the sitemap, request indexing if eligible and record
Google's actual result. Submission is not proof of indexing.
