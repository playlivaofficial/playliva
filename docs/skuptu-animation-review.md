# Skuptu Levanta animation review

Local review: http://127.0.0.1:3120/pt-br/play/skuptu-levanta

Branch: `codex/three-game-mission`. Base: `a573049f166d50a14bb1458db1cef3fa5cbecd88`.
This adjustment is uncommitted and has not been pushed or deployed.

## Mechanics changed

- Retargeted the supplied athlete's neutral setup into a controlled deadlift. The leg drive comes before hip extension, with a neutral back and a forward gaze.
- Anchored each foot independently to the mat, at a 33 cm stance with modest toe turnout. Two-bone leg IK preserves the stance through the pull and failure recovery.
- Set a fixed vertical bar plane. The shaft starts at 30.5 cm and rises to roughly 78 cm. The knees clear the bar before lockout.
- Added two-bone arm IK with rear-facing elbow poles, symmetric 53.4 cm grip spacing, and near-full elbow extension. Small clavicle corrections accommodate the model's slightly unequal arm lengths.
- Aligned the grip to the palms, and pronated through the forearms. The supplied rig has no finger bones, so a localized hand-vertex correction curls the fingers around the shaft and blends back to the original hand shape on release. The source GLBs are untouched.
- Added restrained millimeter-scale effort tremor and chin bracing. Failure blends from the actual held pose into the supplied failure clip while keeping the feet planted. Release and the bar drop still use the authoritative crash frame.

The technique is a combination of procedural pose retargeting, arm/leg IK, hand and foot anchors, a grip blend shape, and failure blending. Gameplay timing, settlement, multiplier, controls, audio events, identity, commercial systems, routes, metadata, and the gym composition were not changed in this adjustment.

## Verification

`tests/levanta-pose.test.mjs` checks 101 pull poses against the shipped mesh: planted feet, extended elbows, grip centers on the shaft, vertical bar path, leg clearance, mat clearance, and restoration of the original hand geometry after release.

`scripts/levanta-animation-qa.mjs` captures setup, pull, strain, lockout, cashout, failure, release, impact, and recovery at 1440 / 430 / 390 / 320. Its deterministic harness is local-only. It checks for overflow, browser errors, foot drift, and matching crash/release/audio timestamps. Images and reports are in ignored `social/output/three-game/animation/`.

The renderer remains at 47 draw calls and 32,374 triangles in these checks. No texture, model download, or mesh was added by the animation correction. Browser viewport checks do not substitute for performance measurements on physical mobile devices.

Required toolchain: Node `v24.20.0`, pnpm `10.30.3`. Final command outputs are in ignored `social/output/three-game/final-*.log`.

Initial animation results: frozen install, lint, typecheck, all 447 tests, production build, the 414-URL route crawl, and the secret scan passed. The four-width animation harness and the actual production-build page smoke test reported no browser errors or horizontal overflow. Crash/release/failure audio shared a frame; impact/impact audio shared a frame at every width.

Remaining baseline warnings: the country-context and site-header effect lint warnings, the existing JSON-LD unused-disable lint warning, and Next.js's middleware-to-proxy deprecation. The route crawl reports PT-BR OG coverage of 104/111; it does not claim complete OG coverage.

## Files for this adjustment

- `components/originals/three-games/levanta-pose.ts`: pose, IK, grip and foot constraints.
- `components/originals/three-games/levanta-scene.ts`: integration into the existing rendering clock and failure transition; current PCF shadow-map name replaces its equivalent deprecated alias.
- `scripts/levanta-motion-audit.mjs`: inspection of the source joints and hand bounds.
- `scripts/levanta-animation-qa.mjs`: four-width visual and timing QA.
- `tests/levanta-pose.test.mjs`: geometry and pose regression checks.
- `tests/routes.mjs`: updated the older discovery-card expectation for the preceding three-game mission; no route or SEO implementation changed here.
- This review note.

Other uncommitted files belong to the preceding three-game mission and environment work.

## Shoe visibility and recovery follow-up

The failure clip animated `ToeBase` independently of the anchored ankle. The right sole reached Y=0.00665 against the mat's Y=0.020 surface, so roughly 1.3 cm of the lower shoe could disappear into the platform. Camera/container cropping was not the cause. The fix retains each shoe's toe position, rotation and scale together with its ankle anchor, without raising the character or changing the floor/camera.

The source failure clip also drifted backward into a stiff standing finish. Recovery now settles the pelvis over the planted stance, holds a modest forward torso angle, softens the knees, drops the shoulders and gaze, and lets the arms hang with a small elbow bend. The correction fades in after release; subtle breathing keeps the resting pose from freezing. The existing pull and the first release frame are preserved.

Regression coverage now includes 150 recovery samples across early, middle and lockout failures, in addition to the 101-pose pull sweep. It checks the complete skinned mesh against the platform, both toe and ankle anchors, forward recovery posture, and continuity on the release frame. The visual harness also captures the late post-failure stance and checks console errors. Its local server now serves the existing operator image and favicon so missing harness assets do not obscure genuine console failures.

Follow-up files: `levanta-pose.ts`, `tests/levanta-pose.test.mjs`, `scripts/levanta-animation-qa.mjs`, `scripts/three-game-scenarios.mjs`, `scripts/three-game-browser-qa.mjs`, and this note. There are no camera, environment, engine, settlement, audio, commercial, or SEO changes in this follow-up. Logs use `social/output/three-game/shoes-*.log`.

Follow-up validation: frozen install, lint, typecheck, all 448 tests, the expanded pose regression checks, and the production build passed with Node v24.20.0 / pnpm 10.30.3. Final four-width screenshots and the production-page smoke test report no console errors or overflow. Shoes remain visible in setup, pull, lockout, impact and late recovery; the crash/release and impact/audio timestamps still match. The three baseline lint warnings and Next middleware deprecation remain. Nothing has been committed or deployed.

## Final skinned outsole contact

The remaining grounding weakness was measurement order and coverage: ankle targets were calibrated once in the source Ready pose, before final IK, using vertices with more than 60% ankle/toe influence. That excludes shoe vertices influenced by the shin and does not guarantee final animated mesh contact. The initial model offset also used a bottom-9%-of-bind-bounds heuristic. Neither is now used as the final contact constraint.

Close-up renders with the mat present and hidden did **not** reproduce literal setup-pose floor intersection in the preceding build. The supplied shoe has an uneven, curved lower outline even without the floor. Consequently, the earlier numeric clearance checks should not be read as proof that the user's entire visual concern was resolved, and this change does not claim to reconstruct the source footwear.

The initial root offset now measures the complete skinned mesh. The pose solver caches each shoe's below-ankle vertices, including shin influences, then measures their actual world-space minimum after ankle/toe retargeting. It corrects each ankle vertically and re-solves the leg, with up to two correction passes, in setup, pull, release and recovery. A shared contact definition ties the solver to the unchanged platform geometry: mat top Y=0.020, highest seam Y=0.0214, target outsole Y=0.0234 (2 mm separation from the seam to avoid surface intersection). Torso, hands, bar and horizontal stance anchors are unchanged. The existing forward fatigue hinge, shoulder drop and relaxed recovery arms remain.

Independent full-mesh regression scans cover 101 pull poses and 150 failure/recovery poses. Both sole minima must stay within 0.02 mm of the target, so tests reject excessive floating as well as sinking. Toe X/Z remains planted while vertical contact corrections are bounded to 4 mm. The four-width browser checks additionally assert contact clearance in setup, lift, lockout, release, impact and recovery. Draw calls remain 47 and triangles 32,374; no assets were added. This is desktop browser QA, not a physical-device performance benchmark.

Files changed for this contact correction: `levanta-contact.ts`, `levanta-pose.ts`, `levanta-scene.ts`, `levanta-environment.ts` (shared height constants only; identical geometry), `tests/levanta-pose.test.mjs`, `scripts/levanta-animation-qa.mjs`, and this document. Validation logs use `social/output/three-game/contact-*.log`; close-up captures, rendered mesh measurements and four-width screenshots are also in the ignored output directory. No gameplay, timing, audio, SEO, affiliate, framing or source-asset changes were made.

Final validation passed on Node v24.20.0 / pnpm 10.30.3: frozen install, lint (three existing warnings), typecheck, 448 tests, targeted geometry recheck, and production build (existing middleware deprecation). The four-width animation run and production-page smoke test recorded no console errors or overflow. An additional browser scan of every rendered mesh vertex independently confirmed both sole minima and in-canvas shoe bounds in all 12 width/pose combinations, with the engine phase checked explicitly. Crash/release/audio and impact/audio timestamps remain matched. Review the refreshed production build at `http://127.0.0.1:3120/pt-br/play/skuptu-levanta?review=outsole-contact`. No commit or deployment was made.
