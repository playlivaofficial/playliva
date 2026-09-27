import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import automation from '../../lib/owner/server/automation.ts'
import planner from '../../lib/owner/creative-planner.ts'
import model from '../../lib/owner/automation-model.ts'
import { installGenerationStage } from './generation-stage.mjs'
import { advanceScene } from './capture-actions.mjs'

// Exercise capture controls/layout for each actual registry entry. This creates
// screenshots only, not video masters, uploads, or historical regeneration.
const base = process.env.SOCIAL_CAPTURE_BASE_URL || 'http://127.0.0.1:3122'
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Capture smoke must target localhost.')
const output = resolve('social/output/owner-growth/capture-smoke'); await mkdir(output, { recursive: true })
const executablePath = [process.env.SOCIAL_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].filter(Boolean).find(existsSync)
const browser = await chromium.launch({ executablePath, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const reports = []
try {
  const requested = process.argv.find(arg => arg.startsWith('--games='))?.slice(8).split(',')
  for (const game of automation.generationGames().filter(game => !requested || requested.includes(game.slug))) {
    const context = await browser.newContext({ viewport: { width: 1080, height: 1920 }, locale: 'pt-BR', deviceScaleFactor: 1 })
    const page = await context.newPage(), errors = []
    await page.clock.install({ time: new Date() })
    page.on('pageerror', error => errors.push(error.message))
    const job = planner.planCreative(game, 'wow', 'smoke-v1', new Date().toISOString(), model.emptyAutomation())
    await page.goto(base + new URL(job.creative.targetUrl).pathname, { waitUntil: 'networkidle' })
    await page.locator('[data-game-unit]').waitFor({ state: 'visible' }); await page.waitForTimeout(3500)
    await installGenerationStage(page, job)
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 100))
    await page.evaluate(() => { window.ownerAnimations = new Map() })
    let actions = 0
    const phases = new Set()
    for (let second = 0; second < 22; second++) {
      // This is control/layout QA, not a cadence test: skip intermediate frames.
      await page.clock.fastForward(1000)
      const state = await page.evaluate(advanceScene, { elapsed: second, variant: 1, seconds: 24, act: second % 2 === 1 })
      actions += state.actions; phases.add(state.phase)
      if ([3, 11, 19].includes(second)) await page.screenshot({ path: resolve(output, `${game.slug}-${second}.png`) })
    }
    const layout = await page.locator('[data-game-viewport]').evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom } })
    const report = { game: game.slug, actions, phases: [...phases], errors, layout }
    reports.push(report); console.log(JSON.stringify(report))
    await context.close()
  }
} finally { await browser.close(); await writeFile(resolve(output, 'report.json'), JSON.stringify(reports, null, 2)) }
for (const report of reports) {
  assert.ok(report.actions >= 2, `${report.game}: insufficient real actions`)
  assert.ok(report.phases.length >= 2, `${report.game}: no real phase progression`)
  assert.equal(report.errors.length, 0, `${report.game}: page errors`)
  assert.ok(report.layout.bottom < 1570, `${report.game}: scene overlaps footer`)
}
