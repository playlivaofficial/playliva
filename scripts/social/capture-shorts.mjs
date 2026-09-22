import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright-core'
import sharp from 'sharp'
import ffmpegPath from 'ffmpeg-static'
import content from '../../lib/social/content.ts'

const ROOT = resolve(import.meta.dirname, '../..')
const MANIFEST_PATH = resolve(ROOT, 'social/content/youtube-shorts-br.json')
const BASE_URL = process.env.SOCIAL_CAPTURE_BASE_URL ?? 'https://www.playliva.com'
const FPS = 4
const selectedId = process.argv.find(value => value.startsWith('--id='))?.slice(5)
const candidates = [process.env.SOCIAL_CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean)
const executablePath = candidates.find(path => existsSync(path))
if (!executablePath) throw new Error('Set SOCIAL_CHROME_PATH to a Chrome or Edge executable')
if (!ffmpegPath || !existsSync(ffmpegPath)) throw new Error('ffmpeg-static is not installed; run pnpm install')

const manifest = content.validateManifest(JSON.parse(await readFile(MANIFEST_PATH, 'utf8')))
const items = selectedId ? manifest.items.filter(item => item.contentId === selectedId) : manifest.items
if (!items.length) throw new Error(`Unknown content id: ${selectedId}`)

function escapeXml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}
function lines(value, width) {
  const result = [], words = value.split(/\s+/); let line = ''
  for (const word of words) {
    if (`${line} ${word}`.trim().length > width && line) { result.push(line); line = word }
    else line = `${line} ${word}`.trim()
  }
  if (line) result.push(line)
  return result
}
function textSvg(item) {
  const hook = lines(item.hook, 25).slice(0, 2)
  const body = lines(item.body, 48).slice(0, 2)
  return Buffer.from(`<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#061522"/><stop offset=".55" stop-color="#0b2d32"/><stop offset="1" stop-color="#061522"/></linearGradient></defs>
    <rect width="1080" height="1920" fill="url(#bg)"/>
    <text x="540" y="92" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="700" letter-spacing="7" fill="#a9f16e">PLAYLIVA ORIGINALS</text>
    ${hook.map((line, index) => `<text x="540" y="${175 + index * 72}" text-anchor="middle" font-family="Arial,sans-serif" font-size="66" font-weight="800" fill="#ffffff">${escapeXml(line)}</text>`).join('')}
    ${body.map((line, index) => `<text x="540" y="${330 + index * 38}" text-anchor="middle" font-family="Arial,sans-serif" font-size="29" font-weight="500" fill="#c9d9d6">${escapeXml(line)}</text>`).join('')}
    <rect x="54" y="1580" width="972" height="214" rx="42" fill="#a9f16e"/>
    <text x="540" y="1672" text-anchor="middle" font-family="Arial,sans-serif" font-size="48" font-weight="800" fill="#09211f">${escapeXml(item.cta)}</text>
    <text x="540" y="1734" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="#214c3e">${escapeXml(item.gameName)}</text>
    <text x="540" y="1862" text-anchor="middle" font-family="Arial,sans-serif" font-size="27" font-weight="600" fill="#c9d9d6">18+  |  Jogue com responsabilidade  |  Apenas Liva Credits</text>
  </svg>`)
}

async function composeFrame(screenshot, item, output) {
  const game = await sharp(screenshot).resize(972, 1120, { fit: 'contain', background: '#061522' }).png().toBuffer()
  await sharp(textSvg(item)).composite([{ input: game, left: 54, top: 430 }]).png().toFile(output)
}

async function waitEnabled(page, selector, timeout = 30_000) {
  const locator = page.locator(selector)
  await locator.waitFor({ state: 'visible', timeout })
  await locator.waitFor({ state: 'attached', timeout })
  for (let i = 0; i < 100; i++) {
    if (await locator.isEnabled()) return locator
    await page.waitForTimeout(100)
  }
  throw new Error(`${selector} did not become enabled`)
}

async function act(page, item, frame) {
  if (item.gameSlug === 'crash') {
    if (frame === 5) await (await waitEnabled(page, '[data-action="start"]')).click()
    if (frame === 28) { const cash = page.locator('[data-action="cashout"]'); if (await cash.isVisible() && await cash.isEnabled()) await cash.click() }
  }
  if (item.gameSlug === 'mines') {
    if (frame === 5) await (await waitEnabled(page, '[data-mines-start]')).click()
    if (frame === 13) { const tile = page.locator('[data-tile="12"]'); if (await tile.isEnabled()) await tile.click() }
  }
  if (item.gameSlug === 'blackjack' && frame === 5) await (await waitEnabled(page, '[data-blackjack-deal]')).click()
  if (item.gameSlug === 'roulette') {
    if (frame === 4) await (await waitEnabled(page, '[data-bet="red:red"]')).click()
    if (frame === 7) await (await waitEnabled(page, '[data-roulette-spin]')).click()
  }
  if (item.gameSlug === 'capybara-gold' && frame === 5) await (await waitEnabled(page, '[data-slot-spin]')).click()
}

async function encode(frameDir, item) {
  const output = resolve(ROOT, item.videoFile)
  await mkdir(dirname(output), { recursive: true })
  await new Promise((success, failure) => {
    const child = spawn(ffmpegPath, ['-y', '-framerate', String(FPS), '-i', resolve(frameDir, 'frame-%05d.png'),
      '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.1',
      '-preset', 'medium', '-crf', '18', '-movflags', '+faststart', '-an', '-t', String(item.duration), output],
    { stdio: ['ignore', 'ignore', 'pipe'] })
    let stderr = ''
    child.stderr.on('data', chunk => { stderr += chunk.toString(); process.stderr.write('.') })
    child.on('error', failure)
    child.on('exit', code => code === 0 ? success() : failure(new Error(`ffmpeg exited ${code}: ${stderr.slice(-1500)}`)))
  })
  return output
}

const browser = await chromium.launch({ executablePath, headless: true, args: ['--use-angle=swiftshader-webgl', '--enable-webgl'] })
try {
  for (const item of items) {
    const context = await browser.newContext({ viewport: { width: 1080, height: 1920 }, locale: 'pt-BR', colorScheme: 'dark' })
    await context.addInitScript(() => {
      localStorage.setItem('playliva.cookie-consent', JSON.stringify({ necessary: true, analytics: false, marketing: false }))
      localStorage.removeItem('playliva.demo-session')
    })
    const page = await context.newPage()
    await page.goto(`${BASE_URL}${new URL(item.targetUrl).pathname}`, { waitUntil: 'networkidle', timeout: 60_000 })
    await page.locator('[data-game-unit]').waitFor({ state: 'visible', timeout: 40_000 })
    const frameDir = resolve(ROOT, 'social/output/frames', item.contentId)
    await mkdir(frameDir, { recursive: true })
    const frameCount = item.duration * FPS
    for (let frame = 0; frame < frameCount; frame++) {
      await act(page, item, frame)
      const screenshot = await page.locator('[data-game-unit]').screenshot({ type: 'png' })
      await composeFrame(screenshot, item, resolve(frameDir, `frame-${String(frame).padStart(5, '0')}.png`))
      await page.waitForTimeout(1000 / FPS)
      process.stdout.write(`\r${item.contentId}: ${frame + 1}/${frameCount}`)
    }
    const output = await encode(frameDir, item)
    item.publishStatus = 'needs_review'
    console.log(`\nRendered ${output}`)
    await context.close()
  }
} finally {
  await browser.close()
}

await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)
