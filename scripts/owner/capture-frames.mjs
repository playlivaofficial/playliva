import { advanceScene, isMovingGameplayFrame } from './capture-actions.mjs'
import { chromium } from 'playwright-core'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createHash } from 'node:crypto'
import ffmpegStatic from 'ffmpeg-static'
import { installGenerationStage } from './generation-stage.mjs'

/** Offline frame rendering: game clocks advance 1/30s per actual rendered frame.
 * Slow CPU/GPU work changes render duration, never footage cadence. No frame duplication.
 */
export async function capture(job, folder, seconds) {
  await mkdir(folder, { recursive: true })
  const executablePath = [process.env.SOCIAL_CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].filter(Boolean).find(existsSync)
  if (!executablePath) throw new Error('Chrome runtime is missing.')
  const browser = await chromium.launch({ executablePath, headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  let encoder
  try {
    const context = await browser.newContext({ viewport: { width: 1080, height: 1920 }, locale: 'pt-BR', deviceScaleFactor: 1, colorScheme: 'dark' })
    await context.addInitScript(() => { localStorage.setItem('playliva.cookie-consent', JSON.stringify({ necessary: true, analytics: false, marketing: false })) })
    const page = await context.newPage(), errors = []
    await page.clock.install({ time: new Date() })
    page.on('pageerror', error => errors.push(error.message))
    const source = new URL(job.creative.targetUrl), base = new URL(process.env.SOCIAL_CAPTURE_BASE_URL || 'https://www.playliva.com')
    if (!['www.playliva.com', '127.0.0.1', 'localhost'].includes(base.hostname)) throw new Error('Capture origin is not allowlisted.')
    await page.goto(`${base.origin}${source.pathname}`, { waitUntil: 'networkidle', timeout: 90000 })
    await page.locator('[data-game-unit]').waitFor({ state: 'visible' })
    await page.waitForTimeout(3000)
    await installGenerationStage(page, job)
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100))
    await page.evaluate(() => { window.ownerAnimations = new Map() })
    const raw = resolve(folder, 'capture.mkv')
    encoder = spawn(process.env.SOCIAL_FFMPEG_PATH || ffmpegStatic, ['-y', '-hide_banner', '-f', 'image2pipe', '-framerate', '30', '-vcodec', 'png', '-i', 'pipe:0', '-an', '-c:v', 'ffv1', '-level', '3', raw], { stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true })
    let encoderError = '', pipeError
    encoder.stdin.on('error', error => { pipeError = error })
    encoder.stderr.on('data', part => { encoderError = (encoderError + part).slice(-2000) })
    const ended = new Promise((ok, fail) => { encoder.on('error', fail); encoder.on('close', code => code === 0 ? ok() : fail(new Error(`Capture encoder failed (${code}): ${encoderError}`))) })
    // Observe rejections immediately, including while a frame is rendering.
    ended.catch(() => {})
    const diagnostics = { settings: { width: 1080, height: 1920, frameRate: 30, mode: 'offline-frame-clock' }, frames: 0, phases: [], actions: 0, repeatedFrames: 0, longestRepeat: 0, movingFrames: 0, movingRepeats: 0 }
    let previous = '', lastAction = -2, previousHash = '', repeats = 0
    // Production CPU evidence: Ginga's native 600-frame capture takes ~25 min.
    // Give this heavier scene headroom instead of reducing quality or cadence.
    const budgetMinutes = job.gameSlug === 'liva-ginga' ? 60 : 25
    const deadline = Date.now() + budgetMinutes * 60000
    for (let frame = 0; frame < seconds * 30; frame++) {
      if (Date.now() > deadline) throw new Error(`Capture exceeded the ${budgetMinutes}-minute job budget.`)
      if (pipeError) throw new Error('Capture encoder pipe failed.')
      const elapsed = frame / 30
      await page.clock.runFor(frame % 3 === 2 ? 34 : 33)
      const act = elapsed > .5 && elapsed - lastAction > 1.8 + (job.captureVariant % 3) * .18 && elapsed < seconds - 2.5
      if (act) lastAction = elapsed
      const result = await page.evaluate(advanceScene, { elapsed, variant: job.captureVariant, seconds, act })
      diagnostics.actions += result.actions
      if (result.phase !== previous) { diagnostics.phases.push({ time: elapsed, phase: result.phase }); previous = result.phase }
      const png = await page.screenshot({ type: 'png', timeout: 30000 })
      const hash = createHash('sha256').update(png).digest('hex')
      // The intentional static end card covers the game during the last 1.8s.
      // A still-flying engine behind it is not a visible frozen gameplay frame.
      if (isMovingGameplayFrame(result.phase, elapsed, seconds)) { diagnostics.movingFrames++; if (hash === previousHash) diagnostics.movingRepeats++ }
      if (hash === previousHash) { diagnostics.repeatedFrames++; repeats++ } else repeats = 0
      diagnostics.longestRepeat = Math.max(diagnostics.longestRepeat, repeats); previousHash = hash
      if (!encoder.stdin.write(png)) await once(encoder.stdin, 'drain')
      diagnostics.frames++
      if (frame === 90) await writeFile(resolve(folder, 'frame-preview.png'), png)
      if (frame % 150 === 149) console.log(JSON.stringify({ capture: job.id, frames: frame + 1, total: seconds * 30 }))
    }
    encoder.stdin.end(); await ended
    await writeFile(resolve(folder, 'capture.json'), JSON.stringify(diagnostics))
    if (errors.length || diagnostics.actions < 2) throw new Error('Capture had a page error or insufficient gameplay actions.')
    if (['crash', 'liva-ginga', 'skuptu-levanta'].includes(job.gameSlug) && (diagnostics.movingFrames < 30 || diagnostics.movingRepeats / diagnostics.movingFrames > .1)) {
      throw new Error(`Capture motion continuity failed: ${diagnostics.movingFrames} moving frames, ${diagnostics.movingRepeats} repeats, longest static run ${diagnostics.longestRepeat}.`)
    }
    return { raw, diagnostics }
  } finally { encoder?.kill(); await browser.close() }
}
