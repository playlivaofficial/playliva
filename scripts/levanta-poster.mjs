// Capture the real accepted scene for discovery/social art; never a gameplay backdrop.
import {chromium} from 'playwright-core'
import {mkdir} from 'node:fs/promises'
import sharp from 'sharp'
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}})
 await page.goto('http://127.0.0.1:3120/pt-br/play/skuptu-levanta');await page.waitForSelector('[data-pose]')
 await page.addStyleTag({content:'[data-game-viewport]{position:fixed!important;inset:0!important;width:1200px!important;height:630px!important;z-index:999999!important;border-radius:0!important} [data-game-viewport]>div{height:630px!important;min-height:630px!important;aspect-ratio:auto!important;border-radius:0!important} [data-game-viewport] [class*="gymHud"]{display:none!important} [data-game-viewport] canvas{border-radius:0!important}'})
 await page.waitForTimeout(400)
 await mkdir('assets-source/originals/levanta',{recursive:true})
 await page.locator('[data-game-viewport]').screenshot({path:'assets-source/originals/levanta/poster-scene.png'})
 const title=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="shade" x2="0" y2="1"><stop stop-color="#071c32" stop-opacity="0"/><stop offset="1" stop-color="#071c32" stop-opacity=".96"/></linearGradient></defs><rect y="438" width="1200" height="192" fill="url(#shade)"/><text x="600" y="545" text-anchor="middle" font-family="Arial" font-weight="900" font-size="66" fill="#ffe99a">SKUPTU LEVANTA</text><text x="600" y="586" text-anchor="middle" font-family="Arial" font-weight="700" font-size="21" letter-spacing="6" fill="#a5f0d4">PLAYLIVA ORIGINAL</text></svg>')
 await sharp('assets-source/originals/levanta/poster-scene.png').resize(1200,630).composite([{input:title}]).webp({quality:90}).toFile('public/originals/levanta/poster.webp')
 console.log('Skuptu: real-scene 1200×630 poster created')
} finally {await browser.close()}
