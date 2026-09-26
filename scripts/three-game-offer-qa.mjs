import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 430, height: 950 } }), report = [], errors = []
page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
await page.goto('http://127.0.0.1:3121'); await page.waitForFunction(() => window.qa)
const frame = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const advance = async ms => { await page.evaluate(ms => window.qa.advance(ms), ms); await frame() }
const offer = page.locator('[data-betsson-engagement-offer]')
for (const country of ['BR', 'MX']) for (const kind of ['samba-drop', 'skuptu-levanta', 'carnaval-gold']) {
  await page.evaluate(({ country, kind }) => { localStorage.setItem('playliva.country', country); window.qa.open(kind) }, { country, kind }); await frame()
  if (kind === 'skuptu-levanta') await page.waitForSelector('[data-pose]')
  assert.equal(await page.locator('[data-sponsor-slot] a[href*="/go?"]').count() > 0, country === 'BR')
  const shown = []
  for (let cycle = 1; cycle <= 9; cycle++) {
    const start = await page.evaluate(kind => window.qa.start(kind), kind); assert.equal(start.ok, true); await frame()
    assert.equal(await offer.count(), 0, `${kind}: offer during active round`)
    await advance(kind === 'skuptu-levanta' ? 40000 : 5000)
    assert.equal(await offer.count(), 0, `${kind}: offer before complete cycle`)
    await advance(kind === 'skuptu-levanta' ? 2451 : 1000)
    if (country === 'BR' && cycle % 3 === 0) {
      await offer.waitFor({ state: 'visible', timeout: 3000 })
      assert.equal(Number(await offer.getAttribute('data-completed-cycle')), cycle)
      shown.push(cycle); await page.keyboard.press('Escape'); await frame(); assert.equal(await offer.count(), 0)
    }
  }
  await page.waitForTimeout(700)
  assert.equal(await offer.count(), 0)
  assert.deepEqual(shown, country === 'BR' ? [3, 6, 9] : [])
  report.push({ country, kind, completedCycles: 9, shown })
}
await writeFile('social/output/three-game/offer-browser-report.json', JSON.stringify({ report, errors }, null, 2))
await browser.close(); assert.deepEqual(errors, []); console.log(JSON.stringify(report, null, 2))
