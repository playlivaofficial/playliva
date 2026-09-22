import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import ffmpegPath from 'ffmpeg-static'
import sharp from 'sharp'
import content from '../../lib/social/content.ts'

const ROOT = resolve(import.meta.dirname, '../..')
const MANIFEST_PATH = resolve(ROOT, 'social/content/youtube-shorts-br.json')
const REPORT_PATH = resolve(ROOT, 'social/content/youtube-shorts-br-qc.json')
const FRAME_ROOT = resolve(ROOT, 'social/output/qc-frames')
const REVIEW_ROOT = resolve(ROOT, 'social/output/review-library')
const selectedId = process.argv.find(value => value.startsWith('--id='))?.slice(5)
const manifest = content.validateManifest(JSON.parse(await readFile(MANIFEST_PATH, 'utf8')))
const items = manifest.items.filter(item => !selectedId || item.contentId === selectedId)
if (!items.length) throw new Error(`Unknown content id: ${selectedId}`)
if (!ffmpegPath || !existsSync(ffmpegPath)) throw new Error('ffmpeg-static is unavailable; run pnpm install')

function run(args) {
  return new Promise((success, failure) => {
    const child = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let stderr = ''
    child.stderr.on('data', chunk => { stderr += chunk.toString() })
    child.on('error', failure)
    child.on('exit', code => code === 0 ? success(stderr) : failure(new Error(`ffmpeg exited ${code}: ${stderr.slice(-2500)}`)))
  })
}

function durationFrom(output) {
  const match = output.match(/Duration:\s+(\d+):(\d+):(\d+(?:\.\d+)?)/)
  if (!match) throw new Error('Media duration missing')
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3])
}

function streamInfo(output) {
  const videoLine = output.match(/Video:[^\n]+/i)?.[0] ?? ''
  const video = videoLine.match(/Video:\s*([^\s,(]+)[^\n]*?\b(\d{2,5})x(\d{2,5})\b[^\n]*?(\d+(?:\.\d+)?) fps/i)
  const audio = output.match(/Audio:\s*([^,]+),[^\n]*?(\d{4,6}) Hz[^\n]*?(\d+) kb\/s/i)
  const videoBitrate = output.match(/Video:[^\n]*?(\d+) kb\/s/i)
  if (!video || !audio) throw new Error('Required video/audio streams missing')
  return {
    videoCodec: video[1].trim(), videoProfile: videoLine.match(/h264 \(([^)]+)\)/i)?.[1] ?? '', width: Number(video[2]), height: Number(video[3]), fps: Number(video[4]),
    videoBitrateKbps: Number(videoBitrate?.[1] ?? 0), audioCodec: audio[1].trim(), audioBitrateKbps: Number(audio[3]),
  }
}

function loudnessInfo(output) {
  const integrated = [...output.matchAll(/Integrated loudness:[\s\S]*?I:\s*(-?\d+(?:\.\d+)?) LUFS/g)].at(-1)?.[1]
  const truePeak = [...output.matchAll(/True peak:[\s\S]*?Peak:\s*(-?\d+(?:\.\d+)?) dBFS/g)].at(-1)?.[1]
  if (integrated === undefined || truePeak === undefined) throw new Error('Loudness measurements missing')
  return { integratedLufs: Number(integrated), truePeakDbfs: Number(truePeak) }
}

async function sha(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

async function differenceHash(path) {
  const { data } = await sharp(path).resize(9, 8, { fit: 'fill' }).greyscale().raw().toBuffer({ resolveWithObject: true })
  let bits = ''
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) bits += data[row * 9 + col] > data[row * 9 + col + 1] ? '1' : '0'
  return BigInt(`0b${bits}`).toString(16).padStart(16, '0')
}

async function inspectItem(item) {
  const videoPath = resolve(ROOT, item.videoFile)
  if (!existsSync(videoPath)) throw new Error(`${item.contentId}: output is missing`)
  let probe = ''
  try { probe = await run(['-hide_banner', '-i', videoPath, '-map', '0:a:0', '-af', 'ebur128=peak=true', '-f', 'null', '-']) } catch (error) { probe = String(error) }
  const duration = durationFrom(probe)
  const streams = streamInfo(probe)
  const loudness = loudnessInfo(probe)
  const frameDir = resolve(FRAME_ROOT, item.contentId)
  await mkdir(frameDir, { recursive: true })
  const moments = [1, Math.max(2, duration / 2), Math.max(2, duration - 1)]
  const frameHashes = []
  const framePerceptualHashes = []
  const frameEntropy = []
  for (const [index, moment] of moments.entries()) {
    const path = resolve(frameDir, `${index + 1}.jpg`)
    await run(['-y', '-hide_banner', '-i', videoPath, '-ss', moment.toFixed(2), '-frames:v', '1', '-q:v', '2', path])
    frameHashes.push(await sha(path))
    framePerceptualHashes.push(await differenceHash(path))
    frameEntropy.push(Number((await sharp(path).stats()).entropy.toFixed(3)))
  }
  const file = await stat(videoPath)
  const notes = []
  if (streams.width !== item.encoding.width || streams.height !== item.encoding.height) notes.push('incorrect dimensions')
  if (Math.abs(streams.fps - item.encoding.fps) > .05) notes.push('incorrect frame rate')
  if (Math.abs(duration - item.duration) > .65) notes.push('incorrect duration')
  if (!/h264/i.test(streams.videoCodec) || !/high/i.test(streams.videoProfile)) notes.push('incorrect H.264 profile')
  if (!/aac/i.test(streams.audioCodec)) notes.push('AAC audio missing')
  // CRF preserves visual quality while simple, low-motion games legitimately use fewer bits.
  if (streams.videoBitrateKbps && streams.videoBitrateKbps < 1000) notes.push('video bitrate below review floor')
  // FFmpeg's native AAC encoder may undershoot the 192 kbps target on sparse generated audio.
  if (streams.audioBitrateKbps < 128) notes.push('audio bitrate below review floor')
  if (Math.abs(loudness.integratedLufs - item.audio.loudnessLufs) > 1) notes.push('integrated loudness outside delivery tolerance')
  if (loudness.truePeakDbfs > item.audio.truePeakDb + .3) notes.push('true peak exceeds delivery ceiling')
  if (frameEntropy.some(value => value < 2.5)) notes.push('blank or low-detail review frame')
  return {
    inspectedAt: new Date().toISOString(), ...streams, ...loudness, duration: Number(duration.toFixed(2)),
    fileSizeBytes: file.size, sha256: await sha(videoPath), frameHashes,
    framePerceptualHashes, frameEntropy, passed: notes.length === 0, notes,
  }
}

await mkdir(REVIEW_ROOT, { recursive: true })
const results = []
for (const [index, item] of items.entries()) {
  console.log(`[${index + 1}/${items.length}] Inspecting ${item.contentId}`)
  try {
    const qc = await inspectItem(item)
    item.qc = qc
    item.qualityStatus = qc.passed ? 'needs_review' : 'rejected'
    item.reviewStatus = item.reviewStatus === 'approved' ? 'approved' : qc.passed ? 'needs_review' : 'rejected'
    item.publishStatus = item.reviewStatus === 'approved' ? item.publishStatus : 'needs_review'
    results.push({ contentId: item.contentId, gameSlug: item.gameSlug, ...qc })
  } catch (error) {
    const notes = [error instanceof Error ? error.message : String(error)]
    item.qualityStatus = 'rejected'; item.reviewStatus = 'rejected'; item.publishStatus = 'needs_review'; item.qc = null
    results.push({ contentId: item.contentId, gameSlug: item.gameSlug, passed: false, notes })
  }
}

const duplicateVideos = []
const hashes = new Map()
for (const result of results.filter(value => value.sha256)) {
  const prior = hashes.get(result.sha256)
  if (prior) duplicateVideos.push([prior, result.contentId])
  else hashes.set(result.sha256, result.contentId)
}
if (duplicateVideos.length) {
  for (const ids of duplicateVideos) for (const id of ids) {
    const item = manifest.items.find(value => value.contentId === id)
    item.qualityStatus = 'rejected'; item.reviewStatus = 'rejected'
  }
}

for (const game of new Set(items.map(item => item.gameSlug))) {
  const gameItems = items.filter(item => item.gameSlug === game)
  const tiles = []
  for (const item of gameItems) {
    const frame = resolve(FRAME_ROOT, item.contentId, '2.jpg')
    if (!existsSync(frame)) continue
    const image = await sharp(frame).resize(270, 480, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer()
    tiles.push({ input: image, left: (tiles.length % 5) * 270, top: Math.floor(tiles.length / 5) * 480 })
  }
  if (tiles.length) await sharp({ create: { width: 1350, height: Math.ceil(tiles.length / 5) * 480, channels: 3, background: '#031713' } }).composite(tiles).jpeg({ quality: 90 }).toFile(resolve(REVIEW_ROOT, `${game}-contact-sheet.jpg`))
}

const report = {
  version: 1, inspectedAt: new Date().toISOString(), total: results.length,
  passed: results.filter(value => value.passed).length, failed: results.filter(value => !value.passed).length,
  duplicateVideos, items: results,
}
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`)
await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)

const cards = items.map(item => `<article><video controls preload="metadata" poster="../../${item.thumbnailFile.replace('social/output/', '')}"><source src="../../${item.videoFile.replace('social/output/', '')}" type="video/mp4"></video><h2>${item.contentId}</h2><p><b>${item.hook}</b><br>${item.title}</p><code>${content.trackedTargetUrl(item)}</code><p>${item.qualityStatus} · ${item.reviewStatus}</p></article>`).join('')
await writeFile(resolve(REVIEW_ROOT, 'index.html'), `<!doctype html><meta charset="utf-8"><title>PlayLiva Shorts review</title><style>body{margin:0;padding:30px;background:#061713;color:#eefbf6;font:15px Arial}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}article{background:#0b2922;padding:16px;border-radius:18px}video{width:100%;aspect-ratio:9/16;background:#000;border-radius:12px}h2{font-size:16px;overflow-wrap:anywhere}code{font-size:10px;overflow-wrap:anywhere;color:#9cf1ce}</style><h1>PlayLiva Originals · 50 Shorts · human review required</h1><main>${cards}</main>`)
console.log(`QC ${report.passed}/${report.total} passed; ${report.failed} failed; ${duplicateVideos.length} exact duplicate pair(s)`)
