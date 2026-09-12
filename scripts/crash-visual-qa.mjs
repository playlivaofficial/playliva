// Local-only, deterministic storyboard of the REAL renderer and original rigs.
// No app route, wallet persistence, network outcomes or production debug switch.
// node scripts/crash-visual-qa.mjs -> http://127.0.0.1:3101
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
const require = createRequire(import.meta.url)
const { build } = createRequire(require.resolve('tsx'))('esbuild')
const bundle = await build({
  stdin: { contents: `
    import { mountIslandScene } from './components/originals/crash/island-scene'
    import { createCrashEngine, PREPARING_MS, KICK_MS, timeToMultiplier } from './lib/originals/crash/engine'
    import { createDemoSessionStore } from './lib/originals/session'
    import { fallDurationMs } from './lib/originals/crash/timing'
    import { formatCredits } from './lib/originals/credits'
    import { crashCopy } from './lib/originals/crash/copy'
    import { segmentToLocale } from './lib/locale'
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
      engine.start(10000)
      if (document.querySelector('#cashout').checked && point > 115 && delta >= timeToMultiplier(115)) {
        time = impact + timeToMultiplier(115) + .001; engine.tick(); engine.cashOut()
      }
      if (delta >= timeToMultiplier(point)) { time = impact + timeToMultiplier(point); engine.tick() }
      time = impact + delta
      engine.tick()
      cleanup = mountIslandScene(scene, engine, { now: () => time,
        ready: () => { setTimeout(() => { if (version === current && !ticking) status.textContent = 'Ready: ' + kind + ' ' + selected.delta + 'ms / ' + summary() }, 200) },
        error: () => { status.textContent = 'Renderer error' } })
    }
    document.querySelectorAll('[data-delta]').forEach(button => button.onclick = () => frame(Number(button.dataset.delta),button.dataset.kind))
    document.querySelector('#point').onchange = event => { point=Number(event.target.value); frame(selected.delta,selected.kind) }
    document.querySelector('#cashout').onchange = () => frame(selected.delta,selected.kind)
    document.querySelector('#locale').onchange = () => updateHud()
    document.querySelector('#run').onclick = () => { frame(-impact); anchor = performance.now(); ticking = true }
    function summary() {
      const state = engine.getSnapshot()
      return state.phase + ' / live ' + (state.multiplier / 100).toFixed(2) + 'x / wager ' + state.wager + ' / locked return ' + formatCredits(state.result?.payout ?? 0, 'en')
    }
    function updateHud() {
      const state = engine.getSnapshot(), locale = segmentToLocale(document.querySelector('#locale').value)
      document.querySelector('.phase').textContent = crashCopy(locale)[state.phase]
      const multiplier = document.querySelector('.multiplier')
      multiplier.textContent = new Intl.NumberFormat(locale, {minimumFractionDigits:2, maximumFractionDigits:2}).format(state.multiplier / 100) + '×'
      multiplier.toggleAttribute('data-crashed', state.phase === 'falling' || state.phase === 'impact')
    }
    function update(wallTime) {
      if (ticking) {
        time = wallTime - anchor; engine.tick()
        if (document.querySelector('#cashout').checked && engine.getSnapshot().wager === 'active' && engine.getSnapshot().multiplier >= 115) engine.cashOut()
        status.textContent = summary() + ' / contact +' + Math.round(time - impact) + 'ms'
      }
      updateHud()
      requestAnimationFrame(update)
    }
    requestAnimationFrame(update); frame(-16)
  `, resolveDir: process.cwd(), loader: 'ts' },
  bundle: true, write: false, platform: 'browser', format: 'esm', target: 'es2022',
})
const sceneCss = await readFile(new URL('../components/originals/crash/crash-game.module.css', import.meta.url), 'utf8')
// Reuse the built production font when available; no additional download/dependency.
const chunks = new URL('../.next/static/chunks/', import.meta.url)
let fontCss = ''
try {
  for (const name of await readdir(chunks)) {
    if (!name.endsWith('.css')) continue
    const source = await readFile(new URL(name, chunks), 'utf8')
    fontCss += [...source.matchAll(/@font-face\{font-family:Inter;[^}]+\}/g)].map(match => match[0].replaceAll('../media/', '/qa-font/')).join('')
  }
} catch { /* A fresh checkout can still preview with the system fallback. */ }
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Island Crash local frame QA</title>
<style>*{box-sizing:border-box}body{margin:0;background:#061522;color:white;font:14px/1.5 Arial,Helvetica,sans-serif}p{margin:0}header{padding:12px}h1{font-size:18px}nav{display:flex;flex-wrap:wrap;gap:6px}button{min-height:44px;padding:8px;background:#a9f16e;border:0;border-radius:5px}#stage{width:calc(100% - 50px);max-width:916px;margin:auto;overflow:hidden}#status{padding:12px}${sceneCss}</style>
<style>${fontCss}body{font-family:Inter,Arial,Helvetica,sans-serif}html{scrollbar-width:none}::-webkit-scrollbar{display:none}</style>
<div id="stage" class="viewport"><div id="scene" class="scene"></div><div class="vignette"></div><div class="sceneBrand">PLAYLIVA ORIGINALS <span>ISLAND CRASH</span></div><div class="hud"><p class="phase"></p><p class="multiplier"></p></div></div>
<p id="status">Loading</p><header><h1>Local renderer storyboard — exact contact / fall frames with production HUD CSS</h1><label>Language <select id="locale"><option value="en">EN</option><option value="pt-br">PT-BR</option><option value="es-mx">ES-MX</option></select></label> <label>Outcome <select id="point"><option value="100">1.00x</option><option value="110">1.10x</option><option value="250">2.50x</option><option value="500" selected>5.00x</option><option value="1000">10.00x</option><option value="10000">100.00x</option></select></label> <label><input type="checkbox" id="cashout">Cash out at 1.15x</label><nav>${[-700,-100,-16,0,16,40,100,250,500,1000,5000].map(delta => `<button data-kind="contact" data-delta="${delta}">Contact ${delta}ms</button>`).join('')}${[-16,0,16,200,450,600,750,900,1100].map(delta=>`<button data-kind="crash" data-delta="${delta}">Crash ${delta}ms</button>`).join('')}<button id="run">Run real-time round</button></nav></header><script type="module" src="/bundle.js"></script></html>`
const assets = new Set(['/originals/crash/runtime/castaway.glb', '/originals/crash/runtime/island-kicker.glb'])
createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://127.0.0.1').pathname
    if (path === '/') { response.setHeader('Content-Type', 'text/html'); response.end(html) }
    else if (path === '/bundle.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(bundle.outputFiles[0].contents) }
    else if (assets.has(path)) { response.setHeader('Content-Type', 'model/gltf-binary'); response.end(await readFile(new URL('../public' + path, import.meta.url))) }
    else if (/^\/qa-font\/[a-zA-Z0-9_.-]+\.woff2$/.test(path)) { response.setHeader('Content-Type', 'font/woff2'); response.end(await readFile(new URL('../.next/static/media/' + path.split('/').pop(), import.meta.url))) }
    else { response.writeHead(404); response.end() }
  } catch { response.writeHead(500); response.end() }
}).listen(3101, '127.0.0.1', () => console.log('Local visual QA: http://127.0.0.1:3101'))
