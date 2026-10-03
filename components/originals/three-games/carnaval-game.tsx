'use client'
import Image from 'next/image'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useCountry } from '@/components/country-context'
import { DemoSessionProvider, useDemoSession } from '../demo-session'
import { PlayGameShell } from '../play-game-shell'
import { CARNAVAL } from '@/lib/originals/three-game-definitions'
import { threeCopy, threeNumber } from '@/lib/originals/three-game-copy'
import { createCarnavalEngine, type CarnavalEngine } from '@/lib/originals/carnaval/engine'
import { SYMBOLS,STAKES,CARNAVAL_CONFIG,PAYING_SYMBOLS,LINES } from '@/lib/originals/carnaval/config'
import { formatCredits } from '@/lib/originals/credits'
import { trackFreePlay } from '@/lib/originals/analytics'
import { useThreeAudio } from './use-audio'
import styles from './three-games.module.css'
export default function CarnavalGame(){return <DemoSessionProvider><CarnavalPlay/></DemoSessionProvider>}
export function CarnavalPlay({suppliedEngine}:{suppliedEngine?:CarnavalEngine}){
 const {locale,countryCode}=useCountry(),{wallet,session}=useDemoSession(),[engine]=useState(()=>suppliedEngine??createCarnavalEngine(wallet)),audio=useThreeAudio('carnaval-gold')
 const round=useSyncExternalStore(engine.subscribe,engine.getSnapshot,engine.getServerSnapshot),[stake,setStake]=useState(100),[error,setError]=useState(false)
 const assets=useRef(new Set<string>()),[loaded,setLoaded]=useState(false),[loadError,setLoadError]=useState(false),[attempt,setAttempt]=useState(0)
 const copy=threeCopy(locale),ready=round.phase==='ready'||round.phase==='bonus-summary',format=(n:number)=>formatCredits(n,locale)
 useEffect(()=>{let frame=0;const tick=()=>{engine.tick();frame=requestAnimationFrame(tick)};frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame)},[engine])
 const seen=useRef({spin:'',stop:0,result:'',bonus:'',meter:1,retrigger:0,summary:''})
 useEffect(()=>{
  const prev=seen.current,key=`${round.seriesId}:${round.spinAt}`,base={originalId:CARNAVAL.id,originalSlug:CARNAVAL.slug,category:CARNAVAL.category,locale,country:countryCode,roundId:round.seriesId??undefined}
  audio.active(!ready,round.free)
  if(round.phase==='spinning'&&prev.spin!==key){prev.spin=key;prev.stop=0;prev.retrigger=0;audio.cue('start');trackFreePlay(round.free?'demo_free_spin_start':'demo_round_start',base)}
  if(round.phase==='spinning'||round.phase==='result'||round.phase==='bonus-intro'||round.phase==='bonus-summary'){
   for(let i=prev.stop;i<round.stopped;i++){audio.cue('stop',i);if(round.grid[i].includes('mask'))audio.cue('special',i)}
   if(prev.stop!==round.stopped&&round.anticipation)audio.cue('anticipation',round.stopped)
   prev.stop=round.stopped
  }
  if(round.free&&prev.meter<round.streak){audio.cue('meter');trackFreePlay('demo_streak_increase',{...base,streakLevel:String(round.streak)})}prev.meter=round.streak
  if(round.retriggered>prev.retrigger){audio.cue('retrigger');trackFreePlay('demo_bonus_retrigger',{...base,spinsAwarded:String(round.retriggered)})}prev.retrigger=round.retriggered
  if(round.result&&round.phase!=='spinning'&&prev.result!==round.result.id){prev.result=round.result.id;const ratio=round.result.evaluation.payout/round.stake,tier=ratio>=50?'huge':ratio>=10?'big':'win';if(ratio>0){audio.cue(tier);trackFreePlay('demo_slot_win',{...base,winTier:tier});if(session.settings.haptics)navigator.vibrate?.(35)}if(!round.free&&!round.result.evaluation.awardedSpins)trackFreePlay('demo_round_complete',base)}
  if(round.phase==='bonus-intro'&&prev.bonus!==round.seriesId){prev.bonus=round.seriesId!;audio.cue('bonus');trackFreePlay('demo_bonus_trigger',{...base,spinsAwarded:String(round.bonusAwarded)})}
  if(round.phase==='bonus-summary'&&prev.summary!==round.seriesId){prev.summary=round.seriesId!;audio.cue('summary');trackFreePlay('demo_bonus_complete',{...base,spinsAwarded:String(round.bonusAwarded),streakLevel:String(round.streak)});trackFreePlay('demo_round_complete',base)}
 },[round,audio,ready,locale,countryCode,session.settings.haptics])
 const payout=round.result?.evaluation.payout??0,win=round.phase!=='spinning'&&payout>0,winning=new Set(win?round.result?.evaluation.winningCells:[])
 function start(){audio.unlock();setError(!engine.spin(stake).ok)}
 return <div className={styles.game} data-three-game="carnaval-gold" data-turbo={session.settings.turbo}>
 <PlayGameShell game={CARNAVAL} compact roundActive={!ready} controls={<div className={styles.controls}>
 <label style={{gridColumn:'1/-1'}}>{copy.stake}<select value={stake} disabled={!ready} onChange={e=>setStake(Number(e.target.value))}>{STAKES.map(n=><option value={n} key={n}>{format(n)}</option>)}</select></label>
 <button className={styles.action} onClick={start} disabled={!ready||!loaded}>{ready?copy.spin:round.free?`${copy.free} · ${round.bonusRemaining}`:copy.spinning}</button>{error&&<p role="alert" className={styles.error}>{copy.error}</p>}
 </div>}>
 <div className={`${styles.cabinet} ${round.free?styles.bonusActive:''}`}>
 <div className={styles.cabinetHeader}><span className={styles.eyebrow}>LIVA</span><h2>CARNAVAL GOLD</h2><div className={styles.lines}>20 {locale==='pt-BR'?'LINHAS':locale.startsWith('es-')?'LÍNEAS':'LINES'} · PLAYLIVA ORIGINAL</div></div>
 <div className={styles.reels}>{round.grid.map((reel,col)=><div key={col} className={`${styles.reel} ${round.phase==='spinning'&&col>=round.stopped?styles.moving:''}`} data-reel={col} data-stopped={col<round.stopped}>{reel.map((symbol,row)=><div className={styles.symbol} key={row} data-win={winning.has(col*3+row)} data-special={symbol==='mask'||symbol==='note'}><span className={styles.symbolArt}><Image src={`/originals/carnaval-gold/${symbol}.webp`} alt={copy.symbols[SYMBOLS.indexOf(symbol)]} fill sizes="(max-width:600px) 18vw, 150px"/></span></div>)}</div>)}</div>
 <div className={styles.meter}><span>{copy.meter}</span>{[1,2,3,4,5].map(n=><b key={n} data-on={n<=round.streak}>×{n}</b>)}{round.free&&<span>{copy.free}: {round.bonusRemaining}</span>}</div>
 <div className={styles.banner} role="status" aria-live="polite">{round.anticipation?copy.anticipation:round.retriggered>0?`+${round.retriggered} · ${copy.retrigger}`:win?<><span>{payout/round.stake>=50?copy.huge:payout/round.stake>=10?copy.big:copy.win}</span><strong>{format(payout)}</strong></>:ready?copy.ready:copy.spinning}</div>
 {round.free&&<div className={styles.small}>{copy.total}: <span className={styles.ret}>{format(round.bonusTotal)}</span></div>}
 {(round.phase==='bonus-intro'||round.phase==='bonus-summary')&&<div className={styles.overlay}><span className={styles.eyebrow}>LIVA CARNAVAL GOLD</span><h3>{round.phase==='bonus-intro'?copy.bonus:copy.summary}</h3><strong>{round.phase==='bonus-intro'?round.bonusAwarded:format(round.bonusTotal)}</strong><p>{round.phase==='bonus-intro'?copy.free:copy.total} · {copy.meter} ×{round.streak}</p><button onClick={()=>{audio.unlock();engine.continueBonus()}}>{copy.continue}</button></div>}
 {round.phase==='error'&&<div className={styles.overlay} role="alert"><p>{copy.roundError}</p><button onClick={()=>{audio.unlock();engine.continueBonus()}}>{copy.retry}</button></div>}
 {!loaded&&<div className={styles.overlay}><h3>CARNAVAL GOLD</h3><p>{loadError?copy.loadError:copy.loading}</p>{loadError&&<button onClick={()=>{assets.current.clear();setLoadError(false);setAttempt(n=>n+1)}}>{copy.retry}</button>}</div>}
 <div className={styles.hidden} aria-hidden="true">{SYMBOLS.map(symbol=><Image key={`${symbol}-${attempt}`} src={`/originals/carnaval-gold/${symbol}.webp`} alt="" width={1} height={1} loading="eager" unoptimized onLoad={()=>{assets.current.add(symbol);if(assets.current.size===SYMBOLS.length)setLoaded(true)}} onError={()=>setLoadError(true)}/>)}</div>
 </div></PlayGameShell>
 <details className={styles.help}><summary>{locale==='pt-BR'?'Linhas e pagamentos':locale.startsWith('es-')?'Líneas y pagos':'Lines and payouts'}</summary><p>{copy.payNote}</p><table><thead><tr><th>{copy.result}</th><th>3</th><th>4</th><th>5</th></tr></thead><tbody>{PAYING_SYMBOLS.map(s=><tr key={s}><th>{copy.symbols[SYMBOLS.indexOf(s)]}</th>{CARNAVAL_CONFIG.paytable[s].map((n,i)=><td key={i}>{threeNumber(n*LINES.length/CARNAVAL_CONFIG.payScale,locale,2)}×</td>)}</tr>)}</tbody></table><svg viewBox="0 0 600 250" role="img" aria-label="20"><g stroke="#dfbd64" strokeWidth="2" fill="none">{LINES.map((line,i)=><g key={i} transform={`translate(${i%5*120},${Math.floor(i/5)*60})`}><rect x="10" y="5" width="95" height="45" opacity=".2"/><polyline points={line.map((r,c)=>`${18+c*19},${13+r*15}`).join(' ')}/></g>)}</g></svg></details>
 </div>
}
