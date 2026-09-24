# Island Crash — kick contact, launch sync and audio

Presentation-only polish for `/[locale]/play/crash`. The round engine, crash
curve, wallet accounting, settlement, auto-cashout, history and every other
Original are untouched; `pnpm test` still asserts the engine and wallet
snapshots. The one deliberate rebase is the aggregate Originals file hash in
`tests/m10-product.test.mjs`, which now covers the new contact marker, the
kicker staging, the removed sky streaks and the audio module.

## The kick now lands on the rear, not the upper back

The kicking clip swings the foot above head height and then sweeps it straight
down the castaway's back. The previous marker, source **1.925 s**, caught the
foot at **70.5 % of the standing silhouette** — shoulder-blade height, nearest
skeleton joint `RightForeArm`. On camera that reads as a kick to the head.

Two staged changes, both re-derived from the shipped GLBs rather than guessed:

| | before | after |
| --- | --- | --- |
| `CONTACT_CLIP_SECONDS` | 1.925 s | **1.975 s** |
| `KICKER_START` | `[-1.05, -.1, -.55]` | **`[-1.11, -.1, -.54]`** |
| contact height | 70.5 % (upper back) | **55.6 % (buttocks)** |
| nearest joint | `RightForeArm` | **`Hips`** |
| foot ↔ body gap at contact | 0.004 | 0.001 |
| clearance one frame earlier | 0.003 (grazing the back) | **0.067 (clear)** |

The buttocks protrude **0.065 world units** further rear than the upper back,
so pulling the kicker back 0.06 lets the descending foot miss the back
entirely and still strike the rear hip. Both characters stay planted on the
sand at `y = -.1`; no rig, mesh, clip or character was replaced.

`tests/island-crash-polish.test.mjs` asserts the contact is behind the hips,
between 46 % and 62 % body height, nearest to `Hips`, and a full hip-to-head
span away from the head — so a future staging change cannot silently drift
back up to the shoulders.

## Contact, launch and audio share one deadline

The engine already publishes `flightAt = startedAt + PREPARING_MS + KICK_MS`,
and `KICK_MS` is `CONTACT_CLIP_SECONDS / KICK_SPEED`. Three consumers now read
that single timestamp:

1. the renderer seeks the kick clip to `kickAge * KICK_SPEED`, so the contact
   frame is drawn exactly at `flightAt`;
2. the castaway's launch pose and flight position are derived from the same
   `flightAt`, so upward motion starts on the first frame after contact;
3. `scheduleLaunch(flightAt)` converts that deadline once into AudioContext
   time and schedules the impact and whoosh in advance.

Audio is therefore not chasing a React render or a `requestAnimationFrame`
callback. Measured in the production build over three consecutive rounds, the
kick cue was scheduled **715 ms** after the start click against a computed
deadline of **714.29 ms** — inside a tenth of a frame at 60 fps.

The landing cue uses the same pattern: `finishedAt + fallDurationMs(...)` is
the engine's own impact deadline, scheduled the moment the fall begins.

## Audio: original, procedural, zero assets

Every sound is synthesised at runtime from oscillators and generated noise
buffers in `lib/originals/crash/audio.ts`.

| Item | Value |
| --- | --- |
| Source | Original PlayLiva work, composed and synthesised for this game |
| Licence | None required — no third-party recording, sample or track is used |
| Attribution | None required |
| Local filenames | None. There is no audio file in the repository or the bundle |
| Download cost | 0 bytes (verified: no media request on the gameplay route) |

This was chosen over sourcing royalty-free files deliberately: it removes all
licensing and attribution exposure, keeps the first gameplay load unchanged,
and lets every cue be scheduled on the engine clock instead of waiting for a
file to decode.

- **Round music** — a 112 BPM eight-bar island turnaround (C–Am–F–G) with a
  marimba/steel-drum lead built from a sine plus an inharmonic 3.01 partial,
  a triangle bass, off-beat chord stabs, a clave accent and a shaker. The
  phrase is scheduled note-by-note on a lookahead scheduler, so bars differ
  from one another and there is no loop seam or repeated one-bar motif.
- **Kick impact** — 180→55 Hz sine thump, a band-passed noise slap and a
  520→300 Hz triangle "boink" tail. Cartoonish, not realistic.
- **Launch whoosh** — noise through a 420→3000 Hz band-pass sweep plus a
  quiet rising lift tone, starting on the same deadline as the kick.
- **Fall / landing** — 140→40 Hz thud, a low-passed sandy splat, a comedic
  descending wobble and two coconut "bonk" pings just after the impact.

Mixing: music sits at 0.13 against 0.85 for effects, everything passes through
a limiter, and the music ducks to 45 % for 240 ms on the kick and 35 % for
340 ms on the landing so impacts always cut through.

### Lifecycle

- The AudioContext is created lazily inside the Start button handler, so
  mobile autoplay rules are satisfied and a visitor who never plays never
  builds one.
- The shell's existing **Sound** toggle drives `setEnabled`: the master gain
  ramps to zero, the scheduler stops and every pending voice is cancelled.
  With sound off, a full round schedules **zero** cues.
- Starting a round while music is already playing reuses the running
  scheduler; a round ending fades it out over 600 ms and clears the interval.
  Verified over consecutive rounds: one AudioContext, exactly one scheduler
  per round, no stacking and no cumulative level drift.
- Unmounting disposes the context and disconnects every node.

## Removed: the white sky streaks

The seven thin white cylinders that swept past during flight and the fall read
as rain or cheap speed lines. The whole `wind` group is gone, with no
replacement particle effect; altitude is carried by the existing parallax
clouds and the camera. The impact dust burst and landing ring are unchanged.

## QA

Deterministic frame stepping through `scripts/crash-visual-qa.mjs` at 1440,
430, 390 and 320 px: contact reads as a rear kick at every width, the castaway
leaves the ground on the frame after contact, the fall and landing stay
coherent, the multiplier HUD stays legible and no viewport overflows. Audio
behaviour was measured in the production build on the real route.
