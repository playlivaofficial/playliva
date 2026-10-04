// Reproducible, original PlayLiva artwork. No stock images, licensed vehicles or fonts.
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const source = `${root}assets-source/rio-drift`, output = `${root}public/originals/rio-drift`
await mkdir(source, { recursive: true }); await mkdir(output, { recursive: true })
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
<defs>
 <linearGradient id="sky" x2="0" y2="1"><stop stop-color="#091728"/><stop offset=".52" stop-color="#71415c"/><stop offset="1" stop-color="#fbaf74"/></linearGradient>
 <linearGradient id="sea" x2="0" y2="1"><stop stop-color="#54ada8"/><stop offset="1" stop-color="#092e44"/></linearGradient>
 <linearGradient id="road" x1="0" x2="1" y2="1"><stop stop-color="#263847"/><stop offset="1" stop-color="#0b1321"/></linearGradient>
 <linearGradient id="paint"><stop stop-color="#023957"/><stop offset=".2" stop-color="#069aba"/><stop offset=".45" stop-color="#83fff3"/><stop offset=".58" stop-color="#1491e9"/><stop offset=".8" stop-color="#074b9c"/><stop offset="1" stop-color="#011e3c"/></linearGradient>
 <linearGradient id="glass" x2="1" y2="1"><stop stop-color="#b6ffe8"/><stop offset=".28" stop-color="#44818f"/><stop offset="1" stop-color="#092033"/></linearGradient>
 <linearGradient id="shade"><stop stop-color="#041521" stop-opacity=".93"/><stop offset=".55" stop-color="#041521" stop-opacity=".2"/><stop offset="1" stop-color="#041521" stop-opacity="0"/></linearGradient>
 <radialGradient id="sun"><stop stop-color="#ffeec3" stop-opacity=".45"/><stop offset="1" stop-color="#ffce9600"/></radialGradient>
 <filter id="glow"><feGaussianBlur stdDeviation="8"/></filter>
</defs>
<path fill="url(#sky)" d="M0 0h1200v675H0z"/><circle cx="970" cy="190" r="170" fill="url(#sun)"/><circle cx="970" cy="190" r="47" fill="#ffe0a3"/>
<path fill="#213b50" d="M0 310L130 261 210 287 291 175Q324 116 352 194L396 279 440 240 538 301 644 234 709 283 787 237 890 307 1200 261v160H0z"/>
<path fill="url(#sea)" d="M0 323Q600 295 1200 345v330H0z"/>
${Array.from({length:14},(_,i)=>`<path d="M${560+i*26} ${362+i*9}h${65+i*6}" stroke="#ffcd9b" stroke-opacity="${.23-i*.01}" stroke-width="2"/>`).join('')}
<path fill="#405663" d="M576 332C724 322 813 348 947 441L1200 675H379C735 441 902 396 576 332z"/>
<path fill="url(#road)" d="M593 339C731 331 815 359 927 450L1161 675H455C790 447 881 405 593 339z"/>
<path d="M590 338C740 329 820 359 943 445L1190 675M580 345C851 405 780 449 420 675" fill="none" stroke="#ffe4a4" stroke-width="4"/>
<path d="M605 341C830 362 915 419 877 450L761 516 674 563 578 621" fill="none" stroke="#dae2db" stroke-opacity=".45" stroke-width="5" stroke-dasharray="24 26"/>
${Array.from({length:18},(_,i)=>{const x=10+i*36,h=30+(i*19)%67;return `<path d="M${x} 329v-${h}h28v${h}" fill="#142d40"/><path d="M${x+5} ${315-h}v6m10-6v6m-10 8v6m10-6v6" stroke="#ffd493" stroke-opacity=".65" stroke-width="3"/>`}).join('')}
<g fill="none" stroke="#42ead1"><path d="M781 569Q968 559 994 461" stroke-width="5" filter="url(#glow)"/><path d="M722 616Q945 602 1006 486" stroke-width="2" opacity=".6"/></g>
<g transform="translate(956 513) rotate(9) skewX(-8) scale(1.45 .99)">
 <ellipse cx="10" cy="22" rx="100" ry="132" fill="#011221" opacity=".7"/>
 <path d="M-67-82h16v62h-16zm118 0h16v62H51zM-68 41h17v58h-17zm119 0h17v58H51z" fill="#071019" stroke="#586775" stroke-width="2"/>
 <path d="M-45-122Q0-143 45-122Q71-102 63-33L57 44Q76 103 55 125Q0 138-55 125Q-76 103-57 44L-63-33Q-71-102-45-122z" fill="url(#paint)" stroke="#77fbe5" stroke-width="2"/>
 <path d="M-40-39Q0-66 40-39L34 61Q0 85-34 61z" fill="#092c3f"/>
 <path d="M-38-38Q0-60 38-38L29-2H-29z" fill="url(#glass)" stroke="#94c9cb"/>
 <path d="M-29 7h58l1 36h-60z" fill="#1aa1bb"/><path d="M-32 55h64l1 11q-33 18-66 0z" fill="url(#glass)"/>
 <path d="M-30-109l-18 9m78-9 18 9" stroke="#effffb" stroke-width="7" stroke-linecap="round"/>
 <path d="M-28-91l-5 36M28-91l5 36" stroke="#b4ffee" stroke-width="2" opacity=".7"/>
 <path d="M-57 11v37M57 11v37" stroke="#ffdb72" stroke-width="4"/>
 <path d="M-51 113l20 4m62 0 20-4" stroke="#fc7082" stroke-width="5"/>
 <path d="M-61 93h122v11H-61z" fill="#062136" stroke="#58f5e6"/>
 <text y="33" text-anchor="middle" fill="#dffff2" font-family="sans-serif" font-weight="700" font-size="13">PL</text>
</g>
<path fill="url(#shade)" d="M0 0h1200v675H0z"/>
<g font-family="sans-serif" fill="#eefffc"><text x="70" y="104" font-weight="700" letter-spacing="4" font-size="23">PLAYLIVA ORIGINAL</text><text x="64" y="275" font-weight="900" letter-spacing="-4" font-size="102">LIVA TURBO</text><text x="64" y="408" fill="#64f5d7" font-weight="900" letter-spacing="-4" font-size="126">CRASH</text><path d="M70 450h220" stroke="#ffd778" stroke-width="4"/><text x="70" y="494" letter-spacing="3" font-size="19">PLAYLIVA ORIGINAL · 25×</text><text x="70" y="598" font-size="25" font-weight="700">PlayLiva</text></g>
</svg>`
await writeFile(`${source}/poster.svg`,svg)
await sharp(Buffer.from(svg)).webp({quality:88,effort:6}).toFile(`${output}/poster.webp`)
await sharp(Buffer.from(svg)).resize(1200,630,{fit:'cover',position:'centre'}).webp({quality:88,effort:6}).toFile(`${output}/share.webp`)
console.log('Liva Turbo Crash original poster 1200×675 and share 1200×630 rendered.')
