import test from 'node:test'
import assert from 'node:assert/strict'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { JSDOM, VirtualConsole } from 'jsdom'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import country from '../components/country-context.tsx'
import selector from '../components/language-selector.tsx'
import affiliate from '../components/affiliate-button.tsx'
import commercial from '../lib/commercial/server.ts'
import locale from '../lib/locale.ts'
import { GEO_PARTNERS, geoLanguageRegistry } from './fixtures/geo-language.mjs'

const h=React.createElement
function Probe() {
  const context=country.useCountry()
  return h('output', {'data-geo':context.marketCode,'data-language':context.locale,'data-currency':context.currency,'data-partners':context.commercial.operators.map(o=>o.name).join('|')})
}

for (const geo of ['MX','CO','PE',null,'BR']) test(`language UI preserves trusted ${geo??'unknown'} GEO despite stale market storage`, async()=>{
  const start=geo&&geo!=='BR'?'es-'+geo.toLowerCase():'es-mx'
  const dom=new JSDOM('<div id="root"></div>',{url:`https://www.playliva.com/${start}/games/aviator?utm_source=qa&utm_campaign=fixture#overview`,virtualConsole:new VirtualConsole()})
  const saved=new Map()
  for(const key of ['window','self','document','location','navigator','Event','MouseEvent','HTMLElement','Node','IS_REACT_ACT_ENVIRONMENT']){
    saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key))
    Object.defineProperty(globalThis,key,{configurable:true,writable:true,value:key==='IS_REACT_ACT_ENVIRONMENT'?true:dom.window[key]})
  }
  const root=createRoot(document.getElementById('root')), snapshot=commercial.snapshotFromRegistry(geo,geoLanguageRegistry())
  const eligible=['MX','CO','PE'].includes(geo), pushes=[]
  const render=()=>act(()=>root.render(h(AppRouterContext.Provider,{value:{push(path){pushes.push(path);window.history.pushState({},'',path)},prefetch(){}}},
    h(PathnameContext.Provider,{value:window.location.pathname},h(country.CountryProvider,{initialLocale:locale.segmentToLocale(start),initialCountryCode:'MX',visitorCountryCode:geo,commercial:snapshot},
      h(selector.LanguageSelector),h(Probe),snapshot.operators.map(o=>h(affiliate.AffiliateButton,{key:o.id,operatorSlug:o.slug,category:'crash',pageType:'game',gameSlug:'aviator'},o.name)))))))
  const click=node=>act(()=>node.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})))
  try {
    window.localStorage.setItem('playliva.country','PE')
    await render()
    for(const [label,expected] of [['English','en'],['Português','pt-br'],['Español',start]]){
      await click(document.querySelector('button[aria-haspopup=menu]'))
      const options=[...document.querySelectorAll('[role=menuitem]')]
      assert.deepEqual(options.map(n=>n.textContent),['Español','English','Português'])
      assert.doesNotMatch(document.querySelector('[role=menu]').textContent,/México|Colombia|Perú|🇲🇽|🇨🇴|🇵🇪|🇧🇷/)
      await click(options.find(n=>n.textContent===label)); await render()
      const probe=document.querySelector('output')
      assert.equal(probe.dataset.geo,eligible?geo:undefined)
      assert.equal(probe.dataset.currency,eligible?{MX:'MXN',CO:'COP',PE:'PEN'}[geo]:undefined)
      assert.equal(probe.dataset.partners,eligible?GEO_PARTNERS[geo].join('|'):'')
      assert.equal(window.location.pathname,`/${expected}/games/aviator`)
      assert.equal(window.location.search,'?utm_source=qa&utm_campaign=fixture')
      assert.equal(window.location.hash,'#overview')
      assert.match(document.cookie,new RegExp('playliva_locale='+expected))
      for(const a of document.querySelectorAll('a[href^="/go?"]')){
        const url=new URL(a.href)
        assert.equal(url.searchParams.get('country'),geo)
        assert.equal(url.searchParams.get('language'),locale.segmentToLocale(expected))
      }
      assert.equal(document.querySelectorAll('a[href^="/go?"]').length,eligible?2:0)
      assert.equal(window.localStorage.getItem('playliva.country'),'PE','obsolete storage is ignored, never overwritten')
      // Ordinary navigation also retains the same detected GEO.
      window.history.pushState({},'',`/${expected}/offers`);await render()
      assert.equal(document.querySelector('output').dataset.geo,eligible?geo:undefined)
      window.history.pushState({},'',`/${expected}/games/aviator?utm_source=qa&utm_campaign=fixture#overview`);await render()
    }
    assert.equal(pushes.length,3)
  } finally {
    await act(()=>root.unmount());dom.window.close()
    for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]}
  }
})

test('language routing preserves Spanish SEO editions and uses published EN/PT destinations for guides',()=>{
  assert.equal(locale.languageLocaleSegment('es-MX','CO','en'),'es-co')
  assert.equal(locale.languageLocaleSegment('es-PE','MX','pt-br'),'es-mx')
  assert.equal(locale.languageLocaleSegment('es-MX',null,'es-pe'),'es-pe')
  for(const target of ['en','pt-br']){
    assert.equal(locale.languageSwitchPath('/es-co/guides/aviator-demo',target),`/${target}/games/aviator`)
    assert.equal(locale.languageSwitchPath('/es-pe/guides/bonos-casino',target),`/${target}/offers`)
  }
  assert.equal(locale.languageSwitchPath('/es-mx/guides/aviator-demo','es-co'),'/es-co/guides/aviator-demo')
  assert.equal(locale.languageSwitchPath('/es-co/games/aviator','pt-br'),'/pt-br/games/aviator')
})
