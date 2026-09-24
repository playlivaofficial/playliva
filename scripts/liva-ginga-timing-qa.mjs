// Local real-renderer evidence. Requires embaixadinha-visual-qa.mjs on port 3113.
import { chromium } from 'playwright-core'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const out = 'social/output/embaixadinha-qa'
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] })
const results = []
try {
  for (const width of [1440, 430, 390, 320]) for (const fail of [2, 20, 55]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    page.on('requestfailed', r => errors.push(r.url() + ': ' + r.failure()?.errorText))
    await page.goto(`http://127.0.0.1:3113/?fail=${fail}&w=${width}&h=700`)
    await page.waitForFunction(() => window.loaded, null, { timeout: 120000 })
    await page.click('#start')
    const schedule = await page.evaluate(() => window.qa.schedule)
    const crash = schedule[fail].at
    // Render every successful contact at its mathematical timestamp.
    for (let i = 0; i < fail; i++) {
      await page.evaluate(at => window.qa.at(at), schedule[i].at)
      await page.waitForTimeout(60)
    }
    for (const [label, at] of [['before', crash - 16], ['crash', crash], ['escape', crash + 100], ['stumble', crash + 360]]) {
      await page.evaluate(at => window.qa.at(at), at)
      await page.waitForTimeout(100)
      if (fail === 20) await page.locator('#host').screenshot({ path: `${out}/ginga-${width}-${label}.png` })
    }
    const evidence = await page.evaluate(() => ({ events: window.motionEvents, audio: window.audioEvents, snapshot: window.qa.snapshot() }))
    const crashEvents = evidence.events.filter(e => e.type !== 'contact-cue-dispatch')
    assert.deepEqual(crashEvents.map(e => e.type), ['stumble-start', 'ball-escape-start', 'hud-freeze', 'crash-cue-dispatch', 'crash-render'])
    assert.equal(new Set(crashEvents.map(e => e.frameAt)).size, 1)
    assert.equal(crashEvents[0].frameAt - crashEvents[0].scheduledAt, 0)
    const contacts = evidence.events.filter(e => e.type === 'contact-cue-dispatch')
    assert.equal(contacts.length, fail)
    assert.equal(new Set(contacts.map(e => e.index)).size, fail)
    const crashAudio = evidence.audio.filter(e => e.logical === crashEvents[0].frameAt)
    assert.ok(crashAudio.length, 'real AudioContext scheduled crash voices')
    assert.deepEqual(errors, [])
    results.push({ width, fail, crashMs: crash, contactCount: contacts.length, maxContactLagMs: Math.max(...contacts.map(e => e.frameAt - e.scheduledAt)), crashFrameDeltaMs: 0, dispatchSpanMs: crashEvents[3].observedAt - crashEvents[0].observedAt, firstAudioOffsetMs: crashAudio[0].scheduledOffsetMs, errors })
    await page.close()
  }
  await writeFile(`${out}/ginga-timing.json`, JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results, null, 2))
} finally { await browser.close() }
