import { createSynth, note } from '../synth'
import type { AudioMix } from '../audio-mix'

/** Original syncopated mallets, soft bass and shakers. No third-party samples. */
export function createAviaAudio() {
  const synth = createSynth({ masterGain: .7, musicGain: .16, sfxGain: .65 })
  let enabled = false, visible = true, disposed = false, flying = false, intensity = 0
  function music() {
    if (!enabled || !visible || disposed) { synth.stopLoop(); return }
    synth.startLoop(60 / 106 / 4, (i, at) => {
      const bus = synth.music, melody = [0, 7, 11, 14, 7, 4, 2, 9, 12, 9, 7, 4, 2, 7, 11, 9]
      if (i % 8 === 0) synth.tone(at, { frequency: note((i % 64 < 32 ? 0 : 5) - 36), decay: .34, gain: .5, bus })
      if ([0, 3, 6].includes(i % 8)) synth.tone(at, { frequency: 140, bend: 53, decay: .12, gain: .18, bus })
      if (i % 2) synth.noise(at, { type: 'highpass', frequency: 5200, duration: .055, gain: .045, bus })
      if ([0, 3, 5].includes(i % 8)) synth.bell(at, note(melody[Math.floor(i / 2) % 16] - 12), .19, .24, bus)
      if (flying && i % 4 === 0) synth.noise(at, { type: 'bandpass', frequency: 280 + intensity * 100, duration: .6, gain: .035, bus: synth.sfx })
    })
    synth.musicLevel(flying ? .85 : .55, .25)
  }
  return {
    setMix(mix: AudioMix) { synth.setMix(mix) },
    setEnabled(on: boolean) { disposed = false; enabled = on; synth.setEnabled(on); music() },
    unlock() { synth.unlock(); music() },
    setVisible(on: boolean) { visible = on; synth.setVisible(on); music() },
    flight(on: boolean, multiplier = 100) { flying = on; intensity = Math.min(6, Math.log(multiplier / 100)); music() },
    cue(cue: 'bet' | 'countdown' | 'takeoff' | 'cashout' | 'crash' | 'reset') {
      if (disposed) return
      const at = synth.ready(); if (at === null) return
      if (cue === 'takeoff') { synth.noise(at, { type: 'bandpass', frequency: 220, sweepTo: 1400, duration: 1.5, attack: .3, gain: .2 }); return }
      if (cue === 'crash') { synth.duck(at, .15, .9); synth.noise(at, { type: 'lowpass', frequency: 2200, sweepTo: 180, duration: .7, gain: .3 }); synth.tone(at, { frequency: 260, bend: 85, decay: .5, gain: .2 }); return }
      if (cue === 'cashout') { synth.duck(at, .3, .7); [0, 4, 7, 12].forEach((n, i) => synth.bell(at + i * .085, note(n), .21, .45)); return }
      synth.bell(at, cue === 'countdown' ? 660 : cue === 'bet' ? 880 : 440, .12, .12)
    },
    dispose() { disposed = true; synth.dispose() },
  }
}
