# Single Island Crash creative validation

Bulk rendering is paused pending human review of one corrected Short. No other
masters are changed. The existing 50-item manifest and approval states are not
written by this workflow. Public publishing and scheduling are not supported.

Native 1440×2560 tab-capture trials at 60 and 30 fps had uneven delivery on the
current Windows host. The validation therefore retains the recorder's native
25 fps through export, with no 25→30 frame duplication or low-resolution upscale.
The pinned Playwright recorder normally compresses its source to 1 Mbps. The
local validation harness intercepts only that recorder process's exact argument
signature and sets 24 Mbps, qmax 12, four threads and speed 4. Dependencies are
not edited; the harness rejects the capture if this adjustment was not applied.

The 1440×2560 composition and 1196×760 gameplay canvas are downscaled to a real
1080×1920 master. A temporary magenta source marker aligns the clip and SFX; it
is excluded from the final master. An isolated, repeatable local demo sample
provides a full flight and fall for comparison without changing production
game code or randomness. The final uses H.264 High at a 10 Mbps CBR target and
AAC at 256 kbps, with 25 fps retained. ffprobe and frame-difference checks reject
incorrect dimensions, frame count, or near-frozen flight/fall frames.

The original Kokoro `pf_dora` narration WAV is reused. The new owned procedural
score combines changing marimba-style phrases, plucked bass, shakers and hand
percussion, a flight riser, fall whoosh, impact and playful resolution. Real
sidechain compression ducks the music under narration; two-pass loudness targets
−16 LUFS / −1.5 dBTP. The brand row is below the headline and above gameplay.

On this Windows capture host, start the existing production build on port 3101.
Use installed Chrome and the existing approved narration. A local ffprobe binary
is expected at `social/output/local-tools/package/bin/win32/x64/ffprobe.exe`
(the `ffprobe-static` archive can be unpacked there without changing dependencies).

```text
node --import tsx scripts/social/capture-crash-validation.mjs --fps=25 --high-quality --repeatable-demo
node scripts/social/encode-crash-validation.mjs
```

These commands refuse to overwrite an existing capture/master. Outputs and QC
reports live in ignored `social/output/crash-validation/`. Only the final file
`island-crash-validation-final.mp4` is the review candidate; native trials and
rejected drafts are diagnostic artifacts, not additional library Shorts.

After explicit authorization for this single private upload:

```text
node --import tsx scripts/social/youtube-validation-upload.mjs --confirm-one-private
```

The uploader verifies the exact PlayLiva channel, final dimensions and motion QC,
checks for an existing matching UTM, and stores a durable resumable session under
ignored `.youtube-oauth/`. It never advances the bulk queue or changes existing
videos. Channel quota/upload-limit errors stop immediately. Do not blindly retry
such errors. The upload result is in the ignored validation output folder.

Before scaling, review the actual local master and YouTube's finished HD version.
API processing success alone is not proof that YouTube preserved visual quality.
