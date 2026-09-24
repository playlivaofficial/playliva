// Isolated localhost-only QA for the REAL Liva Ginga renderer, engine and
// motion code with a frozen, scriptable clock. No production route, URL override
// or remote outcome. Run: node scripts/embaixadinha-visual-qa.mjs [--poster]
//   http://127.0.0.1:3113/?fail=40&variant=overhit&w=800&h=600
// Page API: window.qa.start(), window.qa.at(msAfterFlick), window.qa.snapshot().
// --poster renders the discovery/OG poster from the actual scene into public/.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const { build } = createRequire(require.resolve('tsx'))('esbuild')
const bundle = await build({
  stdin: { contents: `
    import { mountJuggleScene } from './components/originals/embaixadinha/juggle-scene'
    import { createJuggleEngine } from './lib/originals/embaixadinha/engine'
    import { TOUCHES, GROWTH_MS, SURVIVAL, PREPARING_MS, failVariant } from './lib/originals/embaixadinha/juggle'
    import { createJuggleAudio } from './lib/originals/embaixadinha/audio'
    import { createDemoSessionStore } from './lib/originals/session'
    const q = new URLSearchParams(location.search)
    const fail = Number(q.get('fail') ?? 40)
    // Uniform sample that makes touch \`fail\` the failing one (test-only entropy).
    const reach = TOUCHES[fail].at + 1, u = 1 - SURVIVAL * Math.exp(-reach / GROWTH_MS)
    let clock = 1000, id = 'qa-round'
    if (q.get('variant')) for (let i = 0; i < 400; i++) if (failVariant('qa-' + i, fail) === q.get('variant')) { id = 'qa-' + i; break }
    const engine = createJuggleEngine(createDemoSessionStore(() => null), { now: () => clock, random: { uint32: () => Math.floor(u * 2 ** 32) }, id: () => id })
    const host = document.getElementById('host')
    host.style.width = (q.get('w') ?? 800) + 'px'; host.style.height = (q.get('h') ?? 600) + 'px'
    const hud = document.getElementById('hud')
    const audio = createJuggleAudio(); audio.setEnabled(true)
    const events = []; window.motionEvents = events
    window.audioEvents = []
    const oscStart = OscillatorNode.prototype.start
    OscillatorNode.prototype.start = function(when) { window.audioEvents.push({ logical: clock, observed: performance.now(), scheduledOffsetMs: (when - this.context.currentTime) * 1000 }); return oscStart.call(this, when) }
    mountJuggleScene(host, engine, { now: () => clock, ready: () => { window.loaded = true }, error: e => { window.loadError = String(e) },
      frame: f => { hud.textContent = (f.multiplier / 100).toFixed(2) + '×'; hud.dataset.crashed = f.crashed }, cues: () => audio, trace: event => events.push(event) })
    window.qa = {
      start() { if (engine.getSnapshot().phase === 'ready') { clock = 1000; audio.unlock(); audio.roundStart(); engine.start(10000) } },
      at(ms) { clock = 1000 + PREPARING_MS + ms },
      snapshot: () => engine.getSnapshot(),
      schedule: TOUCHES,
      events: () => events,
      clear: () => { events.length = 0; window.audioEvents.length = 0 },
    }
  `, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, format: 'esm', target: 'es2022', platform: 'browser',
})
const html = `<!doctype html><html><meta charset="utf-8"><title>Liva Ginga local QA</title><body style="margin:0;background:#111">
<style>#host canvas{width:100%;height:100%;display:block}</style><div id="host" style="position:relative"></div><div id="hud" style="position:absolute;top:10px;right:14px;color:#fff;font:900 42px Arial;text-shadow:0 3px 0 #0f6b3b"></div>
<button id="start" onclick="window.qa.start()" style="position:absolute;bottom:0;right:0">Start QA</button><script type="module" src="/bundle.js"></script></body></html>`
const server = createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://127.0.0.1').pathname
    if (path === '/') { response.setHeader('Content-Type', 'text/html'); response.end(html) }
    else if (path === '/favicon.ico') { response.writeHead(204); response.end() }
    else if (path === '/bundle.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(bundle.outputFiles[0].contents) }
    else if (/^\/originals\/embaixadinha\/runtime\/(?:craque|footballer)\.glb$/.test(path)) { response.setHeader('Content-Type', 'model/gltf-binary'); response.end(await readFile(new URL('../public' + path, import.meta.url))) }
    else { response.writeHead(404); response.end() }
  } catch { response.writeHead(500); response.end() }
}).listen(3113, '127.0.0.1', () => console.log('Embaixadinha scene QA: http://127.0.0.1:3113'))

if (process.argv.includes('--poster')) {
  const { chromium } = await import('playwright-core')
  const sharp = (await import('sharp')).default
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : { channel: 'chrome', args: ['--enable-unsafe-swiftshader'] })
  const page = await browser.newPage({ viewport: { width: 1200, height: 675 }, deviceScaleFactor: 1.5 })
  await page.goto('http://127.0.0.1:3113/?fail=60&w=1200&h=675')
  await page.waitForFunction(() => window.loaded, null, { timeout: 120000 })
  // A low, controlled juggling arc; keep local QA controls out of the poster.
  await page.evaluate(() => { window.qa.start(); window.qa.at(760) })
  await page.evaluate(() => { document.getElementById('hud').style.display = 'none'; document.getElementById('start').style.display = 'none' })
  await page.waitForTimeout(400)
  const png = await page.locator('#host').screenshot()
  await sharp(png).resize(1200, 675).webp({ quality: 82 }).toFile(fileURLToPath(new URL('../public/originals/embaixadinha/poster.webp', import.meta.url)))
  await browser.close()
  server.close()
  console.log('Wrote public/originals/embaixadinha/poster.webp')
}
