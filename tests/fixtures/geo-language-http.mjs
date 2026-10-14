import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { JSDOM } from 'jsdom'
import { geoLanguageRegistry } from './geo-language.mjs'
import { ownerGeoHttpFixture } from './owner-geo-http.mjs'

/** A second loopback-only server tests approved synthetic inventory. No partner
 * destination is followed, and no production credential or override is used. */
export async function verifyGeoLanguageHttp() {
  const listener=createServer().listen(0,'127.0.0.1');await once(listener,'listening')
  const port=listener.address().port;await new Promise(resolve=>listener.close(resolve))
  const base='http://127.0.0.1:'+port, owner=await ownerGeoHttpFixture()
  const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],
    {stdio:['ignore','pipe','pipe'],windowsHide:true,env:{...process.env,...owner.env,PLAYLIVA_COMMERCIAL_REGISTRY:JSON.stringify(geoLanguageRegistry())}})
  let output='';server.stdout.on('data',chunk=>output+=chunk);server.stderr.on('data',chunk=>output+=chunk)
  let cases=0
  try {
    let ready=false
    for(let i=0;i<80;i++){try{if((await fetch(base+'/robots.txt')).ok){ready=true;break}}catch{};if(server.exitCode!==null)throw new Error(output);await new Promise(r=>setTimeout(r,250))}
    assert.ok(ready,'approved GEO fixture server starts')
    for(const geo of ['MX','CO','PE']){
      const headers={'x-vercel-ip-country':geo,cookie:'playliva.country=MX;previewGeo=MX'}
      const root=await fetch(base+'/?utm_source=qa',{headers:{...headers,'accept-language':'en-US'},redirect:'manual'})
      assert.equal(root.status,302);assert.equal(new URL(root.headers.get('location'),base).pathname,'/es-'+geo.toLowerCase())
      assert.equal(new URL(root.headers.get('location'),base).search,'?utm_source=qa')
      for(const segment of ['es-'+geo.toLowerCase(),'en','pt-br'])for(const path of ['/offers','/games/aviator','/play/crash']){
        const response=await fetch(base+'/'+segment+path,{headers}),doc=new JSDOM(await response.text()).window.document
        assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/private.*no-store/)
        assert.equal(doc.querySelector('[aria-label="Owner GEO preview"]'),null)
        assert.equal(doc.querySelector('button[aria-label="Seleccionar país"],button[aria-label="Select country"],button[aria-label="Selecionar país"]'),null)
        const anchors=[...doc.querySelectorAll('a[href^="/go?"]')]
        assert.ok(anchors.length>0,`${geo} ${segment} ${path}: approved links`)
        for(const a of anchors){const u=new URL(a.href,base);assert.equal(u.searchParams.get('country'),geo);assert.equal(u.searchParams.get('language'),segment==='en'?'en':segment==='pt-br'?'pt-BR':'es-'+geo)}
        if(path==='/offers'){
          assert.match(doc.querySelector('[data-detected-market]').textContent,new RegExp(geo==='MX'?'M[eé]xico':geo==='CO'?'Col[oô]mbia':'Per[uú]'))
          if(segment==='en'||segment==='pt-br')assert.match(doc.querySelector('meta[name=robots]').content,/noindex/)
        }
        doc.defaultView.close();cases++
      }
      for(const language of ['en','pt-br']){
        const r=await fetch(base+'/',{headers:{...headers,cookie:'playliva_locale='+language},redirect:'manual'})
        assert.equal(new URL(r.headers.get('location'),base).pathname,'/'+language)
      }
    }
    for(const geo of ['BR','GE','US','']){
      for(const segment of ['es-mx','en','pt-br']){
        const response=await fetch(base+'/'+segment+'/offers',{headers:{'x-vercel-ip-country':geo,cookie:'playliva.country=CO;previewGeo=CO;playliva_locale=es-co'}})
        const doc=new JSDOM(await response.text()).window.document
        assert.equal(doc.querySelector('a[href^="/go?"]'),null);assert.equal(doc.querySelector('[aria-label="Owner GEO preview"]'),null)
        doc.defaultView.close();cases++
      }
    }
    await owner.verify(base,true)
    console.log(`Approved GEO/language HTTP matrix passed: ${cases} pages, three languages, private Owner isolation and retired/unknown GEO suppression.`)
  } finally {
    if(server.exitCode===null){const exited=once(server,'exit');server.kill();await exited}
  }
}
