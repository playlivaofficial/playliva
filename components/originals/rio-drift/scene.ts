import { trackAt, trafficAt, type DriftRun } from '@/lib/originals/rio-drift/engine'

type Point = { x: number; y: number; half: number }
const rgba = (r: number, g: number, b: number, a = 1) => `rgba(${r},${g},${b},${a})`
function polygon(c: CanvasRenderingContext2D, points: number[][], fill: string | CanvasGradient) {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = fill; c.fill()
}
/** Code-owned compact GT coupe. Body, glazing, split lamps and spoiler are original geometry. */
export function drawCoupe(c: CanvasRenderingContext2D, x: number, y: number, width: number, angle: number, paint = '#087fda', hero = true) {
  c.save(); c.translate(x, y); c.rotate(angle); c.scale(width / 72, width / 72)
  c.fillStyle = '#03111dc9'; c.beginPath(); c.ellipse(4, 6, 39, 72, 0, 0, Math.PI * 2); c.fill()
  for (const side of [-1, 1]) for (const axle of [-30, 34]) {
    c.fillStyle = '#090f1b'; c.beginPath(); c.roundRect(side * 31 - 5, axle - 12, 10, 25, 4); c.fill()
    c.fillStyle = '#6a7a88'; c.fillRect(side * 34 - 1, axle - 8, 2, 16)
  }
  const body = c.createLinearGradient(-33, 0, 33, 0)
  body.addColorStop(0, '#083d79'); body.addColorStop(.22, paint); body.addColorStop(.5, hero ? '#78eeef' : '#fbe391'); body.addColorStop(.65, paint); body.addColorStop(1, '#022c56')
  c.beginPath(); c.moveTo(-24, -59); c.quadraticCurveTo(0, -68, 24, -59); c.quadraticCurveTo(34, -48, 33, -13)
  c.lineTo(29, 18); c.quadraticCurveTo(38, 44, 29, 61); c.quadraticCurveTo(0, 68, -29, 61); c.quadraticCurveTo(-38, 44, -29, 18); c.lineTo(-33, -13); c.quadraticCurveTo(-34, -48, -24, -59)
  c.fillStyle = body; c.fill(); c.strokeStyle = '#9cfcffb8'; c.lineWidth = 1; c.stroke()
  c.fillStyle = '#063247'; c.beginPath(); c.moveTo(-22, -20); c.quadraticCurveTo(0, -32, 22, -20); c.lineTo(18, 29); c.quadraticCurveTo(0, 38, -18, 29); c.closePath(); c.fill()
  const glass = c.createLinearGradient(-24, -20, 20, 30); glass.addColorStop(0, '#93cecd'); glass.addColorStop(.24, '#224b5c'); glass.addColorStop(1, '#071825')
  polygon(c, [[-20, -20], [20, -20], [16, -1], [-16, -1]], glass)
  polygon(c, [[-16, 21], [16, 21], [17, 31], [-17, 31]], '#122c3f')
  polygon(c, [[-14, 1], [14, 1], [15, 19], [-15, 19]], hero ? '#18bad0' : paint)
  c.strokeStyle = '#befff5'; c.lineWidth = .8; c.beginPath(); c.moveTo(-14, -52); c.lineTo(-18, -33); c.moveTo(14, -52); c.lineTo(18, -33); c.stroke()
  for (const side of [-1, 1]) {
    c.strokeStyle = '#f4fdff'; c.lineWidth = 3; c.beginPath(); c.moveTo(side * 15, -54); c.lineTo(side * 26, -50); c.stroke()
    c.strokeStyle = '#ff6576'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(side * 12, 57); c.lineTo(side * 27, 54); c.stroke()
    c.fillStyle = '#ffd56f'; c.fillRect(side * 29 - 1, 1, 2, 17)
  }
  c.fillStyle = '#051b2c'; c.beginPath(); c.roundRect(-32, 44, 64, 6, 2); c.fill(); c.fillStyle = '#53e6df'; c.fillRect(-26, 44, 52, 1)
  if (hero) { c.fillStyle = '#e0fff9'; c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.fillText('PL', 0, 13) }
  c.restore()
}

/** A bounded, asset-free pseudo-3D coast renderer; physics never depends on pixels or frame rate. */
export function renderDrift(c: CanvasRenderingContext2D, w: number, h: number, s: DriftRun, reduced: boolean) {
  const night = Math.min(1, s.distance / 2600), road = trackAt(s.distance), tunnel = road.district === 'tunnel'
  const sky = c.createLinearGradient(0, 0, 0, h * .43)
  sky.addColorStop(0, rgba(30 - night * 18, 40 - night * 24, 84 - night * 46)); sky.addColorStop(.62, rgba(162 - night * 130, 91 - night * 65, 111 - night * 58)); sky.addColorStop(1, rgba(255 - night * 195, 178 - night * 126, 130 - night * 52))
  c.fillStyle = sky; c.fillRect(0, 0, w, h)
  const sun = c.createRadialGradient(w * .73, h * .21, 0, w * .73, h * .21, w * .16)
  sun.addColorStop(0, '#ffe4aaa8'); sun.addColorStop(1, '#ffc68300'); c.fillStyle = sun; c.fillRect(w * .55, h * .06, w * .36, h * .32)
  c.fillStyle = rgba(255, 218, 162, .7 * (1 - night)); c.beginPath(); c.arc(w * .73, h * .21, w * .052, 0, Math.PI * 2); c.fill()
  c.fillStyle = '#384057'; c.beginPath(); c.moveTo(0, h*.36)
  c.bezierCurveTo(w*.1,h*.08,w*.14,h*.22,w*.23,h*.32); c.bezierCurveTo(w*.36,h*.23,w*.43,h*.2,w*.6,h*.34)
  c.bezierCurveTo(w*.74,h*.19,w*.79,h*.25,w,h*.3); c.lineTo(w,h*.4); c.lineTo(0,h*.4); c.fill()
  c.fillStyle = '#183d4d'; c.beginPath(); c.moveTo(w*.59,h*.36); c.bezierCurveTo(w*.72,h*.31,w*.74,h*.15,w*.8,h*.145)
  c.bezierCurveTo(w*.87,h*.14,w*.85,h*.31,w*.97,h*.34); c.lineTo(w,h*.4); c.lineTo(w*.59,h*.4); c.fill()
  const sea = c.createLinearGradient(0, h * .32, 0, h); sea.addColorStop(0, '#286d80'); sea.addColorStop(.55, night > .5 ? '#143648' : '#187988'); sea.addColorStop(1, '#072634')
  c.fillStyle = sea; c.fillRect(0, h * .34, w, h * .66)
  for (let i = 0; i < 18; i++) {
    const yy = h * (.36 + i * .028), xx = ((i * 97 + (reduced ? 0 : s.distance * .15)) % (w * .44)) - w * .1
    c.strokeStyle = rgba(177, 240, 240, .13 - i * .004); c.lineWidth = 1; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx + 15 + i * 3, yy); c.stroke()
  }
  const project = (q: number): Point => {
    const ahead = (1 - q) * 320, bend = trackAt(s.distance + ahead).curve
    return { x: w * .5 + bend * w * .35 * Math.sin((1 - q) * Math.PI), y: h * (.33 + .74 * q * q), half: w * (.015 + .49 * q * q) * road.halfWidth }
  }
  for (let i = 0; i < 64; i++) {
    const q = i / 64, a = project(q), b = project((i + 1) / 64), band = Math.floor((s.distance + (1 - q) * 320) / 12) % 2
    b.y += 1 // Overlap subpixel joins; avoid a distracting horizontal seam on each road quad.
    polygon(c, [[a.x - a.half * 1.32, a.y], [a.x + a.half * 1.65, a.y], [b.x + b.half * 1.65, b.y], [b.x - b.half * 1.32, b.y]], band ? '#234552' : '#254854')
    polygon(c, [[a.x - a.half * 1.08, a.y], [a.x + a.half * 1.08, a.y], [b.x + b.half * 1.08, b.y], [b.x - b.half * 1.08, b.y]], band ? '#dfc8ac' : '#4b8997')
    polygon(c, [[a.x - a.half, a.y], [a.x + a.half, a.y], [b.x + b.half, b.y], [b.x - b.half, b.y]], band ? '#283442' : '#2b3846')
    for (const side of [-1, 1]) {
      polygon(c, [[a.x + side * a.half * .94, a.y], [a.x + side * a.half * .955, a.y], [b.x + side * b.half * .955, b.y], [b.x + side * b.half * .94, b.y]], night > .5 ? '#38cdd1' : '#c7dedb')
      if (band) polygon(c, [[a.x + side * a.half * .325, a.y], [a.x + side * a.half * .337, a.y], [b.x + side * b.half * .337, b.y], [b.x + side * b.half * .325, b.y]], '#a7b6b788')
    }
  }
  // Original city blocks, lamp rhythm and palms move only along predictable perspective paths.
  for (let i = 10; i >= 0; i--) {
    const z = ((i * 38 + 380 - s.distance % 38) % 380), q = Math.max(.05, 1 - z / 380), p = project(q), size = 8 + q * q * 80
    const x = p.x + p.half * 1.38, y = p.y
    c.fillStyle = i % 2 ? '#234154' : '#243b52'; c.fillRect(x, y - size * 1.65, size * .75, size * 1.65)
    polygon(c, [[x, y - size * 1.65], [x + size * .22, y - size * 1.83], [x + size * .96, y - size * 1.83], [x + size * .75, y - size * 1.65]], '#4c6470')
    for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) { c.fillStyle = (row + col + i) % 3 ? '#edd59599' : '#48cad966'; c.fillRect(x + size * (.1 + col * .21), y - size * (1.4 - row * .3), size * .08, size * .12) }
    const palm = p.x - p.half * 1.2
    c.strokeStyle = '#244b4f'; c.lineWidth = 2 + q * 3; c.beginPath(); c.moveTo(palm, y); c.quadraticCurveTo(palm - size * .12, y - size * .5, palm, y - size); c.stroke()
    for (let leaf = 0; leaf < 5; leaf++) { c.strokeStyle = '#367765'; c.lineWidth = 1 + q * 4; c.beginPath(); c.moveTo(palm, y - size); c.quadraticCurveTo(palm + Math.cos(leaf * 1.4) * size * .4, y - size * 1.4, palm + Math.cos(leaf * 1.4) * size * .64, y - size * .83); c.stroke() }
  }
  if (tunnel) {
    const shade = c.createLinearGradient(0, 0, 0, h); shade.addColorStop(0, '#060f20e6'); shade.addColorStop(.5, '#07132975'); shade.addColorStop(1, '#09152800'); c.fillStyle = shade; c.fillRect(0, 0, w, h)
    c.strokeStyle = '#204154'; c.lineWidth = w * .075; c.beginPath(); c.moveTo(-w * .1, h); c.quadraticCurveTo(w * .1, -h * .35, w * .5, h * .2); c.quadraticCurveTo(w * .9, -h * .35, w * 1.1, h); c.stroke()
    c.strokeStyle = '#4be3e3'; c.lineWidth = 2; c.beginPath(); c.moveTo(w * .05, h); c.quadraticCurveTo(w * .16, h * .28, w * .5, h * .27); c.quadraticCurveTo(w * .84, h * .28, w * .95, h); c.stroke()
  }
  for (let index = s.obstacle + 1; index >= s.obstacle; index--) {
    const o = trafficAt(index), z = o.distance - s.distance
    if (z < -10 || z > 290) continue
    const q = Math.max(.12, .77 - z / 340), p = project(q), x = p.x + p.half * o.x
    if (o.kind === 'cones') {
      polygon(c, [[x, p.y - q * 32], [x - q * 16, p.y], [x + q * 16, p.y]], '#f89e52'); c.fillStyle = '#f5e6c7'; c.fillRect(x - q * 7, p.y - q * 15, q * 14, q * 4)
    } else drawCoupe(c, x, p.y, Math.max(10, w * .115 * q / .77), 0, o.kind === 'taxi' ? '#daba45' : '#92a2aa', false)
  }
  const p = project(.77), carWidth = Math.min(108, w * .145), x = p.x + p.half * s.x, y = p.y
  if (s.drifting && !reduced) {
    for (const side of [-1, 1]) {
      c.strokeStyle = '#121b2699'; c.lineWidth = Math.max(2, carWidth * .045); c.beginPath(); c.moveTo(x + side * carWidth * .43, y + carWidth * .45); c.quadraticCurveTo(x + side * carWidth * .43 - s.lateral * carWidth * .8, y + carWidth, x - s.lateral * carWidth * 2 + side * carWidth * .43, h * 1.1); c.stroke()
      for (let i = 0; i < 4; i++) { c.fillStyle = rgba(164, 219, 220, .14 - i * .025); c.beginPath(); c.ellipse(x + side * carWidth * .4 - s.lateral * i * 13, y + carWidth * (.75 + i * .35), carWidth * (.16 + i * .09), carWidth * .24, 0, 0, Math.PI * 2); c.fill() }
    }
  }
  if (night > .4) {
    const glow = c.createRadialGradient(x, y + 20, 0, x, y + 20, carWidth); glow.addColorStop(0, '#10dbe645'); glow.addColorStop(1, '#10dbe600'); c.fillStyle = glow; c.fillRect(x - carWidth, y - carWidth / 2, carWidth * 2, carWidth * 2)
  }
  drawCoupe(c, x, y, carWidth, s.angle + (s.phase === 'impact' && !reduced ? Math.min(.32, s.impactTime) : 0))
  if (s.phase === 'impact') {
    c.fillStyle = rgba(255, 173, 101, Math.max(0, .2 - s.impactTime * .4)); c.fillRect(0, 0, w, h)
    if (!reduced) for (let i = 0; i < 8; i++) { c.fillStyle = '#ffd991'; c.fillRect(x + Math.sin(i * 3) * s.impactTime * 110, y + Math.cos(i * 3) * s.impactTime * 90, 2, 5) }
  }
  const vignette = c.createRadialGradient(w / 2, h * .55, w * .16, w / 2, h * .55, w * .75); vignette.addColorStop(0, '#05152200'); vignette.addColorStop(1, '#05152255'); c.fillStyle = vignette; c.fillRect(0, 0, w, h)
}
