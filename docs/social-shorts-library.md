# PlayLiva Originals premium Shorts library

Social Growth Sprint #1B defines 50 PT-BR YouTube Shorts: ten unique concepts for each playable PlayLiva Original (`crash`, `mines`, `blackjack`, `roulette`, and `capybara-gold`). The manifest is `social/content/youtube-shorts-br.json`. The five-item proof-of-concept manifest, including its private validation-upload record, is preserved separately as `social/content/youtube-shorts-br-v1-archive.json`.

## Reproducible production

Generated narration, browser recordings, MP4 masters, thumbnails, model files, and review pages stay under ignored `social/output/`. They can be reproduced from tracked source files:

```bash
pnpm social:voice:setup
pnpm social:voice
pnpm social:capture
pnpm social:inspect
pnpm social:review
```

The voice setup installs the pinned Kokoro runtime under `social/output/python-deps`; it does not add Python packages to the web application. Narration uses the official multilingual Kokoro-82M model with Brazilian Portuguese language code `p` and the `pf_dora` voice. Model downloads are cached outside Git. Review the upstream Apache-2.0 model license and voice-card notes before redistribution.

Capture renders the live game DOM in an isolated 1440×2560 browser stage. The browser recorder supplies a stable native 25 fps source, so masters use 30 fps rather than manufacturing a 60 fps claim. FFmpeg performs one final Lanczos downsample to 1080×1920 and encodes H.264 High profile at CRF 17 with AAC audio at 192 kbps. It mixes the PT-BR narration with generated electronic beds and game-specific synthesized cues, then normalizes delivery to -16 LUFS and -1.5 dBTP. No commercial music or third-party gameplay is used.

Every capture uses the actual PlayLiva controls and game engine. Outcomes come from the running game and are never injected. Browser chrome, navigation, operator offers, affiliate links, account data, and debugging UI are excluded. The composition keeps primary text and calls to action away from the lower and right-side YouTube overlays. PlayLiva is the primary brand, LivaSports is a secondary network mark, and the final call to action links only to the relevant PlayLiva free-play route.

Use `--id=<content-id>` with `social:voice`, `social:capture`, or `social:inspect` to regenerate one item. Capture also accepts `--game=<game-slug>`.

## Review and publishing boundary

`social:inspect` checks dimensions, duration, frame rate, video/audio codecs, bitrate floors, sampled-frame detail, exact file hashes, and duplicate master files. It writes the tracked `social/content/youtube-shorts-br-qc.json` report and ignored per-game contact sheets under `social/output/review-library/`. Automated success moves an item only to `qualityStatus: needs_review`; it never approves it.

Human review must check all 50 videos for framing, legibility, real gameplay, narration, pacing, audio balance, duplicate creative treatment, responsible-play text, branding, and the end card. Only then may an individual item be approved:

```bash
pnpm social:review -- --approve=<content-id>
```

Approval changes review state; it does not upload. Uploading even one private validation item is a separate action. Bulk upload, scheduling, unlisted upload, and public publishing remain disabled for this library.

Attribution is unique per Short:

```text
utm_source=youtube
utm_medium=organic_social
utm_campaign=playliva_originals_shorts
utm_content=<content-id>
```

All targets are exact PT-BR PlayLiva Original routes. No operator or affiliate destination appears in the video or metadata.
