# Liva Embaixadinha

A PlayLiva Original crash game, free to play with virtual Liva Credits only. A
stylized 3D player juggles a ball on a Brazilian street court; the multiplier
rises with every touch, and the round crashes when he loses the ball. It is not
certified, audited, regulated or provably fair, and credits have no monetary
value. Route: `/[locale]/play/embaixadinha` (en, pt-BR, es-MX).

## One authoritative crash event

`lib/originals/embaixadinha/juggle.ts` is the only contract.

- **Touch schedule.** The rhythm is fixed and identical for every round:
  - 73 touches: the flick at 0 ms, then touches up to 37,010 ms.
  - The feet play fast 480 ms touches early.
  - Feet and thighs mix in the middle.
  - Higher 560–620 ms arcs come late.
  - The tier (0/1/2) drives presentation energy only.
- **Multiplier.** It is 100·e^(t/8000) in hundredths: 2× at about 5.5 s,
  10× at about 18.4 s, capped at 100×.
- **Crash draw.** Before the flick, the engine draws which touch fails from one
  crypto sample: P(the juggle is still alive at touch k) = 0.99·e^(−t_k/8000).
  - The 100× touch always fails, so the cap can never be exceeded.
  - The failure variant (sideways, heel, over-hit, between the feet) is a pure
    hash of the round and touch. It is presentation only.
- **Crash publication.** `engine.ts` publishes `crashAt`, `failTouch` and
  `variant` only when the clock reaches that touch time.
  - Until then the snapshot carries `crashAt: 0` and no outcome.
  - A manual cashout exactly at the failing touch loses.
  - An auto cashout wins only if its target time is strictly before
    `crashAt`.
- **Frame sync.** The renderer (`juggle-scene.ts`) ticks the engine with the
  same clock inside each animation frame, before it samples anything. On the
  first frame at or after `crashAt`, in that single frame:
  - the ball switches from its calibrated parabola to the escape trajectory;
  - the pose branches into the failure;
  - the HUD text freezes at the touch's multiplier (written directly, not via
    React);
  - the crash cue plays and the music stops;
  - `performance.mark('embaixadinha:crash-frame')` records
    `{crashAt, frameAt, lagMs}`.

  Before the failing touch, the pose and ball are provably identical to a
  surviving round (tested).
- **Returns.** An auto cashout at target *a* returns (a/100)·0.99·e^(−t_next/8000),
  where t_next is the first touch after *a* is reached.
  - The maximum is 99%.
  - Across targets it ranges from about 91.6% to 99%, averaging about 95.9%.
  - The first touch fails 7.23% of the time.
  - P(reaching 2×) is 48%.

**Measured crash sync.** This used the production build, 390 px mobile
emulation, headless Chromium with SwiftShader software GL.

- In 6 of 6 rounds, the frame before the crash frame ran before `crashAt`, so
  the failure appeared on the first frame after the deadline.
- `lagMs` ranged from 4 to 109 ms, always below that frame's interval. Software
  GL in this container draws frames 60–220 ms apart; on a GPU the lag is below
  one 16 ms frame.
- The HUD read exactly the failing touch's multiplier (1.06×, 1.20×, 1.35×,
  1.52×) and did not change afterwards.

## Character, court and assets

- **Character.** `node scripts/embaixadinha-assets.mjs` derives
  `runtime/craque.glb` from PlayLiva's own rigged Island Crash castaway
  (`public/originals/crash/runtime/castaway.glb`, the M5 supplied asset). It
  keeps the same 28-joint skeleton and skinning, projects the hair onto a
  close buzz cut and strips animations.
  - The output is 1,720,656 bytes; the manifest records its SHA-256.
  - The kit is painted in a shader (`craque-kit.ts`) from bind-pose regions:
    yellow jersey with a green V-neck and trim, "10" on the back, blue shorts,
    white hooped socks, boots, stubble and a clipper fade.
  - It uses no real person, no photograph and no third-party character asset.
  - It has no club, federation or sportswear marks.
- **Motion.** All juggling motion is procedural (`juggle-motion.ts`):
  - Contact points are calibrated from the rig's forward kinematics.
  - The ball follows exact parabolas between contacts.
  - Escapes are integrated with bounces.
  - The head tracks the ball, with a hands-on-head reaction after a miss.
- **Court.** `court.ts` builds the scene from primitives and canvas textures:
  - a painted street court, murals ("A QUADRA É NOSSA") and fence;
  - a small goal and bunting;
  - a colourful terraced hillside of instanced houses, palms and water tanks,
    under a warm sky.

  It is a warm, generic community setting, with no real place, landmark or
  caricature.
- **Poster.** `poster.webp` (1200×675) is rendered from the real scene by
  `node scripts/embaixadinha-visual-qa.mjs --poster`.
- **Audio.** All audio is procedural Web Audio from the shared kit in
  `lib/originals/synth.ts`: no samples, no licensed music.
  - The music is an original samba batucada groove in D at 104 BPM: surdo,
    caixa, ganzá, bass and cavaquinho. Tamborim, agogô and a whistled hook
    join mid-round, and repinique calls join late.
  - The cues are: a referee whistle at the start, a varied leather "tock" per
    touch, a crash (miss, "wah-wah" brass, crowd groan), ball bounces and a
    cashout (bells and cheer).
  - Sound OFF silences and suspends everything; a hidden tab suspends the
    clock; unmount closes the context. The loop never stacks
    (`tests/football-audio.test.mjs`).

## Performance

Measured on the production build at 390 px:

- **Ready time.** The game is ready (model, kit shader, court) about 2.9 s
  after navigation in this software-GL container.
- **Page transfer.** It is about 3.7 MB, mostly the 1.72 MB character and the
  shared three.js runtime.
- **Game JavaScript.** About 19 KB gzip on top of three.js (162 KB gzip),
  which is shared with Island Crash.
- **Ordinary pages.** They never load the renderer; `pnpm test:routes` checks
  this.
- **Renderer.** DPR is capped. The court uses instancing and a static shadow
  blob, and reduced motion calms the scenery.

## QA

`node scripts/embaixadinha-visual-qa.mjs` serves the real scene with a frozen
clock and a `window.qa` API on localhost:3113, for example
`?fail=40&variant=overhit`. The public route has no outcome override.
`tests/embaixadinha.test.mjs` covers:

- the schedule, sampling distribution and returns;
- the one-event crash and cashout/auto edges;
- 25 full rounds;
- contact calibration, the presentation branch point, copy parity and the
  asset hash.
