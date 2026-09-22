import { execFileSync } from 'node:child_process'
import ffmpeg from 'ffmpeg-static'

export function checkMotionCadence(file, fps, phases) {
  const width = 220, height = 132, frameSize = width * height
  const bytes = execFileSync(ffmpeg, ['-v', 'error', '-i', file, '-vf', 'crop=880:528:60:550,scale=220:132:flags=area,format=gray', '-fps_mode', 'passthrough', '-f', 'rawvideo', 'pipe:1'], { maxBuffer: 100e6 })
  const differences = []
  for (let frame = 1; frame < bytes.length / frameSize; frame++) {
    let sum = 0
    for (let pixel = 0; pixel < frameSize; pixel++) sum += Math.abs(bytes[frame * frameSize + pixel] - bytes[(frame - 1) * frameSize + pixel])
    differences.push({ frame, time: frame / fps, meanAbsoluteDifference: sum / frameSize })
  }
  return summarizeMotionCadence(differences, phases)
}

export function summarizeMotionCadence(differences, phases) {
  const segments = phases.flatMap((phase, index) => {
    if (!['flying', 'falling'].includes(phase.phase)) return []
    const end = phases[index + 1]?.time
    if (!end || end - phase.time < .3) return []
    const frames = differences.filter(row => row.time > phase.time + .12 && row.time < end - .08)
    return [{ phase: phase.phase, start: phase.time, end, frames: frames.length, nearFrozen: frames.filter(row => row.meanAbsoluteDifference < .10).length, minimumDifference: Math.min(...frames.map(row => row.meanAbsoluteDifference)) }]
  })
  return { threshold: .10, region: 'gameplay 880x528 at (60,550), downsampled to 220x132 luma', segments, differences, passed: segments.some(s => s.phase === 'flying' && s.frames >= 75) && segments.some(s => s.phase === 'falling' && s.frames >= 5) && segments.every(s => s.nearFrozen === 0) }
}
