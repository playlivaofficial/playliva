import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'
const source = 'assets-source/originals/carnaval-gold', out = 'public/originals/carnaval-gold'
await mkdir(source,{recursive:true});await mkdir(out,{recursive:true})
// Approved source images are preserved in the repository for reproducible exports.
if (!process.argv.includes('--posters-only')) await sharp(`${source}/stage.png`).resize(1200).webp({quality:86}).toFile(`${out}/stage.webp`)
// Mechanical sprite extraction and runtime compression; generated source atlas is preserved.
const symbols=['crown','mask','note','drums','fan','jewel','macaw','tambourine','heart','diamond','club','spade']
for(const [i,name] of (process.argv.includes('--posters-only') ? [] : symbols).entries()){
 const row=Math.floor(i/4),left=i%4*320,top=[35,410,790][row],height=[375,380,375][row]
 const atlas = await sharp(`${source}/symbols.png`).resize(1280,1280).toBuffer()
 await sharp(atlas).extract({left,top,width:320,height}).resize(256,256,{fit:'contain',background:{r:9,g:13,b:36,alpha:0}}).webp({quality:90}).toFile(`${out}/${name}.webp`)
}
const title=Buffer.from('<svg width="1200" height="630"><text x="600" y="282" text-anchor="middle" font-family="Georgia" font-weight="bold" font-size="48" fill="#b6eedf">LIVA</text><text x="600" y="372" text-anchor="middle" font-family="Georgia" font-weight="bold" font-size="90" fill="#ffe3a1">FIESTA GOLD</text></svg>')
await sharp(`${source}/stage.png`).resize(1200,630).composite([{input:title}]).webp({quality:90}).toFile(`${out}/poster.webp`)
await mkdir('public/originals/samba-drop',{recursive:true})
const pegs=Array.from({length:12},(_,r)=>Array.from({length:r+1},(_,k)=>`<circle cx="${600+(k-r/2)*40}" cy="${115+r*28}" r="5" fill="#a2f4d4"/>`).join('')).join('')
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><radialGradient id="g"><stop stop-color="#116568"/><stop offset="1" stop-color="#07172c"/></radialGradient></defs><rect width="1200" height="630" fill="url(#g)"/><path d="M600 60L905 490H295Z" fill="#073743" stroke="#48b5a2" stroke-width="3"/>${pegs}<circle cx="680" cy="308" r="16" fill="#ffdf6a" stroke="#fffad7" stroke-width="4"/><text x="600" y="553" text-anchor="middle" font-family="Arial" font-weight="900" font-size="64" fill="#ffeab2">LIVA RITMO DROP</text><text x="600" y="592" text-anchor="middle" font-family="Arial" font-size="16" letter-spacing="7" fill="#8edcc9">PLAYLIVA ORIGINAL</text></svg>`
await writeFile('public/originals/samba-drop/poster.svg',svg)
await sharp(Buffer.from(svg)).webp({quality:90}).toFile('public/originals/samba-drop/poster.webp')
console.log('Fiesta and Ritmo artwork ready')
