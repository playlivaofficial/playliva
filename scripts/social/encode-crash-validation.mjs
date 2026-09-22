import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import ffmpeg from 'ffmpeg-static'
import { createTropicalScore } from './crash-validation-audio.mjs'
import { checkMotionCadence } from './validation-cadence.mjs'

const root = resolve(import.meta.dirname, '../..')
const folder = resolve(root, 'social/output/crash-validation')
const probe = resolve(root, 'social/output/local-tools/package/bin/win32/x64/ffprobe.exe')
const raw = resolve(folder, 'native-25-hq-demo-sync/capture.webm')
const diagnostics = JSON.parse(await readFile(resolve(folder, 'native-25-hq-demo-sync/capture.json'), 'utf8'))
const output = resolve(folder, 'island-crash-validation-final.mp4')
if (existsSync(output)) throw new Error('Validation master exists; preserve it rather than silently replacing it')
const info = path => JSON.parse(execFileSync(probe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', path], { maxBuffer: 5e6 }))
const source = info(raw), video = source.streams.find(s => s.codec_type === 'video')
if (video.width < 1080 || video.height < 1920 || video.r_frame_rate !== '25/1') throw new Error('Reject source dimensions/cadence')
const markerPixels = execFileSync(ffmpeg, ['-v', 'error', '-i', raw, '-vf', 'crop=60:60:0:0,scale=1:1,format=rgb24', '-fps_mode', 'passthrough', '-f', 'rawvideo', 'pipe:1'], { maxBuffer: 1e6 })
let lastMarker = -1
for (let frame = 0; frame < markerPixels.length / 3; frame++) if (markerPixels[frame * 3] > 180 && markerPixels[frame * 3 + 1] < 80 && markerPixels[frame * 3 + 2] > 180) lastMarker = frame
if (lastMarker < 0) throw new Error('Capture timing marker missing; reject unsynchronized source')
const duration = 18, start = (lastMarker + 1) / 25
await createTropicalScore(folder, diagnostics.phases, duration)
const voice = resolve(root, 'social/output/voice/island-crash-01-decision.wav')
const mix = resolve(folder, 'validation-mix.wav')
const run = args => execFileSync(ffmpeg, ['-hide_banner', ...args], { maxBuffer: 8e6, stdio: ['ignore', 'pipe', 'pipe'] }).toString()
run(['-y', '-i', resolve(folder, 'tropical-score.wav'), '-i', resolve(folder, 'flight-crash-accents.wav'), '-i', voice, '-filter_complex', `[0:a]highpass=f=50,lowpass=f=12000,volume=.62[bed];[1:a]volume=.7[fx];[2:a]adelay=520|520,volume=1.35,apad,atrim=0:${duration},asplit=2[voice][side];[bed][side]sidechaincompress=threshold=.025:ratio=8:attack=12:release=260:makeup=1[duck];[duck][fx][voice]amix=inputs=3:normalize=0,atrim=0:${duration}[a]`, '-map', '[a]', '-c:a', 'pcm_s24le', mix])
const { spawnSync } = await import('node:child_process')
const measurement = spawnSync(ffmpeg, ['-hide_banner', '-i', mix, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 5e6 })
const analysis = JSON.parse(measurement.stderr.match(/\{\s*"input_i"[\s\S]*?\}/)[0])
const norm = `loudnorm=I=-16:TP=-1.5:LRA=7:measured_I=${analysis.input_i}:measured_TP=${analysis.input_tp}:measured_LRA=${analysis.input_lra}:measured_thresh=${analysis.input_thresh}:offset=${analysis.target_offset}:linear=true`
run(['-y', '-i', raw, '-i', mix, '-filter_complex', `[0:v]trim=start=${start}:duration=${duration},setpts=PTS-STARTPTS,scale=1080:1920:flags=lanczos,setsar=1,format=yuv420p[v];[1:a]${norm}[a]`, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-b:v', '10M', '-minrate', '10M', '-maxrate', '10M', '-bufsize', '20M', '-x264-params', 'nal-hrd=cbr', '-fps_mode', 'passthrough', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', String(duration), '-movflags', '+faststart', output])
const final = info(output), finalVideo = final.streams.find(s => s.codec_type === 'video')
if (finalVideo.width !== 1080 || finalVideo.height !== 1920 || finalVideo.avg_frame_rate !== '25/1' || Number(finalVideo.nb_frames) !== duration * 25) throw new Error('Validation master rejected: resolution/frame count/cadence mismatch')
const cadence = checkMotionCadence(output, 25, diagnostics.phases)
await writeFile(resolve(folder, 'final-cadence.json'), JSON.stringify(cadence, null, 2))
if (!cadence.passed) throw new Error('Validation master rejected: flight/fall cadence check failed; do not upload')
await writeFile(resolve(folder, 'ffprobe.json'), JSON.stringify({ source, final, trimStart: start, audioMeasurements: analysis }, null, 2))
run(['-y', '-i', output, '-ss', '4', '-frames:v', '1', resolve(folder, 'validation-preview.png')])
console.log(JSON.stringify({ output, width: finalVideo.width, height: finalVideo.height, fps: finalVideo.avg_frame_rate, frames: finalVideo.nb_frames, bitrate: finalVideo.bit_rate, profile: finalVideo.profile, bytes: final.format.size, duration: final.format.duration }))
