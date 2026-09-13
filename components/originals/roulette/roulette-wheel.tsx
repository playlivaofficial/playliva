'use client'
import { useEffect, useId, useRef } from 'react'
import type { Locale } from '@/lib/types'
import { pocketColor, ROULETTE_TIMING, WHEEL_ORDER } from '@/lib/originals/roulette/config'
import { sampleOrbit, POCKET_DEGREES } from '@/lib/originals/roulette/presentation'
import type { RouletteSnapshot } from '@/lib/originals/roulette/engine'
import { rouletteCopy } from '@/lib/originals/roulette/copy'
import styles from './roulette.module.css'

const realTime = () => performance.now()
const point = (radius: number, degrees: number) => {
  const angle = degrees * Math.PI / 180
  // Trig last bits differ between server/browser platforms. Quantize SVG-only
  // coordinates well below a screen pixel to keep hydration deterministic.
  return [200 + Math.sin(angle) * radius, 200 - Math.cos(angle) * radius].map(n => Number(n.toFixed(4)))
}
function wedge(angle: number, outer: number, inner: number) {
  const a = angle - POCKET_DEGREES / 2, b = angle + POCKET_DEGREES / 2
  return `M${point(outer, a)} A${outer},${outer} 0 0 1 ${point(outer, b)} L${point(inner, b)} A${inner},${inner} 0 0 0 ${point(inner, a)}Z`
}
/** Read-only animation: neither RNG nor settlement callbacks enter this renderer. */
export function RouletteWheel({ round, locale, now = realTime }: { round: RouletteSnapshot; locale: Locale; now?: () => number }) {
  const rotor = useRef<SVGGElement>(null), ball = useRef<SVGCircleElement>(null), id = useId().replace(/:/g, '')
  const c = rouletteCopy(locale), landed = round.phase === 'settling' || round.phase === 'result' || round.phase === 'betting'
  const number = landed ? round.result?.number : undefined
  useEffect(() => {
    const plan = round.orbit
    if (!plan) { rotor.current?.setAttribute('transform', 'rotate(0 200 200)'); const p = point(172, -35); ball.current?.setAttribute('cx', String(p[0])); ball.current?.setAttribute('cy', String(p[1])); ball.current?.setAttribute('opacity', '1'); return }
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    function draw() {
      const progress = (now() - round.spinStartedAt) / ROULETTE_TIMING.spinMs
      const sample = sampleOrbit(plan!, progress, media.matches), p = point(sample.radius, sample.ball)
      rotor.current?.setAttribute('transform', `rotate(${sample.wheel} 200 200)`)
      ball.current?.setAttribute('cx', String(p[0])); ball.current?.setAttribute('cy', String(p[1]))
      ball.current?.setAttribute('opacity', String(sample.opacity))
      if (progress < 1) frame = requestAnimationFrame(draw)
    }
    const preference = () => { cancelAnimationFrame(frame); draw() }
    draw(); media.addEventListener('change', preference)
    return () => { cancelAnimationFrame(frame); media.removeEventListener('change', preference) }
  }, [round.orbit, round.spinStartedAt, now])
  return <svg viewBox="0 0 400 400" role="img" aria-label={`${c.wheel}${number !== undefined ? ` · ${number}` : ''}`} className={styles.wheel} data-roulette-wheel>
    <defs>
      <linearGradient id={`${id}gold`} x2="1" y2="1"><stop stopColor="#fff0be"/><stop offset=".25" stopColor="#ac7633"/><stop offset=".5" stopColor="#e7c57e"/><stop offset=".8" stopColor="#72502b"/><stop offset="1" stopColor="#eccc91"/></linearGradient>
      <radialGradient id={`${id}wood`}><stop stopColor="#53372d"/><stop offset=".78" stopColor="#271e1e"/><stop offset="1" stopColor="#6f5137"/></radialGradient>
      <radialGradient id={`${id}hub`} cx=".35" cy=".25"><stop stopColor="#22626a"/><stop offset=".6" stopColor="#112b3b"/><stop offset="1" stopColor="#060f20"/></radialGradient>
      <radialGradient id={`${id}ball`} cx=".3" cy=".2"><stop stopColor="#fff"/><stop offset=".5" stopColor="#fffae6"/><stop offset="1" stopColor="#a3926c"/></radialGradient>
    </defs>
    <circle cx="200" cy="204" r="191" fill="#000c"/>
    <circle cx="200" cy="200" r="189" fill={`url(#${id}gold)`}/>
    <circle cx="200" cy="200" r="181" fill={`url(#${id}wood)`} stroke="#1a1418" strokeWidth="2"/>
    <circle cx="200" cy="200" r="173" fill="none" stroke="#cfb28055" strokeWidth="1.5"/>
    <circle cx="200" cy="200" r="162" fill="#040c18" stroke={`url(#${id}gold)`} strokeWidth="3"/>
    <g ref={rotor} data-wheel-rotor>
      {WHEEL_ORDER.map((n, index) => <g key={n} data-pocket={n} data-winning={number === n || undefined} className={styles.pocket}>
        <path d={wedge(index * POCKET_DEGREES, 159, 112)} fill={n === 0 ? '#13775c' : pocketColor(n) === 'red' ? '#ab343d' : '#121c29'} stroke="#cdb574" strokeWidth=".55"/>
        <path d={wedge(index * POCKET_DEGREES, 132, 112)} fill={number === n ? '#ffe09c' : '#0003'} stroke="#e2c889" strokeWidth=".6"/>
        <text x="200" y="54" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${index * POCKET_DEGREES} 200 200)`} fill="#fff5db" fontSize="12" fontWeight="750">{n}</text>
      </g>)}
      <circle cx="200" cy="200" r="110" fill={`url(#${id}gold)`}/>
      <circle cx="200" cy="200" r="105" fill={`url(#${id}hub)`}/>
      {[0, 90, 180, 270].map(angle => <path key={angle} d="M196 185L194 115Q200 109 206 115L204 185Z" fill={`url(#${id}gold)`} transform={`rotate(${angle} 200 200)`}/>)}
      <circle cx="200" cy="200" r="22" fill={`url(#${id}gold)`}/>
      <circle cx="200" cy="200" r="14" fill="#0d2432" stroke="#efd49a"/>
    </g>
    <circle ref={ball} cx={point(172, -35)[0]} cy={point(172, -35)[1]} r="5.7" fill={`url(#${id}ball)`} stroke="#fffcdf" strokeWidth=".6" className={styles.ball} data-roulette-ball/>
    <path d="M64 84A178 178 0 0 1 330 69" fill="none" stroke="#fff5d744" strokeWidth="3" strokeLinecap="round"/>
    <path d="M188 8L200 17L212 8" fill="#efda9b"/>
  </svg>
}
