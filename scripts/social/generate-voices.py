from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEPS = ROOT / "social" / "output" / "python-deps"
MODEL_CACHE = ROOT / "social" / "output" / "model-cache"
VOICE_DIR = ROOT / "social" / "output" / "voice"
MANIFEST = ROOT / "social" / "content" / "youtube-shorts-br.json"

sys.path.insert(0, str(DEPS))
os.environ.setdefault("HF_HOME", str(MODEL_CACHE))
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")

try:
    import numpy as np
    import soundfile as sf
    from kokoro import KPipeline
except ImportError as error:
    raise SystemExit("Voice runtime is missing. Run pnpm social:voice:setup first.") from error


def main() -> None:
    requested = next((arg.removeprefix("--id=") for arg in sys.argv[1:] if arg.startswith("--id=")), None)
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    items = [item for item in manifest["items"] if requested is None or item["contentId"] == requested]
    if not items:
        raise SystemExit(f"Unknown content ID: {requested}")

    VOICE_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_CACHE.mkdir(parents=True, exist_ok=True)
    pipeline = KPipeline(lang_code="p", repo_id="hexgrad/Kokoro-82M")

    for index, item in enumerate(items, 1):
        output = VOICE_DIR / f'{item["contentId"]}.wav'
        if output.exists() and "--force" not in sys.argv:
            print(f"[{index}/{len(items)}] exists {output.name}")
            continue
        chunks = []
        for _, _, audio in pipeline(item["voiceLine"], voice=item["voice"]["voice"], speed=item["voice"]["speed"]):
            chunks.append(np.asarray(audio, dtype=np.float32))
        if not chunks:
            raise RuntimeError(f'No narration generated for {item["contentId"]}')
        sf.write(output, np.concatenate(chunks), 24000, subtype="PCM_16")
        print(f"[{index}/{len(items)}] generated {output.name}")


if __name__ == "__main__":
    main()
