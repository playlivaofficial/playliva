// Isolated localhost-only deterministic QA of the REAL game, shell, wallet and
// CSS. No production route, URL override, remote outcome or persisted wallet.
// node scripts/capybara-visual-qa.mjs -> http://127.0.0.1:3103
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
const require = createRequire(import.meta.url)
const { build } = createRequire(require.resolve('tsx'))('esbuild')
const bundle = await build({
  stdin: { contents: `
    import React, {useState} from 'react'
    import {createRoot} from 'react-dom/client'
    import {CountryProvider} from './components/country-context'
    import {DemoSessionProvider} from './components/originals/demo-session'
    import {CapybaraGame} from './components/originals/capybara/capybara-game'
    import {createSlotEngine} from './lib/originals/capybara/engine'
    import {createDemoSessionStore} from './lib/originals/session'
    const loss = () => ['coconut','emerald','flower','toucan','pearl'].map(s=>Array(4).fill(s))
    function grid(kind) {
      const g=loss()
      if(kind==='loss'||kind==='insufficient') return g
      if(kind==='near-miss'||kind==='bonus') { for(let i=0;i<(kind==='bonus'?3:2);i++)g[i][0]='scatter'; return g }
      if(kind==='mega')return Array.from({length:5},(_,i)=>Array(4).fill(i?'wild':'coconut'))
      for(let i=0;i<3;i++)g[i][0]='leaf'
      if(kind==='wild'||kind==='multi-wild')g[1][0]='wild'
      if(kind==='multi-wild')g[2][0]='wild'
      return g
    }
    let wallet, engine, last='', frameTime=0, paused=false
    const root=createRoot(document.getElementById('game'))
    function open(kind='loss') {
      wallet=createDemoSessionStore(()=>null)
      if(kind==='insufficient')wallet.debit(999950)
      frameTime=0; paused=false
      engine=createSlotEngine(wallet,{now:()=>paused?frameTime:performance.now(),draw:(_r,free)=>grid(free?'wild':kind)})
      const locale=document.getElementById('locale').value
      root.render(<CountryProvider key={kind+locale+performance.now()} initialLocale={locale}><DemoSessionProvider store={wallet}><CapybaraGame suppliedEngine={engine}/></DemoSessionProvider></CountryProvider>)
      document.getElementById('scenario-name').textContent='Scenario: '+kind
      last=kind
    }
    for(const button of document.querySelectorAll('[data-scenario]'))button.onclick=()=>open(button.dataset.scenario)
    document.getElementById('locale').onchange=()=>open(last)
    document.getElementById('settle').onclick=()=>{paused=true;frameTime=engine.getSnapshot().revealAt;engine.tick()}
    document.getElementById('next').onclick=()=>{paused=true;frameTime+=2200;engine.tick()}
    setInterval(()=>{ const s=engine.getSnapshot(); const w=wallet.getSnapshot().session; document.getElementById('state').textContent=JSON.stringify({phase:s.phase,free:s.free,remaining:s.bonusRemaining,multiplier:s.bonusMultiplier,total:s.bonusTotal,completed:s.completed,balance:w.balance,transactions:w.transactions.length,result:s.result?.evaluation},null,2)},100)
    open()
  `, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, outdir: 'qa-output', platform: 'browser', format: 'esm', target: 'es2022',
  external: ['/originals/*'],
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [{ name: 'next-local-adapters', setup(api) {
    api.onResolve({ filter: /^next\/(image|link|navigation)$/ }, args => ({ path: args.path, namespace: 'qa-next' }))
    api.onLoad({ filter: /.*/, namespace: 'qa-next' }, args => ({ loader: 'jsx', resolveDir: process.cwd(), contents: args.path === 'next/image' ?
      `import React from 'react'; export default function Image({unoptimized,priority,fill,sizes,...props}) {return <img {...props}/>} ` : args.path === 'next/link' ?
      `import React from 'react'; export default function Link({prefetch,...props}){return <a {...props}/>} ` :
      `export const usePathname=()=>'/'+document.getElementById('locale').value.toLowerCase()+'/play/capybara-gold'; export const useRouter=()=>({push(){},replace(){}}); export const useSearchParams=()=>new URLSearchParams();` }))
  } }],
})
const files = Object.fromEntries(bundle.outputFiles.map(f => [f.path.endsWith('.css') ? '/bundle.css' : '/bundle.js', f.contents]))
const chunks = new URL('../.next/static/chunks/', import.meta.url)
const styles = (await readdir(chunks)).filter(n => n.endsWith('.css')).map(n => `<link rel="stylesheet" href="/_next/static/chunks/${n}">`).join('')
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Capybara local scenario QA</title>${styles}<link rel="stylesheet" href="/bundle.css"><style>body{margin:0;background:#071322;color:white;font-family:Arial,sans-serif}#tools{padding:16px}#tools button{padding:8px;min-height:44px;margin:4px;background:#173e38;color:white;border:1px solid #9bad67;border-radius:6px}#tools select{color:black}pre{white-space:pre-wrap;font-size:11px}#game{padding-top:64px}</style><div id="game"></div><section id="tools"><h1>Local-only production component QA</h1><p id="scenario-name"></p><label>Language <select id="locale"><option value="pt-BR">PT-BR</option><option value="en">EN</option><option value="es-MX">ES-MX</option></select></label><nav>${['loss','small','wild','multi-wild','near-miss','bonus','mega','insufficient'].map(s=>`<button data-scenario="${s}">${s}</button>`).join('')}<button id="settle">Freeze settled frame</button><button id="next">Advance 2200ms</button></nav><pre id="state"></pre></section><script type="module" src="/bundle.js"></script></html>`
createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://127.0.0.1').pathname
    if (path === '/') { response.setHeader('Content-Type', 'text/html'); response.end(html) }
    else if (files[path]) { response.setHeader('Content-Type', path.endsWith('.css') ? 'text/css' : 'text/javascript'); response.end(files[path]) }
    else if (/^\/originals\/capybara-gold\/[a-z-]+\.webp$/.test(path)) { response.setHeader('Content-Type', 'image/webp'); response.end(await readFile(new URL('../public' + path, import.meta.url))) }
    else if (/^\/_next\/static\/(chunks|media)\/[a-zA-Z0-9_.-]+\.(css|woff2)$/.test(path)) { response.setHeader('Content-Type', path.endsWith('.css') ? 'text/css' : 'font/woff2'); response.end(await readFile(new URL('../.next' + path.slice(6), import.meta.url))) }
    else { response.writeHead(404); response.end() }
  } catch { response.writeHead(500); response.end() }
}).listen(3103, '127.0.0.1', () => console.log('Capybara scenario QA: http://127.0.0.1:3103'))
