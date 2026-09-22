import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const capture = await readFile(new URL('../scripts/social/capture-shorts.mjs', import.meta.url), 'utf8')
const voice = await readFile(new URL('../scripts/social/generate-voices.py', import.meta.url), 'utf8')

test('renderer captures native gameplay at high resolution and performs one premium master encode', () => {
  assert.match(capture, /CAPTURE_WIDTH = 1440/)
  assert.match(capture, /CAPTURE_HEIGHT = 2560/)
  assert.match(capture, /scale=\$\{item\.encoding\.width\}:\$\{item\.encoding\.height\}:flags=lanczos/)
  assert.match(capture, /libx264/)
  assert.match(capture, /-profile:v/)
  assert.match(capture, /-movflags', '\+faststart'/)
  assert.doesNotMatch(capture, /screenshot\(/)
})

test('renderer includes safe-zone brand treatment, a PlayLiva-only CTA and real controls', () => {
  assert.match(capture, /playliva-lockup\.svg/)
  assert.match(capture, /livasports-lockup\.svg/)
  assert.match(capture, /JOGUE GRÁTIS NO PLAYLIVA/)
  assert.doesNotMatch(capture, /livasports\.com/)
  for (const selector of ['data-action', 'data-mines-start', 'data-blackjack-deal', 'data-roulette-spin', 'data-slot-spin']) assert.match(capture, new RegExp(selector))
})

test('audio path uses PT-BR Kokoro narration, generated beds/SFX and delivery loudness', () => {
  assert.match(voice, /KPipeline\(lang_code="p"/)
  assert.match(voice, /voice=item\["voice"\]\["voice"\]/)
  assert.match(capture, /aevalsrc=/)
  assert.match(capture, /loudnorm=I=\$\{item\.audio\.loudnessLufs\}:TP=\$\{item\.audio\.truePeakDb\}/)
  assert.match(capture, /item\.encoding\.audioBitrateKbps/)
})
