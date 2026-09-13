// Local-only QA of the real Roulette component, wallet, SVG and controls.
// Explicit visible scenario/clock controls; never built into a public route.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
const require = createRequire(import.meta.url)
const { build } = createRequire(require.resolve('tsx'))('esbuild')
const bundle = await build({ stdin: { contents: `
  import React from 'react'
  import {createRoot} from 'react-dom/client'
  import {CountryProvider} from './components/country-context'
  import {DemoSessionProvider} from './components/originals/demo-session'
  import {RouletteGame} from './components/originals/roulette/roulette-game'
  import {createRouletteEngine} from './lib/originals/roulette/engine'
  import {createDemoSessionStore} from './lib/originals/session'
  const root=createRoot(document.getElementById('game'))
  let wallet,engine,serial=0,saved=new Map(),paused=false,time=0
  const now=()=>paused?time:performance.now()
  function open(keep=false,low=false) {
    if(engine)engine.abandon();if(!keep)saved=new Map()
    const storage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)}
    wallet=createDemoSessionStore(()=>storage);if(low)wallet.debit(999950)
    paused=false
    const number=Number(document.getElementById('number').value)
    engine=createRouletteEngine(wallet,{now,random:{uint32:()=>number}})
    const locale=document.getElementById('locale').value
    root.render(<CountryProvider key={++serial} initialLocale={locale}><DemoSessionProvider store={wallet}><RouletteGame suppliedEngine={engine} presentationNow={now}/></DemoSessionProvider></CountryProvider>)
  }
  document.getElementById('new').onclick=()=>open()
  document.getElementById('low').onclick=()=>open(false,true)
  document.getElementById('locale').onchange=()=>open()
  document.getElementById('number').onchange=()=>open()
  document.getElementById('pause').onclick=()=>{if(!paused){time=performance.now();paused=true}}
  for(const b of document.querySelectorAll('[data-step]'))b.onclick=()=>{if(!paused){time=performance.now();paused=true}time+=Number(b.dataset.step);engine.tick()}
  document.getElementById('resume').onclick=()=>{paused=false}
  document.getElementById('reload-spin').onclick=()=>open(true)
  document.getElementById('mixed').onclick=()=>{for(const id of ['straight:23','red:red','odd:odd','dozen:2','column:2','split:20-23','corner:19-20-22-23'])engine.place(id,1000)}
  setInterval(()=>{const s=engine.getSnapshot(),w=wallet.getSnapshot().session;document.getElementById('state').textContent=JSON.stringify({phase:s.phase,elapsed:Math.round(now()-s.spinStartedAt),paused,placements:s.placements,result:s.result,completed:s.completed,balance:w.balance,transactions:w.transactions},null,2)},80)
  open()
`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, outdir: 'qa-output', platform: 'browser', format: 'esm', target: 'es2022',
  define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'local-next-adapters', setup(api) {
    api.onResolve({ filter: /^next\/(image|link|navigation)$/ }, a => ({ path: a.path, namespace: 'qa-next' }))
    api.onLoad({ filter: /.*/, namespace: 'qa-next' }, a => ({ loader: 'jsx', resolveDir: process.cwd(), contents: a.path === 'next/image' ?
      `import React from 'react';export default function Image({unoptimized,priority,fill,sizes,...props}){return <img {...props}/>} ` : a.path === 'next/link' ?
      `import React from 'react';export default function Link({prefetch,...props}){return <a {...props}/>} ` :
      `export const usePathname=()=>'/'+document.getElementById('locale').value.toLowerCase()+'/play/roulette';export const useRouter=()=>({push(){},replace(){}});export const useSearchParams=()=>new URLSearchParams();` }))
  } }],
})
const files = Object.fromEntries(bundle.outputFiles.map(f => [f.path.endsWith('.css') ? '/bundle.css' : '/bundle.js', f.contents]))
const styles = (await readdir(new URL('../.next/static/chunks/', import.meta.url))).filter(n => n.endsWith('.css')).map(n => `<link rel="stylesheet" href="/_next/static/chunks/${n}">`).join('')
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Roulette local scenario QA</title>${styles}<link rel="stylesheet" href="/bundle.css"><style>body{margin:0;background:#071322;color:white;font-family:Arial,sans-serif}#game{padding-top:64px}#tools{padding:16px}#tools button{padding:8px;min-height:44px;margin:4px;background:#173e38;color:white;border:1px solid #9bad67;border-radius:6px}#tools select{color:black}pre{white-space:pre-wrap;font-size:11px}</style><div id="game"></div><section id="tools"><h1>Local-only Roulette scenarios</h1><label>Language <select id="locale"><option value="pt-BR">PT-BR</option><option value="en">EN</option><option value="es-MX">ES-MX</option></select></label><label>Result <select id="number"><option>23</option><option>0</option><option>2</option><option>36</option></select></label><nav><button id="new">New scenario</button><button id="low">Insufficient balance</button><button id="mixed">Mixed ticket</button><button id="pause">Freeze clock</button>${[160,950,1710,380,120,850].map(ms=>`<button data-step="${ms}">Advance ${ms}ms</button>`).join('')}<button id="resume">Resume clock</button><button id="reload-spin">Reload spin, keep ledger</button></nav><pre id="state"></pre></section><script type="module" src="/bundle.js"></script></html>`
createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://127.0.0.1').pathname
    if (path === '/') { response.setHeader('Content-Type', 'text/html'); response.end(html) }
    else if (files[path]) { response.setHeader('Content-Type', path.endsWith('.css') ? 'text/css' : 'text/javascript'); response.end(files[path]) }
    else if (path === '/originals/roulette/orbit-poster.svg') { response.setHeader('Content-Type', 'image/svg+xml'); response.end(await readFile(new URL('../public' + path, import.meta.url))) }
    else if (/^\/_next\/static\/(chunks|media)\/[a-zA-Z0-9_.-]+\.(css|woff2)$/.test(path)) { response.setHeader('Content-Type', path.endsWith('.css') ? 'text/css' : 'font/woff2'); response.end(await readFile(new URL('../.next' + path.slice(6), import.meta.url))) }
    else { response.writeHead(404); response.end() }
  } catch { response.writeHead(500); response.end() }
}).listen(3107, '127.0.0.1', () => console.log('Roulette local QA: http://127.0.0.1:3107'))
