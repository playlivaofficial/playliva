// Local-only deterministic visual QA; controls are never bundled into app routes.
import { chromium } from 'playwright-core'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import engine from '../lib/originals/levanta/engine.ts'

const dir = 'social/output/three-game/animation'
await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const errors = [], report = []
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
page.on('pageerror', e => errors.push(e.message))
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
await page.goto('http://127.0.0.1:3121'); await page.waitForFunction(() => window.qa)
for (const width of [1440, 430, 390, 320]) {
  await page.setViewportSize({ width, height: 1000 })
  await page.evaluate(() => window.qa.open('skuptu-levanta'))
  await page.waitForFunction(() => document.querySelector('[data-pose]'))
  const capture = async phase => {
    await page.locator('[data-game-viewport]').screenshot({ path: `${dir}/${width}-${phase}.png` })
    const metric = await page.locator('[data-pose]').evaluate(e => ({ ...e.dataset }))
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    assert.equal(overflow, false, `overflow at ${width}/${phase}`)
    for (const limb of JSON.parse(metric.pose)) {
      assert.ok(limb.footError < .00001, `sliding foot at ${width}/${phase}`)
      assert.ok(Math.abs(limb.soleClearance - .002) < .00002, `outsole contact at ${width}/${phase}: ${limb.soleClearance}`)
    }
    return metric
  }
  const advance = async ms => {
    await page.evaluate(ms => window.qa.advance(ms), ms)
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  }
  await capture('setup')
  await page.evaluate(() => window.qa.start('skuptu-levanta'))
  await advance(2000); await capture('pull')
  await advance(5000); await capture('strain')
  await advance(5500); await capture('lockout')
  await page.evaluate(() => window.qa.cashout())
  await advance(500); await capture('cashout')
  const failureAt = 2500 + engine.timeToMultiplier(1552)
  await advance(failureAt - 14000 - 1); await capture('before-failure')
  await advance(16); const failure = await capture('failure')
  assert.equal(failure.hudCrashFrame, failure.audioFailureFrame)
  assert.equal(failure.hudCrashFrame, failure.crashFrame)
  assert.equal(failure.hudCrashFrame, failure.barDropFrame)
  assert.ok(Number(failure.crashFrame) >= failureAt)
  await advance(96); await capture('release')
  let impact
  for (let frame = 0; frame < 40; frame++) {
    await advance(16)
    const state = await page.locator('[data-pose]').evaluate(e => ({ ...e.dataset }))
    if (state.impact) { impact = state; break }
  }
  assert.ok(impact, 'bar must land')
  assert.equal(impact.impact, impact.audioImpactFrame, 'bar impact and impact sound must share a frame')
  await capture('impact'); await advance(700); await capture('recovery')
  await advance(1200); await capture('post-failure')
  report.push({ width, failureFrame: failure.crashFrame, impactFrame: impact.impact, drawCalls: impact.drawCalls, triangles: impact.triangles, errors: [] })
  console.log(report.at(-1))
}
await writeFile(`${dir}/report.json`, JSON.stringify({ report, errors }, null, 2))
assert.deepEqual(errors, [])
await browser.close()
