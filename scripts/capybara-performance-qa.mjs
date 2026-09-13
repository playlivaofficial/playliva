// Local test proxy only. Adds visible performance evidence to the production
// build without changing application code or sending telemetry anywhere.
// Start `pnpm start --port 3102`, then this script; browse localhost:3104.
import { createServer } from 'node:http'
const probe = `<script>(function(){
let ready=null;const paints={};
new PerformanceObserver(list=>{for(const e of list.getEntries())paints[e.name]=Math.round(e.startTime)}).observe({type:'paint',buffered:true});
const watch=new MutationObserver(()=>{if(ready===null&&document.querySelector('[data-capybara-game][data-ready="true"]')){requestAnimationFrame(()=>{if(ready===null){ready=Math.round(performance.now());watch.disconnect();setTimeout(report,3000)}})}});watch.observe(document.documentElement,{subtree:true,attributes:true,childList:true});
function report(){const entries=performance.getEntriesByType('resource');const selected=entries.filter(e=>/\\.(js|webp)(\\?|$)/.test(e.name));const nav=performance.getEntriesByType('navigation')[0];const result={paintMs:paints,spinReadyMs:ready,domContentLoadedMs:Math.round(nav.domContentLoadedEventEnd),resources:selected.map(e=>({path:new URL(e.name).pathname,encodedBytes:e.encodedBodySize,decodedBytes:e.decodedBodySize,transferBytes:e.transferSize,durationMs:Math.round(e.duration)}))};const node=document.createElement('pre');node.id='m6-performance-evidence';node.style='white-space:pre-wrap;font-size:12px;padding:16px';node.textContent=JSON.stringify(result,null,2);document.body.append(node)}
})();</script>`
createServer(async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:3102' + req.url, { redirect: 'manual' })
    for (const [key, value] of response.headers) if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key)) res.setHeader(key, value)
    res.statusCode = response.status
    if ((response.headers.get('content-type') ?? '').includes('text/html')) res.end((await response.text()).replace('</head>', probe + '</head>'))
    else res.end(Buffer.from(await response.arrayBuffer()))
  } catch { res.writeHead(502); res.end('Local preview unavailable') }
}).listen(3104, '127.0.0.1', () => console.log('Local performance evidence: http://127.0.0.1:3104/pt-br/play/capybara-gold'))
