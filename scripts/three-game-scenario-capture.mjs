import {chromium} from 'playwright-core'
import {mkdir,writeFile} from 'node:fs/promises'
const dir='social/output/three-game/scenarios';await mkdir(dir,{recursive:true})
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message))
await page.goto('http://127.0.0.1:3121');await page.waitForFunction(()=>Boolean(window.qa))
const snap=async name=>{await page.waitForTimeout(100);await page.locator('[data-game-viewport]').screenshot({path:`${dir}/${name}.png`})}
const advance=ms=>page.evaluate(ms=>window.qa.advance(ms),ms)
await page.evaluate(()=>window.qa.open('samba-drop','high'));await page.waitForTimeout(300);await snap('samba-idle');await page.evaluate(()=>window.qa.start('samba-drop'));await advance(450);await snap('samba-early');await advance(1100);await snap('samba-middle');await advance(1000);await snap('samba-final');await advance(90);await snap('samba-high-land')
await page.evaluate(()=>window.qa.open('skuptu-levanta'));await page.waitForTimeout(1800);await snap('skuptu-ready');await page.evaluate(()=>window.qa.start('skuptu-levanta'));await advance(1750);await snap('skuptu-early');await advance(5000);await snap('skuptu-strain');await page.evaluate(()=>window.qa.cashout());await snap('skuptu-cashout');await advance(13953);await snap('skuptu-failure');await advance(150);await snap('skuptu-drop');await advance(450);await snap('skuptu-impact')
const sync=await page.locator('[data-hud-crash-frame]').evaluate(e=>({...e.dataset}));console.log('sync',sync)
await page.evaluate(()=>window.qa.open('carnaval-gold','bonus'));await page.waitForTimeout(500);await snap('carnaval-idle');await page.evaluate(()=>window.qa.start('carnaval-gold'));await advance(300);await snap('carnaval-spin');await advance(1150);await snap('carnaval-anticipation');await advance(2400);await snap('carnaval-bonus');await advance(2500);await snap('carnaval-free');await advance(2500);await snap('carnaval-meter-5');
for(let i=0;i<60;i++){const s=await advance(5000);if(s.phase==='bonus-summary')break}await snap('carnaval-summary')
await writeFile(`${dir}/report.json`,JSON.stringify({sync,errors},null,2));console.log({errors});await browser.close()
