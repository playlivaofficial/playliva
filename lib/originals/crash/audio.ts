/**
 * Island Crash audio.
 *
 * Every sound here is synthesised from scratch with the Web Audio API and is
 * original PlayLiva work: there is no sampled recording, no downloaded file
 * and therefore no third-party licence, attribution or takedown exposure. It
 * also ships zero bytes of media, so the first gameplay load is unchanged.
 *
 * Synchronisation contract: the caller passes the engine's own
 * `performance.now()` deadlines (kick contact, landing) and this module
 * converts them once into AudioContext time and schedules the cue in advance.
 * Sound therefore fires on the audio clock at the same instant the renderer
 * draws the shared contact frame, instead of chasing a React render or a
 * requestAnimationFrame callback.
 */

/** Master ceiling before the limiter; keeps consecutive rounds at a steady level. */
const MASTER_GAIN = 0.9
/** Music sits well under the impacts so the kick and landing always read. */
const MUSIC_GAIN = 0.13
const SFX_GAIN = 0.85
const BPM = 112
const BEAT = 60 / BPM
const STEPS_PER_BAR = 8 // eighth notes
const STEP = BEAT / 2

/** Scheduler lookahead, in seconds, and its polling interval in milliseconds. */
const LOOKAHEAD = 0.25
const TICK_MS = 25

const NOTE = (semitonesFromA4: number) => 440 * Math.pow(2, semitonesFromA4 / 12)
// C major / A minor pocket: bright, tropical, not saccharine.
const C4 = NOTE(3), E4 = NOTE(7), G4 = NOTE(10), A4 = NOTE(12)
const B4 = NOTE(14), C5 = NOTE(15), D5 = NOTE(17), E5 = NOTE(19)
const C3 = NOTE(-9), F3 = NOTE(-4), G3 = NOTE(-2), A3 = NOTE(0)

/** Eight-bar phrase: a I–vi–IV–V island turnaround that never repeats a bar verbatim. */
const BASS: readonly number[] = [C3, A3, F3, G3, C3, A3, F3, G3]
const CHORDS: readonly (readonly number[])[] = [
  [C4, E4, G4], [A3, C4, E4], [F3, A4, C5], [G3, B4, D5],
  [C4, E4, G4], [A3, C4, E4], [F3, A4, C5], [G3, B4, D5],
]
/** `null` is a rest. Syncopation and rests keep it from becoming a "tu-tu-tu" loop. */
const MELODY: readonly (readonly (number | null)[])[] = [
  [G4, null, C5, null, E5, null, D5, null],
  [C5, null, null, A4, G4, null, null, null],
  [A4, null, C5, D5, null, C5, null, A4],
  [G4, null, null, D5, null, B4, null, null],
  [E5, null, D5, null, C5, null, G4, null],
  [A4, null, null, C5, E5, null, D5, null],
  [C5, null, A4, null, G4, null, E4, null],
  [D5, null, G4, null, B4, null, null, null],
]
/** 3-2 clave-ish accent grid; the shaker fills the gaps. */
const CLAVE: readonly boolean[] = [true, false, false, true, false, false, true, false]

type Voice = AudioScheduledSourceNode

export interface CrashAudio {
  /** Mirrors the shell's Sound toggle. Silences music and every pending cue. */
  setEnabled(enabled: boolean): void
  /** Must run inside a real user gesture so mobile browsers allow playback. */
  unlock(): void
  /** Schedules the kick impact and launch whoosh on the engine's contact deadline. */
  scheduleLaunch(contactAtMs: number): void
  /** Schedules the landing thump on the engine's own impact deadline. */
  scheduleLanding(impactAtMs: number): void
  /** Fades the round music out; safe to call repeatedly. */
  endRound(): void
  dispose(): void
}

export function createCrashAudio(): CrashAudio {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let musicBus: GainNode | null = null
  let sfxBus: GainNode | null = null
  let enabled = true
  let disposed = false
  let timer: number | null = null
  let nextStepTime = 0
  let step = 0
  const voices = new Set<Voice>()

  function build() {
    if (ctx || disposed) return
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    try { ctx = new Ctor() } catch { ctx = null; return }
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -10; limiter.knee.value = 12; limiter.ratio.value = 6
    limiter.attack.value = 0.003; limiter.release.value = 0.18
    master = ctx.createGain(); master.gain.value = enabled ? MASTER_GAIN : 0
    musicBus = ctx.createGain(); musicBus.gain.value = 0
    sfxBus = ctx.createGain(); sfxBus.gain.value = SFX_GAIN
    musicBus.connect(master); sfxBus.connect(master)
    master.connect(limiter); limiter.connect(ctx.destination)
  }

  /** Engine deadline (performance.now) → audio clock, never in the past. */
  function audioTime(atMs: number): number {
    if (!ctx) return 0
    return Math.max(ctx.currentTime, ctx.currentTime + (atMs - performance.now()) / 1000)
  }

  function track(node: Voice, stopAt: number) {
    voices.add(node)
    node.onended = () => { try { node.disconnect() } catch { /* already torn down */ } voices.delete(node) }
    node.stop(stopAt)
  }

  function noise(duration: number): AudioBufferSourceNode | null {
    if (!ctx) return null
    const frames = Math.max(1, Math.ceil(duration * ctx.sampleRate))
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
    const source = ctx.createBufferSource()
    source.buffer = buffer
    return source
  }

  /** One decaying synth note. `bend` sweeps the pitch for cartoon impacts. */
  function tone(at: number, options: {
    type?: OscillatorType; frequency: number; bend?: number; bendSeconds?: number
    attack?: number; decay: number; gain: number; bus?: GainNode | null; partial?: number
  }) {
    if (!ctx) return
    const bus = options.bus ?? sfxBus
    if (!bus) return
    const osc = ctx.createOscillator()
    osc.type = options.type ?? 'sine'
    osc.frequency.setValueAtTime(options.frequency, at)
    if (options.bend !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, options.bend), at + (options.bendSeconds ?? options.decay))
    }
    const gain = ctx.createGain()
    const attack = options.attack ?? 0.004
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, options.gain), at + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + options.decay)
    osc.connect(gain); gain.connect(bus)
    osc.start(at)
    track(osc, at + attack + options.decay + 0.02)
    if (options.partial) {
      // A quiet inharmonic partial gives the marimba/steel-drum its wooden edge.
      const second = ctx.createOscillator()
      second.type = 'sine'
      second.frequency.setValueAtTime(options.frequency * options.partial, at)
      const secondGain = ctx.createGain()
      secondGain.gain.setValueAtTime(0.0001, at)
      secondGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, options.gain * 0.3), at + attack)
      secondGain.gain.exponentialRampToValueAtTime(0.0001, at + attack + options.decay * 0.5)
      second.connect(secondGain); secondGain.connect(bus)
      second.start(at)
      track(second, at + attack + options.decay + 0.02)
    }
  }

  function burst(at: number, options: {
    duration: number; gain: number; type: BiquadFilterType; frequency: number
    sweepTo?: number; q?: number; bus?: GainNode | null
  }) {
    if (!ctx) return
    const bus = options.bus ?? sfxBus
    const source = noise(options.duration)
    if (!source || !bus) return
    const filter = ctx.createBiquadFilter()
    filter.type = options.type
    filter.frequency.setValueAtTime(options.frequency, at)
    if (options.sweepTo) filter.frequency.exponentialRampToValueAtTime(options.sweepTo, at + options.duration)
    filter.Q.value = options.q ?? 1
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(options.gain, at + Math.min(0.03, options.duration * 0.25))
    gain.gain.exponentialRampToValueAtTime(0.0001, at + options.duration)
    source.connect(filter); filter.connect(gain); gain.connect(bus)
    source.start(at)
    track(source, at + options.duration + 0.02)
  }

  /** Briefly pull the music down so an impact always cuts through. */
  function duck(at: number, depth: number, seconds: number) {
    if (!ctx || !musicBus) return
    const gain = musicBus.gain
    gain.cancelScheduledValues(at)
    gain.setValueAtTime(gain.value, at)
    gain.linearRampToValueAtTime(MUSIC_GAIN * depth, at + 0.03)
    gain.linearRampToValueAtTime(MUSIC_GAIN, at + seconds)
  }

  function scheduleStep(index: number, at: number) {
    const bar = Math.floor(index / STEPS_PER_BAR) % MELODY.length
    const beat = index % STEPS_PER_BAR
    if (beat === 0) {
      tone(at, { type: 'triangle', frequency: BASS[bar], decay: 0.30, gain: 0.30, bus: musicBus })
    }
    if (beat === 3 || beat === 6) {
      tone(at, { type: 'triangle', frequency: BASS[bar] * (beat === 6 ? 1.5 : 1), decay: 0.18, gain: 0.18, bus: musicBus })
    }
    // Off-beat chord stabs: the island "skank" that carries the groove.
    if (beat === 2 || beat === 5 || beat === 7) {
      for (const note of CHORDS[bar]) {
        tone(at, { type: 'sine', frequency: note, decay: 0.16, gain: 0.055, bus: musicBus, partial: 2.76 })
      }
    }
    const melody = MELODY[bar][beat]
    if (melody !== null) {
      tone(at, { type: 'sine', frequency: melody, decay: 0.34, gain: 0.115, bus: musicBus, partial: 3.01 })
    }
    if (CLAVE[beat]) burst(at, { duration: 0.045, gain: 0.05, type: 'bandpass', frequency: 2100, q: 2.5, bus: musicBus })
    // Shaker on every off-eighth, alternating accent, for forward motion.
    if (beat % 2 === 1) {
      burst(at, { duration: 0.05, gain: beat === 3 ? 0.055 : 0.035, type: 'highpass', frequency: 6800, bus: musicBus })
    }
  }

  function pump() {
    if (!ctx || timer === null) return
    while (nextStepTime < ctx.currentTime + LOOKAHEAD) {
      scheduleStep(step, nextStepTime)
      step += 1
      nextStepTime += STEP
    }
  }

  function startMusic(at: number) {
    if (!ctx || !musicBus || !enabled) return
    const gain = musicBus.gain
    gain.cancelScheduledValues(at)
    gain.setValueAtTime(Math.max(0.0001, gain.value), at)
    gain.linearRampToValueAtTime(MUSIC_GAIN, at + 0.35)
    if (timer !== null) return // already running: never stack a second scheduler
    step = 0
    nextStepTime = Math.max(ctx.currentTime, at)
    timer = window.setInterval(pump, TICK_MS)
    pump()
  }

  function stopMusic(fadeSeconds: number) {
    if (!ctx || !musicBus) return
    const now = ctx.currentTime
    const gain = musicBus.gain
    gain.cancelScheduledValues(now)
    gain.setValueAtTime(Math.max(0.0001, gain.value), now)
    gain.linearRampToValueAtTime(0, now + fadeSeconds)
    if (timer !== null) { window.clearInterval(timer); timer = null }
  }

  function silence() {
    if (timer !== null) { window.clearInterval(timer); timer = null }
    if (!ctx) return
    if (musicBus) {
      musicBus.gain.cancelScheduledValues(ctx.currentTime)
      musicBus.gain.setValueAtTime(0, ctx.currentTime)
    }
    for (const voice of Array.from(voices)) {
      try { voice.stop() } catch { /* already stopped */ }
      try { voice.disconnect() } catch { /* already torn down */ }
    }
    voices.clear()
  }

  return {
    setEnabled(next: boolean) {
      enabled = next
      if (!ctx || !master) return
      const now = ctx.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setValueAtTime(master.gain.value, now)
      master.gain.linearRampToValueAtTime(next ? MASTER_GAIN : 0, now + 0.08)
      if (!next) silence()
    },
    unlock() {
      if (!enabled || disposed) return
      build()
      if (ctx?.state === 'suspended') void ctx.resume().catch(() => { /* gesture required */ })
    },
    scheduleLaunch(contactAtMs: number) {
      if (!enabled || disposed) return
      build()
      if (!ctx) return
      const at = audioTime(contactAtMs)
      startMusic(at)
      // Kick: low thump + slap transient + cartoon "boink" tail.
      tone(at, { type: 'sine', frequency: 180, bend: 55, bendSeconds: 0.13, decay: 0.16, gain: 0.85 })
      burst(at, { duration: 0.06, gain: 0.34, type: 'bandpass', frequency: 1800, q: 1.2 })
      tone(at + 0.012, { type: 'triangle', frequency: 520, bend: 300, bendSeconds: 0.18, decay: 0.2, gain: 0.2 })
      // Launch whoosh begins on the very same deadline as the kick.
      burst(at, { duration: 0.38, gain: 0.26, type: 'bandpass', frequency: 420, sweepTo: 3000, q: 2 })
      tone(at, { type: 'sine', frequency: 240, bend: 900, bendSeconds: 0.34, attack: 0.05, decay: 0.3, gain: 0.07 })
      duck(at, 0.45, 0.24)
    },
    scheduleLanding(impactAtMs: number) {
      if (!enabled || disposed) return
      build()
      if (!ctx) return
      const at = audioTime(impactAtMs)
      // Thud + sandy splat + a comedic wobble, then two coconut bonks.
      tone(at, { type: 'sine', frequency: 140, bend: 40, bendSeconds: 0.22, decay: 0.26, gain: 1 })
      burst(at, { duration: 0.2, gain: 0.45, type: 'lowpass', frequency: 900 })
      tone(at + 0.02, { type: 'triangle', frequency: 300, bend: 90, bendSeconds: 0.4, decay: 0.42, gain: 0.17 })
      tone(at + 0.1, { type: 'sine', frequency: 900, decay: 0.07, gain: 0.13 })
      tone(at + 0.19, { type: 'sine', frequency: 1350, decay: 0.06, gain: 0.1 })
      duck(at, 0.35, 0.34)
    },
    endRound() { stopMusic(0.6) },
    dispose() {
      disposed = true
      silence()
      const closing = ctx
      ctx = null; master = null; musicBus = null; sfxBus = null
      void closing?.close().catch(() => { /* already closed */ })
    },
  }
}
