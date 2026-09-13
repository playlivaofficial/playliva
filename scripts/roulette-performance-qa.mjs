// Local proxy only; never deployed or imported by the game. Adds DOM-visible
// paint/readiness evidence to an unchanged production preview on :3102.
import { createServer } from 'node:http'
const probe = `<script>(function(){
let wheelPaint=null,ready=null,reported=false;const paints={};
new PerformanceObserver(list=>{for(const e of list.getEntries())paints[e.name]=Math.round(e.startTime)}).observe({type:'paint',buffered:true});
const watch=new MutationObserver(inspect);watch.observe(document.documentElement,{subtree:true,attributes:true,childList:true});
function inspect(){
 if(wheelPaint===null&&document.querySelector('[data-roulette-phase]'))requestAnimationFrame(()=>{if(wheelPaint===null)wheelPaint=Math.round(performance.now())});
 if(ready===null&&document.querySelector('[data-roulette-game][data-ready="true"] [data-roulette-chip]:not(:disabled)'))requestAnimationFrame(()=>{if(ready===null){ready=Math.round(performance.now());watch.disconnect();setTimeout(report,1500)}})
}
function report(){if(reported)return;reported=true;const entries=performance.getEntriesByType('resource');const nav=performance.getEntriesByType('navigation')[0];const result={paintMs:paints,wheelPaintProxyMs:wheelPaint,gameReadyMs:ready,domContentLoadedMs:Math.round(nav.domContentLoadedEventEnd),resources:entries.filter(e=>/\\.(js|svg|css|woff2)(\\?|$)/.test(e.name)).map(e=>({path:new URL(e.name).pathname,encodedBytes:e.encodedBodySize,transferBytes:e.transferSize,durationMs:Math.round(e.duration)}))};const node=document.createElement('pre');node.id='m8-performance-evidence';node.style='white-space:pre-wrap;font-size:12px;padding:16px';node.textContent=JSON.stringify(result,null,2);document.body.append(node)}
inspect();})();</script>`
createServer(async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:3102' + req.url, { redirect: 'manual' })
    for (const [key, value] of response.headers) if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key)) res.setHeader(key, value)
    res.statusCode = response.status
    if ((response.headers.get('content-type') ?? '').includes('text/html')) res.end((await response.text()).replace('</head>', probe + '</head>'))
    else res.end(Buffer.from(await response.arrayBuffer()))
  } catch { res.writeHead(502); res.end('Local preview unavailable') }
}).listen(3108, '127.0.0.1', () => console.log('Roulette local performance evidence: http://127.0.0.1:3108/pt-br/play/roulette'))
