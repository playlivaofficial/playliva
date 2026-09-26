import type { AudioMix } from '../audio-mix'
/**
 * Liva Embaixadinha audio — original runtime synthesis (see lib/originals/synth.ts).
 *
 * Music: a street-samba batucada in D major at 104 BPM (16th-note grid in
 * 2/4): surdo, caixa, tamborim, agogô, ganzá, a cavaquinho-style strum,
 * a 7-string-style bass line and a short whistled hook. Layers enter with
 * the juggle's energy tier, so higher multipliers sound busier without
 * getting louder. No known song, chant or anthem is quoted.
 *
 * Sync: the renderer calls touch/crash/bounce on the exact frame the event
 * becomes visible; nothing here decides or anticipates an outcome.
 */
import { createSynth, note } from '../synth'
import type { FailVariant, TouchKind } from './juggle'

const STEP = 60 / 104 / 4
const E3 = note(-17), Fs3 = note(-15), B2 = note(-22), E2 = note(-29), A2 = note(-24), D2 = note(-31)
const D4 = note(-7), Fs4 = note(-3), A4 = note(0), B3 = note(-10), Ds4 = note(-6), E4 = note(-5), G4 = note(-2), Cs4 = note(-8)
const D5 = note(5), E5 = note(7), Fs5 = note(9), A5 = note(12), B4 = note(2), Cs5 = note(4)
/** Two bars per chord: D – B7 – Em – A7 (a classic samba turnaround). */
const CHORDS: readonly { bass: readonly [number, number]; voicing: readonly number[] }[] = [
  { bass: [D2, A2], voicing: [D4, Fs4, A4] }, { bass: [B2, Fs3], voicing: [B3, Ds4, A4] },
  { bass: [E2, B2], voicing: [E4, G4, B4] }, { bass: [A2, E3], voicing: [Cs4, E4, G4] },
]
// 16-step (two-bar) patterns. 1 = hit, 2 = accent.
const TAMBORIM = [2, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0]
const AGOGO = [2, 0, 1, 0, 2, 0, 0, 1, 0, 1, 0, 2, 0, 1, 0, 0] // 2 = high bell, 1 = low bell
const STRUM = [0, 1, 0, 1, 1, 0, 1, 0]
/** Whistled hook, one note per step (null = rest), played every fourth bar pair from tier 1. */
const HOOK: readonly (number | null)[] = [A4, null, D5, null, E5, Fs5, null, E5, D5, null, B4, null, A4, null, null, null,
  Fs5, null, E5, D5, null, Cs5, null, A4, B4, null, A5, null, Fs5, null, null, null]

export interface JuggleAudio {
  setMix(mix: AudioMix): void
  setEnabled(enabled: boolean): void
  unlock(): void
  setVisible(visible: boolean): void
  /** Referee whistle + wind-up; groove starts on the flick. */
  roundStart(): void
  touch(kind: TouchKind, tier: 0 | 1 | 2, index: number): void
  crash(variant: FailVariant): void
  bounce(strength: number): void
  cashout(multiplier: number): void
  /** Round fully over (court resets). */
  roundEnd(): void
  dispose(): void
}

export function createJuggleAudio(): JuggleAudio {
  const s = createSynth({ musicGain: 0.13 })
  let energy: 0 | 1 | 2 = 0, playing = false

  function groove(index: number, at: number) {
    const bus = s.music
    const step = index % 16, bar8 = index % 8, chord = CHORDS[Math.floor(index / 16) % CHORDS.length]
    // Surdo: light muted on beat 1, open low on beat 2.
    if (bar8 === 0) s.tone(at, { frequency: 70, bend: 52, bendSeconds: .12, decay: .14, gain: .32, bus })
    if (bar8 === 4) s.tone(at, { frequency: 64, bend: 44, bendSeconds: .3, decay: .38, gain: .55, bus })
    // Caixa 16ths: ghost notes with accents on the "a".
    s.noise(at, { duration: .045, gain: bar8 % 4 === 3 ? .09 : .035, type: 'bandpass', frequency: 3200, q: .9, bus })
    // Ganzá.
    s.noise(at, { duration: .035, gain: bar8 % 2 ? .04 : .022, type: 'highpass', frequency: 7800, bus })
    // Bass: root / fifth.
    if (bar8 === 0 || bar8 === 3) s.tone(at, { type: 'triangle', frequency: chord.bass[0], decay: .22, gain: .3, bus })
    if (bar8 === 4 || bar8 === 6) s.tone(at, { type: 'triangle', frequency: chord.bass[1], decay: .18, gain: .22, bus })
    // Cavaquinho strum: quick plucked chord with a tiny roll.
    if (STRUM[bar8]) chord.voicing.forEach((f, i) => s.tone(at + i * .008, { type: 'triangle', frequency: f * 2, decay: .09, gain: .05, bus, partials: [[2, .3]] }))
    if (energy >= 1) {
      const hit = TAMBORIM[step]
      if (hit) { s.noise(at, { duration: .03, gain: hit === 2 ? .09 : .06, type: 'bandpass', frequency: 5200, q: 3, bus }); s.tone(at, { frequency: 1250, decay: .03, gain: .05, bus }) }
      const bell = AGOGO[step]
      if (bell) s.tone(at, { frequency: bell === 2 ? 1180 : 890, decay: .16, gain: .07, bus, partials: [[2.4, .3]] })
      const lead = HOOK[index % 64 < 32 ? index % 32 : 99]
      if (lead) s.tone(at, { frequency: lead, decay: .2, gain: .075, attack: .02, bus, partials: [[2, .08]] })
    }
    if (energy >= 2) {
      // Repinique calls at the end of every second bar.
      if (step >= 13) s.tone(at, { frequency: 420, bend: 360, bendSeconds: .05, decay: .06, gain: .12, bus })
      s.noise(at, { duration: .02, gain: .025, type: 'highpass', frequency: 9500, bus })
    }
  }

  function whistle(at: number, long: boolean) {
    // Two-tone referee whistle with a pea trill.
    for (const [offset, length] of long ? [[0, .12], [.16, .38]] as const : [[0, .16]] as const) {
      s.tone(at + offset, { frequency: 2750, decay: length, gain: .08, attack: .01, partials: [[1.02, .8]] })
      s.noise(at + offset, { duration: length, gain: .025, type: 'bandpass', frequency: 2800, q: 6 })
    }
  }

  return {
    setMix: s.setMix,
    setEnabled(next) { s.setEnabled(next); if (!next) playing = false },
    unlock: () => s.unlock(),
    setVisible: next => s.setVisible(next),
    roundStart() {
      const at = s.ready()
      if (at === null) return
      energy = 0
      whistle(at, false)
    },
    touch(kind, tier, index) {
      const at = s.ready()
      if (at === null) return
      // Also resume after sound is enabled mid-round or the opening flick was
      // skipped by a throttled tab. One guarded scheduler, never stacked loops.
      if (!playing) { playing = true; s.startLoop(STEP, groove); s.musicLevel(1, .25) }
      if (kind === 'flick') {
        // Flick: scoop + the groove kicks in.
        s.tone(at, { frequency: 240, bend: 420, bendSeconds: .08, decay: .1, gain: .28 })
        s.noise(at, { duration: .05, gain: .12, type: 'bandpass', frequency: 1500 })
        return
      }
      if (tier !== energy) energy = tier
      // Leather-on-instep "tock": pitch drifts touch to touch; thighs are duller.
      const thigh = kind.endsWith('thigh')
      const drift = 1 + ((index * 37) % 11 - 5) * .012
      const base = (thigh ? 150 : 205) * drift
      s.tone(at, { frequency: base, bend: base * .62, bendSeconds: .07, decay: thigh ? .1 : .075, gain: thigh ? .36 : .42 })
      s.noise(at, { duration: thigh ? .04 : .028, gain: thigh ? .06 : .1, type: 'bandpass', frequency: thigh ? 900 : 1700, q: 1.2 })
      // Every tenth touch: a small bright accent so long streaks feel like progress.
      if (index % 10 === 0) s.tone(at + .03, { frequency: 1480, decay: .12, gain: .06, partials: [[2.01, .3]] })
      s.duck(at, .8, .12)
    },
    crash(variant) {
      const at = s.ready()
      if (at === null) return
      // Mistimed contact (or a clean miss), then a comic "wah-wah" sting and a crowd groan.
      if (variant !== 'between-feet') {
        s.tone(at, { frequency: 150, bend: 95, bendSeconds: .09, decay: .12, gain: .4 })
        s.noise(at, { duration: .06, gain: .14, type: 'bandpass', frequency: 1100, q: .8 })
      } else s.noise(at, { duration: .12, gain: .06, type: 'bandpass', frequency: 600, sweepTo: 300 })
      s.stopLoop(); playing = false
      s.musicLevel(0, .18)
      const wah = [note(-9), note(-10), note(-11), note(-12.5)]
      wah.forEach((f, i) => s.brass(at + .12 + i * .2, f / 2, i === 3 ? .55 : .18, .05))
      s.noise(at + .15, { duration: .9, gain: .07, type: 'bandpass', frequency: 900, sweepTo: 420, q: 2.5, attack: .15 })
      s.noise(at + .15, { duration: .9, gain: .05, type: 'bandpass', frequency: 2200, sweepTo: 1300, q: 3, attack: .15 })
    },
    bounce(strength) {
      const at = s.ready()
      if (at === null) return
      s.tone(at, { frequency: 120, bend: 70, bendSeconds: .08, decay: .1, gain: .35 * strength })
      s.noise(at, { duration: .04, gain: .06 * strength, type: 'lowpass', frequency: 800 })
    },
    cashout(multiplier) {
      const at = s.ready()
      if (at === null) return
      // Bright rising bells + a short crowd cheer; bigger multipliers add a brass stab.
      for (const [i, f] of [D5, Fs5, A5, D5 * 2].entries()) s.bell(at + i * .06, f, .1, .5)
      s.noise(at, { duration: .8, gain: .07, type: 'bandpass', frequency: 1400, q: .7, attack: .12 })
      if (multiplier >= 500) for (const f of [D4, Fs4, A4]) s.brass(at + .05, f, .45, .05)
      s.duck(at, .5, .6)
    },
    roundEnd() {
      if (playing) { s.stopLoop(); playing = false }
      s.musicLevel(0, .4)
    },
    dispose() { playing = false; s.dispose() },
  }
}
