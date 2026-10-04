import { GROWTH_MS, REACTION_MS, timeToMultiplier, type TurboSnapshot } from '@/lib/originals/rio-drift/crash-engine'


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

/** A straight, authored road keeps the car and multiplier readable; no visual can alter settlement. */
export function renderTurbo(c: CanvasRenderingContext2D, w: number, h: number, s: TurboSnapshot, at: number, reduced: boolean) {
  const running = s.phase === 'running', crashed = s.phase === 'crashed' || s.phase === 'ready' && s.history[0] && !s.history[0].capped
  const elapsed = s.phase === 'running' ? Math.min(Math.max(0, at - s.runningAt), timeToMultiplier(2500)) : s.phase === 'launch' ? 0 : timeToMultiplier(s.multiplier)
  const distance = reduced ? 0 : (Math.exp(elapsed / GROWTH_MS) - 1) * 230
  const reaction = s.phase === 'crashed' ? Math.min(1, Math.max(0, at - s.finishedAt) / REACTION_MS) : crashed ? 1 : 0
  const sky = c.createLinearGradient(0, 0, 0, h)
  sky.addColorStop(0, '#081527'); sky.addColorStop(.36, '#174b64'); sky.addColorStop(.48, '#be8475'); sky.addColorStop(.54, '#e7a672'); sky.addColorStop(1, '#081824')
  c.fillStyle = sky; c.fillRect(0, 0, w, h)
  const glow = c.createRadialGradient(w*.5,h*.44,0,w*.5,h*.44,w*.4)
  glow.addColorStop(0,'#ffdb9666');glow.addColorStop(1,'#ffe0a000');c.fillStyle=glow;c.fillRect(0,0,w,h)
  // Fictional waterfront skyline, deliberately kept away from the main HUD.
  for(let i=0;i<16;i++) {
    const x=i*w/15, size=(i*13%31+17)*w/700
    c.fillStyle='#123344';c.fillRect(x,h*.5-size,w*.055,size)
    c.fillStyle='#80c9c966';c.fillRect(x+3,h*.5-size+5,2,Math.max(3,size-9))
  }
  c.fillStyle='#13323e';c.fillRect(0,h*.5,w,h*.5)
  const project=(q:number)=>({x:w*.5,y:h*(.49+.55*q*q),half:w*(.013+.52*q*q)})
  for(let i=0;i<50;i++) {
    const q=i/50,a=project(q),b=project((i+1)/50), band=Math.floor((distance+(1-q)*260)/14)%2
    b.y+=1
    polygon(c,[[a.x-a.half*1.09,a.y],[a.x+a.half*1.09,a.y],[b.x+b.half*1.09,b.y],[b.x-b.half*1.09,b.y]],band?'#286579':'#174d61')
    polygon(c,[[a.x-a.half,a.y],[a.x+a.half,a.y],[b.x+b.half,b.y],[b.x-b.half,b.y]],band?'#142b3c':'#162e3f')
    for(const side of [-1,1]) {
      polygon(c,[[a.x+side*a.half*.95,a.y],[a.x+side*a.half*.966,a.y],[b.x+side*b.half*.966,b.y],[b.x+side*b.half*.95,b.y]],'#57dac9')
      if(band)polygon(c,[[a.x+side*a.half*.325,a.y],[a.x+side*a.half*.34,a.y],[b.x+side*b.half*.34,b.y],[b.x+side*b.half*.325,b.y]],'#b0cad466')
    }
  }
  for(let i=0;i<8;i++) {
    const q=(i/8+(distance%30)/240)%1,p=project(q),size=3+q*q*38
    for(const side of [-1,1]){
      c.fillStyle='#36586a';c.fillRect(p.x+side*p.half*1.2,p.y-size,Math.max(1,q*3),size)
      c.fillStyle='#c5fff1';c.fillRect(p.x+side*p.half*1.2-2,p.y-size,4+q*3,2+q*2)
    }
  }
  const width=Math.min(112,w*.19),x=w*.5+(reduced?0:reaction*width*.12),y=h*.76
  const under=c.createRadialGradient(x,y,0,x,y,width)
  under.addColorStop(0,crashed?'#fd9a423b':'#33efd23d');under.addColorStop(1,'#24e2ca00');c.fillStyle=under;c.fillRect(x-width,y-width,width*2,width*2)
  if(running&&!reduced)for(let i=0;i<4;i++) {
    c.fillStyle=rgba(77,237,224,.17-i*.035);c.fillRect(x-width*.23+i*width*.13,y+width*.85,width*.05,width*(.25+(s.multiplier/2500)*.5))
  }
  drawCoupe(c,x,y,width,reduced?0:reaction*.075)
  if(crashed)for(let i=0;i<5;i++) {
    c.fillStyle=rgba(171,185,190,.17-i*.025)
    c.beginPath();c.ellipse(x+(i-2)*width*.14,y-width*(.6+i*.15+reaction*.18),width*(.12+i*.035),width*.19,0,0,Math.PI*2);c.fill()
  }
  const shade=c.createLinearGradient(0,0,0,h*.5);shade.addColorStop(0,'#061120b3');shade.addColorStop(1,'#06112000');c.fillStyle=shade;c.fillRect(0,0,w,h*.5)
}
