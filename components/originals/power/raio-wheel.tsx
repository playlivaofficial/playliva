'use client'
import { useEffect, useRef } from 'react'
import { WHEEL_ORDER, pocketColor } from '@/lib/originals/roulette/config'
import { sampleOrbit } from '@/lib/originals/roulette/presentation'
import { CHARGE_MS, SPIN_MS, type createRaioEngine } from '@/lib/originals/raio/engine'
import type { createPowerAudio } from '@/lib/originals/power-audio'
import styles from './power.module.css'
export function RaioWheel({engine,audio}:{engine:ReturnType<typeof createRaioEngine>;audio:ReturnType<typeof createPowerAudio>}){
  const wheel=useRef<SVGGElement>(null),ball=useRef<SVGGElement>(null),last=useRef(''),tick=useRef(-1)
  useEffect(()=>{
    let raf=0
    const reduced=matchMedia('(prefers-reduced-motion: reduce)')
    function frame(){
      raf=0
      const state=engine.getSnapshot(),at=performance.now()
      if(state.orbit){
        const progress=Math.max(0,Math.min(1,(at-state.startedAt-CHARGE_MS)/SPIN_MS)),pose=sampleOrbit(state.orbit,progress,reduced.matches)
        // Land the actual SVG BEFORE publishing the authoritative result in this frame.
        wheel.current?.setAttribute('transform',`rotate(${pose.wheel} 200 200)`)
        const angle=pose.ball*Math.PI/180,r=pose.radius
        ball.current?.setAttribute('transform',`translate(${200+Math.sin(angle)*r} ${200-Math.cos(angle)*r})`)
        ball.current?.setAttribute('opacity',String(pose.opacity))
        if(state.phase==='spin'&&progress<1){const n=Math.floor(progress*28);if(n!==tick.current){tick.current=n;audio.cue('tick')}}
        if(progress===1&&last.current!==state.roundId){last.current=state.roundId!;audio.cue('land');performance.clearMarks('raio:landing');performance.mark('raio:landing',{detail:{deadline:state.startedAt+CHARGE_MS+SPIN_MS,frameAt:at}})}
      }
      engine.tick();if(!raf&&['charge','spin','result'].includes(engine.getSnapshot().phase))raf=requestAnimationFrame(frame)
    }
    const wake=()=>{if(!raf)raf=requestAnimationFrame(frame)}
    const unsubscribe=engine.subscribe(wake);wake()
    return()=>{unsubscribe();cancelAnimationFrame(raf)}
  },[engine,audio])
  return <svg className={styles.wheel} viewBox="0 0 400 400" aria-hidden="true">
    <defs><radialGradient id="raio-metal"><stop stopColor="#58899a"/><stop offset=".55" stopColor="#102934"/><stop offset=".87" stopColor="#b7d99e"/><stop offset="1" stopColor="#07171c"/></radialGradient><radialGradient id="raio-core"><stop stopColor="#356168"/><stop offset="1" stopColor="#031215"/></radialGradient></defs>
    <circle cx="200" cy="200" r="191" fill="#03121b" stroke="#bfef55" strokeWidth="3"/>
    <circle cx="200" cy="200" r="179" fill="none" stroke="#48717b" strokeWidth="8"/>
    <g ref={wheel}>{WHEEL_ORDER.map((n,i)=>{
      const a=(i-.5)*2*Math.PI/37,b=(i+.5)*2*Math.PI/37,point=(r:number,t:number)=>`${200+Math.sin(t)*r},${200-Math.cos(t)*r}`
      return <g key={n}><path d={`M${point(151,a)} A151,151 0 0,1 ${point(151,b)} L${point(111,b)} A111,111 0 0,0 ${point(111,a)} Z`} fill={pocketColor(n)==='red'?'#963443':n===0?'#1d865b':'#142b35'} stroke="#759395" strokeWidth=".6"/><text x="200" y="62" transform={`rotate(${i*360/37} 200 200)`} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">{n}</text></g>
    })}<circle cx="200" cy="200" r="104" fill="url(#raio-metal)"/><circle cx="200" cy="200" r="87" fill="url(#raio-core)"/><path d="M210 142 174 207 199 203 189 251 231 184 206 190Z" fill="#dbf77c"/><circle cx="200" cy="200" r="99" fill="none" stroke="#b6d799" strokeDasharray="2 12"/></g>
    <g ref={ball} transform="translate(102 60)"><circle r="7" cy="2" fill="#0008"/><circle r="5.3" fill="#fff6d9"/><circle r="1.6" cx="-1.5" cy="-1.5" fill="white"/></g>
  </svg>
}
