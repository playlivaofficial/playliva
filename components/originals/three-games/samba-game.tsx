'use client'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useCountry } from '@/components/country-context'
import { DemoSessionProvider, useDemoSession } from '../demo-session'
import { PlayGameShell } from '../play-game-shell'
import { SAMBA_DROP } from '@/lib/originals/three-game-definitions'
import { threeCopy, threeNumber } from '@/lib/originals/three-game-copy'
import { createDropEngine, type DropEngine } from '@/lib/originals/samba-drop/engine'
import { configuration, ROWS, RISKS, SCALE, type Rows, type Risk } from '@/lib/originals/samba-drop/math'
import { formatCredits } from '@/lib/originals/credits'
import { trackFreePlay } from '@/lib/originals/analytics'
import { useThreeAudio } from './use-audio'
import styles from './three-games.module.css'
export default function SambaGame(){return <DemoSessionProvider><SambaPlay/></DemoSessionProvider>}
export function SambaPlay({suppliedEngine,presentationNow}:{suppliedEngine?:DropEngine;presentationNow?:()=>number}){
 const {locale,countryCode}=useCountry(),{wallet,session}=useDemoSession(),[engine]=useState(()=>suppliedEngine??createDropEngine(wallet))
 const round=useSyncExternalStore(engine.subscribe,engine.getSnapshot,engine.getServerSnapshot)
 const [stake,setStake]=useState(100),[rows,setRows]=useState<Rows>(12),[risk,setRisk]=useState<Risk>('medium'),[error,setError]=useState(false)
 const audio=useThreeAudio('samba-drop'),ball=useRef<SVGCircleElement>(null),copy=threeCopy(locale)
 const boardRows=round.phase==='dropping'||round.phase==='landed'?round.rows:rows,config=configuration(boardRows,round.phase==='dropping'||round.phase==='landed'?round.risk:risk)
 const dx=480/boardRows,dy=350/boardRows,active=round.phase==='dropping'||round.phase==='landed'
 useEffect(()=>{
  let frame=0,lastPeg=-1,lastId='',landed='',reported=''
  const animate=(at:number)=>{
   at=presentationNow?.()??at
   engine.tick();const s=engine.getSnapshot(),n=s.rows,spacing=480/n,height=350/n
   if(s.phase==='dropping'){
    if(s.id!==lastId){lastId=s.id!;lastPeg=-1;audio.cue('start');audio.active(true)}
    const elapsed=at-s.startedAt,progress=Math.max(0,(elapsed-250)/170),step=Math.min(n-1,Math.floor(progress)),f=Math.min(1,progress-step)
    const rights=s.path.slice(0,step).reduce((a,b)=>a+b,0)
    let x=300+(rights-step/2)*spacing,y=100+step*height
    if(elapsed<250){y=55+45*Math.max(0,elapsed/250)}
    else if(progress<n){x+=(s.path[step]-.5)*spacing*f;y+=height*f-Math.sin(Math.PI*f)*height*.42;if(step!==lastPeg){lastPeg=step;audio.cue(step>n-3?'anticipation':'tick',step)}}
    else{x=300+(s.path.reduce((a,b)=>a+b,0)-n/2)*spacing;y=450+Math.min(1,(elapsed-(250+n*170))/350)*38}
    ball.current?.setAttribute('cx',String(x));ball.current?.setAttribute('cy',String(y));ball.current?.setAttribute('opacity','1')
   }else if(s.result){
    ball.current?.setAttribute('cx',String(300+(s.result.bucket-n/2)*spacing));ball.current?.setAttribute('cy','488')
    if(landed!==s.result.id){landed=s.result.id;audio.active(false);audio.cue(s.result.multiplier>=100*SCALE?'huge':s.result.multiplier>=10*SCALE?'big':'land');if(wallet.getSnapshot().session.settings.haptics)navigator.vibrate?.(35)}
    if(reported!==s.result.id){reported=s.result.id;trackFreePlay('demo_round_complete',{originalId:SAMBA_DROP.id,originalSlug:SAMBA_DROP.slug,category:SAMBA_DROP.category,locale,country:countryCode,roundId:s.result.id,multiplierBucket:s.result.multiplier>=10*SCALE?'10x-plus':s.result.multiplier>=SCALE?'1-10x':'under-1x',rows:String(s.rows),risk:s.risk})}
   }
   frame=requestAnimationFrame(animate)
  };frame=requestAnimationFrame(animate);return()=>{cancelAnimationFrame(frame);audio.active(false)}
 },[engine,audio,wallet,locale,countryCode,presentationNow])
 function start(){try{audio.unlock();const result=engine.start(stake,rows,risk);setError(!result.ok);if(result.ok)trackFreePlay('demo_round_start',{originalId:SAMBA_DROP.id,originalSlug:SAMBA_DROP.slug,category:SAMBA_DROP.category,locale,country:countryCode,roundId:engine.getSnapshot().id!,rows:String(rows),risk})}catch{setError(true)}}
 return <div className={styles.game} data-three-game="samba-drop"><PlayGameShell game={SAMBA_DROP} compact roundActive={active} controls={<div className={styles.controls}>
  <label>{copy.stake}<select value={stake} disabled={active} onChange={e=>setStake(Number(e.target.value))}>{[100,200,500,1000,2500,5000].map(n=><option key={n} value={n}>{formatCredits(n,locale)}</option>)}</select></label>
  <label>{copy.rows}<select value={rows} disabled={active} onChange={e=>setRows(Number(e.target.value) as Rows)}>{ROWS.map(n=><option key={n}>{n}</option>)}</select></label>
  <label>{copy.risk}<select value={risk} disabled={active} onChange={e=>setRisk(e.target.value as Risk)}>{RISKS.map(r=><option key={r} value={r}>{copy[r]}</option>)}</select></label>
  <button className={styles.action} disabled={active||round.phase==='error'} onClick={start}>{copy.drop}</button>{error&&<p role="alert" className={styles.error}>{copy.error}</p>}
 </div>}><div className={styles.stage}>
  <div className={styles.stageHeader}><span className={styles.eyebrow}>PLAYLIVA ORIGINAL</span><h2>RITMO DROP</h2></div>
  <div className={styles.status} aria-live="polite">{round.result&&round.phase!=='dropping'?`${threeNumber(round.result.multiplier/SCALE,locale,4)}× · ${copy.return} ${formatCredits(round.result.payout,locale)}`:round.phase==='dropping'?copy.dropping:copy.ready}</div>
  <svg viewBox="0 0 600 530" className={styles.board} role="img" aria-label={`${copy.rows}: ${boardRows} · ${copy.risk}: ${copy[config.risk]}`}>
   <defs><radialGradient id="samba-glow"><stop stopColor="#d4ff6c"/><stop offset="1" stopColor="#d4ff6c" stopOpacity="0"/></radialGradient><linearGradient id="samba-gold" x2="1" y2="1"><stop stopColor="#fff7b0"/><stop offset="1" stopColor="#db9e24"/></linearGradient></defs>
   <path d="M300 46 Q320 50 340 102 L566 450 Q580 505 540 517 H60 Q20 505 34 450 L260 102 Q280 50 300 46Z" fill="#092d3a" stroke="#239891" strokeWidth="2"/>
   <path d="M300 56L540 450M300 56L60 450" fill="none" stroke="#87eac1" strokeOpacity=".12" strokeWidth="6"/>
   {Array.from({length:boardRows},(_,r)=>Array.from({length:r+1},(_,k)=>{const x=300+(k-r/2)*dx,y=100+r*dy;return <g key={`${r}-${k}`}><circle cx={x} cy={y} r="10" fill="url(#samba-glow)" opacity=".18"/><circle cx={x} cy={y} r="3.5" fill="#b2eee4"/><circle cx={x-.6} cy={y-1} r="1.2" fill="white"/></g>}))}
   {config.multipliers.map((m,k)=><g key={k}><title>{`${k}: ${threeNumber(m/SCALE,locale,4)}×`}</title><rect x={300+(k-boardRows/2)*dx-dx*.45} y="474" width={dx*.9} height="30" rx="5" fill={m>=10*SCALE?'#eaba54':m>=SCALE?'#218c86':'#234451'} stroke={round.result?.bucket===k&&round.phase!=='dropping'?'#fff6b0':'#508e86'} strokeWidth="2"/><text x={300+(k-boardRows/2)*dx} y="493" textAnchor="middle" fontSize={boardRows===16?10:12} fill={m>=10*SCALE?'#192c30':'#ebfff7'} fontWeight="800">{threeNumber(m/SCALE,locale,m>10*SCALE?0:1)}</text></g>)}
   <circle ref={ball} cx="300" cy="60" r="7" fill="url(#samba-gold)" stroke="#fffbd1" strokeWidth="2"/>
  </svg>
 </div></PlayGameShell>
 <div className={styles.history} aria-label={copy.history}>{round.history.map(item=><span key={item.id}>{threeNumber(item.multiplier/SCALE,locale,2)}×</span>)}</div>
 <details className={styles.help}><summary>{copy.rows}: {boardRows} · {copy.risk}: {copy[config.risk]} · {copy.rules}</summary><table><thead><tr><th>{copy.result}</th><th>×</th><th>%</th></tr></thead><tbody>{config.multipliers.map((rate,i)=><tr key={i}><td>{i+1}</td><td>{threeNumber(rate/SCALE,locale,4)}</td><td>{threeNumber(config.probability[i]*100,locale,4)}</td></tr>)}</tbody></table></details>
 <p className={styles.small}>{session.settings.haptics?'◉ ':''}{copy.credits}</p></div>
}
