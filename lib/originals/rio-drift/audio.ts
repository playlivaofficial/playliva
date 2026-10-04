import { createSynth, note, type Synth } from '../synth'
import type { AudioMix } from '../audio-mix'
import type { TurboSnapshot } from './crash-engine'

/** Original syncopated electronic beat and synthesized car sounds; no downloaded audio. */
export function createDriftAudio(synth: Synth = createSynth({ masterGain: .65, musicGain: .15, sfxGain: .55 })) {
  let enabled = false, visible = true, disposed = false, driving = false, speed = 0
  function loop() {
    if (!enabled || !visible || disposed) { synth.stopLoop(); return }
    synth.startLoop(60 / 116 / 4, (i, at) => {
      const bus = synth.music, bass = [0, 0, 3, 0, 7, 5, 3, 7], chord = [0, 3, 7, 10]
      if ([0, 3, 6].includes(i % 8)) synth.tone(at, { frequency: 145, bend: 42, decay: .16, gain: .32, bus })
      if (i % 8 === 4) synth.noise(at, { type: 'bandpass', frequency: 1700, duration: .075, gain: .16, bus })
      if (i % 2) synth.noise(at, { type: 'highpass', frequency: 6400, duration: .035, gain: .055, bus })
      if ([0, 3, 5].includes(i % 8)) synth.tone(at, { type: 'triangle', frequency: note(bass[Math.floor(i / 2) % 8] - 36), decay: .21, gain: .36, bus })
      if (i % 4 === 2) synth.bell(at, note(chord[Math.floor(i / 4) % 4]), .08, .18, bus)
      if (!driving && i % 4 === 0) synth.tone(at, { type: 'triangle', frequency: 44, decay: .23, gain: .018 })
      if (driving && i % 2 === 0) {
        synth.tone(at, { type: 'triangle', frequency: 68 + speed * 2.4, decay: .32, gain: .12, partials: [[2, .32], [3, .12]] })
      }
    })
    synth.musicLevel(driving ? .9 : .42, .2)
  }
  return {
    setMix(mix: AudioMix) { synth.setMix(mix) },
    setEnabled(on: boolean) { disposed = false; enabled = on; synth.setEnabled(on); loop() },
    unlock() { if (!disposed) { synth.unlock(); loop() } },
    setVisible(on: boolean) { visible = on; synth.setVisible(on); loop() },
    drive(run: TurboSnapshot) { const next = run.phase === 'running'; speed = Math.min(54, Math.log(run.multiplier / 100 + 1) * 18); if (next !== driving) { driving = next; loop() } },
    cue(cue: 'start' | 'cashout' | 'crash' | 'finish' | 'ui') {
      if (disposed) return
      const at = synth.ready(); if (at === null) return
      if (cue === 'crash') { synth.duck(at, .15, .8); synth.noise(at, { type: 'lowpass', frequency: 1800, sweepTo: 120, duration: .38, gain: .35 }); synth.tone(at, { frequency: 105, bend: 35, decay: .4, gain: .26 }); return }
      if (cue === 'start') { synth.tone(at, { type: 'triangle', frequency: 100, bend: 380, decay: .6, gain: .19 }); return }
      if (cue === 'finish') { [0, 3, 7, 12].forEach((n, i) => synth.bell(at + i * .08, note(n), .14, .4)); return }
      synth.bell(at, cue === 'cashout' ? 880 : 520, .11, .16)
    },
    dispose() { disposed = true; driving = false; synth.dispose() },
  }
}
