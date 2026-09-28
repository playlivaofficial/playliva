import test from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
import {installGenerationStage} from '../scripts/owner/generation-stage.mjs'

test('capture frame does not reposition nested game cabinet headers or footers', async () => {
  const dom=new JSDOM('<html><head><style>.cabinet-header,.cabinet-footer{position:relative;top:0px}</style></head><body><div data-game-unit><div data-game-viewport><header class="cabinet-header">Golaço</header><div>Reels</div><footer class="cabinet-footer">Result</footer></div></div></body></html>')
  const previous=globalThis.document;globalThis.document=dom.window.document
  try {
    await installGenerationStage({evaluate:async(fn,args)=>fn(args)},{gameSlug:'golaco',creative:{hook:'Uma rodada de verdade.',gameTitle:'Liva Golaço'}})
    const style=el=>dom.window.getComputedStyle(el)
    assert.equal(style(document.querySelector('#owner-social-stage > header')).position,'absolute')
    assert.equal(style(document.querySelector('.cabinet-header')).position,'relative')
    assert.equal(style(document.querySelector('.cabinet-header')).top,'0px')
    assert.equal(style(document.querySelector('.cabinet-footer')).position,'relative')
    assert.equal(document.querySelectorAll('[data-game-unit]').length,1)
  }finally{globalThis.document=previous;dom.window.close()}
})
