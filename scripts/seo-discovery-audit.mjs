// Read-only rendered HTTP crawl. No Google submissions or authenticated requests.
import { mkdir, writeFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
const base=process.env.SEO_AUDIT_URL||'http://127.0.0.1:3130',name=process.env.SEO_AUDIT_NAME||'local'
const canonical='https://www.playliva.com',out='social/output/seo-v2'
await mkdir(out,{recursive:true})
const xml=await(await fetch(base+'/sitemap.xml')).text()
const sitemap=new JSDOM(xml,{contentType:'text/xml'})
const urls=[...sitemap.window.document.querySelectorAll('url > loc')].map(n=>n.textContent)
sitemap.window.close()
const rows=[],failures=[];let cursor=0
await Promise.all(Array.from({length:4},async()=>{while(cursor<urls.length){const url=urls[cursor++],path=new URL(url).pathname
 try{const response=await fetch(base+path,{redirect:'manual',signal:AbortSignal.timeout(60000)}),html=await response.text(),dom=new JSDOM(html),doc=dom.window.document
 const meta=name=>doc.querySelector(`meta[name="${name}"],meta[property="${name}"]`)?.getAttribute('content')||''
 const links=[...new Set([...doc.querySelectorAll('a[href]')].map(a=>{try{const u=new URL(a.getAttribute('href'),canonical+path);return u.origin===canonical&&!u.search?u.pathname:null}catch{return null}}).filter(Boolean))]
 const row={path,status:response.status,canonical:doc.querySelector('link[rel="canonical"]')?.href,robots:meta('robots'),title:doc.title,description:meta('description'),h1:[...doc.querySelectorAll('h1')].map(n=>n.textContent.trim()),alternates:[...doc.querySelectorAll('link[hreflang]')].map(n=>({lang:n.hreflang,url:n.href})),og:meta('og:image'),schemas:[...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap(n=>{try{return [JSON.parse(n.textContent)['@type']]}catch{return ['invalid']}}),links,bytes:Buffer.byteLength(html)}
 rows.push(row);dom.window.close();if(row.status!==200||row.canonical!==url||/noindex/.test(row.robots)||row.h1.length!==1)failures.push({path,status:row.status,canonical:row.canonical,robots:row.robots,h1:row.h1.length})
 }catch(e){failures.push({path,error:e.message})}
}}))
rows.sort((a,b)=>a.path.localeCompare(b.path))
for(const row of rows){row.inbound=rows.filter(other=>other.path!==row.path&&other.links.includes(row.path)).map(other=>other.path);row.outbound=row.links.filter(path=>rows.some(other=>other.path===path)&&path!==row.path)}
const duplicates=[];for(const locale of ['pt-br','en','es-mx'])for(const field of ['title','description','h1']){const groups=new Map();for(const row of rows.filter(r=>r.path.startsWith('/'+locale+'/'))){const value=field==='h1'?row.h1.join(' '):row[field];if(value)groups.set(value,[...(groups.get(value)||[]),row.path])}for(const [value,paths]of groups)if(paths.length>1)duplicates.push({locale,field,value,paths})}
const report={observedAt:new Date().toISOString(),base,sitemapCount:urls.length,rows,failures,duplicates,orphans:rows.filter(r=>!r.inbound.length).map(r=>r.path),weak:rows.filter(r=>r.inbound.length===1).map(r=>r.path)}
await writeFile(`${out}/${name}-audit.json`,JSON.stringify(report,null,2))
console.log(JSON.stringify({base,sitemap:urls.length,crawled:rows.length,failures:failures.length,duplicates:duplicates.length,orphans:report.orphans,weak:report.weak}))
if(failures.length)process.exitCode=1
