import * as THREE from 'three'

/**
 * Fictional sunny community court for Liva Embaixadinha. Everything is built
 * from primitives and small runtime canvases: no downloaded textures, no real
 * place, landmark, club, sponsor or copyrighted mural. The mood is community,
 * football, sun and colour — clean painted surfaces, never grime.
 * Player stands at the origin facing +Z (toward the camera).
 */
export interface Court { group: THREE.Group; dispose(): void; update(seconds: number): void }

type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number) => void
function canvasTexture(width: number, height: number, paint: Painter, repeat?: [number, number]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  paint(canvas.getContext('2d')!, width, height)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  if (repeat) { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(...repeat) }
  return texture
}
/** Deterministic pseudo-random so the court is identical on every load. */
function seeded(seed: number) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x1_0000_0000 } }

function paintCourt(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const rand = seeded(7)
  ctx.fillStyle = '#23a15c'; ctx.fillRect(0, 0, w, h)
  // Broad painted bands in the national palette, gently sun-faded.
  ctx.fillStyle = '#2e67c9'; ctx.fillRect(0, h * .72, w, h * .28)
  ctx.fillStyle = '#f4cf2e'; ctx.beginPath(); ctx.ellipse(w * .5, h * .56, w * .23, h * .3, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#23a15c'; ctx.beginPath(); ctx.ellipse(w * .5, h * .56, w * .2, h * .26, 0, 0, Math.PI * 2); ctx.fill()
  // Soft wear/sun patches keep it lived-in but clean.
  for (let i = 0; i < 260; i++) {
    const x = rand() * w, y = rand() * h, r = 6 + rand() * 40
    ctx.fillStyle = `rgba(255,255,230,${.025 + rand() * .045})`
    ctx.beginPath(); ctx.ellipse(x, y, r, r * (.4 + rand() * .6), rand() * 3, 0, Math.PI * 2); ctx.fill()
  }
  ctx.strokeStyle = '#f6f7ef'; ctx.lineWidth = 7; ctx.lineCap = 'round'
  ctx.strokeRect(w * .04, h * .08, w * .92, h * .84)
  ctx.beginPath(); ctx.moveTo(w * .5, h * .08); ctx.lineTo(w * .5, h * .92); ctx.stroke()
  ctx.beginPath(); ctx.ellipse(w * .5, h * .56, w * .12, h * .16, 0, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(w * .96, h * .5, h * .24, Math.PI * .5, Math.PI * 1.5); ctx.stroke()
  ctx.beginPath(); ctx.arc(w * .04, h * .5, h * .24, -Math.PI * .5, Math.PI * .5); ctx.stroke()
  ctx.fillStyle = '#f6f7ef'; ctx.beginPath(); ctx.arc(w * .5, h * .56, 7, 0, Math.PI * 2); ctx.fill()
}

function paintMural(ctx: CanvasRenderingContext2D, w: number, h: number, variant: 0 | 1) {
  const base = variant ? '#f7d23a' : '#1d9a57'
  ctx.fillStyle = base; ctx.fillRect(0, 0, w, h)
  // Big tropical leaves and diagonal colour blocks.
  const rand = seeded(variant ? 31 : 13)
  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = ['#13874c', '#2b6fd6', '#f0b92a', '#34b56e'][i % 4] + (variant ? 'cc' : 'aa')
    ctx.save(); ctx.translate(rand() * w, h * (.4 + rand() * .7)); ctx.rotate(-1.2 + rand() * 2.4)
    ctx.beginPath(); ctx.ellipse(0, 0, h * .55, h * .13, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore()
  }
  ctx.fillStyle = variant ? '#1e56c2' : '#f6d03a'
  ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w * .28, h * .18); ctx.lineTo(w * .36, h * .18); ctx.lineTo(w * .1, h); ctx.fill()
  // Generic player silhouette mid-kick (no likeness).
  ctx.save(); ctx.translate(variant ? w * .78 : w * .22, h * .56); ctx.scale(h / 260, h / 260)
  ctx.fillStyle = variant ? '#1e56c2' : '#0f6f3b'
  ctx.beginPath(); ctx.arc(0, -86, 16, 0, Math.PI * 2); ctx.fill()
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = ctx.fillStyle
  ctx.lineWidth = 24; ctx.beginPath(); ctx.moveTo(0, -64); ctx.lineTo(-6, -8); ctx.stroke()
  ctx.lineWidth = 15
  ctx.beginPath(); ctx.moveTo(-3, -58); ctx.lineTo(-40, -36); ctx.lineTo(-56, -64); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(3, -58); ctx.lineTo(38, -70); ctx.lineTo(60, -52); ctx.stroke()
  ctx.lineWidth = 18
  ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(-28, 36); ctx.lineTo(-24, 84); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(34, 8); ctx.lineTo(72, -6); ctx.stroke()
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(98, -22, 15, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
  // Hand-painted lettering, original phrases.
  ctx.save(); ctx.translate(variant ? w * .34 : w * .62, h * .42); ctx.rotate(-.06)
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.font = `900 ${Math.round(h * .2)}px "Arial Black", "Helvetica Neue", Arial, sans-serif`
  ctx.lineWidth = h * .035; ctx.strokeStyle = variant ? '#fff6c4' : '#0c5c32'
  ctx.fillStyle = variant ? '#0f6f3b' : '#fff4b8'
  const lines = variant ? ['BOLA NO PÉ', 'SORRISO NO ROSTO'] : ['A QUADRA', 'É NOSSA']
  lines.forEach((line, i) => { ctx.strokeText(line, 0, (i - .5) * h * .24); ctx.fillText(line, 0, (i - .5) * h * .24) })
  ctx.restore()
  // Crown doodle and a thin border.
  ctx.strokeStyle = variant ? '#0f6f3b' : '#fff4b8'; ctx.lineWidth = h * .02
  ctx.beginPath(); const cx = variant ? w * .12 : w * .9, cy = h * .15, s = h * .07
  ctx.moveTo(cx - s, cy + s * .6); ctx.lineTo(cx - s, cy - s * .4); ctx.lineTo(cx - s * .4, cy); ctx.lineTo(cx, cy - s * .7); ctx.lineTo(cx + s * .4, cy); ctx.lineTo(cx + s, cy - s * .4); ctx.lineTo(cx + s, cy + s * .6); ctx.closePath(); ctx.stroke()
}

function paintFence(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(214,224,230,.9)'; ctx.lineWidth = 3
  const step = 32
  for (let x = -h; x < w + h; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(x + h, 0); ctx.lineTo(x, h); ctx.stroke()
  }
}

function paintWindows(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // White wall tile with two windows and a door stripe; tinted by instance colour.
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(0, h * .9, w, h * .1)
  const win = (x: number, y: number) => {
    ctx.fillStyle = '#3b5b73'; ctx.fillRect(x, y, w * .2, h * .26)
    ctx.fillStyle = '#e9f4fb'; ctx.fillRect(x + 3, y + 3, w * .2 - 6, h * .1)
    ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(x - 3, y + h * .26, w * .2 + 6, 5)
  }
  win(w * .16, h * .22); win(w * .62, h * .22)
  ctx.fillStyle = '#6b4a36'; ctx.fillRect(w * .42, h * .55, w * .16, h * .35)
}

function paintSky(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#2f8fe6'); g.addColorStop(.55, '#77c3f4'); g.addColorStop(1, '#d9f1ff')
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
  const sun = ctx.createRadialGradient(w * .18, h * .22, 4, w * .18, h * .22, h * .55)
  sun.addColorStop(0, 'rgba(255,248,214,.95)'); sun.addColorStop(.2, 'rgba(255,241,190,.45)'); sun.addColorStop(1, 'rgba(255,241,190,0)')
  ctx.fillStyle = sun; ctx.fillRect(0, 0, w, h)
  const rand = seeded(99)
  for (let i = 0; i < 7; i++) {
    const x = rand() * w, y = h * (.12 + rand() * .35), s = 30 + rand() * 50
    ctx.fillStyle = 'rgba(255,255,255,.85)'
    for (let j = 0; j < 5; j++) { ctx.beginPath(); ctx.ellipse(x + (j - 2) * s * .55, y + Math.abs(j - 2) * s * .12, s * (.55 - Math.abs(j - 2) * .1), s * .32, 0, 0, Math.PI * 2); ctx.fill() }
  }
}

export function buildCourt(options: { reducedMotion: boolean }): Court {
  const group = new THREE.Group()
  const owned: { dispose(): void }[] = []
  const own = <T extends { dispose(): void }>(value: T) => { owned.push(value); return value }
  const std = (color: string | THREE.Color, roughness = .82) => own(new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 }))
  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D = group) => {
    const mesh = new THREE.Mesh(geometry, material); parent.add(mesh); return mesh
  }

  // Sky dome (unlit, behind everything).
  const sky = add(own(new THREE.SphereGeometry(80, 24, 12)), own(new THREE.MeshBasicMaterial({
    map: own(canvasTexture(512, 256, paintSky)), side: THREE.BackSide, fog: false, depthWrite: false })))
  sky.rotation.y = Math.PI * .72
  sky.renderOrder = -1

  // Court floor.
  const floor = add(own(new THREE.PlaneGeometry(18, 15)), std('#ffffff', .9))
  ;(floor.material as THREE.MeshStandardMaterial).map = own(canvasTexture(1024, 740, paintCourt))
  floor.rotation.x = -Math.PI / 2
  floor.position.set(0, 0, -1.5)
  // Pavement apron beyond the court.
  const apron = add(own(new THREE.PlaneGeometry(60, 40)), std('#c9c1b0', .95))
  apron.rotation.x = -Math.PI / 2; apron.position.set(0, -.01, -10)

  // Painted back wall with two original murals and a fence above it.
  const wallZ = -8.4
  const muralA = own(canvasTexture(1024, 256, (c, w, h) => paintMural(c, w, h, 0)))
  const muralB = own(canvasTexture(1024, 256, (c, w, h) => paintMural(c, w, h, 1)))
  const wallGeometry = own(new THREE.BoxGeometry(9, 1.7, .25))
  const wallLeft = add(wallGeometry, std('#ffffff', .9)); (wallLeft.material as THREE.MeshStandardMaterial).map = muralA
  wallLeft.position.set(-4.5, .85, wallZ)
  const wallRight = add(wallGeometry, std('#ffffff', .9)); (wallRight.material as THREE.MeshStandardMaterial).map = muralB
  wallRight.position.set(4.5, .85, wallZ)
  const capMaterial = std('#f4f1e8', .8)
  const cap = add(own(new THREE.BoxGeometry(18.2, .12, .34)), capMaterial); cap.position.set(0, 1.76, wallZ)
  const fence = add(own(new THREE.PlaneGeometry(18.2, 2.2)), own(new THREE.MeshStandardMaterial({
    map: own(canvasTexture(256, 256, paintFence, [9, 1.1])), transparent: true, alphaTest: .35, side: THREE.DoubleSide, roughness: .5, metalness: .3 })))
  fence.position.set(0, 2.9, wallZ)
  const postGeometry = own(new THREE.CylinderGeometry(.04, .04, 2.3, 8)), postMaterial = std('#cfd8dc', .45)
  for (let x = -9; x <= 9; x += 3) { const post = add(postGeometry, postMaterial); post.position.set(x, 2.9, wallZ) }

  // Side stands: painted concrete steps (yellow / blue / green).
  const stepGeometry = own(new THREE.BoxGeometry(1, 1, 1))
  const stepColors = ['#f4cf2e', '#2e67c9', '#23a15c', '#f4cf2e', '#2e67c9']
  const stepMaterials = stepColors.map(color => std(color, .88))
  for (let i = 0; i < 5; i++) {
    const step = add(stepGeometry, stepMaterials[i])
    step.scale.set(2.4 - i * .1, .42 * (i + 1), .6)
    step.position.set(-7.4, .21 * (i + 1), -7.6 + i * .6)
    step.rotation.y = Math.PI / 2
  }

  // Small goal on the right: striped posts and a net.
  const goal = new THREE.Group(); group.add(goal)
  goal.position.set(6.2, 0, -4.2); goal.rotation.y = -Math.PI / 2 + .25
  const stripe = own(canvasTexture(16, 128, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#d93a32' : '#ffffff'; c.fillRect(0, i * h / 8, w, h / 8) } }))
  const postMat = own(new THREE.MeshStandardMaterial({ map: stripe, roughness: .5 }))
  const goalPost = own(new THREE.CylinderGeometry(.05, .05, 2, 10))
  for (const x of [-1.5, 1.5]) { const post = add(goalPost, postMat, goal); post.position.set(x, 1, 0) }
  const bar = add(own(new THREE.CylinderGeometry(.05, .05, 3.1, 10)), postMat, goal); bar.rotation.z = Math.PI / 2; bar.position.y = 2
  const netMaterial = own(new THREE.LineBasicMaterial({ color: '#f5f5f0', transparent: true, opacity: .75 }))
  const net: number[] = []
  for (let i = 0; i <= 12; i++) { const x = -1.5 + i * .25; net.push(x, 2, 0, x, 1.6, -1, x, 1.6, -1, x, 0, -1) }
  for (let j = 0; j <= 8; j++) { const y = j * .2; net.push(-1.5, y, -1, 1.5, y, -1) }
  for (let j = 0; j <= 4; j++) { const t = j / 4; net.push(-1.5, 2 - .4 * t, -t, 1.5, 2 - .4 * t, -t) }
  const netGeometry = own(new THREE.BufferGeometry()); netGeometry.setAttribute('position', new THREE.Float32BufferAttribute(net, 3))
  goal.add(new THREE.LineSegments(netGeometry, netMaterial))

  // Hillside community: terraced, brightly painted houses (instanced).
  const rand = seeded(2024)
  const facade = own(canvasTexture(128, 128, paintWindows))
  const houseMaterial = own(new THREE.MeshStandardMaterial({ map: facade, roughness: .9 }))
  const houseGeometry = own(new THREE.BoxGeometry(1, 1, 1))
  const houseCount = 118
  const houses = new THREE.InstancedMesh(houseGeometry, houseMaterial, houseCount)
  const palette = ['#f28c38', '#3f8fe0', '#f2c230', '#ef6f8e', '#2fbfae', '#f7f0e2', '#9d6fd6', '#f36b47', '#69c46a', '#57b6ec']
  const matrix = new THREE.Matrix4(), color = new THREE.Color(), q = new THREE.Quaternion()
  let placed = 0
  for (let row = 0; row < 6 && placed < houseCount; row++) {
    const z = -11 - row * 3.1, baseY = row * 1.75
    for (let x = -24 + rand() * 1.5; x < 24 && placed < houseCount; x += 2.2 + rand() * 1.6) {
      const width = 1.8 + rand() * 1.6, height = 1.6 + rand() * 2.2, depth = 2 + rand()
      matrix.compose(new THREE.Vector3(x, baseY + height / 2, z - rand() * .8), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (rand() - .5) * .18), new THREE.Vector3(width, height, depth))
      houses.setMatrixAt(placed, matrix)
      houses.setColorAt(placed, color.set(palette[Math.floor(rand() * palette.length)]))
      placed++
    }
  }
  houses.count = placed
  group.add(houses)
  // Terraced hillside the houses stand on, and a distant green ridge under the sky.
  const slopeAngle = Math.atan2(1.75, 3.1)
  const slope = add(own(new THREE.PlaneGeometry(70, 34)), std('#5f9a4a', .95))
  slope.rotation.x = -Math.PI / 2 + slopeAngle
  // House rows sit on the line y = (−11 − z) · tan(slope); the plane starts just in front of row 0.
  slope.position.set(0, (-11 + 9.5) * Math.tan(slopeAngle) - .05 + 17 * Math.sin(slopeAngle), -9.5 - 17 * Math.cos(slopeAngle))
  for (const [x, scale, color] of [[-26, [30, 11, 10], '#3f8a55'], [4, [34, 15, 10], '#4b9a5a'], [34, [26, 10, 10], '#3c8450']] as const) {
    const ridge = add(own(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2)), std(color, .95))
    ridge.scale.set(scale[0], scale[1], scale[2]); ridge.position.set(x, 10, -58)
  }
  const bushGeometry = own(new THREE.IcosahedronGeometry(1, 1))
  const bushMaterials = ['#2f9a4c', '#46b155', '#1f7f42'].map(c => std(c, .9))
  for (let i = 0; i < 46; i++) {
    const bush = add(bushGeometry, bushMaterials[i % 3])
    const row = Math.floor(rand() * 6)
    bush.position.set(-24 + rand() * 48, row * 1.75 + .4, -10.5 - row * 3.1 + rand())
    bush.scale.setScalar(.6 + rand() * 1.1)
  }
  // Blue water tanks on some roofs: a small, cheerful detail.
  const tankGeometry = own(new THREE.CylinderGeometry(.35, .35, .5, 12)), tankMaterial = std('#2a78d4', .5)
  for (let i = 0; i < placed; i += 5) {
    houses.getMatrixAt(i, matrix)
    const p = new THREE.Vector3(), s = new THREE.Vector3(); matrix.decompose(p, q, s)
    const tank = add(tankGeometry, tankMaterial); tank.position.set(p.x + s.x * .2, p.y + s.y / 2 + .25, p.z)
  }

  // Palms framing the court.
  const trunkCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(.15, 2, 0), new THREE.Vector3(.5, 4.2, 0)])
  const trunkGeometry = own(new THREE.TubeGeometry(trunkCurve, 8, .12, 8, false)), trunkMaterial = std('#a57a4b', .9)
  const frondGeometry = own(new THREE.BufferGeometry())
  const frond: number[] = [], frondIndex: number[] = []
  for (let i = 0; i <= 14; i++) {
    const u = i / 14, width = Math.sin(Math.PI * u) * .36, y = Math.sin(u * Math.PI) * .35 - u * u * 1.1
    frond.push(u * 2.6, y, -width, u * 2.6, y + .05, 0, u * 2.6, y, width)
    if (i < 14) for (let j = 0; j < 2; j++) { const k = i * 3 + j; frondIndex.push(k, k + 3, k + 1, k + 1, k + 3, k + 4) }
  }
  frondGeometry.setAttribute('position', new THREE.Float32BufferAttribute(frond, 3)); frondGeometry.setIndex(frondIndex); frondGeometry.computeVertexNormals()
  const frondMaterials = ['#3aa655', '#57bf4c'].map(c => { const m = std(c, .8); m.side = THREE.DoubleSide; return m })
  const palms: THREE.Group[] = []
  for (const [x, z, scale, turn] of [[-8.6, -7.2, 1.15, .2], [8.7, -7.6, 1.3, 2.4], [-11.5, -10, 1.4, 1.1], [11, -10.5, 1.2, 3.3], [3.4, -9.6, .95, 1.9]] as const) {
    const palm = new THREE.Group(); palm.position.set(x, 0, z); palm.scale.setScalar(scale); palm.rotation.y = turn; group.add(palm)
    add(trunkGeometry, trunkMaterial, palm)
    const crown = new THREE.Group(); crown.position.set(.5, 4.2, 0); palm.add(crown)
    for (let i = 0; i < 7; i++) { const leaf = add(frondGeometry, frondMaterials[i % 2], crown); leaf.rotation.y = i * Math.PI * 2 / 7; leaf.rotation.z = .12 * (i % 2) }
    palms.push(crown)
  }
  // A utility pole with a gentle wire sag.
  const pole = add(own(new THREE.CylinderGeometry(.09, .12, 7, 8)), std('#8e8a82', .9)); pole.position.set(-6.2, 3.5, -9.2)
  const wire: number[] = []
  for (let i = 0; i < 20; i++) { const t0 = i / 20, t1 = (i + 1) / 20; const p = (t: number) => [-6.2 + t * 16, 6.6 - Math.sin(t * Math.PI) * .9, -9.2 - t * 3]; wire.push(...p(t0), ...p(t1)) }
  const wireGeometry = own(new THREE.BufferGeometry()); wireGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3))
  group.add(new THREE.LineSegments(wireGeometry, own(new THREE.LineBasicMaterial({ color: '#3b3b3b' }))))
  // Bunting across the court: tiny triangles in yellow/green/blue.
  const flags = new THREE.InstancedMesh(own(new THREE.ConeGeometry(.16, .32, 3)), own(new THREE.MeshStandardMaterial({ roughness: .7, side: THREE.DoubleSide })), 26)
  for (let i = 0; i < 26; i++) {
    const t = i / 25, x = -8 + t * 16, y = 4.1 - Math.sin(t * Math.PI) * .6
    matrix.compose(new THREE.Vector3(x, y, -7.9), q.setFromEuler(new THREE.Euler(0, 0, Math.PI)), new THREE.Vector3(1, 1, .15))
    flags.setMatrixAt(i, matrix); flags.setColorAt(i, color.set(['#f4cf2e', '#23a15c', '#2e67c9'][i % 3]))
  }
  group.add(flags)

  return {
    group,
    update(seconds) {
      if (options.reducedMotion) return
      palms.forEach((crown, i) => { crown.rotation.z = Math.sin(seconds * .9 + i * 1.7) * .035; crown.rotation.x = Math.cos(seconds * .7 + i) * .025 })
    },
    dispose() {
      owned.forEach(item => item.dispose())
      houses.dispose(); flags.dispose()
    },
  }
}
