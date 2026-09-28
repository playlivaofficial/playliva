import test from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
import {installGenerationStage} from '../scripts/owner/generation-stage.mjs'
import {advanceScene,isMovingGameplayFrame} from '../scripts/owner/capture-actions.mjs'

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

test('intentional static end card is excluded from gameplay motion QC without excusing frozen visible gameplay', () => {
  const inspect=(frozen)=>{
    let moving=0,repeated=0
    for(let frame=0;frame<600;frame++){
      const elapsed=frame/30,phase=elapsed<8?'preparing':'flying'
      const same=elapsed>=18.2||frozen
      if(isMovingGameplayFrame(phase,elapsed,20)){moving++;if(same)repeated++}
    }
    return{moving,repeated,passes:moving>=30&&repeated/moving<=.1}
  }
  assert.ok(inspect(false).passes,'long flights remain valid when the final branded card covers them')
  assert.equal(inspect(false).repeated,0)
  assert.equal(inspect(true).passes,false,'frozen gameplay still fails the original strict threshold')
  assert.equal(isMovingGameplayFrame('ready',2,20),false)
  assert.equal(isMovingGameplayFrame('juggling',17,20),true)
  assert.equal(isMovingGameplayFrame('lifting',19,20),false)
})

test('Skuptu social framing omits the guaranteed-return banner without changing the underlying game or other status messages', async () => {
  const dom=new JSDOM('<html><head></head><body><div data-game-unit><div role="status" id="outside">Outside viewport</div><div data-game-viewport><canvas></canvas><div role="status" id="cash">RETORNO GARANTIDO</div></div><div data-game-controls><div role="status" id="controls">Controls</div></div></div></body></html>')
  const previous=globalThis.document;globalThis.document=dom.window.document
  try{
    await installGenerationStage({evaluate:async(fn,arg)=>fn(arg)},{gameSlug:'skuptu-levanta',creative:{hook:'Uma rodada de verdade',gameTitle:'Skuptu Levanta'}})
    assert.equal(dom.window.getComputedStyle(document.getElementById('cash')).display,'none')
    assert.notEqual(dom.window.getComputedStyle(document.getElementById('outside')).display,'none')
    assert.notEqual(dom.window.getComputedStyle(document.getElementById('controls')).display,'none')
    assert.ok(document.querySelector('canvas'))
    assert.match(document.querySelector('#owner-social-stage > footer').textContent,/sem valor monetário/)
  }finally{globalThis.document=previous;dom.window.close()}
})

test('Skuptu motion QC observes the continuing lift after cashout instead of the disabled wager control', () => {
  const dom=new JSDOM('<div id="owner-social-stage" data-game="skuptu-levanta"><div data-game-viewport><div data-failed="false"><span>FORÇA TOTAL</span><strong>1.10×</strong></div></div><div data-game-controls><button disabled>RETORNO GARANTIDO · 1.10</button></div></div>')
  const previousDocument=globalThis.document,previousWindow=globalThis.window
  globalThis.document=dom.window.document;globalThis.window=dom.window;document.getAnimations=()=>[];window.ownerAnimations=new Map()
  try{
    const observe=()=>advanceScene({elapsed:5,variant:0,seconds:20,act:false}).phase
    assert.equal(observe(),'lifting')
    assert.equal(isMovingGameplayFrame(observe(),5,20),true)
    document.querySelector('[data-failed]').dataset.failed='true';assert.equal(observe(),'failed')
    document.querySelector('[data-failed]').dataset.failed='false';document.querySelector('span').textContent='PREPARE A PEGADA';assert.equal(observe(),'preparing')
    document.querySelector('button').disabled=false;document.querySelector('span').textContent='O PALCO É SEU';assert.equal(observe(),'ready')
  }finally{globalThis.document=previousDocument;globalThis.window=previousWindow;dom.window.close()}
})
