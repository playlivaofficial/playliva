/**
 * Liva Capybara Gold audio.
 *
 * Every cue and the Jungle Gold Bonus music are synthesised at runtime with the
 * Web Audio API. They are original PlayLiva work: no sample, recording or
 * downloaded file is used, so there is no third-party licence or attribution
 * and the game ships zero audio bytes.
 *
 * Synchronisation contract: the game calls a cue in the same render that shows
 * the matching engine state (a reel landing, a settled win, the bonus intro),
 * so sound and picture share one frame. Cues only describe outcomes the engine
 * has already fixed; nothing here can influence a result.
 *
 * Lifecycle: one AudioContext per mounted game, created lazily inside a user
 * gesture, suspended while the tab is hidden and closed on unmount. The Sound
 * toggle ramps the master to silence and stops every scheduled voice and the
 * music scheduler; nothing keeps playing after the toggle or navigation.
 */

export type SlotWinTier = 'small' | 'medium' | 'big' | 'super' | 'mega'

/** Master ceiling before the limiter; generous headroom so layered cues never clip. */
const MASTER_GAIN = 0.8
const SFX_GAIN = 0.9
/** Bonus music sits well under the SFX so reel stops and wins always read. */
const MUSIC_GAIN = 0.12
const BPM = 128
const STEP = 60 / BPM / 2 // eighth notes
const STEPS_PER_BAR = 8
const LOOKAHEAD = 0.25
const TICK_MS = 25
/** Safety net: a reel-roll loop can never outlive the longest anticipated spin. */
const ROLL_MAX_SECONDS = 5

const NOTE = (semitonesFromA4: number) => 440 * Math.pow(2, semitonesFromA4 / 12)
// G major / E minor "golden jungle" pocket; a different key, tempo and groove from Island Crash.
const G2 = NOTE(-26), C3 = NOTE(-21), D3 = NOTE(-19), E3 = NOTE(-17)
const G3 = NOTE(-14), A3 = NOTE(-12), B3 = NOTE(-10), C4 = NOTE(-9), D4 = NOTE(-7), E4 = NOTE(-5), Fs4 = NOTE(-3)
const G4 = NOTE(-2), A4 = NOTE(0), B4 = NOTE(2), C5 = NOTE(3), D5 = NOTE(5), E5 = NOTE(7), Fs5 = NOTE(9), G5 = NOTE(10)
const A5 = NOTE(12), B5 = NOTE(14), C6 = NOTE(15), D6 = NOTE(17), E6 = NOTE(19), G6 = NOTE(22)

/** I–V–vi–IV with a IV–V lift: bright and celebratory without being a loop of one bar. */
const BASS: readonly number[] = [G2, D3, E3, C3, G2, D3, C3, D3]
const CHORDS: readonly (readonly number[])[] = [
  [G3, B3, D4], [A3, D4, Fs4], [G3, B3, E4], [G3, C4, E4],
  [G3, B3, D4], [A3, D4, Fs4], [G3, C4, E4], [A3, D4, Fs4],
]
/** Steel-pan lead; `null` rests keep it playful rather than a constant ostinato. */
const MELODY: readonly (readonly (number | null)[])[] = [
  [D5, null, G5, null, B5, null, A5, G5],
  [Fs5, null, null, D5, A5, null, null, null],
  [E5, null, G5, B5, null, A5, null, G5],
  [E5, null, null, C5, E5, null, G5, null],
  [B5, null, A5, null, G5, null, D5, null],
  [Fs5, null, A5, null, D6, null, null, C6],
  [B5, null, G5, null, E5, null, G5, A5],
  [Fs5, null, D5, null, A5, null, null, null],
]
/** Conga tones on the tropical "tumbao" accents. */
const CONGA: readonly (number | null)[] = [null, null, 1, null, null, 1.5, null, 1]

type Voice = AudioScheduledSourceNode

export interface SlotAudio {
  /** Mirrors the shell's Sound toggle. Off silences music and every pending cue. */
  setEnabled(enabled: boolean): void
  /** Must run inside a real user gesture so mobile browsers allow playback. */
  unlock(): void
  /** Suspends the audio clock while the tab is hidden; resumes when visible and enabled. */
  setVisible(visible: boolean): void
  /** Spin button press + reel roll that runs until the last reel stops. */
  spinStart(free: boolean): void
  /** One landed reel; Suns (numbered in landing order) and Capybaras add their own cue. */
  reelStop(reel: number, landed: { suns: number; sunsSoFar: number; wild: boolean; last: boolean }): void
  /** Rising tension until the engine's (already scheduled) final stop. */
  anticipation(untilMs: number): void
  win(tier: SlotWinTier): void
  bonusTrigger(suns: number): void
  multiplierUp(level: number): void
  retrigger(): void
  /** Idempotent: starts exactly one bonus music scheduler, or fades it out. */
  bonusMusic(active: boolean): void
  bonusEnd(big: boolean): void
  dispose(): void
}

export function createSlotAudio(): SlotAudio {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null, sfxBus: GainNode | null = null, musicBus: GainNode | null = null
  let enabled = true, visible = true, musicWanted = false
  let timer: number | null = null, nextStepTime = 0, step = 0
  let roll: { source: AudioBufferSourceNode; gain: GainNode; lfo: OscillatorNode } | null = null
  let riser: { osc: OscillatorNode; gain: GainNode } | null = null
  let noiseBuffer: AudioBuffer | null = null
  const voices = new Set<Voice>()

  function build() {
    if (ctx) return
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    try { ctx = new Ctor() } catch { ctx = null; return }
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -9; limiter.knee.value = 10; limiter.ratio.value = 8
    limiter.attack.value = 0.002; limiter.release.value = 0.2
    master = ctx.createGain(); master.gain.value = enabled ? MASTER_GAIN : 0
    sfxBus = ctx.createGain(); sfxBus.gain.value = SFX_GAIN
    musicBus = ctx.createGain(); musicBus.gain.value = 0
    sfxBus.connect(master); musicBus.connect(master)
    master.connect(limiter); limiter.connect(ctx.destination)
  }

  /** Returns the audio clock "now" only when a cue may actually play. */
  function ready(): number | null {
    if (!enabled || !visible) return null
    build()
    if (!ctx) return null
    if (ctx.state === 'suspended') void ctx.resume().catch(() => { /* needs a gesture */ })
    return ctx.currentTime + 0.005
  }

  function track(node: Voice, stopAt: number) {
    voices.add(node)
    node.onended = () => { try { node.disconnect() } catch { /* already torn down */ } voices.delete(node) }
    node.stop(stopAt)
  }

  function noise(): AudioBufferSourceNode | null {
    if (!ctx) return null
    if (!noiseBuffer) {
      // One shared second of white noise, looped/sliced by every percussive cue.
      const frames = ctx.sampleRate
      noiseBuffer = ctx.createBuffer(1, frames, ctx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1
    }
    const source = ctx.createBufferSource()
    source.buffer = noiseBuffer
    source.loop = true
    return source
  }

  function envelope(gain: GainNode, at: number, peak: number, attack: number, decay: number) {
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay)
  }

  /** A decaying voice; `partials` add inharmonic overtones for bells, pans and marimba. */
  function tone(at: number, o: { type?: OscillatorType; frequency: number; bend?: number; bendSeconds?: number
    attack?: number; decay: number; gain: number; bus?: GainNode | null; partials?: readonly [number, number][] }) {
    if (!ctx) return
    const bus = o.bus ?? sfxBus
    if (!bus) return
    const attack = o.attack ?? 0.004
    for (const [ratio, level] of [[1, 1] as [number, number], ...(o.partials ?? [])]) {
      const osc = ctx.createOscillator(), gain = ctx.createGain()
      osc.type = ratio === 1 ? o.type ?? 'sine' : 'sine'
      osc.frequency.setValueAtTime(o.frequency * ratio, at)
      if (o.bend !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.bend * ratio), at + (o.bendSeconds ?? o.decay))
      const decay = ratio === 1 ? o.decay : o.decay * 0.55
      envelope(gain, at, o.gain * level, attack, decay)
      osc.connect(gain); gain.connect(bus)
      osc.start(at); track(osc, at + attack + decay + 0.03)
    }
  }

  function burst(at: number, o: { duration: number; gain: number; type: BiquadFilterType; frequency: number
    sweepTo?: number; q?: number; attack?: number; bus?: GainNode | null }) {
    if (!ctx) return
    const bus = o.bus ?? sfxBus, source = noise()
    if (!source || !bus) return
    const filter = ctx.createBiquadFilter()
    filter.type = o.type; filter.Q.value = o.q ?? 1
    filter.frequency.setValueAtTime(o.frequency, at)
    if (o.sweepTo) filter.frequency.exponentialRampToValueAtTime(o.sweepTo, at + o.duration)
    const gain = ctx.createGain()
    envelope(gain, at, o.gain, o.attack ?? Math.min(0.02, o.duration * 0.25), o.duration)
    source.connect(filter); filter.connect(gain); gain.connect(bus)
    source.start(at, Math.random() * 0.5); track(source, at + o.duration + 0.05)
  }

  /** Warm brass-like stab: two detuned saws through an opening low-pass. */
  function brass(at: number, frequency: number, duration: number, gain: number) {
    if (!ctx || !sfxBus) return
    const filter = ctx.createBiquadFilter(), amp = ctx.createGain()
    filter.type = 'lowpass'; filter.Q.value = 0.8
    filter.frequency.setValueAtTime(500, at)
    filter.frequency.exponentialRampToValueAtTime(2600, at + 0.05)
    filter.frequency.exponentialRampToValueAtTime(1100, at + duration)
    amp.gain.setValueAtTime(0.0001, at)
    amp.gain.exponentialRampToValueAtTime(gain, at + 0.035)
    amp.gain.setValueAtTime(gain, at + Math.max(0.04, duration - 0.12))
    amp.gain.exponentialRampToValueAtTime(0.0001, at + duration)
    filter.connect(amp); amp.connect(sfxBus)
    for (const detune of [-7, 7]) {
      const osc = ctx.createOscillator()
      osc.type = 'sawtooth'; osc.frequency.setValueAtTime(frequency, at); osc.detune.value = detune
      osc.connect(filter); osc.start(at); track(osc, at + duration + 0.03)
    }
  }

  const bell = (at: number, frequency: number, gain: number, decay = 0.9) =>
    tone(at, { frequency, decay, gain, attack: 0.003, partials: [[2.76, 0.35], [5.4, 0.12]] })
  const marimba = (at: number, frequency: number, gain: number, bus?: GainNode | null) =>
    tone(at, { type: 'sine', frequency, decay: 0.32, gain, bus, partials: [[3.99, 0.22]] })
  const timpani = (at: number, gain: number) => {
    tone(at, { frequency: 98, bend: 72, bendSeconds: 0.35, decay: 0.55, gain })
    burst(at, { duration: 0.18, gain: gain * 0.35, type: 'lowpass', frequency: 700 })
  }
  const sparkle = (at: number, count: number, spread: number, gain: number) => {
    const scale = [E6, G6, D6, B5, A5, C6]
    for (let i = 0; i < count; i++) tone(at + (i / count) * spread + Math.random() * 0.03,
      { frequency: scale[i % scale.length] * (1 + (Math.random() - 0.5) * 0.01), decay: 0.18, gain: gain * (1 - i / (count * 1.6)) })
  }

  /** Briefly pull the music down so a cue always cuts through. */
  function duck(at: number, depth: number, seconds: number) {
    if (!ctx || !musicBus || timer === null) return
    const gain = musicBus.gain
    gain.cancelScheduledValues(at)
    gain.setValueAtTime(gain.value, at)
    gain.linearRampToValueAtTime(MUSIC_GAIN * depth, at + 0.04)
    gain.linearRampToValueAtTime(MUSIC_GAIN, at + seconds)
  }

  function stopRoll(at: number) {
    if (!roll) return
    const { gain, source, lfo } = roll
    roll = null
    gain.gain.cancelScheduledValues(at)
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), at)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.08)
    source.stop(at + 0.1); lfo.stop(at + 0.1)
  }

  function stopRiser(at: number) {
    if (!riser) return
    const { gain, osc } = riser
    riser = null
    gain.gain.cancelScheduledValues(at)
    gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), at)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.07)
    osc.stop(at + 0.09)
  }

  function scheduleStep(index: number, at: number) {
    const bar = Math.floor(index / STEPS_PER_BAR) % MELODY.length, beat = index % STEPS_PER_BAR
    if (beat === 0 || beat === 3 || beat === 6) {
      tone(at, { type: 'triangle', frequency: BASS[bar] * (beat === 6 ? 1.5 : 1), decay: beat ? 0.2 : 0.34, gain: beat ? 0.22 : 0.32, bus: musicBus })
    }
    if (beat === 2 || beat === 6) for (const note of CHORDS[bar]) marimba(at, note, 0.05, musicBus)
    const lead = MELODY[bar][beat]
    // Steel-pan: slightly sharp second partial and a soft attack.
    if (lead !== null) tone(at, { frequency: lead, decay: 0.3, gain: 0.1, attack: 0.008, bus: musicBus, partials: [[2.02, 0.3], [3.01, 0.12]] })
    const conga = CONGA[beat]
    if (conga !== null) tone(at, { frequency: 210 * conga, bend: 160 * conga, bendSeconds: 0.12, decay: 0.14, gain: 0.16, bus: musicBus })
    burst(at, { duration: 0.045, gain: beat % 2 ? 0.05 : 0.028, type: 'highpass', frequency: 7200, bus: musicBus })
    if (beat === 4) burst(at, { duration: 0.07, gain: 0.05, type: 'bandpass', frequency: 1900, q: 3, bus: musicBus })
  }

  function pump() {
    if (!ctx || timer === null) return
    while (nextStepTime < ctx.currentTime + LOOKAHEAD) { scheduleStep(step, nextStepTime); step++; nextStepTime += STEP }
  }

  function startMusic() {
    const at = ready()
    if (at === null || !ctx || !musicBus) return
    const gain = musicBus.gain
    gain.cancelScheduledValues(at)
    gain.setValueAtTime(Math.max(0.0001, gain.value), at)
    gain.linearRampToValueAtTime(MUSIC_GAIN, at + 0.6)
    if (timer !== null) return // already running: never stack a second scheduler
    step = 0; nextStepTime = at + 0.05
    timer = window.setInterval(pump, TICK_MS)
    pump()
  }

  function stopMusic(fadeSeconds: number) {
    if (timer !== null) { window.clearInterval(timer); timer = null }
    if (!ctx || !musicBus) return
    const now = ctx.currentTime, gain = musicBus.gain
    gain.cancelScheduledValues(now)
    gain.setValueAtTime(Math.max(0.0001, gain.value), now)
    gain.linearRampToValueAtTime(0, now + fadeSeconds)
  }

  /** Hard stop: every voice, loop, riser and the music scheduler. */
  function silence() {
    if (timer !== null) { window.clearInterval(timer); timer = null }
    roll = null; riser = null
    if (!ctx) return
    musicBus?.gain.cancelScheduledValues(ctx.currentTime)
    musicBus?.gain.setValueAtTime(0, ctx.currentTime)
    for (const voice of Array.from(voices)) {
      try { voice.stop() } catch { /* already stopped */ }
      try { voice.disconnect() } catch { /* already torn down */ }
    }
    voices.clear()
  }

  return {
    setEnabled(next) {
      if (enabled === next) return
      enabled = next
      if (!ctx || !master) return
      const now = ctx.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setValueAtTime(master.gain.value, now)
      master.gain.linearRampToValueAtTime(next ? MASTER_GAIN : 0, now + 0.08)
      if (!next) {
        silence()
        // After the fade, park the audio clock so a muted game costs no CPU/battery.
        const parked = ctx
        window.setTimeout(() => { if (!enabled && parked === ctx) void parked.suspend().catch(() => {}) }, 120)
      } else {
        if (visible) void ctx.resume().catch(() => { /* needs a gesture */ })
        if (musicWanted) startMusic()
      }
    },
    unlock() {
      if (!enabled) return
      build()
      if (ctx?.state === 'suspended' && visible) void ctx.resume().catch(() => { /* gesture required */ })
    },
    setVisible(next) {
      visible = next
      if (!ctx) return
      if (!next) { stopRoll(ctx.currentTime); stopRiser(ctx.currentTime); void ctx.suspend().catch(() => {}) }
      else if (enabled) void ctx.resume().catch(() => {})
    },
    spinStart(free) {
      const at = ready()
      if (at === null || !ctx || !sfxBus) return
      stopRoll(at); stopRiser(at)
      // Button: crisp click + a soft mechanical "clunk" as the reels release.
      burst(at, { duration: 0.03, gain: 0.3, type: 'bandpass', frequency: 3200, q: 1.4 })
      tone(at, { type: 'triangle', frequency: free ? 1320 : 1180, decay: 0.05, gain: 0.14 })
      tone(at + 0.02, { frequency: 150, bend: 90, bendSeconds: 0.1, decay: 0.12, gain: 0.35 })
      // Reel-start swoosh rising into the roll.
      burst(at + 0.02, { duration: 0.32, gain: 0.16, type: 'bandpass', frequency: 300, sweepTo: 1800, q: 1.6, attack: 0.08 })
      // Roll: a looping noise band pulsed by a fast LFO, like reel strips ratcheting past.
      const source = noise()
      if (!source) return
      const filter = ctx.createBiquadFilter(), gain = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain()
      filter.type = 'bandpass'; filter.frequency.value = free ? 1500 : 1150; filter.Q.value = 1.1
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.07, at + 0.2)
      lfo.type = 'square'; lfo.frequency.value = 17; depth.gain.value = 0.03
      lfo.connect(depth); depth.connect(gain.gain)
      source.connect(filter); filter.connect(gain); gain.connect(sfxBus)
      source.start(at); lfo.start(at)
      track(source, at + ROLL_MAX_SECONDS); track(lfo, at + ROLL_MAX_SECONDS)
      roll = { source, gain, lfo }
      duck(at, 0.6, 0.4)
    },
    reelStop(reel, landed) {
      const at = ready()
      if (at === null) return
      // Each reel lands a touch differently: fixed per-reel voicing plus a small random drift.
      const vary = [1, 0.94, 1.06, 0.9, 1.1][reel % 5] * (1 + (Math.random() - 0.5) * 0.04)
      tone(at, { frequency: 175 * vary, bend: 68, bendSeconds: 0.09, decay: landed.last ? 0.16 : 0.11, gain: landed.last ? 0.62 : 0.5 })
      burst(at, { duration: 0.035, gain: 0.22, type: 'bandpass', frequency: 2300 * vary, q: 1.5 })
      tone(at + 0.004, { type: 'triangle', frequency: 880 * vary, decay: 0.04, gain: 0.1 })
      if (roll) {
        if (landed.last) stopRoll(at)
        else { roll.gain.gain.cancelScheduledValues(at); roll.gain.gain.setValueAtTime(Math.max(0.0001, roll.gain.gain.value), at)
          roll.gain.gain.linearRampToValueAtTime(0.07 * (1 - (reel + 1) / 6), at + 0.05) }
      }
      if (landed.last) stopRiser(at)
      // Golden Sun: a bell "sun chime" that climbs a major third with every Sun in the spin.
      for (let i = 0; i < landed.suns; i++) {
        const order = landed.sunsSoFar - landed.suns + i, t = at + i * 0.07
        const root = A5 * Math.pow(2, (order * 4) / 12)
        bell(t, root, 0.2); bell(t + 0.06, root * 1.5, 0.14, 0.7)
        burst(t, { duration: 0.35, gain: 0.05, type: 'highpass', frequency: 7500 })
      }
      if (landed.wild && !landed.suns) tone(at + 0.02, { frequency: 520, bend: 780, bendSeconds: 0.07, decay: 0.09, gain: 0.1 })
    },
    anticipation(untilMs) {
      const at = ready()
      if (at === null || !ctx || !sfxBus) return
      stopRiser(at)
      const end = Math.max(at + 0.3, at + (untilMs - performance.now()) / 1000)
      const osc = ctx.createOscillator(), filter = ctx.createBiquadFilter(), gain = ctx.createGain()
      const trem = ctx.createOscillator(), tremDepth = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(D3, at); osc.frequency.exponentialRampToValueAtTime(D4, end)
      filter.type = 'lowpass'; filter.Q.value = 4
      filter.frequency.setValueAtTime(420, at); filter.frequency.exponentialRampToValueAtTime(2800, end)
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.09, at + 0.25)
      gain.gain.linearRampToValueAtTime(0.13, end)
      trem.frequency.setValueAtTime(5, at); trem.frequency.linearRampToValueAtTime(13, end); tremDepth.gain.value = 0.04
      trem.connect(tremDepth); tremDepth.connect(gain.gain)
      osc.connect(filter); filter.connect(gain); gain.connect(sfxBus)
      osc.start(at); trem.start(at)
      track(osc, end + 0.4); track(trem, end + 0.4)
      riser = { osc, gain }
      // Heartbeat taps under the riser.
      for (let t = at + 0.1; t < end - 0.05; t += 0.28) tone(t, { frequency: 65, decay: 0.09, gain: 0.22 })
    },
    win(tier) {
      const now = ready()
      if (now === null) return
      const at = now + 0.1 // lets the final reel's "chunk" read first
      duck(at, 0.35, tier === 'small' ? 0.4 : 1.6)
      if (tier === 'small') { marimba(at, G5, 0.16); marimba(at + 0.08, C6, 0.13); return }
      if (tier === 'medium') {
        for (const [i, note] of [C5, E5, G5, C6].entries()) marimba(at + i * 0.07, note, 0.18)
        sparkle(at + 0.25, 5, 0.3, 0.07)
        return
      }
      // Big and above: layered brass fanfare, shimmer and (for super/mega) a longer lift.
      timpani(at, 0.5)
      const chords = tier === 'big' ? [[C4, E4, G4], [C4, E4, G4, C5]] : [[C4, E4, G4], [D4, Fs4, A4], [G4, B4, D5, G5]]
      chords.forEach((chord, i) => chord.forEach(note => brass(at + i * 0.22, note, i === chords.length - 1 ? 0.7 : 0.18, 0.07)))
      for (const [i, note] of [G5, C6, E6].entries()) bell(at + 0.12 + i * 0.09, note, 0.12, 0.6)
      sparkle(at + 0.3, tier === 'big' ? 10 : 18, tier === 'big' ? 0.9 : 1.6, 0.06)
      if (tier !== 'big') { timpani(at + 0.44, 0.45); burst(at + 0.4, { duration: 1.4, gain: 0.07, type: 'highpass', frequency: 5000, attack: 0.3 }) }
    },
    bonusTrigger(suns) {
      const now = ready()
      if (now === null) return
      stopRoll(now); stopRiser(now)
      const at = now + 0.12
      // Jungle Gold fanfare: drum hits, rising brass arpeggio, cymbal swell, sun bells.
      timpani(at, 0.55); timpani(at + 0.16, 0.45); timpani(at + 0.32, 0.6)
      const climb = suns >= 5 ? [G3, B3, D4, G4, B4, D5] : suns === 4 ? [G3, B3, D4, G4, B4] : [G3, B3, D4, G4]
      climb.forEach((note, i) => brass(at + 0.1 + i * 0.11, note, 0.16, 0.075))
      const top = at + 0.1 + climb.length * 0.11
      for (const note of [G4, B4, D5, G5]) brass(top, note, 0.85, 0.06)
      burst(at + 0.05, { duration: 1.3, gain: 0.08, type: 'highpass', frequency: 4500, attack: 0.5 })
      for (const [i, note] of [G5, B5, D6, G6].entries()) bell(top + i * 0.08, note, 0.1, 0.8)
    },
    multiplierUp(level) {
      const at = ready()
      if (at === null) return
      // Capybara "chirp" (two squeaks) + a power-up step that climbs with the multiplier.
      tone(at, { type: 'triangle', frequency: 620, bend: 1040, bendSeconds: 0.06, decay: 0.08, gain: 0.16 })
      tone(at + 0.09, { type: 'triangle', frequency: 780, bend: 1320, bendSeconds: 0.06, decay: 0.1, gain: 0.15 })
      const base = [G4, B4, D5, G5, B5][Math.max(0, Math.min(4, level - 1))]
      bell(at + 0.18, base, 0.14, 0.5); bell(at + 0.25, base * 1.5, 0.12, 0.6)
      duck(at, 0.5, 0.6)
    },
    retrigger() {
      const at = ready()
      if (at === null) return
      for (const [i, note] of [D5, G5, B5, D6].entries()) bell(at + 0.1 + i * 0.05, note, 0.1, 0.4)
      tone(at + 0.1, { frequency: 600, bend: 2400, bendSeconds: 0.25, decay: 0.26, gain: 0.05 })
    },
    bonusMusic(active) {
      musicWanted = active
      if (active) startMusic()
      else stopMusic(1.2)
    },
    bonusEnd(big) {
      const at = ready()
      if (at === null) return
      stopMusic(0.8)
      timpani(at, 0.45)
      for (const note of [G4, B4, D5, G5]) brass(at + 0.05, note, big ? 1.1 : 0.7, 0.055)
      for (const [i, note] of [D6, B5, G5, D5, G5, B5, D6, G6].slice(0, big ? 8 : 5).entries()) bell(at + 0.18 + i * 0.07, note, 0.09, 0.6)
    },
    dispose() {
      musicWanted = false
      silence()
      const closing = ctx
      ctx = null; master = null; sfxBus = null; musicBus = null; noiseBuffer = null
      void closing?.close().catch(() => { /* already closed */ })
    },
  }
}
