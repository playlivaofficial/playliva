// Local-only deterministic QA of the REAL game, shell, wallet and vector deck.
// No public route, persisted outcome override, backend or production debug input.
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { readFile, readdir } from 'node:fs/promises'
const require = createRequire(import.meta.url)
const { build } = createRequire(require.resolve('tsx'))('esbuild')
const scenarios = {
  natural: 'A 9 K 8', decisions: '5 10 6 7 4', bust: 'K 6 9 5 5',
  'dealer-bust': 'K 6 8 9 K', push: 'K 10 8 8', double: '5 9 6 8 K',
  split: '8 10 8 7 3 2 K', 'three-hands': '8 10 8 7 8 8 3 2 K 9',
  'split-aces': 'A 10 A 7 K A', insufficient: '8 10 8 7',
  'long-hand': 'A 10 A 7 2 2 2 2 2 2 2 2 2', 'dealer-natural': '9 A K Q',
}
const bundle = await build({ stdin: { contents: `
  import React from 'react'
  import {createRoot} from 'react-dom/client'
  import {CountryProvider} from './components/country-context'
  import {DemoSessionProvider} from './components/originals/demo-session'
  import {BlackjackGame} from './components/originals/blackjack/blackjack-game'
  import {createBlackjackEngine} from './lib/originals/blackjack/engine'
  import {createDemoSessionStore} from './lib/originals/session'
  const scenarios=${JSON.stringify(scenarios)}
  const root=createRoot(document.getElementById('game'))
  let wallet,engine,kind='decisions',serial=0,saved=new Map(),paused=false,time=0
  function open(next=kind,keep=false) {
    kind=next; if(!keep)saved=new Map()
    const storage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)}
    wallet=createDemoSessionStore(()=>storage)
    if(kind==='insufficient'&&!keep)wallet.debit(999950)
    let cursor=0,round=0; paused=false
    const shoe={beginRound(){cursor=0;round++},draw(){const ranks=scenarios[kind].split(' ');const rank=ranks[cursor];if(!rank)throw Error('Scenario exhausted');return Object.freeze({id:round+'-'+cursor++,rank,suit:['spades','hearts','clubs','diamonds'][cursor%4]})}}
    engine=createBlackjackEngine(wallet,{shoe,now:()=>paused?time:performance.now()})
    const locale=document.getElementById('locale').value
    root.render(<CountryProvider key={++serial} initialLocale={locale}><DemoSessionProvider store={wallet}><BlackjackGame suppliedEngine={engine}/></DemoSessionProvider></CountryProvider>)
    document.getElementById('scenario-name').textContent='Scenario: '+kind
  }
  for(const b of document.querySelectorAll('[data-scenario]'))b.onclick=()=>open(b.dataset.scenario)
  document.getElementById('locale').onchange=()=>open()
  document.getElementById('pause').onclick=()=>{if(!paused){time=performance.now();paused=true}}
  document.getElementById('step').onclick=()=>{if(!paused){time=performance.now();paused=true}time+=240;engine.tick()}
  document.getElementById('resume').onclick=()=>{paused=false}
  document.getElementById('reload-hand').onclick=()=>open(kind,true)
  setInterval(()=>{const s=engine.getSnapshot(); const w=wallet.getSnapshot().session;document.getElementById('state').textContent=JSON.stringify({phase:s.phase,revision:s.revision,active:s.activeHand,hands:s.hands,dealer:s.dealer,returned:s.totalReturn,completed:s.completed,balance:w.balance,transactions:w.transactions},null,2)},100)
  open()
`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, outdir: 'qa-output', platform: 'browser', format: 'esm', target: 'es2022',
  define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'local-next-adapters', setup(api) {
    api.onResolve({ filter: /^next\/(image|link|navigation)$/ }, a => ({ path: a.path, namespace: 'qa-next' }))
    api.onLoad({ filter: /.*/, namespace: 'qa-next' }, a => ({ loader: 'jsx', resolveDir: process.cwd(), contents: a.path === 'next/image' ?
      `import React from 'react'; export default function Image({unoptimized,priority,fill,sizes,...props}){return <img {...props}/>} ` : a.path === 'next/link' ?
      `import React from 'react'; export default function Link({prefetch,...props}){return <a {...props}/>} ` :
      `export const usePathname=()=>'/'+document.getElementById('locale').value.toLowerCase()+'/play/blackjack';export const useRouter=()=>({push(){},replace(){}});export const useSearchParams=()=>new URLSearchParams();` }))
  } }],
})
const files = Object.fromEntries(bundle.outputFiles.map(f => [f.path.endsWith('.css') ? '/bundle.css' : '/bundle.js', f.contents]))
const styles = (await readdir(new URL('../.next/static/chunks/', import.meta.url))).filter(n => n.endsWith('.css')).map(n => `<link rel="stylesheet" href="/_next/static/chunks/${n}">`).join('')
const html = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blackjack local scenario QA</title>${styles}<link rel="stylesheet" href="/bundle.css"><style>body{margin:0;background:#071322;color:white;font-family:Arial,sans-serif}#game{padding-top:64px}#tools{padding:16px}#tools button{padding:8px;min-height:44px;margin:4px;background:#173e38;color:white;border:1px solid #9bad67;border-radius:6px}#tools select{color:black}pre{white-space:pre-wrap;font-size:11px}</style><div id="game"></div><section id="tools"><h1>Local-only Blackjack scenarios</h1><p id="scenario-name"></p><label>Language <select id="locale"><option value="pt-BR">PT-BR</option><option value="en">EN</option><option value="es-MX">ES-MX</option></select></label><nav>${Object.keys(scenarios).map(s=>`<button data-scenario="${s}">${s}</button>`).join('')}<button id="pause">Pause clock</button><button id="step">Advance 240ms</button><button id="resume">Resume clock</button><button id="reload-hand">Reload hand, keep ledger</button></nav><pre id="state"></pre></section><script type="module" src="/bundle.js"></script></html>`
createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://127.0.0.1').pathname
    if (path === '/') { response.setHeader('Content-Type', 'text/html'); response.end(html) }
    else if (files[path]) { response.setHeader('Content-Type', path.endsWith('.css') ? 'text/css' : 'text/javascript'); response.end(files[path]) }
    else if (path === '/originals/blackjack/table-poster.svg') { response.setHeader('Content-Type', 'image/svg+xml'); response.end(await readFile(new URL('../public' + path, import.meta.url))) }
    else if (/^\/_next\/static\/(chunks|media)\/[a-zA-Z0-9_.-]+\.(css|woff2)$/.test(path)) { response.setHeader('Content-Type', path.endsWith('.css') ? 'text/css' : 'font/woff2'); response.end(await readFile(new URL('../.next' + path.slice(6), import.meta.url))) }
    else { response.writeHead(404); response.end() }
  } catch { response.writeHead(500); response.end() }
}).listen(3105, '127.0.0.1', () => console.log('Blackjack local QA: http://127.0.0.1:3105'))
