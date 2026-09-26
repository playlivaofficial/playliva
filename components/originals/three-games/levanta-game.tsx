'use client'
import { flushSync } from 'react-dom'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useCountry } from '@/components/country-context'
import { DemoSessionProvider, useDemoSession } from '../demo-session'
import { PlayGameShell } from '../play-game-shell'
import { LEVANTA } from '@/lib/originals/three-game-definitions'
import { threeCopy } from '@/lib/originals/three-game-copy'
import { createLevantaEngine, type LevantaEngine, payoutFor } from '@/lib/originals/levanta/engine'
import { formatCredits } from '@/lib/originals/credits'
import { multiplierBucket, trackFreePlay } from '@/lib/originals/analytics'
import { useThreeAudio } from './use-audio'
import styles from './three-games.module.css'
export default function LevantaGame(){return <DemoSessionProvider><LevantaPlay/></DemoSessionProvider>}
export function LevantaPlay({suppliedEngine,presentationNow}:{suppliedEngine?:LevantaEngine;presentationNow?:()=>number}){
 const {locale,countryCode}=useCountry(),{wallet,session}=useDemoSession(),[engine]=useState(()=>suppliedEngine??createLevantaEngine(wallet)),audio=useThreeAudio('skuptu-levanta')
 const round=useSyncExternalStore(engine.subscribe,engine.getSnapshot,engine.getServerSnapshot),host=useRef<HTMLDivElement>(null)
 const [loaded,setLoaded]=useState(false),[loadError,setLoadError]=useState(false),[attempt,setAttempt]=useState(0),[stake,setStake]=useState(100),[auto,setAuto]=useState(0),[error,setError]=useState(false)
 const copy=threeCopy(locale),active=round.phase!=='ready',format=(n:number)=>formatCredits(n,locale)
 useEffect(()=>{
  let stopped=false,frame=0,view:Awaited<ReturnType<typeof import('./levanta-scene')['createLevantaScene']>>|undefined,crash='',cash='',impact='',started='',crashRendered=0,impactDelay=0
  const element=host.current!
  import('./levanta-scene').then(m=>m.createLevantaScene(element)).then(scene=>{if(stopped){scene.dispose();return}view=scene;setLoaded(true)
   const render=(at:number)=>{
    at=presentationNow?.()??at
    // Update the HUD synchronously, then source pose, bar and audio in this same RAF.
    flushSync(()=>engine.tick());const s=engine.getSnapshot(),base={originalId:LEVANTA.id,originalSlug:LEVANTA.slug,category:LEVANTA.category,locale,country:countryCode,roundId:s.roundId??undefined}
    if(s.roundId&&s.phase==='preparing'&&started!==s.roundId){started=s.roundId;audio.active(true);audio.cue('start')}
    if(s.phase==='failed'&&crash!==s.roundId){crash=s.roundId!;crashRendered=at;const height=Math.max(0,(view?.barHeight??.5)-.305);impactDelay=(-1.2+Math.sqrt(1.44+19.6*height))/9.8*1000;element.dataset.hudCrashFrame=String(at);element.dataset.audioFailureFrame=String(at);audio.cue('fail');trackFreePlay('demo_crash',{...base,multiplierBucket:multiplierBucket(s.multiplier)})}
    if(s.wager==='cashed_out'&&cash!==s.roundId){cash=s.roundId!;audio.cue('cashout');trackFreePlay('demo_cashout',{...base,multiplierBucket:multiplierBucket(s.result!.multiplier)})}
    view?.render(s,at)
    if(s.phase==='failed'&&at>=crashRendered+impactDelay&&impact!==s.roundId){impact=s.roundId!;audio.cue('impact');element.dataset.audioImpactFrame=String(at);trackFreePlay('demo_round_complete',base);if(wallet.getSnapshot().session.settings.haptics)navigator.vibrate?.([45,30,25])}
    if(s.phase==='ready')audio.active(false)
    frame=requestAnimationFrame(render)
   };frame=requestAnimationFrame(render)
  }).catch(()=>{if(!stopped)setLoadError(true)})
  return()=>{stopped=true;cancelAnimationFrame(frame);view?.dispose();audio.active(false)}
 },[engine,audio,wallet,locale,countryCode,attempt,presentationNow])
 function start(){try{audio.unlock();const result=engine.start(stake,auto||null);setError(!result.ok);if(result.ok)trackFreePlay('demo_round_start',{originalId:LEVANTA.id,originalSlug:LEVANTA.slug,category:LEVANTA.category,locale,country:countryCode,roundId:engine.getSnapshot().roundId!})}catch{setError(true)}}
 return <div className={styles.game} data-three-game="skuptu-levanta"><PlayGameShell game={LEVANTA} compact roundActive={active} controls={<div className={styles.controls}>
 <label style={{gridColumn:'span 2'}}>{copy.stake}<select value={stake} disabled={active} onChange={e=>setStake(Number(e.target.value))}>{[100,200,500,1000,2500,5000].map(n=><option value={n} key={n}>{format(n)}</option>)}</select></label>
 <label>{copy.auto}<select value={auto} disabled={active} onChange={e=>setAuto(Number(e.target.value))}><option value={0}>{copy.off}</option>{[110,125,150,200,300,500,1000].map(n=><option key={n} value={n}>{(n/100).toFixed(2)}×</option>)}</select></label>
 <button className={styles.action} disabled={!loaded||(active&&(round.phase!=='lifting'||round.wager!=='active'))} onClick={()=>round.phase==='lifting'?engine.cashOut():start()}>{round.phase==='lifting'&&round.wager==='active'?<>{copy.cashout}<strong>{format(payoutFor(round.stake,round.multiplier))}</strong></>:round.wager==='cashed_out'?`${copy.cashed} · ${format(round.result!.payout)}`:active?copy[round.phase]:copy.start}</button>{error&&<p className={styles.error} role="alert">{copy.error}</p>}
 </div>}><div className={`${styles.stage} ${styles.gym}`}>
  <div ref={host} className={styles.canvas} aria-label="Skuptu"/>
  <div className={styles.gymHud} data-failed={round.phase==='failed'}><span>{copy[round.phase]}</span><strong>{(round.multiplier/100).toFixed(2)}×</strong></div>
  {round.wager==='cashed_out'&&<div className={styles.cashout} role="status">{copy.cashed} · {format(round.result!.payout)}</div>}
  {!loaded&&<div className={styles.overlay}><h3>SKUPTU LEVANTA</h3><p>{loadError?copy.loadError:copy.loading}</p>{loadError&&<button onClick={()=>{setLoadError(false);setAttempt(n=>n+1)}}>{copy.retry}</button>}</div>}
 </div></PlayGameShell><div className={styles.history} aria-label={copy.history}>{round.history.map(item=><span key={item.roundId}>{item.won?'✓':'×'} {(item.multiplier/100).toFixed(2)}×</span>)}</div><p className={styles.small}>{session.settings.music||session.settings.sfx?'♫ · ':''}{copy.credits}</p></div>
}
