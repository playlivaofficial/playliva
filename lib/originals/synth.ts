/**
 * Shared runtime synthesis kit for PlayLiva Original soundscapes.
 *
 * Every sound built on this is generated with the Web Audio API at runtime:
 * original work, no samples, no downloads, no third-party licence. One
 * AudioContext per mounted game, created lazily inside a user gesture,
 * suspended while muted or hidden and closed on dispose. A limiter guards the
 * master; SFX sit above a separate music bus that can duck under cues.
 */
export interface Synth {
  /** Audio-clock "now" (+5ms) when a cue may play, else null (muted, hidden, unsupported). */
  ready(): number | null
  readonly ctx: AudioContext | null
  readonly sfx: GainNode | null
  readonly music: GainNode | null
  setEnabled(enabled: boolean): void
  unlock(): void
  setVisible(visible: boolean): void
  /** Fade the music bus to `level` (0..1 of the music gain) over `seconds`. */
  musicLevel(level: number, seconds: number): void
  duck(at: number, depth: number, seconds: number): void
  tone(at: number, o: ToneOptions): void
  noise(at: number, o: NoiseOptions): void
  brass(at: number, frequency: number, duration: number, gain: number, bus?: GainNode | null): void
  bell(at: number, frequency: number, gain: number, decay?: number, bus?: GainNode | null): void
  /** Starts exactly one scheduler; `step(index, at)` schedules one grid step. */
  startLoop(stepSeconds: number, step: (index: number, at: number) => void): void
  stopLoop(): void
  readonly looping: boolean
  /** Stops every scheduled voice and the loop now. */
  silence(): void
  dispose(): void
}
export interface ToneOptions {
  type?: OscillatorType; frequency: number; bend?: number; bendSeconds?: number
  attack?: number; decay: number; gain: number; bus?: GainNode | null
  /** [frequency ratio, relative level] inharmonic partials. */
  partials?: readonly (readonly [number, number])[]
  detune?: number
}
export interface NoiseOptions {
  duration: number; gain: number; type: BiquadFilterType; frequency: number
  sweepTo?: number; q?: number; attack?: number; bus?: GainNode | null
}

export function createSynth(options: { masterGain?: number; sfxGain?: number; musicGain?: number } = {}): Synth {
  const MASTER = options.masterGain ?? 0.8, SFX = options.sfxGain ?? 0.9, MUSIC = options.musicGain ?? 0.12
  let ctx: AudioContext | null = null, master: GainNode | null = null, sfx: GainNode | null = null, music: GainNode | null = null
  let enabled = true, visible = true, noiseBuffer: AudioBuffer | null = null
  let timer: number | null = null, nextStep = 0, stepIndex = 0, stepSeconds = 0.125
  let stepFn: ((index: number, at: number) => void) | null = null
  const voices = new Set<AudioScheduledSourceNode>()

  function build() {
    if (ctx) return
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    try { ctx = new Ctor() } catch { ctx = null; return }
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -9; limiter.knee.value = 10; limiter.ratio.value = 8
    limiter.attack.value = 0.002; limiter.release.value = 0.2
    master = ctx.createGain(); master.gain.value = enabled ? MASTER : 0
    sfx = ctx.createGain(); sfx.gain.value = SFX
    music = ctx.createGain(); music.gain.value = 0
    sfx.connect(master); music.connect(master); master.connect(limiter); limiter.connect(ctx.destination)
  }
  function track(node: AudioScheduledSourceNode, stopAt: number) {
    voices.add(node)
    node.onended = () => { try { node.disconnect() } catch { /* already torn down */ } voices.delete(node) }
    node.stop(stopAt)
  }
  function envelope(gain: GainNode, at: number, peak: number, attack: number, decay: number) {
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay)
  }
  function noiseSource(): AudioBufferSourceNode | null {
    if (!ctx) return null
    if (!noiseBuffer) {
      const frames = ctx.sampleRate
      noiseBuffer = ctx.createBuffer(1, frames, ctx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
    }
    const source = ctx.createBufferSource(); source.buffer = noiseBuffer; source.loop = true
    return source
  }
  function pump() {
    if (!ctx || timer === null || !stepFn) return
    while (nextStep < ctx.currentTime + 0.25) { stepFn(stepIndex, nextStep); stepIndex++; nextStep += stepSeconds }
  }
  function stopTimer() { if (timer !== null) { window.clearInterval(timer); timer = null } }

  const synth: Synth = {
    get ctx() { return ctx }, get sfx() { return sfx }, get music() { return music },
    get looping() { return timer !== null },
    ready() {
      if (!enabled || !visible) return null
      build()
      if (!ctx) return null
      if (ctx.state === 'suspended') void ctx.resume().catch(() => { /* needs a gesture */ })
      return ctx.currentTime + 0.005
    },
    setEnabled(next) {
      if (enabled === next) return
      enabled = next
      if (!ctx || !master) return
      const at = ctx.currentTime
      master.gain.cancelScheduledValues(at)
      master.gain.setValueAtTime(master.gain.value, at)
      master.gain.linearRampToValueAtTime(next ? MASTER : 0, at + 0.08)
      if (!next) {
        synth.silence()
        const parked = ctx
        window.setTimeout(() => { if (!enabled && parked === ctx) void parked.suspend().catch(() => {}) }, 120)
      } else if (visible) void ctx.resume().catch(() => {})
    },
    unlock() {
      if (!enabled) return
      build()
      if (ctx?.state === 'suspended' && visible) void ctx.resume().catch(() => { /* gesture required */ })
    },
    setVisible(next) {
      visible = next
      if (!ctx) return
      if (!next) void ctx.suspend().catch(() => {})
      else if (enabled) void ctx.resume().catch(() => {})
    },
    musicLevel(level, seconds) {
      if (!ctx || !music) return
      const at = ctx.currentTime
      music.gain.cancelScheduledValues(at)
      music.gain.setValueAtTime(Math.max(0.0001, music.gain.value), at)
      music.gain.linearRampToValueAtTime(MUSIC * level, at + seconds)
    },
    duck(at, depth, seconds) {
      if (!ctx || !music || timer === null) return
      const gain = music.gain
      gain.cancelScheduledValues(at)
      gain.setValueAtTime(gain.value, at)
      gain.linearRampToValueAtTime(MUSIC * depth, at + 0.04)
      gain.linearRampToValueAtTime(MUSIC, at + seconds)
    },
    tone(at, o) {
      if (!ctx) return
      const bus = o.bus ?? sfx
      if (!bus) return
      const attack = o.attack ?? 0.004
      for (const [ratio, level] of [[1, 1] as const, ...(o.partials ?? [])]) {
        const osc = ctx.createOscillator(), gain = ctx.createGain()
        osc.type = ratio === 1 ? o.type ?? 'sine' : 'sine'
        osc.frequency.setValueAtTime(o.frequency * ratio, at)
        if (o.detune) osc.detune.value = o.detune
        if (o.bend !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.bend * ratio), at + (o.bendSeconds ?? o.decay))
        const decay = ratio === 1 ? o.decay : o.decay * 0.55
        envelope(gain, at, o.gain * level, attack, decay)
        osc.connect(gain); gain.connect(bus)
        osc.start(at); track(osc, at + attack + decay + 0.03)
      }
    },
    noise(at, o) {
      if (!ctx) return
      const bus = o.bus ?? sfx, source = noiseSource()
      if (!source || !bus) return
      const filter = ctx.createBiquadFilter()
      filter.type = o.type; filter.Q.value = o.q ?? 1
      filter.frequency.setValueAtTime(o.frequency, at)
      if (o.sweepTo) filter.frequency.exponentialRampToValueAtTime(o.sweepTo, at + o.duration)
      const gain = ctx.createGain()
      envelope(gain, at, o.gain, o.attack ?? Math.min(0.02, o.duration * 0.25), o.duration)
      source.connect(filter); filter.connect(gain); gain.connect(bus)
      source.start(at, Math.random() * 0.5); track(source, at + o.duration + 0.05)
    },
    brass(at, frequency, duration, gain, bus) {
      const out = bus ?? sfx
      if (!ctx || !out) return
      const filter = ctx.createBiquadFilter(), amp = ctx.createGain()
      filter.type = 'lowpass'; filter.Q.value = 0.8
      filter.frequency.setValueAtTime(500, at)
      filter.frequency.exponentialRampToValueAtTime(2600, at + 0.05)
      filter.frequency.exponentialRampToValueAtTime(1100, at + duration)
      amp.gain.setValueAtTime(0.0001, at)
      amp.gain.exponentialRampToValueAtTime(gain, at + 0.035)
      amp.gain.setValueAtTime(gain, at + Math.max(0.04, duration - 0.12))
      amp.gain.exponentialRampToValueAtTime(0.0001, at + duration)
      filter.connect(amp); amp.connect(out)
      for (const detune of [-7, 7]) {
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(frequency, at); osc.detune.value = detune
        osc.connect(filter); osc.start(at); track(osc, at + duration + 0.03)
      }
    },
    bell(at, frequency, gain, decay = 0.9, bus) {
      synth.tone(at, { frequency, decay, gain, attack: 0.003, bus, partials: [[2.76, 0.35], [5.4, 0.12]] })
    },
    startLoop(seconds, step) {
      const at = synth.ready()
      if (at === null || !ctx) return
      stepFn = step; stepSeconds = seconds
      if (timer !== null) return // never stack a second scheduler
      stepIndex = 0; nextStep = at + 0.03
      timer = window.setInterval(pump, 25)
      pump()
    },
    stopLoop() { stopTimer() },
    silence() {
      stopTimer()
      if (!ctx) return
      music?.gain.cancelScheduledValues(ctx.currentTime)
      music?.gain.setValueAtTime(0, ctx.currentTime)
      for (const voice of Array.from(voices)) {
        try { voice.stop() } catch { /* already stopped */ }
        try { voice.disconnect() } catch { /* already torn down */ }
      }
      voices.clear()
    },
    dispose() {
      synth.silence()
      const closing = ctx
      ctx = null; master = null; sfx = null; music = null; noiseBuffer = null
      void closing?.close().catch(() => { /* already closed */ })
    },
  }
  return synth
}

export const note = (semitonesFromA4: number) => 440 * Math.pow(2, semitonesFromA4 / 12)
