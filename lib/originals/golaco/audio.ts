import type { AudioMix } from '../audio-mix'
/**
 * Liva Golaço audio — original runtime synthesis (see lib/originals/synth.ts).
 *
 * Stadium palette: crowd swells made from shaped noise, a goal horn, the
 * referee's whistle, snare rolls and a brassy marching-band bonus theme in
 * B♭ major at 124 BPM. No chant, anthem or known song is quoted; the crowd
 * is abstract texture (no words). Cues fire in the same render as the engine
 * state they describe and never influence an outcome.
 */
import { createSynth, note } from '../synth'

export type GolacoWinTier = 'small' | 'medium' | 'big' | 'super' | 'mega'
const STEP = 60 / 124 / 2 // eighth notes
const Bb2 = note(-23), F3 = note(-16), G3 = note(-14)
const Bb3 = note(-11), D4 = note(-7), Eb4 = note(-6), F4 = note(-4), G4 = note(-2), A4 = note(0)
const Bb4 = note(1), C5 = note(3), D5 = note(5), Eb5 = note(6), F5 = note(8), G5 = note(10), Bb5 = note(13)
/** I – IV – V – I per two bars. */
const BASS = [Bb2, Bb2, Eb4 / 2, Eb4 / 2, F3, F3, Bb2, G3]
const STABS: readonly (readonly number[])[] = [[Bb3, D4, F4], [Bb3, D4, F4], [Eb4, G4, Bb4], [Eb4, G4, Bb4], [F4, A4, C5], [F4, A4, C5], [Bb3, D4, F4], [G3, Bb3, D4]]
/** Original brass hook, one entry per eighth over 4 bars (null = rest). */
const HOOK: readonly (number | null)[] = [
  F5, null, D5, F5, null, Bb5, null, null, G5, null, Eb5, G5, null, Bb5, null, null,
  A4, C5, F5, null, Eb5, D5, C5, null, D5, null, Bb4, null, F5, null, null, null,
]

export interface GolacoAudio {
  setMix(mix: AudioMix): void
  setEnabled(enabled: boolean): void
  unlock(): void
  setVisible(visible: boolean): void
  spinStart(free: boolean): void
  reelStop(reel: number, landed: { trophies: number; trophiesSoFar: number; goals: number; wild: boolean; last: boolean }): void
  anticipation(untilMs: number): void
  win(tier: GolacoWinTier): void
  bonusTrigger(trophies: number): void
  streakUp(level: number): void
  retrigger(): void
  bonusMusic(active: boolean, featured?: boolean): void
  bonusEnd(big: boolean): void
  dispose(): void
}

export function createGolacoAudio(): GolacoAudio {
  const s = createSynth({ musicGain: 0.12 })
  let musicWanted = false, musicLevel = 1

  const crowd = (at: number, o: { duration: number; gain: number; low?: number; high?: number; attack?: number; bus?: GainNode | null }) => {
    // Two formant-ish bands of noise read as a distant crowd, not wind.
    s.noise(at, { duration: o.duration, gain: o.gain, type: 'bandpass', frequency: o.low ?? 520, sweepTo: (o.low ?? 520) * 1.25, q: 1.3, attack: o.attack ?? 0.12, bus: o.bus })
    s.noise(at, { duration: o.duration * 0.9, gain: o.gain * 0.7, type: 'bandpass', frequency: o.high ?? 1600, sweepTo: (o.high ?? 1600) * 1.2, q: 1.6, attack: o.attack ?? 0.12, bus: o.bus })
  }
  const whistle = (at: number, length: number, gain = 0.07) => {
    s.tone(at, { frequency: 2900, decay: length, gain, attack: 0.01, partials: [[1.018, 0.85]] })
    s.noise(at, { duration: length, gain: gain * 0.3, type: 'bandpass', frequency: 2950, q: 7 })
  }
  const horn = (at: number, gain: number) => {
    for (const f of [Bb3 / 2, D4 / 2, F4 / 2]) s.brass(at, f, 0.9, gain)
  }
  const snare = (at: number, gain: number, bus?: GainNode | null) => {
    s.noise(at, { duration: 0.09, gain, type: 'bandpass', frequency: 2400, q: 0.7, bus })
    s.tone(at, { frequency: 190, bend: 150, bendSeconds: 0.06, decay: 0.07, gain: gain * 0.8, bus })
  }

  function band(index: number, at: number) {
    const bus = s.music, beat = index % 8, bar = Math.floor(index / 8) % BASS.length
    if (beat % 4 === 0) s.tone(at, { frequency: 58, bend: 42, bendSeconds: 0.12, decay: 0.2, gain: 0.5, bus })
    if (beat === 2 || beat === 6) snare(at, 0.12, bus)
    if (beat === 7 && bar % 2 === 1) { snare(at, 0.06, bus); snare(at + STEP / 2, 0.08, bus) }
    s.noise(at, { duration: 0.03, gain: beat % 2 ? 0.02 : 0.035, type: 'highpass', frequency: 8200, bus })
    if (beat === 0 || beat === 3 || beat === 4) s.tone(at, { type: 'triangle', frequency: BASS[bar] * (beat === 3 ? 1.5 : 1), decay: 0.24, gain: 0.3, bus })
    if (beat === 1 || beat === 5) for (const f of STABS[bar]) s.brass(at, f, 0.16, 0.035, bus)
    const lead = HOOK[index % HOOK.length]
    if (lead) s.brass(at, lead, 0.2, 0.04, bus)
    // Crowd bed: slow swells under the band.
    if (index % 16 === 0) crowd(at, { duration: 2.2, gain: 0.03, attack: 0.9, bus })
  }

  return {
    setMix: s.setMix,
    setEnabled(next) { s.setEnabled(next); if (next && musicWanted) { s.startLoop(STEP, band); s.musicLevel(musicLevel, .3) } },
    unlock: () => { s.unlock(); if(musicWanted){s.startLoop(STEP,band);s.musicLevel(musicLevel,.4)} },
    setVisible: next => s.setVisible(next),
    spinStart(free) {
      const at = s.ready()
      if (at === null) return
      s.noise(at, { duration: 0.03, gain: 0.28, type: 'bandpass', frequency: 3400, q: 1.4 })
      s.tone(at + 0.01, { frequency: 120, bend: 70, bendSeconds: 0.08, decay: 0.1, gain: 0.45 }) // boot-on-ball thump
      s.noise(at + 0.02, { duration: 0.35, gain: 0.13, type: 'bandpass', frequency: 320, sweepTo: 2200, q: 1.3, attack: 0.07 })
      // Reel roll: a quick rattle for the length of a normal spin.
      for (let t = 0.12; t < 1.2; t += 0.055) s.noise(at + t, { duration: 0.03, gain: 0.035 * (1 - t / 1.4), type: 'bandpass', frequency: free ? 1900 : 1500, q: 2 })
      s.duck(at, 0.6, 0.4)
    },
    reelStop(reel, landed) {
      const at = s.ready()
      if (at === null) return
      const vary = [1, 0.93, 1.07, 0.9, 1.1][reel % 5] * (1 + (Math.random() - 0.5) * 0.04)
      s.tone(at, { frequency: 150 * vary, bend: 64, bendSeconds: 0.08, decay: landed.last ? 0.15 : 0.1, gain: landed.last ? 0.6 : 0.48 })
      s.noise(at, { duration: 0.03, gain: 0.2, type: 'bandpass', frequency: 2600 * vary, q: 1.6 })
      // Trophy: a bright bell + a crowd "ooh" that grows with each trophy.
      for (let i = 0; i < landed.trophies; i++) {
        const order = landed.trophiesSoFar - landed.trophies + i, t = at + i * 0.06
        const root = Bb4 * Math.pow(2, (order * 4) / 12)
        s.bell(t, root, 0.2); s.bell(t + 0.05, root * 1.5, 0.13, 0.7)
        crowd(t + 0.05, { duration: 0.7, gain: 0.04 + order * 0.02, low: 420, high: 1250 })
      }
      if (landed.wild && !landed.trophies && !landed.goals) s.tone(at + 0.02, { frequency: 660, bend: 990, bendSeconds: 0.06, decay: 0.08, gain: 0.08 })
    },
    anticipation(untilMs) {
      const at = s.ready()
      if (at === null) return
      const end = Math.max(at + 0.3, at + (untilMs - performance.now()) / 1000)
      // Accelerating snare roll + a rising crowd swell up to the final stop.
      let t = at, gap = 0.12
      while (t < end - 0.02) { snare(t, 0.05 + 0.08 * ((t - at) / (end - at)), null); t += gap; gap = Math.max(0.045, gap * 0.93) }
      crowd(at, { duration: end - at + 0.2, gain: 0.07, low: 380, high: 1100, attack: end - at })
    },
    win(tier) {
      const now = s.ready()
      if (now === null) return
      const at = now + 0.1
      s.duck(at, 0.35, tier === 'small' ? 0.4 : 1.6)
      if (tier === 'small') { s.tone(at, { frequency: D5, decay: 0.2, gain: 0.14, partials: [[3.99, 0.2]] }); s.tone(at + 0.08, { frequency: F5, decay: 0.24, gain: 0.12, partials: [[3.99, 0.2]] }); return }
      if (tier === 'medium') {
        for (const [i, f] of [Bb4, D5, F5, Bb5].entries()) s.tone(at + i * 0.07, { frequency: f, decay: 0.3, gain: 0.15, partials: [[3.99, 0.2]] })
        crowd(at + 0.1, { duration: 0.8, gain: 0.05 })
        return
      }
      // Big and above: brass hit, drums and a crowd roar that lasts longer for super/mega.
      for (const f of [Bb3, D4, F4, Bb4]) s.brass(at, f, 0.5, 0.06)
      s.tone(at, { frequency: 60, bend: 40, bendSeconds: 0.2, decay: 0.35, gain: 0.6 })
      crowd(at, { duration: tier === 'big' ? 1.4 : 2.4, gain: tier === 'big' ? 0.1 : 0.14, attack: 0.08 })
      if (tier !== 'big') { horn(at + 0.35, 0.05); for (let i = 0; i < 6; i++) s.bell(at + 0.3 + i * 0.07, [F5, G5, Bb5][i % 3], 0.08, 0.5) }
    },
    bonusTrigger(trophies) {
      const now = s.ready()
      if (now === null) return
      const at = now + 0.12
      // Stadium erupts: crowd roar, goal horn, drum hits and a rising brass call.
      crowd(at, { duration: 2.2, gain: 0.16, attack: 0.1 })
      for (const [i, t] of [0, 0.16, 0.32].entries()) s.tone(at + t, { frequency: 62, bend: 44, bendSeconds: 0.2, decay: 0.3, gain: 0.55 + i * 0.05 })
      const climb = trophies >= 5 ? [Bb3, D4, F4, Bb4, D5, F5] : trophies === 4 ? [Bb3, D4, F4, Bb4, D5] : [Bb3, D4, F4, Bb4]
      climb.forEach((f, i) => s.brass(at + 0.1 + i * 0.1, f, 0.16, 0.07))
      horn(at + 0.1 + climb.length * 0.1, 0.06)
      s.duck(at, 0.3, 1.5)
    },
    streakUp(level) {
      const at = s.ready()
      if (at === null) return
      // GOL: horn blast + roar + scoreboard beeps climbing with the streak.
      horn(at, 0.055)
      crowd(at, { duration: 1.1, gain: 0.11 + level * 0.01, attack: 0.05 })
      for (let i = 0; i < level; i++) s.tone(at + 0.25 + i * 0.07, { type: 'square', frequency: 880 * Math.pow(2, i / 6), decay: 0.05, gain: 0.03 })
      s.duck(at, 0.4, 0.9)
    },
    retrigger() {
      const at = s.ready()
      if (at === null) return
      whistle(at, 0.1); whistle(at + 0.14, 0.1)
      for (const [i, f] of [D5, F5, Bb5].entries()) s.bell(at + 0.2 + i * 0.06, f, 0.1, 0.45)
    },
    bonusMusic(active, featured = true) {
      musicLevel = featured ? 1 : .4
      musicWanted = active
      if (active) { s.startLoop(STEP, band); s.musicLevel(featured ? 1 : .4, 0.6) }
      else { s.stopLoop(); s.musicLevel(0, 1) }
    },
    bonusEnd(big) {
      const at = s.ready()
      if (at === null) return
      musicWanted = false
      s.stopLoop(); s.musicLevel(0, 0.6)
      // Final whistle: two short, one long.
      whistle(at, 0.14, 0.08); whistle(at + 0.22, 0.14, 0.08); whistle(at + 0.44, 0.55, 0.08)
      crowd(at + 0.5, { duration: big ? 2.2 : 1.4, gain: big ? 0.13 : 0.09, attack: 0.1 })
      for (const f of [Bb3, D4, F4, Bb4]) s.brass(at + 0.55, f, big ? 1.1 : 0.7, 0.05)
    },
    dispose() { musicWanted = false; s.dispose() },
  }
}
