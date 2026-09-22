// One isolated local validation; never writes the 50-item library or uploads.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import childProcess from 'node:child_process'
import { installStage } from './capture-shorts.mjs'

const root = resolve(import.meta.dirname, '../..')
const fps = Number(process.argv.find(x => x.startsWith('--fps='))?.slice(6) ?? 60)
const compact = process.argv.includes('--native-1080')
const highQuality = process.argv.includes('--high-quality')
const repeatableDemo = process.argv.includes('--repeatable-demo')
let qualityApplied = false
if (highQuality) {
  const spawn = childProcess.spawn
  childProcess.spawn = function(command, args, options) {
    if (args?.includes('vp8') && args.includes('-qmax') && args.includes('1M')) {
      args = [...args]
      for (const [key, value] of [['-qmax', '12'], ['-b:v', '24M'], ['-threads', '4'], ['-speed', '4']]) args[args.indexOf(key) + 1] = value
      qualityApplied = true
    }
    return spawn.call(this, command, args, options)
  }
}
if (![25, 30, 60].includes(fps)) throw new Error('Use a native capture rate: 25, 30 or 60')
const folder = resolve(root, `social/output/crash-validation/native-${fps}${compact ? '-1080' : ''}${highQuality ? '-hq' : ''}${repeatableDemo ? '-demo-sync' : ''}`)
await mkdir(folder, { recursive: true })
const rawPath = resolve(folder, 'capture.webm')
if (existsSync(rawPath)) throw new Error('Capture already exists; preserve it and use a distinct validation attempt')
const manifest = JSON.parse(await readFile(resolve(root, 'social/content/youtube-shorts-br.json'), 'utf8'))
const item = manifest.items.find(row => row.contentId === 'island-crash-01-decision')
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--auto-accept-this-tab-capture', '--enable-usermedia-screen-capturing', '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] })
try {
  const context = await browser.newContext({ viewport: { width: compact ? 1080 : 1440, height: compact ? 1920 : 2560 }, deviceScaleFactor: 1, locale: 'pt-BR', colorScheme: 'dark', ...(fps === 25 ? { recordVideo: { dir: folder, size: { width: 1440, height: 2560 } } } : {}) })
  await context.addInitScript(() => { localStorage.setItem('playliva.cookie-consent', JSON.stringify({ necessary: true, analytics: false, marketing: false })) })
  // Isolated illustrative demo fixture: long enough to inspect flight and fall.
  // Production code, actual game randomness and the existing masters are untouched.
  if (repeatableDemo) await context.addInitScript(() => {
    const original = crypto.getRandomValues.bind(crypto)
    crypto.getRandomValues = array => { if (array instanceof Uint32Array && array.length === 1) { array[0] = 2863311520; return array } return original(array) }
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:3101/pt-br/play/crash', { waitUntil: 'networkidle' })
  await page.locator('[data-action="start"]').waitFor({ state: 'visible' })
  await installStage(page, item)
  if (compact) await page.addStyleTag({ content: '#playliva-short-stage{transform:scale(.75);transform-origin:top left}html,body{width:1080px!important;height:1920px!important}' })
  await page.waitForTimeout(2000)
  if (fps === 25) {
    const diagnostics = await page.evaluate(async () => {
      const marker = document.createElement('div'); marker.style = 'position:absolute;left:0;top:0;width:60px;height:60px;background:#ff00ff;z-index:999999'
      document.querySelector('#playliva-short-stage').append(marker)
      await new Promise(r => setTimeout(r, 500)); marker.remove()
      const result = { fps: 25, phases: [], raf: [], canvases: [...document.querySelectorAll('canvas')].map(c => ({ width: c.width, height: c.height, cssWidth: c.clientWidth, cssHeight: c.clientHeight })) }
      const start = performance.now(); let last, done = false
      function monitor(t) { if (done) return; result.raf.push(t - start); const phase = document.querySelector('[data-phase]')?.getAttribute('data-phase'); if (phase !== last) { result.phases.push({ time: (t - start) / 1000, phase }); last = phase } requestAnimationFrame(monitor) }
      requestAnimationFrame(monitor)
      setTimeout(() => document.querySelector('[data-action="start"]')?.click(), 800)
      setTimeout(() => document.querySelector('[data-action="cashout"]')?.click(), 4350)
      setTimeout(() => document.querySelector('[data-action="start"]')?.click(), 9000)
      setTimeout(() => { document.querySelector('.end-card').dataset.visible = 'true' }, 15850)
      await new Promise(r => setTimeout(r, 18000)); done = true
      return result
    })
    const video = page.video(); await page.close(); await context.close()
    await video.saveAs(rawPath)
    if (highQuality && !qualityApplied) throw new Error('Source-quality override was not applied; reject capture')
    diagnostics.sourceEncoder = highQuality ? { codec: 'vp8', bitrate: 24000000, qmax: 12, threads: 4, speed: 4 } : { codec: 'vp8', bitrate: 1000000, qmax: 50 }
    diagnostics.repeatableLocalDemo = repeatableDemo
    await writeFile(resolve(folder, 'capture.json'), JSON.stringify(diagnostics, null, 2))
    console.log(JSON.stringify({ rawPath, ...diagnostics, raf: undefined }))
    await browser.close()
    process.exit(0)
  }
  const chunks = []
  await page.exposeFunction('saveCaptureChunk', base64 => { chunks.push(Buffer.from(base64, 'base64')) })
  await page.evaluate(({ fps, compact }) => {
    window.captureDiagnostics = { fps, phases: [], raf: [], settings: null, canvases: [...document.querySelectorAll('canvas')].map(c => ({ width: c.width, height: c.height, cssWidth: c.clientWidth, cssHeight: c.clientHeight })) }
    const button = document.createElement('button'); button.id = 'begin-native-capture'; button.textContent = 'Begin local capture'; button.style = 'position:fixed;top:0;left:0;z-index:999999'
    button.onclick = async () => {
      button.remove()
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: 'browser', width: { ideal: compact ? 1080 : 1440 }, height: { ideal: compact ? 1920 : 2560 }, frameRate: { ideal: fps, max: fps } }, audio: false, preferCurrentTab: true })
      window.captureDiagnostics.settings = stream.getVideoTracks()[0].getSettings()
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 28000000 })
      const saves = []
      recorder.ondataavailable = event => { if (event.data.size) saves.push(event.data.arrayBuffer().then(buffer => { let binary = ''; const bytes = new Uint8Array(buffer); for (let i = 0; i < bytes.length; i += 16384) binary += String.fromCharCode(...bytes.subarray(i, i + 16384)); return window.saveCaptureChunk(btoa(binary)) })) }
      recorder.onstop = async () => { await Promise.all(saves); stream.getTracks().forEach(t => t.stop()); window.captureDone = true }
      recorder.start(500)
      const start = performance.now(); let previousPhase
      function monitor(t) { if (window.captureDone) return; window.captureDiagnostics.raf.push(t - start); const phase = document.querySelector('[data-phase]')?.getAttribute('data-phase'); if (phase !== previousPhase) { window.captureDiagnostics.phases.push({ time: (t - start) / 1000, phase }); previousPhase = phase } requestAnimationFrame(monitor) }
      requestAnimationFrame(monitor)
      setTimeout(() => document.querySelector('[data-action="start"]')?.click(), 800)
      setTimeout(() => document.querySelector('[data-action="cashout"]')?.click(), 4350)
      setTimeout(() => document.querySelector('[data-action="start"]')?.click(), 9000)
      setTimeout(() => { const card = document.querySelector('.end-card'); card.dataset.visible = 'true'; card.setAttribute('aria-hidden', 'false') }, 15850)
      setTimeout(() => recorder.stop(), 18000)
    }
    document.querySelector('#playliva-short-stage').append(button)
  }, { fps, compact })
  await page.locator('#begin-native-capture').click()
  await page.waitForFunction(() => window.captureDone, { timeout: 60000 })
  await writeFile(rawPath, Buffer.concat(chunks))
  const diagnostics = await page.evaluate(() => window.captureDiagnostics)
  await writeFile(resolve(folder, 'capture.json'), JSON.stringify(diagnostics, null, 2))
  console.log(JSON.stringify({ rawPath, settings: diagnostics.settings, canvases: diagnostics.canvases, phases: diagnostics.phases, rafFrames: diagnostics.raf.length }))
} finally { await browser.close() }
