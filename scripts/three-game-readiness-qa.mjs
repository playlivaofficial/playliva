// Real browser interaction with the isolated deterministic harness, never a production test endpoint.
import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const dir = 'social/output/three-game/readiness'
await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }), errors = [], report = []
page.on('pageerror', e => errors.push(e.message))
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
await page.addInitScript(() => {
  const Native = window.AudioContext
  window.qaAudio = []
  window.AudioContext = class extends Native { constructor(...args) { super(...args); window.qaAudio.push(this) } }
})
await page.goto('http://127.0.0.1:3121'); await page.waitForFunction(() => window.qa)
const frame = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
const advance = async ms => { await page.evaluate(ms => window.qa.advance(ms), ms); await frame(); return page.evaluate(() => window.qa.state()) }
for (const width of [1440, 430, 390, 320]) for (const kind of ['samba-drop', 'carnaval-gold']) {
  await page.setViewportSize({ width, height: 1000 })
  await page.evaluate(kind => window.qa.open(kind, kind === 'samba-drop' ? 'high' : 'bonus'), kind)
  const start = page.locator('[data-game-controls] button').first()
  await start.waitFor({ state: 'visible' }); await page.waitForFunction(() => !document.querySelector('[data-game-controls] button')?.disabled)
  const snap = async state => {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}/${kind}/${state}`)
    await page.locator('[data-game-viewport]').screenshot({ path: `${dir}/${width}-${kind}-${state}.png` })
  }
  if (kind === 'samba-drop') {
    await page.locator('[data-game-controls]').getByLabel('Risco').selectOption('high')
    await page.locator('[data-game-controls]').getByLabel('Fileiras').selectOption('16')
    await snap('sixteen-rows')
    await page.locator('[data-game-controls]').getByLabel('Fileiras').selectOption('12')
  }
  await snap('idle')
  await page.locator('[data-casino-settings-trigger]').click()
  const dialog = page.locator('dialog[open]')
  await dialog.getByRole('button', { name: 'Regras', exact: true }).click()
  await dialog.locator('li').first().waitFor()
  assert.ok(await dialog.locator('li').count() >= 7)
  if (kind === 'carnaval-gold') {
    await dialog.getByRole('button', { name: 'Tabela de pagamentos', exact: true }).click()
    assert.equal(await dialog.locator('tbody tr').count(), 9)
  }
  await dialog.screenshot({ path: `${dir}/${width}-${kind}-help.png` })
  await dialog.getByRole('button', { name: 'Fechar', exact: true }).click()
  await page.evaluate(() => window.qa.settings({ sound: true, music: true, sfx: true, haptics: false }))
  await start.click(); await frame()
  assert.equal(await page.evaluate(() => window.qaAudio.filter(c => c.state !== 'closed').length), 1)
  if (kind === 'samba-drop') {
    await advance(450); await snap('early'); await advance(1100); await snap('middle'); await advance(1000); await snap('final')
    const landed = await advance(90); assert.equal(landed.phase, 'landed'); assert.equal(landed.result.bucket, 0)
    await snap('high-land'); await advance(650)
  } else {
    await advance(300); await snap('spin'); await advance(1150); await snap('anticipation')
    const bonus = await advance(2400); assert.equal(bonus.phase, 'bonus-intro'); await snap('bonus-trigger')
    await advance(2500); await snap('free-spins'); const meter = await advance(2500); assert.equal(meter.streak, 5); await snap('meter-five')
    let state
    for (let i = 0; i < 60; i++) { state = await advance(5000); if (state.phase === 'bonus-summary') break }
    assert.equal(state.phase, 'bonus-summary'); await snap('bonus-summary')
  }
  await page.evaluate(() => window.qa.settings({ sound: false, music: false, sfx: false, haptics: false }))
  await page.waitForTimeout(180)
  assert.equal(await page.evaluate(() => window.qaAudio.filter(c => c.state === 'running').length), 0)
  report.push({ width, kind, gameplay: 'passed', rules: 'passed', audioContexts: 1, mute: 'suspended', overflow: false })
}
// All locale UI checks use the URL locale in the harness, just like the app.
for (const locale of ['en', 'es-MX']) for (const kind of ['samba-drop', 'skuptu-levanta', 'carnaval-gold']) {
  await page.evaluate(({ kind, locale }) => window.qa.open(kind, 'normal', locale), { kind, locale }); await frame()
  await page.locator('[data-casino-settings-trigger]').click()
  const dialog = page.locator('dialog[open]')
  await dialog.getByRole('button', { name: locale === 'en' ? 'Rules' : 'Reglas', exact: true }).click()
  await dialog.locator('li').first().waitFor()
  const text = await dialog.innerText()
  if (locale === 'es-MX') assert.doesNotMatch(text, /\b(?:Créditos por rodada|Samba Meter|Wild|Scatter|How to play)\b/)
  await dialog.getByRole('button', { name: locale === 'en' ? 'Close' : 'Cerrar', exact: true }).click()
}
assert.equal(await page.evaluate(() => window.qaAudio.filter(c => c.state !== 'closed').length), 0, 'unmount closes previous audio')
await writeFile(`${dir}/report.json`, JSON.stringify({ report, errors }, null, 2))
await browser.close(); assert.deepEqual(errors, [])
console.log(JSON.stringify({ cases: report.length, locales: 3, errors }, null, 2))
