import {chromium} from 'playwright-core'
import {mkdir,writeFile} from 'node:fs/promises'
import assert from 'node:assert/strict'
const dir='social/output/three-game/browser';await mkdir(dir,{recursive:true})
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']})
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1})
const errors=[];page.on('pageerror',error=>errors.push(error.message))
page.on('console',message=>{if(message.type()==='error')errors.push(message.text())})
const base=process.env.THREE_GAME_QA_URL??'http://127.0.0.1:3120'
const games=process.argv.slice(2).length?process.argv.slice(2):['samba-drop','skuptu-levanta','carnaval-gold']
for(const slug of games){
 await page.goto(`${base}/pt-br/play/${slug}`,{waitUntil:'networkidle'});await page.waitForTimeout(slug==='skuptu-levanta'?4500:1000)
 const reject=page.getByRole('button',{name:'Recusar opcionais'});if(await reject.isVisible())await reject.click()
 await page.locator('[data-game-viewport]').screenshot({path:`${dir}/${slug}-viewport.png`})
 await page.screenshot({path:`${dir}/${slug}-1440.png`,fullPage:true})
 console.log(slug,await page.locator('[data-three-game]').innerText())
 console.log('overflow',await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))
 for(const width of [430,390,320]){await page.setViewportSize({width,height:950});await page.waitForTimeout(400);await page.locator('[data-game-unit]').screenshot({path:`${dir}/${slug}-${width}-unit.png`});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${slug} overflow at ${width}`);console.log('responsive QA',slug,width,'PASS')}
 await page.setViewportSize({width:1440,height:1000})
}
await page.goto(`${base}/pt-br/games`,{waitUntil:'networkidle'})
for(const [query,slug] of [['Skuptu Levanta','skuptu-levanta'],['Liva Samba Drop','samba-drop'],['Liva Carnaval Gold','carnaval-gold']]){
 await page.getByRole('searchbox').fill(query)
 const card=page.locator(`[data-original-search="${slug}"]`)
 await card.waitFor({state:'visible'})
 assert.equal(await card.getAttribute('href'),`/pt-br/play/${slug}`)
 assert.equal(await page.locator('[data-original-search]').count(),1)
 console.log('catalog search',query,'PASS')
}
await writeFile(`${dir}/errors.json`,JSON.stringify(errors,null,2));console.log({errors});await browser.close()
assert.deepEqual(errors,[])
