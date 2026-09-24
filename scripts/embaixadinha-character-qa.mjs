// Local production-build QA only. Browser entropy is controlled in this test,
// never by an application URL or production game-code override.
import { chromium } from 'playwright-core'
import { mkdir, writeFile } from 'node:fs/promises'
const root = 'social/output/embaixadinha-qa'
await mkdir(root, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--enable-unsafe-swiftshader'] })
const results = []
try {
  for (const width of [1440, 430, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 1000 : 900 }, deviceScaleFactor: 1 })
    const errors = [], failed = [], cancelledPrefetches = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
    page.on('requestfailed', request => {
      const item = { url: request.url(), error: request.failure()?.errorText }
      if (item.error === 'net::ERR_ABORTED' && item.url.includes('_rsc=')) cancelledPrefetches.push(item)
      else failed.push(item)
    })
    page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`) })
    await page.addInitScript(() => {
      const original = crypto.getRandomValues.bind(crypto)
      crypto.getRandomValues = array => {
        if (array instanceof Uint32Array && array.length === 1) { array[0] = Math.floor(.6 * 2 ** 32); return array }
        return original(array)
      }
    })
    await page.goto('http://127.0.0.1:3115/pt-br/play/liva-ginga')
    await page.getByRole('button', { name: 'Recusar opcionais', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('[data-action="start"]')?.disabled === false)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
    if (overflow) throw Error(`Horizontal overflow at ${width}`)
    const canvas = page.locator('canvas').first(), scene = canvas.locator('..').locator('..')
    const captureScene = async phase => {
      // Keep the fixed site header outside the captured game/HUD.
      await scene.evaluate(node => window.scrollBy(0, node.getBoundingClientRect().top - 80))
      await scene.screenshot({ path: `${root}/${width}-${phase}.png` })
    }
    await captureScene('idle')
    await page.locator('#embaixadinha-stake').fill('0')
    await page.locator('[data-action="start"]').click()
    if (await page.locator('[data-action="cashout"]').count()) throw Error('Invalid stake started a round')
    await page.locator('#embaixadinha-stake').fill('100')
    await page.locator('[data-action="start"]').click()
    await page.waitForSelector('[data-action="cashout"]')
    if (!await page.locator('#embaixadinha-stake').isDisabled()) throw Error('Stake input active during round')
    await page.waitForTimeout(1400)
    await captureScene('juggle')
    if (width === 430) await page.locator('[data-action="cashout"]').click()
    await page.waitForFunction(() => document.querySelector('[data-crashed]') !== null, null, { timeout: 20000 })
    const frozen = await page.locator('[data-crashed]').textContent()
    await page.waitForTimeout(350)
    await captureScene('crash')
    if (await page.locator('[data-crashed]').textContent() !== frozen) throw Error('Crash multiplier did not freeze')
    const sync = await page.evaluate(() => performance.getEntriesByName('embaixadinha:crash-frame').map(e => e.detail))
    await page.waitForFunction(() => document.querySelector('[data-action="start"]')?.disabled === false)
    await page.locator('[data-action="start"]').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${root}/${width}-controls.png` })
    results.push({ width, overflow, errors, failed, cancelledPrefetches, frozen, sync, returnedReady: true })
    if (errors.length || failed.length) throw Error(`Console/network errors at ${width}`)
    await page.close()
  }
} finally {
  await writeFile(`${root}/browser-results.json`, JSON.stringify(results, null, 2) + '\n')
  await browser.close()
}
console.log(JSON.stringify(results, null, 2))
