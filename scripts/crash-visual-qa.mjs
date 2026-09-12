// Local-only, deterministic storyboard of the REAL renderer and original rigs.
// No app route, wallet persistence, network outcomes or production debug switch.
// node scripts/crash-visual-qa.mjs -> http://127.0.0.1:3101
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
const require = createRequire(import.meta.url)
const { build } = createRequire(require.resolve('tsx'))('esbuild')
const bundle = await build({
  stdin: { contents: `
    import { mountIslandScene } from './components/originals/crash/island-scene'
    import { createCrashEngine, PREPARING_MS, KICK_MS, timeToMultiplier } from './lib/originals/crash/engine'
    import { createDemoSessionStore } from './lib/originals/session'
    import { fallDurationMs } from './lib/originals/crash/timing'
    const impact = PREPARING_MS + KICK_MS
    let time = 0, cleanup, ticking = false, anchor = 0, version = 0
    let engine, point = 500, selected = {kind:'contact', delta:-16}
    const scene = document.querySelector('#scene'), status = document.querySelector('#status')
    function frame(delta, kind='contact') {
      selected = {kind, delta}
      if (kind === 'crash' || kind === 'impact') delta += timeToMultiplier(point)
      if (kind === 'impact') delta += fallDurationMs(timeToMultiplier(point))
      cleanup?.()
      const current = ++version
      status.textContent = 'Loading frame'
      time = 0; ticking = false
      const wallet = createDemoSessionStore(() => null)
      engine = createCrashEngine(wallet, { now: () => time, random: { uint32: () => Math.max(0,Math.ceil((1 - 97 / point) * 0x1_0000_0000)) }, id: () => 'local-visual-qa' })
      engine.start(100)
      if (delta >= timeToMultiplier(point)) { time = impact + timeToMultiplier(point); engine.tick() }
      time = impact + delta
      engine.tick()
      cleanup = mountIslandScene(scene, engine, { now: () => time,
        ready: () => { setTimeout(() => { if (version === current && !ticking) status.textContent = 'Ready: ' + kind + ' ' + selected.delta + 'ms / ' + engine.getSnapshot().phase }, 200) },
        error: () => { status.textContent = 'Renderer error' } })
    }
    document.querySelectorAll('[data-delta]').forEach(button => button.onclick = () => frame(Number(button.dataset.delta),button.dataset.kind))
    document.querySelector('#point').onchange = event => { point=Number(event.target.value); frame(selected.delta,selected.kind) }
    document.querySelector('#run').onclick = () => { frame(-impact); anchor = performance.now(); ticking = true }
    function update(wallTime) {
      if (ticking) { time = wallTime - anchor; engine.tick(); status.textContent = engine.getSnapshot().phase + ' / ' + (engine.getSnapshot().multiplier / 100).toFixed(2) + 'x / contact +' + Math.round(time - impact) + 'ms' }
      requestAnimationFrame(update)
    }
    requestAnimationFrame(update); frame(-16)
  `, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, platform: 'browser', format: 'esm', target: 'es2022',
})
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Island Crash local frame QA</title>
<style>*{box-sizing:border-box}body{margin:0;background:#061522;color:white;font:14px system-ui}header{padding:12px}h1{font-size:18px}nav{display:flex;flex-wrap:wrap;gap:6px}button{min-height:44px;padding:8px;background:#a9f16e;border:0;border-radius:5px}#scene{width:calc(100% - 32px);max-width:1200px;margin:auto;height:clamp(320px,31vw,380px);position:relative;overflow:hidden}canvas{display:block}#status{padding:12px}@media(max-width:700px){#scene{height:320px}}@media(max-width:360px){#scene{height:260px}}</style>
<header><h1>Local renderer storyboard — exact contact / fall frames</h1><label>Outcome <select id="point"><option value="100">1.00x</option><option value="110">1.10x</option><option value="250">2.50x</option><option value="500" selected>5.00x</option><option value="1000">10.00x</option><option value="10000">100.00x</option></select></label><nav>${[-100,-16,0,16,40,250,500,1000,5000].map(delta => `<button data-kind="contact" data-delta="${delta}">Contact ${delta}ms</button>`).join('')}${[-16,0,16,200,450,600,750,900,1100].map(delta=>`<button data-kind="crash" data-delta="${delta}">Crash ${delta}ms</button>`).join('')}<button id="run">Run real-time round</button></nav></header><div id="scene"></div><p id="status">Loading</p><script type="module" src="/bundle.js"></script></html>`
const assets = new Set(['/originals/crash/runtime/castaway.glb', '/originals/crash/runtime/island-kicker.glb'])
createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://127.0.0.1').pathname
    if (path === '/') { response.setHeader('Content-Type', 'text/html'); response.end(html) }
    else if (path === '/bundle.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(bundle.outputFiles[0].contents) }
    else if (assets.has(path)) { response.setHeader('Content-Type', 'model/gltf-binary'); response.end(await readFile(new URL('../public' + path, import.meta.url))) }
    else { response.writeHead(404); response.end() }
  } catch { response.writeHead(500); response.end() }
}).listen(3101, '127.0.0.1', () => console.log('Local visual QA: http://127.0.0.1:3101'))
