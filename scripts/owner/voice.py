"""One PT-BR narration. Local CPU model; no interactive agent or paid API."""
import json
import os
import sys
from pathlib import Path

os.environ.setdefault('HF_HUB_DISABLE_TELEMETRY', '1')
from kokoro import KPipeline
import numpy as np
import soundfile as sf

job = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
pipeline = KPipeline(lang_code='p', repo_id='hexgrad/Kokoro-82M')
chunks = [np.asarray(audio, dtype=np.float32) for _, _, audio in pipeline(job['voiceLine'], voice='pf_dora', speed=1.04)]
if not chunks:
    raise RuntimeError('Narration generation returned no audio.')
sf.write(sys.argv[2], np.concatenate(chunks), 24000, subtype='PCM_16')
