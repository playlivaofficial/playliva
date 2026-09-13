// Local-only, no-cache gzip proxy for comparable delivery/paint measurements.
// Never imported by application routes. Start a built preview on :3102 first.
import { createServer } from 'node:http'
import { gzipSync } from 'node:zlib'

const probe = `<script>(function(){
const start=performance.now(), paints={}, shifts=[], tasks=[];let lcp=null;
const observers=[];
for(const type of ['paint','largest-contentful-paint','layout-shift','longtask']){
 try{const observer=new PerformanceObserver(list=>{for(const e of list.getEntries()){
  if(type==='paint')paints[e.name]=Math.round(e.startTime);
  if(type==='largest-contentful-paint')lcp=Math.round(e.startTime);
  if(type==='layout-shift'&&!e.hadRecentInput)shifts.push({time:e.startTime,value:e.value});
  if(type==='longtask')tasks.push(e.duration);
 }});observer.observe({type,buffered:true});observers.push(observer)}catch{}
}
function report(){
 observers.forEach(o=>o.disconnect());
 let cls=0,windowValue=0,windowStart=0,last=0;
 for(const shift of shifts){if(shift.time-last>1000||shift.time-windowStart>5000){windowStart=shift.time;windowValue=0}windowValue+=shift.value;last=shift.time;cls=Math.max(cls,windowValue)}
 const resources=performance.getEntriesByType('resource').map(e=>({path:new URL(e.name).pathname,type:e.initiatorType,encodedBytes:e.encodedBodySize,decodedBytes:e.decodedBodySize,transferBytes:e.transferSize}));
 const sum=filter=>resources.filter(filter).reduce((n,e)=>n+e.encodedBytes,0);
 const result={path:location.pathname,viewport:[innerWidth,innerHeight],elapsedMs:Math.round(performance.now()-start),paintMs:paints,lcpProxyMs:lcp,clsProxy:Number(cls.toFixed(4)),longTaskCount:tasks.length,totalBlockingTimeProxyMs:Math.round(tasks.reduce((n,d)=>n+Math.max(0,d-50),0)),jsGzipBytes:sum(e=>e.path.endsWith('.js')),cssGzipBytes:sum(e=>e.path.endsWith('.css')),imageBytes:sum(e=>e.type==='img'||/\\.(webp|png|jpe?g|svg)$/.test(e.path)),resources};
 const node=document.createElement('pre');node.id='m10-performance-evidence';node.style='white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;padding:16px';node.textContent=JSON.stringify(result,null,2);document.body.append(node);
}
window.addEventListener('load',()=>setTimeout(report,2000),{once:true});
})();</script>`

createServer(async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:3102' + req.url, { redirect: 'manual' })
    for (const [key, value] of response.headers) if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'cache-control', 'etag'].includes(key)) res.setHeader(key, value)
    res.statusCode = response.status
    res.setHeader('Cache-Control', 'no-store')
    const contentType = response.headers.get('content-type') ?? ''
    let body = Buffer.from(await response.arrayBuffer())
    if (contentType.includes('text/html')) body = Buffer.from(body.toString().replace('</head>', probe + '</head>'))
    if (/text|javascript|json|svg/.test(contentType)) {
      body = gzipSync(body)
      res.setHeader('Content-Encoding', 'gzip')
    }
    res.setHeader('Content-Length', body.length)
    res.end(body)
  } catch { res.writeHead(502); res.end('Local production preview unavailable') }
}).listen(3111, '127.0.0.1', () => console.log('M10 local performance evidence: http://127.0.0.1:3111/pt-br'))
