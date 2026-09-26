// Black-box UI release smoke: real draws and clocks, no engine injection or affiliate navigation.
import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const base = process.env.THREE_GAME_QA_URL ?? 'http://127.0.0.1:3120'
const dir = 'social/output/three-game/live'
await mkdir(dir, { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] })
const report = []
async function verify(country, slug) {
 const context = await browser.newContext({ viewport: { width: 430, height: 950 } })
 const page = await context.newPage(), errors = [], failedAssets = []
 page.on('pageerror', e => errors.push(e.message))
 page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
 page.on('response', r => { if (r.status() >= 400 && new URL(r.url()).origin === new URL(base).origin) failedAssets.push({ url: r.url(), status: r.status() }) })
 await page.addInitScript(country => {
  localStorage.setItem('playliva.country', country)
  const Native = window.AudioContext
  window.releaseAudio = []
  window.AudioContext = class extends Native { constructor(...args) { super(...args); window.releaseAudio.push(this) } }
 }, country)
 const response = await page.goto(`${base}/pt-br/play/${slug}`, { waitUntil: 'networkidle' })
 assert.equal(response.status(), 200)
 const reject = page.getByRole('button', { name: 'Recusar opcionais', exact: true })
 if (await reject.isVisible()) await reject.click()
 const control = page.locator('[data-game-controls] button').first()
 await page.waitForFunction(() => !document.querySelector('[data-game-controls] button')?.disabled, { timeout: 30000 })
 assert.equal(await page.locator('[data-sponsor-slot] a[href*="/go?"]').count() > 0, country === 'BR')
 await page.locator('[data-casino-settings-trigger]').click()
 const dialog = page.locator('dialog[open]')
 for (const name of ['Música', 'Efeitos sonoros']) {
  const toggle = dialog.getByRole('switch', { name: new RegExp(name) })
  if (await toggle.getAttribute('aria-checked') === 'false') await toggle.click()
 }
 if (slug === 'carnaval-gold') await dialog.getByRole('button', { name: 'Turbo', exact: true }).click()
 await dialog.getByRole('button', { name: 'Regras', exact: true }).click()
 await dialog.locator('li').first().waitFor()
 if (slug === 'carnaval-gold') {
  await dialog.getByRole('button', { name: 'Tabela de pagamentos', exact: true }).click()
  assert.equal(await dialog.locator('tbody tr').count(), 9)
 }
 await dialog.getByRole('button', { name: 'Fechar', exact: true }).click()
 if (slug === 'samba-drop') { await page.locator('[data-game-controls]').getByLabel('Fileiras').selectOption('16'); await page.locator('details summary').click(); assert.equal(await page.locator('details tbody tr').count(), 17) }
 const reset = page.getByRole('button', { name: 'Redefinir Saldo', exact: true })
 const offer = page.locator('[data-betsson-engagement-offer]'), shown = []
 for (let cycle = 1; cycle <= 9; cycle++) {
  await control.click()
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some(b => b.textContent === 'Redefinir Saldo' && b.disabled))
  assert.equal(await offer.count(), 0)
  const deadline = Date.now() + 180000
  while (!await reset.isEnabled()) {
   assert.ok(Date.now() < deadline, `${slug}: round completion timed out`)
   const next = page.getByRole('button', { name: 'CONTINUAR', exact: true })
   if (await next.isVisible()) await next.click()
   await page.waitForTimeout(250)
  }
  await page.waitForTimeout(650)
  if (country === 'BR' && cycle % 3 === 0) {
   await offer.waitFor({ state: 'visible' })
   assert.equal(Number(await offer.getAttribute('data-completed-cycle')), cycle)
   shown.push(cycle); await page.keyboard.press('Escape')
  } else assert.equal(await offer.count(), 0)
  // A bonus summary may remain after the complete series; dismiss before the next paid spin.
  const next = page.getByRole('button', { name: 'CONTINUAR', exact: true })
  if (await next.isVisible()) await next.click()
  console.log('cycle', country, slug, cycle)
 }
 assert.ok(await page.evaluate(() => window.releaseAudio.some(c => c.state === 'running')), 'audio unlocked by user interaction')
 await reset.click()
 await page.locator('[data-game-shell] [role="group"] button').first().click()
 assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('playliva.originals.session')).transactions.at(-1).kind), 'reset')
 await page.locator('[data-game-unit]').screenshot({ path: `${dir}/${country}-${slug}.png` })
 assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
 assert.deepEqual(errors, []); assert.deepEqual(failedAssets, [])
 report.push({ country, slug, cycles: 9, shown, settings: 'pass', rules: 'pass', audio: 'running', reset: 'pass', errors, failedAssets })
 await context.close()
}
try {
 const results = await Promise.allSettled(['BR', 'MX'].flatMap(country => ['samba-drop', 'skuptu-levanta', 'carnaval-gold'].map(slug => verify(country, slug))))
 const failures = results.filter(r => r.status === 'rejected').map(r => String(r.reason))
 await writeFile(`${dir}/report.json`, JSON.stringify({ base, report, failures }, null, 2))
 assert.deepEqual(failures, []); console.log(JSON.stringify({ base, report }, null, 2))
} finally { await browser.close() }
