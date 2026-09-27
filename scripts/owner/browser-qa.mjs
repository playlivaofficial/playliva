import assert from 'node:assert/strict'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
const base = process.env.OWNER_QA_URL || 'http://127.0.0.1:3122'
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Owner QA only targets localhost.')
const directory = resolve(process.env.OWNER_DATA_DIR || 'social/output/owner-growth')
const output = resolve(directory, 'qa'); await mkdir(output, { recursive: true })
const access = await readFile(resolve(directory, 'local-access.txt'), 'utf8'), password = access.match(/^Password: (.+)$/m)?.[1]
if (!password) throw new Error('Local QA password unavailable.')
const executablePath = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync)
const browser = await chromium.launch({ executablePath, headless: true }), context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
const page = await context.newPage(), errors = [], runs = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', event => { if (event.type() === 'error') errors.push(event.text()) })
const paths = ['/owner/growth', '/owner/growth/social', '/owner/growth/seo', '/owner/growth/affiliate', '/owner/growth/content']
try {
  for (const path of paths) {
    const response = await fetch(`${base}${path}`, { redirect: 'manual' })
    assert.ok([307, 308].includes(response.status), `${path} must redirect without a session`)
    assert.equal(response.headers.get('location'), '/owner/login')
    const body = await response.text(); assert.ok(!body.includes('island-crash-01-decision'))
    assert.match(response.headers.get('x-robots-tag'), /noindex/)
  }
  for (const endpoint of ['/api/owner/data', '/api/owner/media/island-crash-01-decision/video']) assert.equal((await fetch(base + endpoint)).status, 401)
  assert.equal((await fetch(`${base}/api/owner/social/island-crash-01-decision`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: JSON.stringify({ action: 'approve', reviewed: 'on' }) })).status, 401)
  await page.goto(`${base}/owner/login`)
  await page.getByLabel('Owner password').fill(password)
  await page.getByRole('button', { name: 'Sign in securely' }).click()
  await page.waitForURL(`${base}/owner/growth`)
  const cookie = (await context.cookies()).find(item => item.name === 'playliva_owner_local')
  assert.ok(cookie?.httpOnly); assert.equal(cookie.sameSite, 'Strict')
  for (const width of [1440, 430, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 900 })
    for (const path of paths) {
      const response = await page.goto(base + path, { waitUntil: 'networkidle' })
      assert.equal(response.status(), 200)
      assert.equal(await page.locator('h1').count(), 1)
      const geometry = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth, videos: document.querySelectorAll('video').length }))
      assert.ok(geometry.scroll <= width + 1, `${path} overflows at ${width}: ${geometry.scroll}`)
      assert.equal(geometry.videos, 0)
      const section = path.split('/').at(-1) === 'growth' ? 'overview' : path.split('/').at(-1)
      await page.screenshot({ path: resolve(output, `${section}-${width}.png`), fullPage: true })
      runs.push({ path, width, status: 200, noHorizontalOverflow: true })
    }
  }
  await page.goto(`${base}/owner/growth/social`)
  await page.getByLabel('Game', { exact: true }).selectOption('crash')
  await page.getByRole('button', { name: 'Apply filters' }).click()
  await page.waitForURL(/game=crash/)
  assert.equal(await page.locator('a[href*="creative="]').count(), 10)
  await page.getByLabel('Upload', { exact: true }).selectOption('uploaded_private')
  await page.getByRole('button', { name: 'Apply filters' }).click()
  await page.waitForURL(/uploadStatus=uploaded_private/)
  assert.equal(await page.locator('a[href*="creative="]').count(), 1)
  await page.locator('a[href*="creative="]').click()
  await page.getByRole('region', { name: 'Creative review' }).waitFor()
  assert.match(await page.locator('body').innerText(), /l1x4jFmamyw/)
  assert.equal(await page.locator('video').count(), 0)
  await page.screenshot({ path: resolve(output, 'review-320.png'), fullPage: true })
  if (process.env.OWNER_QA_MUTATIONS === '1') {
    // Run only against a separate disposable QA owner store, never the review ledger.
    assert.ok(directory.includes('qa-fixture'), 'Mutations require a qa-fixture directory')
    await page.goto(`${base}/owner/growth/social?creative=island-crash-01-decision`)
    assert.equal(await page.locator('video').count(), 0)
    await page.getByRole('button', { name: 'Load video preview' }).click()
    await page.locator('video').evaluate(async video => { video.muted = true; await video.play() })
    await page.waitForFunction(() => document.querySelector('video')?.currentTime > .1)
    const range = await context.request.get(`${base}/api/owner/media/island-crash-01-decision/video`, { headers: { Range: 'bytes=0-99' } })
    assert.equal(range.status(), 206); assert.equal((await range.body()).length, 100)
    await page.getByLabel(/I have reviewed/).check()
    await page.getByRole('button', { name: 'Approve creative', exact: true }).click()
    await page.getByText('Approved for review. Nothing was uploaded or published.', { exact: true }).waitFor()
    await page.getByLabel('Rejection reason (optional)').fill('QA fixture review')
    await page.getByRole('button', { name: 'Reject creative', exact: true }).click()
    await page.getByText('Rejected. Existing source and media were preserved.', { exact: true }).waitFor()
    await page.reload(); assert.match(await page.locator('body').innerText(), /QA fixture review/)
    await page.goto(`${base}/owner/growth/content`)
    await page.getByText('Add a content idea', { exact: true }).click()
    await page.getByLabel('Topic', { exact: true }).fill('QA fixture content plan')
    await page.getByRole('button', { name: 'Save content plan' }).click()
    await page.getByText('Content plan saved. No public page was changed or published.', { exact: true }).waitFor()
    await page.goto(`${base}/owner/growth/content?q=QA+fixture+content+plan`)
    assert.match(await page.locator('tbody').innerText(), /QA fixture content plan/)
    await page.goto(`${base}/owner/growth/social?creative=island-crash-01-decision`)
    page.once('dialog', dialog => dialog.accept())
    await page.getByRole('button', { name: 'Queue regeneration' }).click()
    await page.getByText('Regeneration queued for the workstation. No video has been rendered yet.', { exact: true }).waitFor()
    await page.reload()
    assert.equal(await page.getByRole('button', { name: 'Approve creative', exact: true }).isEnabled(), false)
  }
  const data = await (await context.request.get(`${base}/api/owner/data`)).json()
  const serialized = JSON.stringify(data)
  for (const sensitive of ['refresh_token', 'client_secret', 'passwordHash', 'sessions', password, cookie.value]) assert.ok(!serialized.includes(sensitive), `API must not expose ${sensitive === password || sensitive === cookie.value ? 'credentials' : sensitive}`)
  assert.equal((await context.request.post(`${base}/api/owner/content`, { headers: { Origin: 'https://evil.example' }, data: {} })).status(), 403)
  assert.equal((await context.request.post(`${base}/api/owner/youtube/sync`, { headers: { Origin: base }, data: {} })).status(), 400)
  assert.equal(errors.length, 0, errors.join('\n'))
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await page.waitForURL(`${base}/owner/login`)
  assert.equal((await context.request.get(`${base}/api/owner/data`)).status(), 401)
  assert.equal((await fetch(`${base}/api/owner/data`, { headers: { Cookie: `${cookie.name}=${cookie.value}` } })).status, 401)
  const report = { runs, assertions: ['owner pages redirect', 'API and media authentication', 'HttpOnly Strict cookie', 'no secret exposure', 'CSRF denied', '20 responsive views', 'social game/upload filters', 'private upload review', 'media unavailable state', 'OAuth disconnected error', 'logout invalidates session'], consoleErrors: errors, mutationQA: process.env.OWNER_QA_MUTATIONS === '1' }
  await writeFile(resolve(output, 'browser-report.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ views: runs.length, consoleErrors: errors.length, mutationQA: report.mutationQA, output }))
} finally { await browser.close() }
