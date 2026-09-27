import { spawnSync } from 'node:child_process'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import ffmpeg from 'ffmpeg-static'
import sharp from 'sharp'

const directory = resolve(process.env.OWNER_DATA_DIR || 'social/output/owner-growth/qa-fixture')
if (!directory.includes('qa-fixture')) throw new Error('Use a dedicated qa-fixture directory.')
await mkdir(directory, { recursive: true })
const auth = spawnSync(process.execPath, ['scripts/owner/setup-local.mjs'], { env: { ...process.env, OWNER_DATA_DIR: directory }, stdio: 'inherit' })
if (auth.status !== 0) throw new Error('QA credentials could not be prepared.')
const media = resolve(directory, 'media'); await mkdir(media, { recursive: true })
const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=0x1765ad:s=180x320:d=2:r=24', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', resolve(media, 'qa-playback.mp4')], { stdio: 'inherit' })
if (result.status !== 0) throw new Error('QA playback fixture failed.')
await sharp({ create: { width: 180, height: 320, channels: 3, background: '#1765ad' } }).jpeg().toFile(resolve(media, 'qa-thumbnail.jpg'))
const manifest = JSON.parse(await readFile('social/content/youtube-shorts-br.json', 'utf8'))
manifest.items[0].videoFile = 'qa-playback.mp4'; manifest.items[0].thumbnailFile = 'qa-thumbnail.jpg'
await writeFile(resolve(directory, 'manifest.json'), JSON.stringify(manifest))
console.log('Prepared separate QA metadata and a 2-second solid-color playback fixture. No historical creative was rendered or changed.')
