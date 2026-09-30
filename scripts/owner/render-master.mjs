import videoPolicy from '../../lib/owner/video-production.ts'
import { capture } from './capture-frames.mjs'
export { capture } from './capture-frames.mjs'
export { installGenerationStage } from './generation-stage.mjs'
import { mkdir, writeFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import ffmpegStatic from 'ffmpeg-static'
import { createTropicalScore } from '../social/crash-validation-audio.mjs'

const ffmpeg = process.env.SOCIAL_FFMPEG_PATH || ffmpegStatic
const python = process.env.PLAYLIVA_SOCIAL_PYTHON || 'python3'
export async function run(command, args) {
  return new Promise((ok, fail) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
    let output = ''; child.stdout.on('data', part => { output = (output + part).slice(-100000) }); child.stderr.on('data', part => { output = (output + part).slice(-100000) })
    const timer = setTimeout(() => { child.kill(); fail(new Error('Render command exceeded its time limit.')) }, 20 * 60000)
    child.on('error', error => { clearTimeout(timer); fail(error) }); child.on('exit', code => { clearTimeout(timer); if (code === 0) ok(output); else fail(new Error(`Render command failed (${code}): ${output.slice(-1600)}`)) })
  })
}
async function duration(file) {
  let output = ''; try { output = await run(ffmpeg, ['-hide_banner', '-i', file]) } catch (error) { output = error.message }
  const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(output)
  if (!m) throw new Error('Media duration could not be measured.')
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
}
export async function renderMaster(job, folder) {
  videoPolicy.videoProductionPolicy.assertEnabled()
  await mkdir(folder, { recursive: true })
  const jobPath = resolve(folder, 'job.json'), voice = resolve(folder, 'voice.wav')
  await writeFile(jobPath, JSON.stringify({ voiceLine: job.voiceLine }))
  console.log(JSON.stringify({ id: job.id, stage: 'narration' }))
  await run(python, [resolve('scripts/owner/voice.py'), jobPath, voice])
  const voiceSeconds = await duration(voice), seconds = Math.max(20, Math.ceil(voiceSeconds + 2))
  if (seconds > 30) throw new Error('Narration exceeds the 30-second master limit.')
  console.log(JSON.stringify({ id: job.id, stage: 'capture' }))
  const { raw, diagnostics } = await capture(job, folder, seconds)
  console.log(JSON.stringify({ id: job.id, stage: 'encoding' }))
  const frameLog = await run(ffmpeg, ['-hide_banner', '-i', raw, '-vf', 'showinfo', '-an', '-f', 'null', '-'])
  const times = [...frameLog.matchAll(/pts_time:([\d.]+)/g)].map(match => Number(match[1]))
  const gaps = times.slice(1).map((value, index) => value - times[index]).sort((a, b) => a - b)
  const measuredFps = (times.length - 1) / (times.at(-1) - times[0])
  if (times.length < 100 || measuredFps < 28 || gaps[Math.floor(gaps.length * .95)] > .08 || gaps.at(-1) > .25) throw new Error('Native capture frame pacing failed QC; no interpolated fallback was used.')
  // Reuse the established original composition and synchronize accents to real game phases.
  const phases = diagnostics.phases.map(row => ({ time: row.time, phase: /fall|failed|bust/.test(row.phase) ? 'falling' : /result|impact|landed|settled/.test(row.phase) ? 'impact' : /fly|lift|spin|dropp/.test(row.phase) ? 'flying' : row.phase }))
  await createTropicalScore(folder, phases, seconds)
  const mix = resolve(folder, 'mix.wav'), master = resolve(folder, 'master.mp4'), poster = resolve(folder, 'poster.jpg')
  await run(ffmpeg, ['-y', '-i', resolve(folder, 'tropical-score.wav'), '-i', resolve(folder, 'flight-crash-accents.wav'), '-i', voice, '-filter_complex', `[0:a]volume=.55[bed];[1:a]volume=.65[fx];[2:a]adelay=250|250,apad,atrim=0:${seconds},asplit=2[voice][side];[bed][side]sidechaincompress=threshold=.025:ratio=8:attack=12:release=260[duck];[duck][fx][voice]amix=inputs=3:normalize=0,atrim=0:${seconds}[a]`, '-map', '[a]', '-c:a', 'pcm_s24le', mix])
  const measured = await run(ffmpeg, ['-hide_banner', '-i', mix, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-'])
  const analysis = JSON.parse([...measured.matchAll(/\{\s*"input_i"[\s\S]*?\}/g)].at(-1)?.[0] || '{}')
  if (!analysis.input_i) throw new Error('Audio measurement failed.')
  const norm = `loudnorm=I=-16:TP=-1.5:LRA=7:measured_I=${analysis.input_i}:measured_TP=${analysis.input_tp}:measured_LRA=${analysis.input_lra}:measured_thresh=${analysis.input_thresh}:offset=${analysis.target_offset}:linear=true`
  // Native 30 fps input, no 25-to-30 conversion or frame interpolation.
  await run(ffmpeg, ['-y', '-i', raw, '-i', mix, '-filter_complex', `[0:v]setpts=PTS-STARTPTS,setsar=1,format=yuv420p[v];[1:a]${norm}[a]`, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-b:v', '10M', '-minrate', '10M', '-maxrate', '10M', '-bufsize', '20M', '-x264-params', 'nal-hrd=cbr', '-fps_mode', 'passthrough', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', String(seconds), '-movflags', '+faststart', master])
  await run(ffmpeg, ['-y', '-ss', '3', '-i', master, '-frames:v', '1', '-q:v', '2', poster])
  const probe = await run(ffmpeg, ['-hide_banner', '-i', master, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-'])
  const finalAudio = JSON.parse([...probe.matchAll(/\{\s*"input_i"[\s\S]*?\}/g)].at(-1)?.[0] || '{}')
  const passed = /1080x1920/.test(probe) && /30 fps/.test(probe) && Number(finalAudio.input_i) >= -18 && Number(finalAudio.input_i) <= -14 && Number(finalAudio.input_tp) <= -1
  if (!passed) throw new Error('Final resolution, cadence or loudness QC failed.')
  const bytes = (await stat(master)).size
  const qc = { passed, inspectedAt: new Date().toISOString(), width: 1080, height: 1920, fps: 30, bitrate: Math.round(bytes * 8 / seconds / 1000), lufs: Number(finalAudio.input_i), notes: ['Frame-by-frame 30fps gameplay capture; 10Mbps H.264 target; PT-BR Kokoro narration; original procedural music; voice ducking.', `Measured source ${measuredFps.toFixed(2)} fps; p95 frame gap ${Math.round(gaps[Math.floor(gaps.length * .95)] * 1000)}ms.`, `${diagnostics.actions} gameplay actions; ${diagnostics.phases.length} observed phase changes.`, 'Human creative review required; never auto-published.'] }
  await writeFile(resolve(folder, 'qc.json'), JSON.stringify(qc, null, 2))
  return { master, poster, bytes, qc, duration: seconds }
}
