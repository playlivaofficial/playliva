// Original procedural composition; no samples, recordings or third-party melodies.
import { writeFile } from 'node:fs/promises'
export async function createTropicalScore(folder, phases, duration = 18) {
  const rate = 48000, count = Math.ceil(duration * rate)
  const bed = new Float64Array(count * 2), fx = new Float64Array(count * 2)
  let seed = 93841
  const noise = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1 }
  const hz = midi => 440 * 2 ** ((midi - 69) / 12)
  function add(target, at, length, sample, pan = 0) {
    const first = Math.round(at * rate), total = Math.round(length * rate)
    const left = Math.sqrt((1 - pan) / 2), right = Math.sqrt((1 + pan) / 2)
    for (let n = 0; n < total && first + n < count; n++) {
      if (first + n < 0) continue
      const value = sample(n / rate, n / total)
      target[2 * (first + n)] += value * left
      target[2 * (first + n) + 1] += value * right
    }
  }
  const beat = 60 / 112, chords = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]]
  const motifs = [[0, 2, 1, 3, 2, 1], [1, 2, 3, 1, 0, 2], [2, 1, 0, 2, 3, 1], [0, 1, 3, 2, 1, 0]]
  // Eight-bar phrase with rests, syncopation and changing voicings.
  for (let bar = 0; bar * 4 * beat < duration; bar++) {
    const chord = chords[bar % 4], base = bar * 4 * beat
    for (const [index, offset] of [0, .75, 1.5, 2.5, 3.25, 3.75].entries()) {
      const freq = hz(chord[motifs[bar % 4][index]] + 12)
      add(bed, base + offset * beat, .52, t => .12 * Math.min(1, t / .005) * Math.exp(-t * 8) * (Math.sin(2 * Math.PI * freq * t + 1.8 * Math.sin(2 * Math.PI * freq * 3 * t) * Math.exp(-t * 20)) + .22 * Math.sin(2 * Math.PI * freq * 4 * t)), index % 2 ? .32 : -.32)
    }
    for (const [index, offset] of [0, 1.5, 2, 3.5].entries()) {
      const freq = hz(chord[index % 2 ? 2 : 0] - 24)
      add(bed, base + offset * beat, .45, t => .2 * Math.min(1, t / .008) * Math.exp(-t * 5) * (Math.sin(2 * Math.PI * freq * t) + .2 * Math.sin(4 * Math.PI * freq * t)))
    }
    for (let step = 0; step < 8; step++) {
      let previous = 0
      add(bed, base + step * beat / 2, .055, t => { const current = noise(); const high = current - previous; previous = current; return high * (step % 2 ? .025 : .017) * Math.exp(-t * 65) }, step % 2 ? .6 : -.6)
    }
    for (const offset of [0, 2]) add(bed, base + offset * beat, .21, t => .16 * Math.exp(-t * 19) * Math.sin(2 * Math.PI * (48 * t + 1.1 * (1 - Math.exp(-t * 35)))))
    for (const offset of [1, 2.75, 3.5]) add(bed, base + offset * beat, .15, t => .055 * Math.exp(-t * 27) * (Math.sin(2 * Math.PI * 240 * t) + .3 * noise()), -.22)
  }
  for (const phase of phases) {
    if (phase.phase === 'flying') {
      const fall = phases.find(p => p.time > phase.time && p.phase === 'falling')
      if (fall) add(fx, phase.time, fall.time - phase.time, (t, progress) => .023 * progress ** 2 * Math.sin(2 * Math.PI * (240 * t + 120 * t * t)) + .012 * progress ** 3 * noise())
    }
    if (phase.phase === 'falling') add(fx, phase.time, .48, (t, p) => .13 * Math.sin(Math.PI * p) * (noise() * .55 + Math.sin(2 * Math.PI * (650 * t - 500 * t * t)) * .45))
    if (phase.phase === 'impact') {
      add(fx, phase.time, .22, t => .29 * Math.exp(-t * 22) * (Math.sin(2 * Math.PI * 68 * t) + noise() * .22))
      for (const [index, midi] of [79, 76, 72].entries()) add(fx, phase.time + .12 + index * .11, .35, t => .10 * Math.exp(-t * 10) * Math.sin(2 * Math.PI * hz(midi) * t), .2)
    }
  }
  async function wav(name, data) {
    const buffer = Buffer.alloc(44 + data.length * 2)
    buffer.write('RIFF', 0); buffer.writeUInt32LE(buffer.length - 8, 4); buffer.write('WAVEfmt ', 8); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(2, 22); buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 4, 28); buffer.writeUInt16LE(4, 32); buffer.writeUInt16LE(16, 34); buffer.write('data', 36); buffer.writeUInt32LE(data.length * 2, 40)
    for (let n = 0; n < data.length; n++) { const t = n / 2 / rate; const fade = Math.min(1, t / .2, Math.max(0, (duration - t) / .5)); buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[n] * fade)) * 32767), 44 + n * 2) }
    await writeFile(`${folder}/${name}.wav`, buffer)
  }
  await wav('tropical-score', bed); await wav('flight-crash-accents', fx)
}
