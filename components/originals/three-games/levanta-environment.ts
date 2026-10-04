import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { LEVANTA_MAT_TOP, LEVANTA_MAT_SEAM_TOP } from './levanta-contact'

/** Lightweight original street-gym set: geometry, one small authored mural texture, no baked scene. */
export function addLevantaEnvironment(scene: THREE.Scene) {
  const objects: THREE.Mesh[] = []
  const mat = (color: string, roughness = .8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness })
  const sand = mat('#f5dc9c'), coral = mat('#e99770'), teal = mat('#087d70'), blue = mat('#196daf')
  const rubber = mat('#23383c'), graphite = mat('#203338', .6, .35), steel = mat('#aabec0', .35, .75)
  const leafDark = mat('#167b46'), leafLight = mat('#65ad39'), bark = mat('#bba069'), planter = mat('#21706a')
  leafDark.side = THREE.DoubleSide; leafLight.side = THREE.DoubleSide
  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, x: number, y: number, z: number) {
    const object = new THREE.Mesh(geometry, material); object.position.set(x, y, z)
    object.castShadow = true; object.receiveShadow = true; scene.add(object); objects.push(object); return object
  }
  const box = (w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number) => mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z)
  // The training surface retains the previous exact ground height and clearance.
  box(20, .12, 20, sand, 0, -.08, 0)
  box(3.7, .05, 2.8, rubber, 0, LEVANTA_MAT_TOP - .025, .3)
  for (let x = -1.8; x < 1.9; x += .62) box(.008, .001, 2.78, graphite, x, LEVANTA_MAT_SEAM_TOP - .0006, .3)
  for (let z = -.95; z < 1.7; z += .62) box(3.68, .001, .008, graphite, 0, LEVANTA_MAT_SEAM_TOP - .0005, z)
  const tileMat = mat('#d6bf89')
  for (let i = -7; i <= 7; i++) {
    box(.009, .003, 12, tileMat, i * .8, -.018, -2)
    box(12, .003, .009, tileMat, 0, -.018, i * .8)
  }
  // Sunlit clay and teal keep the tropical gym independent of a national palette.
  box(6.2, 3.5, .16, coral, -.8, 1.6, -3.3)
  box(3.4, 3.5, .16, teal, 4, 1.6, -3.3)
  box(2.5, 3.5, .16, sand, -5.15, 1.6, -3.3)
  box(12, .14, .19, blue, 0, .1, -3.18)
  for (const x of [-4.1, -2.35, 2.45, 5.5]) {
    box(.115, 3.8, .13, teal, x, 1.85, -2.85)
    box(.1, .12, 5.5, teal, x, 3.68, -.7)
  }
  // A mural painted on a real wall, not a background image: original hills, sun and rhythm arcs.
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 640
  const c = canvas.getContext('2d')!
  c.fillStyle = '#e99770'; c.fillRect(0, 0, 1024, 640)
  c.fillStyle = '#ffe3b0'; c.beginPath(); c.arc(765, 150, 98, 0, Math.PI * 2); c.fill()
  const ridge = (color: string, points: number[][]) => { c.fillStyle = color; c.beginPath(); c.moveTo(0, 640); points.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(1024, 640); c.closePath(); c.fill() }
  ridge('#64b8ab', [[0, 445], [150, 282], [290, 409], [435, 217], [670, 451], [810, 303], [1024, 459]])
  ridge('#178ca1', [[0, 500], [204, 348], [360, 480], [576, 343], [765, 478], [926, 386], [1024, 470]])
  ridge('#1968a1', [[0, 555], [180, 465], [355, 552], [560, 446], [760, 565], [970, 470], [1024, 530]])
  ridge('#087c68', [[0, 601], [185, 540], [432, 605], [700, 530], [895, 590], [1024, 532]])
  c.lineWidth = 13; c.strokeStyle = '#ffe3b0'; c.beginPath(); c.moveTo(-30, 570); c.bezierCurveTo(300, 750, 490, 390, 1080, 620); c.stroke()
  c.strokeStyle = '#087c68'; c.lineWidth = 17
  for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(85, 105, 48 + i * 31, -.7, 1.1); c.stroke() }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace
  const mural = new THREE.MeshStandardMaterial({ map: texture, roughness: 1 })
  mesh(new THREE.PlaneGeometry(5.8, 3.2), mural, -.58, 1.64, -3.208)
  // Dumbbell rack stays behind and to the right of the clear lifting area.
  for (const x of [1.3, 2.7]) box(.07, .92, .5, graphite, x, .47, -2.1)
  for (const y of [.37, .8]) {
    box(1.55, .065, .43, graphite, 2, y, -2.1)
    for (let i = 0; i < 4; i++) {
      const x = 1.46 + i * .36
      const handle = mesh(new THREE.CylinderGeometry(.025, .025, .23, 10), steel, x, y + .115, -2.09); handle.rotation.z = Math.PI / 2
      for (const side of [-1, 1]) { const head = mesh(new THREE.CylinderGeometry(.105, .105, .09, 6), graphite, x + side * .125, y + .115, -2.09); head.rotation.z = Math.PI / 2 }
    }
  }
  // A plate tree and kettlebells form a small secondary cluster on the left.
  box(.1, 1.5, .1, graphite, -2.65, .75, -1.85); box(.65, .06, .55, graphite, -2.65, .03, -1.85)
  for (let i = 0; i < 3; i++) {
    const plate = mesh(new THREE.CylinderGeometry(.22 - i * .03, .22 - i * .03, .065, 24), i === 1 ? blue : graphite, -2.5, .44 + i * .35, -1.8)
    plate.rotation.x = Math.PI / 2
  }
  for (const [x, z, size, material] of [[-2.1, -1.2, .15, teal], [-2.5, -1, .18, graphite]] as const) {
    mesh(new THREE.SphereGeometry(size, 12, 8), material, x, size + .01, z)
    mesh(new THREE.TorusGeometry(size * .62, .026, 6, 14), material, x, size * 2.1, z)
  }
  // Reusable curved palm fronds and feathered leaflets, with no leaf texture downloads.
  const frondGeometry = new THREE.BufferGeometry(), positions: number[] = []
  const point = (t: number, side: number) => [t * 1.5, Math.sin(t * Math.PI) * .26 - t * t * .45, side * Math.sin(t * Math.PI) * .18]
  for (let i = 0; i < 6; i++) {
    const a = i / 6, b = (i + 1) / 6
    positions.push(...point(a, -1), ...point(b, -1), ...point(a, 1), ...point(b, -1), ...point(b, 1), ...point(a, 1))
  }
  for(let i=1;i<13;i++)for(const side of [-1,1]){
    const t=i/14,base=point(t,0),next=point(t+.065,0),width=Math.sin(t*Math.PI)*.27
    positions.push(...base,t*1.5+.2,base[1]-.06,side*width,...next)
  }
  frondGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); frondGeometry.computeVertexNormals()
  for (const [x, z, height] of [[-3.3, -2.45, 2.6], [3.9, -3.8, 3.8], [-4.5, -4.4, 4]] as const) {
    if (height < 3) mesh(new THREE.CylinderGeometry(.32, .23, .4, 14), planter, x, .2, z)
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x, .1, z), new THREE.Vector3(x + .12, height * .5, z), new THREE.Vector3(x + .35, height, z + .08)])
    mesh(new THREE.TubeGeometry(curve, 7, .075, 7, false), bark, 0, 0, 0)
    for (let i = 0; i < 9; i++) { const leaf = mesh(frondGeometry, i % 2 ? leafLight : leafDark, x + .35, height, z + .08); leaf.rotation.y = i * Math.PI * 2 / 9; leaf.rotation.z = .15 + (i % 3) * .1; leaf.scale.setScalar(height < 3 ? .8 : 1.15) }
  }
  // Compact tropical plants with fan leaves along the back wall.
  for (const x of [-1.8, 1.9]) {
    mesh(new THREE.CylinderGeometry(.23, .17, .34, 12), planter, x, .17, -2.65)
    for (let i = 0; i < 7; i++) { const leaf = mesh(frondGeometry, i % 2 ? leafLight : leafDark, x, .35, -2.65); leaf.scale.set(.5, .8, 1.1); leaf.rotation.y = i * .9; leaf.rotation.z = .65 }
  }
  // Static scenery batches by material: the detailed set adds a small, fixed draw-call budget.
  const groups = new Map<THREE.Material, THREE.BufferGeometry[]>(), originals = new Set<THREE.BufferGeometry>()
  for (const object of objects) {
    object.updateMatrixWorld(true)
    const material = object.material as THREE.Material
    const transformed = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone()
    transformed.deleteAttribute('uv'); transformed.applyMatrix4(object.matrixWorld)
    // Only the mural uses UVs, so retain that wall mesh separately.
    if (material === mural) { transformed.dispose(); continue }
    groups.set(material, [...(groups.get(material) ?? []), transformed]); originals.add(object.geometry); scene.remove(object)
  }
  for (const [material, geometries] of groups) {
    const combined = mergeGeometries(geometries)
    if (!combined) throw Error('Environment geometry batching failed')
    const object = new THREE.Mesh(combined, material); object.castShadow = true; object.receiveShadow = true; scene.add(object)
    geometries.forEach(g => g.dispose())
  }
  originals.forEach(g => g.dispose())
}
