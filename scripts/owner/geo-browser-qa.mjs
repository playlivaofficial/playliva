// Local production-build QA only. Reads an isolated test credential, never the
// production access file. The caller starts Next with matching temporary auth.
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { chromium } from 'playwright-core'

const config = JSON.parse(await readFile(process.env.OWNER_GEO_QA_CONFIG || 'social/output/geo-migration/owner-qa-config.json', 'utf8'))
const base = new URL(config.base || 'http://127.0.0.1:3140')
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname) && base.protocol === 'http:', 'This fixture must never authenticate against production.')
assert.ok(typeof config.password === 'string' && config.password.length >= 20, 'An isolated test credential is required.')
const output = 'social/output/geo-migration/owner-browser'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const context = await browser.newContext({ extraHTTPHeaders: { 'x-vercel-ip-country': 'GE' } })
await context.addInitScript(() => {
  localStorage.setItem('playliva.country', 'MX')
  localStorage.setItem('playliva.cookie-consent', JSON.stringify({ necessary: true, analytics: true, marketing: false }))
  document.cookie = 'playliva_analytics=granted; path=/; SameSite=Lax'
})
const page = await context.newPage(), checks = [], errors = [], expectedLocalSdkErrors = [], expectedIsolatedStorageErrors = []
page.on('pageerror', error => errors.push({ type: 'pageerror', message: error.message.slice(0, 250) }))
page.on('console', message => {
  if (message.type() !== 'error') return
  const location = message.location().url
  if (location.includes('/_vercel/insights/script.js')) expectedLocalSdkErrors.push('Vercel browser SDK is unavailable on localhost')
  else if (location.endsWith('/api/events') && message.text().includes('503')) expectedIsolatedStorageErrors.push('Real GEO measurement has no database in this isolated owner fixture')
  else errors.push({ type: 'console', message: message.text().slice(0, 250), path: location ? new URL(location).pathname : '' })
})
const previewRequests = []
let previewEvents = 0, inspectingPreview = false
page.on('request', request => {
  if (inspectingPreview && new URL(request.url()).pathname === '/api/events') {
    previewEvents++
    const payload = request.postDataJSON()
    previewRequests.push({ page: new URL(page.url()).pathname, event: payload?.event, route: payload?.url })
  }
})
const visit = async path => {
  const response = await page.goto(new URL(path, base).href, { waitUntil: 'domcontentloaded' })
  assert.equal(response.status(), 200, path)
  await page.getByRole('region', { name: 'Owner GEO preview' }).waitFor({ state: 'visible' })
  await page.waitForTimeout(200)
}
const status = async () => {
  const response = await context.request.get(new URL('/api/owner/geo-preview', base).href)
  assert.equal(response.status(), 200)
  return response.json()
}
const checkLayout = async (width, geo, path) => {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${width} ${path}: horizontal overflow`)
  assert.equal(await page.locator('h1').count(), 1, `${path}: page identity`)
  assert.equal(await page.locator('a[href^="/go?"], [data-commercial-banner], [data-betsson-banner], [data-betting-ad]').count(), 0, `${path}: pending commercial suppression`)
  const bar = page.getByRole('region', { name: 'Owner GEO preview' })
  if (geo) {
    assert.equal(await bar.getAttribute('data-owner-geo-preview'), geo)
    assert.match(await bar.innerText(), new RegExp(`es-${geo} · ${{ MX: 'MXN', CO: 'COP', PE: 'PEN' }[geo]}`))
    assert.equal(await page.locator('html').getAttribute('lang'), `es-${geo}`)
  }
  checks.push({ width, geo: geo || 'Real', path, overflow: false, commercialAnchors: 0 })
}
try {
  await page.goto(new URL('/owner/login', base).href)
  await page.getByLabel('Owner password').fill(config.password)
  await page.getByRole('button', { name: 'Sign in securely' }).click()
  await page.waitForURL(new URL('/owner/growth', base).href)
  assert.equal((await status()).realCountry, 'GE')
  for (const width of [1440, 430, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 900 })
    await visit('/en/games')
    for (const geo of ['MX', 'CO', 'PE']) {
      await Promise.all([
        page.waitForURL(url => url.pathname === `/es-${geo.toLowerCase()}/games`),
        page.getByRole('combobox', { name: 'Preview GEO' }).selectOption(geo),
      ])
      assert.equal((await status()).previewGeo, geo)
      inspectingPreview = true
      for (const suffix of ['', '/games', '/games/aviator', '/providers/spribe', '/offers', '/operators', '/where-to-play/aviator', '/play/crash', '/play/samba-drop']) {
        const path = `/es-${geo.toLowerCase()}${suffix}`
        await visit(path)
        await checkLayout(width, geo, path)
        if (suffix === '/games' || suffix === '/offers') await page.screenshot({ path: `${output}/${geo}-${width}-${suffix.slice(1)}.png`, fullPage: true })
      }
      await visit(`/es-${geo.toLowerCase()}/games`)
    }
    inspectingPreview = false
    await Promise.all([page.waitForEvent('load'), page.getByRole('button', { name: 'Reset to Real GEO' }).click()])
    assert.equal((await status()).previewGeo, null)
    await checkLayout(width, null, new URL(page.url()).pathname)
    assert.equal(await page.locator('[data-owner-geo-preview]').count(), 0)
  }
  assert.equal(previewEvents, 0, 'Owner previews never enter first-party analytics')
  await visit('/owner/growth/affiliate')
  assert.match(await page.locator('main').innerText(), /MXN/)
  assert.match(await page.locator('main').innerText(), /COP/)
  assert.match(await page.locator('main').innerText(), /PEN/)
  await page.getByRole('button', { name: 'Sign out' }).click()
  await page.waitForURL(new URL('/owner/login', base).href)
  assert.equal((await context.request.get(new URL('/api/owner/geo-preview', base).href)).status(), 401)
  assert.equal(errors.length, 0, JSON.stringify(errors))
  await writeFile(`${output}/report.json`, JSON.stringify({ passed: true, checks, previewEvents, previewRequests, errors, expectedLocalSdkErrors: expectedLocalSdkErrors.length, expectedIsolatedStorageErrors: expectedIsolatedStorageErrors.length, logoutRevoked: true }, null, 2))
  console.log(`Owner GEO browser QA passed: ${checks.length} page/viewport checks, MX/CO/PE/Real reset, no commercial leakage, no preview events, logout revoked.`)
} catch (error) {
  await writeFile(`${output}/report.json`, JSON.stringify({ passed: false, checks, previewEvents, previewRequests, errors, failure: error.message }, null, 2))
  throw error
} finally { await browser.close() }
