// Original vector artwork for Liva Golaço, rasterised to small alpha WebP.
// Offline/dev only: node scripts/golaco-assets.mjs
// Every shape below is drawn here from scratch: no club, federation, league,
// manufacturer or tournament mark, no third-party asset. The SVG source of
// each image is this file; outputs land in public/originals/golaco/.
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const OUT = new URL('../public/originals/golaco/', import.meta.url)
const INK = '#0d2a1d'
const svg = (body, size = 256) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
<defs>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".35" stop-color="#ffd23f"/><stop offset=".7" stop-color="#e8a312"/><stop offset="1" stop-color="#a86a07"/></linearGradient>
  <linearGradient id="goldV" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b5"/><stop offset=".45" stop-color="#ffcf3a"/><stop offset="1" stop-color="#b8780a"/></linearGradient>
  <linearGradient id="green" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4fe08f"/><stop offset="1" stop-color="#0c7a3e"/></linearGradient>
  <linearGradient id="blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6aa2ff"/><stop offset="1" stop-color="#1b3fb3"/></linearGradient>
  <linearGradient id="yellow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff07a"/><stop offset="1" stop-color="#f3b914"/></linearGradient>
  <linearGradient id="red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a6b"/><stop offset="1" stop-color="#c3261c"/></linearGradient>
  <linearGradient id="silver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#c9d6df"/><stop offset=".75" stop-color="#8ea2b0"/><stop offset="1" stop-color="#5d7282"/></linearGradient>
  <linearGradient id="orange" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb04a"/><stop offset="1" stop-color="#e2560f"/></linearGradient>
  <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff7c7" stop-opacity=".95"/><stop offset=".55" stop-color="#ffd23f" stop-opacity=".35"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#04140c" flood-opacity=".45"/></filter>
</defs>
<g filter="url(#shadow)">${body}</g></svg>`
const shine = (d, opacity = .55) => `<path d="${d}" fill="#ffffff" opacity="${opacity}"/>`

// Pentagon-panel football, reused by the golden ball.
function ballArt(cx, cy, r, fill, panel, stroke) {
  const pent = (x, y, s, rot = 0) => {
    const pts = Array.from({ length: 5 }, (_, i) => { const a = rot + (i * 2 * Math.PI) / 5 - Math.PI / 2; return `${(x + s * Math.cos(a)).toFixed(1)},${(y + s * Math.sin(a)).toFixed(1)}` })
    return `<polygon points="${pts.join(' ')}" fill="${panel}"/>`
  }
  const ring = Array.from({ length: 5 }, (_, i) => { const a = (i * 2 * Math.PI) / 5 - Math.PI / 2; return pent(cx + r * .74 * Math.cos(a), cy + r * .74 * Math.sin(a), r * .22, a) }).join('')
  const seams = Array.from({ length: 5 }, (_, i) => { const a = (i * 2 * Math.PI) / 5 - Math.PI / 2; return `<line x1="${cx + r * .24 * Math.cos(a)}" y1="${cy + r * .24 * Math.sin(a)}" x2="${cx + r * .56 * Math.cos(a)}" y2="${cy + r * .56 * Math.sin(a)}" stroke="${panel}" stroke-width="${r * .05}" stroke-linecap="round"/>` }).join('')
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="6"/>
  <clipPath id="ball${cx}${cy}"><circle cx="${cx}" cy="${cy}" r="${r - 3}"/></clipPath>
  <g clip-path="url(#ball${cx}${cy})">${pent(cx, cy, r * .26)}${ring}${seams}</g>
  ${shine(`M${cx - r * .62},${cy - r * .2} a${r * .7},${r * .7} 0 0 1 ${r * .6},${-r * .55} a${r * .5},${r * .4} 0 0 0 ${-r * .6},${r * .55}z`, .6)}`
}

const ART = {
  // Golden boot: generic stylised boot, no manufacturer marks.
  chuteira: svg(`
    <path d="M40 150 C40 118 58 104 86 100 L126 94 C132 70 146 58 168 58 L190 58 C204 58 212 70 212 86 L214 150 C216 170 204 182 184 184 L64 186 C48 186 40 172 40 150Z" fill="url(#gold)" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M150 62 L190 62 C200 62 206 70 206 80 L206 96 L150 96Z" fill="url(#green)" stroke="${INK}" stroke-width="5"/>
    <path d="M92 104 C104 100 130 94 150 92 L154 118 C132 122 108 126 96 130Z" fill="#0f8a43" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    ${[0, 1, 2, 3].map(i => `<path d="M${103 + i * 12} ${105 - i * 3} L${105 + i * 12} ${123 - i * 3}" stroke="#fff9dc" stroke-width="5" stroke-linecap="round"/>`).join('')}
    <path d="M44 168 L212 162" stroke="${INK}" stroke-width="6"/>
    ${[66, 100, 134, 168, 198].map(x => `<path d="M${x - 9} 186 L${x - 5} 204 L${x + 5} 204 L${x + 9} 186Z" fill="#244b36" stroke="${INK}" stroke-width="4"/>`).join('')}
    ${shine('M58 128 C70 112 92 108 118 104 C96 116 76 124 58 142Z', .5)}
    ${shine('M168 70 C180 66 194 68 198 76 C188 74 178 76 168 80Z', .6)}`),
  // Goalkeeper gloves: a pair, green backs, yellow cuffs, white palms.
  luvas: svg(`
    <g transform="rotate(-14 110 140)">
      <path d="M62 196 L60 120 C60 108 70 100 82 102 L82 70 C82 60 96 58 100 68 L102 100 L104 58 C104 46 120 46 122 58 L122 100 L126 64 C128 54 142 54 142 66 L140 104 L144 84 C146 74 160 76 158 88 L152 150 C150 170 144 184 136 196Z" fill="url(#green)" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <rect x="56" y="190" width="86" height="30" rx="8" fill="url(#yellow)" stroke="${INK}" stroke-width="6"/>
      ${shine('M72 118 C76 110 84 110 88 116 L88 160 C82 150 76 138 72 118Z', .35)}
    </g>
    <g transform="rotate(12 160 140)">
      <path d="M118 198 L118 122 C118 110 128 102 140 104 L142 72 C142 62 156 60 160 70 L162 102 L164 60 C164 48 180 48 182 60 L182 102 L186 66 C188 56 202 56 202 68 L200 106 L204 86 C206 76 220 78 218 90 L212 152 C210 172 204 186 196 198Z" fill="#f6fbf7" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M130 150 C150 142 176 142 204 150" stroke="#b9d9c5" stroke-width="6" fill="none" stroke-linecap="round"/>
      <rect x="114" y="192" width="88" height="30" rx="8" fill="url(#yellow)" stroke="${INK}" stroke-width="6"/>
      <path d="M126 207 L190 207" stroke="#0f8a43" stroke-width="6"/>
    </g>`),
  // Referee whistle with a yellow/green cord.
  apito: svg(`
    <path d="M150 70 C170 30 216 28 226 60" fill="none" stroke="url(#yellow)" stroke-width="12" stroke-linecap="round"/>
    <path d="M150 70 C170 30 216 28 226 60" fill="none" stroke="#0f8a43" stroke-width="4" stroke-dasharray="10 12" stroke-linecap="round"/>
    <path d="M40 128 C40 96 66 76 102 76 L200 76 C212 76 220 86 220 98 L220 110 C220 122 212 128 200 128 L166 128 C170 138 172 146 172 156 C172 196 140 214 106 214 C66 214 40 184 40 150Z" fill="url(#silver)" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <rect x="196" y="84" width="28" height="36" rx="6" fill="#3b4f5c" stroke="${INK}" stroke-width="5"/>
    <circle cx="106" cy="148" r="30" fill="#2b3a44" stroke="${INK}" stroke-width="5"/>
    <circle cx="106" cy="148" r="15" fill="url(#yellow)"/>
    ${shine('M58 116 C66 96 86 86 110 86 L150 86 C126 94 90 100 66 126Z', .75)}`),
  // Gold medal with a national-palette ribbon (no crest).
  medalha: svg(`
    <path d="M86 20 L126 110 L100 120 L60 30Z" fill="url(#green)" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M170 20 L130 110 L156 120 L196 30Z" fill="url(#blue)" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M112 40 L144 40 L136 106 L120 106Z" fill="url(#yellow)" stroke="${INK}" stroke-width="5"/>
    <circle cx="128" cy="164" r="68" fill="url(#gold)" stroke="${INK}" stroke-width="7"/>
    <circle cx="128" cy="164" r="50" fill="none" stroke="#b77d0b" stroke-width="5"/>
    <path d="M128 128 L138 152 L164 154 L144 170 L151 196 L128 182 L105 196 L112 170 L92 154 L118 152Z" fill="#fff4b8" stroke="#a86a07" stroke-width="4" stroke-linejoin="round"/>
    ${shine('M78 150 C80 122 100 104 124 100 C104 112 90 128 86 158Z', .55)}`),
  // Corner flag on a tuft of turf.
  bandeira: svg(`
    <ellipse cx="112" cy="222" rx="72" ry="16" fill="#1d8f4c" stroke="${INK}" stroke-width="5"/>
    <path d="M72 222 l6 -14 l6 14 M100 224 l6 -16 l6 16 M130 224 l6 -14 l6 14" fill="#3ec476"/>
    <rect x="96" y="30" width="12" height="194" rx="5" fill="url(#silver)" stroke="${INK}" stroke-width="5"/>
    <path d="M108 34 C140 26 168 44 206 34 L206 104 C168 114 140 96 108 104Z" fill="url(#yellow)" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <path d="M108 34 C124 30 138 32 152 38 L152 102 C138 96 124 98 108 104Z" fill="url(#red)"/>
    <path d="M108 34 C140 26 168 44 206 34 L206 104 C168 114 140 96 108 104Z" fill="none" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="102" cy="28" r="10" fill="url(#gold)" stroke="${INK}" stroke-width="4"/>`),
  // Yellow and red referee cards, fanned.
  cartoes: svg(`
    <rect x="52" y="56" width="98" height="140" rx="12" fill="url(#yellow)" stroke="${INK}" stroke-width="7" transform="rotate(-16 100 126)"/>
    <rect x="108" y="52" width="98" height="140" rx="12" fill="url(#red)" stroke="${INK}" stroke-width="7" transform="rotate(12 156 122)"/>
    ${shine('M122 70 L170 78 L162 100 L118 92Z', .35)}
    ${shine('M70 76 L112 64 L116 84 L76 96Z', .45)}`),
  // Stadium floodlight bank.
  refletor: svg(`
    <circle cx="128" cy="92" r="96" fill="url(#glow)"/>
    <rect x="120" y="136" width="16" height="96" fill="url(#silver)" stroke="${INK}" stroke-width="5"/>
    <path d="M92 232 L164 232" stroke="${INK}" stroke-width="8" stroke-linecap="round"/>
    <rect x="44" y="40" width="168" height="104" rx="12" fill="#2d3f4b" stroke="${INK}" stroke-width="7"/>
    ${[0, 1, 2].flatMap(r => [0, 1, 2, 3].map(c => `<circle cx="${74 + c * 36}" cy="${66 + r * 30}" r="12" fill="#fffbe0" stroke="#ffd23f" stroke-width="4"/>`)).join('')}`),
  // Orange training cone.
  cone: svg(`
    <ellipse cx="128" cy="214" rx="90" ry="20" fill="#e2560f" stroke="${INK}" stroke-width="6"/>
    <path d="M110 34 L146 34 L196 206 L60 206Z" fill="url(#orange)" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M100 86 L156 86 L166 120 L90 120Z" fill="#fff8ec"/>
    <path d="M82 150 L174 150 L184 184 L72 184Z" fill="#fff8ec"/>
    <path d="M110 34 L146 34 L196 206 L60 206Z" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    ${shine('M114 44 L126 44 L100 196 L84 196Z', .35)}`),
  // WILD: plain yellow No. 10 shirt, green trim, no badge or maker mark.
  camisa: svg(`
    <circle cx="128" cy="132" r="118" fill="url(#glow)"/>
    <path d="M86 34 L104 40 C112 52 144 52 152 40 L170 34 L224 64 L204 112 L182 102 L182 222 L74 222 L74 102 L52 112 L32 64Z" fill="url(#yellow)" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M104 40 C112 52 144 52 152 40 L140 70 C134 76 122 76 116 70Z" fill="#0f8a43" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M32 64 L52 112 L62 108 L42 60Z M224 64 L204 112 L194 108 L214 60Z" fill="#0f8a43"/>
    <text x="128" y="182" text-anchor="middle" font-family="DejaVu Sans, Liberation Sans, Arial, sans-serif" font-weight="900" font-size="96" fill="#0f8a43" stroke="#fff6c8" stroke-width="5" paint-order="stroke">10</text>
    ${shine('M86 48 L100 52 C92 90 88 150 86 210 L78 210 C80 150 82 90 86 48Z', .35)}`),
  // SCATTER: golden trophy (generic cup) on a green plinth.
  taca: svg(`
    <circle cx="128" cy="118" r="120" fill="url(#glow)"/>
    <path d="M70 52 C30 52 30 118 88 124" fill="none" stroke="url(#gold)" stroke-width="16"/>
    <path d="M70 52 C30 52 30 118 88 124" fill="none" stroke="${INK}" stroke-width="4"/>
    <path d="M186 52 C226 52 226 118 168 124" fill="none" stroke="url(#gold)" stroke-width="16"/>
    <path d="M186 52 C226 52 226 118 168 124" fill="none" stroke="${INK}" stroke-width="4"/>
    <path d="M66 34 L190 34 C190 104 164 138 128 142 C92 138 66 104 66 34Z" fill="url(#gold)" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
    <path d="M116 142 L140 142 L146 176 L110 176Z" fill="url(#goldV)" stroke="${INK}" stroke-width="6"/>
    <rect x="80" y="174" width="96" height="22" rx="6" fill="url(#gold)" stroke="${INK}" stroke-width="6"/>
    <rect x="66" y="194" width="124" height="38" rx="8" fill="url(#green)" stroke="${INK}" stroke-width="7"/>
    <path d="M128 60 L136 78 L156 80 L141 93 L146 113 L128 102 L110 113 L115 93 L100 80 L120 78Z" fill="#fff4b8" stroke="#a86a07" stroke-width="3"/>
    ${shine('M80 44 L98 44 C98 80 104 104 118 124 C96 114 84 88 80 44Z', .6)}`),
  // GOL: golden ball bursting into the net (free spins only).
  gol: svg(`
    <circle cx="128" cy="128" r="124" fill="url(#glow)"/>
    <g stroke="#f4f8f2" stroke-width="3" opacity=".75">${Array.from({ length: 9 }, (_, i) => `<line x1="${28 + i * 25}" y1="18" x2="${28 + i * 25}" y2="238"/><line x1="18" y1="${28 + i * 25}" x2="238" y2="${28 + i * 25}"/>`).join('')}</g>
    ${ballArt(128, 128, 78, 'url(#gold)', '#a86a07', INK)}
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => { const a = i * Math.PI / 4; return `<path d="M${128 + 96 * Math.cos(a)} ${128 + 96 * Math.sin(a)} l${10 * Math.cos(a)} ${10 * Math.sin(a)}" stroke="#fff4b8" stroke-width="8" stroke-linecap="round"/>` }).join('')}`),
}

function stadium(width, height, { poster = false } = {}) {
  const crowd = []
  let seed = 11
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 }
  const colours = ['#ffd21f', '#11924a', '#1f48c9', '#ffffff', '#f28c38', '#ffd21f', '#11924a']
  for (let row = 0; row < 26; row++) {
    const y = height * .34 + row * height * .012
    for (let i = 0; i < 90; i++) {
      const x = (i + (row % 2) * .5) / 90 * width
      crowd.push(`<circle cx="${x.toFixed(1)}" cy="${(y + rand() * 3).toFixed(1)}" r="${(height * .0055).toFixed(1)}" fill="${colours[Math.floor(rand() * colours.length)]}" opacity="${(.55 + rand() * .4).toFixed(2)}"/>`)
    }
  }
  const confetti = Array.from({ length: poster ? 90 : 60 }, () => `<rect x="${(rand() * width).toFixed(0)}" y="${(rand() * height * .8).toFixed(0)}" width="${(6 + rand() * 8).toFixed(0)}" height="${(3 + rand() * 4).toFixed(0)}" fill="${colours[Math.floor(rand() * colours.length)]}" transform="rotate(${(rand() * 180).toFixed(0)} ${(rand() * width).toFixed(0)} ${(rand() * height).toFixed(0)})" opacity=".85"/>`).join('')
  const tower = (x, flip) => `<g transform="translate(${x} 0)${flip ? ' scale(-1 1)' : ''}">
    <rect x="-6" y="${height * .08}" width="12" height="${height * .36}" fill="#3a4a56"/>
    <rect x="-46" y="${height * .04}" width="92" height="${height * .09}" rx="6" fill="#2d3f4b"/>
    ${[0, 1, 2, 3].flatMap(c => [0, 1].map(r => `<circle cx="${-33 + c * 22}" cy="${height * .065 + r * height * .035}" r="8" fill="#fffbe0"/>`)).join('')}
    <circle cx="0" cy="${height * .085}" r="${height * .22}" fill="url(#flood)"/></g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a6b"/><stop offset=".38" stop-color="#6c3f8f"/><stop offset=".62" stop-color="#f08a4b"/><stop offset=".8" stop-color="#ffd27a"/></linearGradient>
    <linearGradient id="pitch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f9e55"/><stop offset="1" stop-color="#0b5f30"/></linearGradient>
    <radialGradient id="flood" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe0" stop-opacity=".7"/><stop offset="1" stop-color="#fffbe0" stop-opacity="0"/></radialGradient>
    <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff4c4"/><stop offset=".3" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#sky)"/>
  <circle cx="${width * .5}" cy="${height * .36}" r="${height * .3}" fill="url(#sun)"/>
  <path d="M0 ${height * .34} Q ${width / 2} ${height * .26} ${width} ${height * .34} L${width} ${height * .66} L0 ${height * .66}Z" fill="#26324a"/>
  ${crowd.join('')}
  <rect x="0" y="${height * .64}" width="${width}" height="${height * .04}" fill="#0f8a43"/>
  <rect x="0" y="${height * .645}" width="${width}" height="${height * .012}" fill="#ffd21f" opacity=".9"/>
  <rect x="0" y="${height * .68}" width="${width}" height="${height * .32}" fill="url(#pitch)"/>
  ${Array.from({ length: 8 }, (_, i) => `<rect x="${i * width / 8}" y="${height * .68}" width="${width / 16}" height="${height * .32}" fill="#ffffff" opacity=".05"/>`).join('')}
  <path d="M${width * .5} ${height * .68} L${width * .5} ${height}" stroke="#ffffff" stroke-opacity=".6" stroke-width="4"/>
  <ellipse cx="${width * .5}" cy="${height * .9}" rx="${width * .16}" ry="${height * .09}" fill="none" stroke="#ffffff" stroke-opacity=".6" stroke-width="4"/>
  ${tower(width * .08, false)}${tower(width * .92, true)}
  ${confetti}
  </svg>`
}

await mkdir(OUT, { recursive: true })
const sizes = {}
for (const [name, source] of Object.entries(ART)) {
  const png = await sharp(Buffer.from(source), { density: 144 }).resize(192, 192).webp({ quality: 88, alphaQuality: 90 }).toBuffer()
  await writeFile(new URL(`${name}.webp`, OUT), png); sizes[name] = png.length
}
const backdrop = await sharp(Buffer.from(stadium(1280, 720))).webp({ quality: 78 }).toBuffer()
await writeFile(new URL('stadium.webp', OUT), backdrop); sizes.stadium = backdrop.length

// Poster/OG 1200×675: stadium, trophy, golden ball, boot, gloves and the wordmark.
const place = async (name, size, left, top, rotate = 0) => ({ input: await sharp(Buffer.from(ART[name]), { density: 200 }).resize(size, size).rotate(rotate, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(), left, top })
const wordmark = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675">
  <text x="600" y="118" text-anchor="middle" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-weight="700" font-size="30" letter-spacing="8" fill="#fff4c4">PLAYLIVA ORIGINALS</text>
  <text x="600" y="262" text-anchor="middle" font-family="DejaVu Sans, Liberation Sans, sans-serif" font-weight="900" font-size="132" fill="#ffd21f" stroke="#0b3d22" stroke-width="12" paint-order="stroke">GOLAÇO</text>
</svg>`
const poster = await sharp(Buffer.from(stadium(1200, 675, { poster: true })))
  .composite([
    await place('taca', 300, 450, 300), await place('gol', 190, 780, 400), await place('chuteira', 200, 190, 420, -12),
    await place('luvas', 170, 70, 300, -8), await place('camisa', 190, 930, 250, 8), await place('medalha', 140, 330, 300, -6),
    { input: Buffer.from(wordmark), left: 0, top: 0 },
  ]).webp({ quality: 82 }).toBuffer()
await writeFile(new URL('poster.webp', OUT), poster); sizes.poster = poster.length
console.log(JSON.stringify(sizes))
