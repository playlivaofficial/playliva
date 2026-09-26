'use client'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useCountry } from '@/components/country-context'
import { useDemoSession } from '../demo-session'
import { PlayGameShell } from '../play-game-shell'
import { createBrasilEngine, brasilActive, handValue, type HandOutcome } from '@/lib/originals/brasil21/engine'
import { BRASIL21 } from '@/lib/originals/brasil21/definition'
import type { Card } from '@/lib/originals/blackjack/cards'
import { formatCredits } from '@/lib/originals/credits'
import { powerCopy } from '@/lib/originals/power-copy'
import { trackFreePlay } from '@/lib/originals/analytics'
import { useTableAudio } from './use-table-audio'
import styles from './power.module.css'
const suits={spades:'♠',hearts:'♥',diamonds:'♦',clubs:'♣'}
function PlayingCard({card,hidden,power,label}:{card?:Card;hidden?:boolean;power?:string|null;label:string}){
  return <div className={styles.cardSlot}><div className={styles.playingCard} data-hidden={hidden} data-red={card?.suit==='hearts'||card?.suit==='diamonds'} data-power={card?.rank===power} aria-label={hidden?label:card?`${card.rank} ${suits[card.suit]}`:label}>
    <span className={styles.cardFace}>{card?<><b>{card.rank}<small>{suits[card.suit]}</small></b><span className={styles.suit}>{suits[card.suit]}</span><b className={styles.cardBottom}>{card.rank}<small>{suits[card.suit]}</small></b></>:null}</span><span className={styles.cardBack} aria-hidden="true">21<span>PL</span></span>
  </div></div>
}
export default function BrasilGame(){
  const {locale,countryCode}=useCountry(),{wallet,session}=useDemoSession(),copy=powerCopy(locale)
  const [engine]=useState(()=>createBrasilEngine(wallet)),s=useSyncExternalStore(engine.subscribe,engine.getSnapshot,engine.getServerSnapshot),[stake,setStake]=useState(1000)
  const active=brasilActive(s.phase),audio=useTableAudio('brasil21',session.settings.sound,active&&s.phase!=='result'&&s.phase!=='error'),seen=useRef(''),phaseSeen=useRef('')
  const context=useMemo(()=>({originalId:BRASIL21.id,originalSlug:BRASIL21.slug,category:BRASIL21.category,country:countryCode,locale,roundId:s.roundId??undefined}),[countryCode,locale,s.roundId])
  useEffect(()=>()=>engine.dispose(),[engine])
  useEffect(()=>{if(!active||s.phase==='player'||s.phase==='error')return;const timer=setInterval(()=>engine.tick(),40);return()=>clearInterval(timer)},[engine,active,s.phase])
  useEffect(()=>{
    const key=`${s.roundId}:${s.player.length}:${s.dealer.length}`
    if(key!==seen.current){seen.current=key;if(s.player.length||s.dealer.length)audio.cue(s.phase==='reveal'?'flip':'deal')}
    const phaseKey=`${s.roundId}:${s.phase}`;if(phaseSeen.current===phaseKey)return;phaseSeen.current=phaseKey
    if(s.phase==='deal'){audio.cue('feature');trackFreePlay('demo_round_start',context);trackFreePlay('demo_table_feature',{...context,winTier:'power-rank'})}
    if(s.phase==='result'&&s.result){const o=s.result.outcome;audio.cue(o==='power'?'power':o==='bust'?'bust':o==='push'?'push':o==='loss'?'loss':'win');trackFreePlay('demo_table_result',{...context,winTier:o})}
    if(s.phase==='ready'&&s.roundId)trackFreePlay('demo_round_complete',context)
  },[s,audio,context])
  const fmt=(n:number)=>formatCredits(n,locale),outcome=(o:HandOutcome)=>({power:copy.powerWin,blackjack:copy.blackjack,win:copy.win,loss:copy.loss,push:copy.push,bust:copy.bust}[o])
  const act=(action:'hit'|'stand'|'double')=>{audio.unlock();if(engine.act(action)){audio.cue(action);trackFreePlay('demo_table_action',{...context,winTier:action})}}
  const controls=<div className={styles.controls}>
    <div className={styles.actionBar}><div><small>{copy.stake}</small><strong>{fmt(active?s.stake:stake)}</strong></div><button className={styles.primary} disabled={active||s.phase==='error'} onClick={()=>{audio.unlock();engine.start(stake)}}>{copy.deal} <span aria-hidden="true">♠</span></button></div>
    <div className={styles.handActions}><button disabled={s.phase!=='player'} onClick={()=>act('hit')}>＋ {copy.hit}</button><button disabled={s.phase!=='player'} onClick={()=>act('stand')}>▰ {copy.stand}</button><button disabled={s.phase!=='player'||s.player.length!==2||session.balance<s.stake} onClick={()=>act('double')}>×2 {copy.double}</button></div>
    <fieldset disabled={active||s.phase==='error'} className={styles.ticket}><legend>{copy.chips}</legend><div className={styles.chips}>{[100,500,1000,2500,5000,10000].map(v=><button key={v} aria-pressed={stake===v} onClick={()=>{audio.unlock();setStake(v);audio.cue('chip')}}>{fmt(v)}</button>)}</div></fieldset>
    <p className={styles.hint}>{copy.drawHint}</p>{s.error&&<p role="alert">{copy.errors[s.error as keyof typeof copy.errors]??copy.errors.unavailable}</p>}
  </div>
  const value=handValue(s.player),dealerValue=handValue(s.dealer)
  return <div className={styles.game} data-power-game="liva-21-brasil" data-phase={s.phase} onPointerDown={()=>audio.unlock()}><PlayGameShell game={BRASIL21} compact controls={controls} roundActive={active}>
    <div className={styles.brasilStage} data-power-win={s.result?.outcome==='power'&&s.phase==='result'}>
      <div className={styles.stageHeader}><span>PLAYLIVA ORIGINALS</span><b>LIVA <em>21</em> BRASIL</b><small>{copy.free}</small></div>
      <div className={styles.powerRank}><div><small>{copy.powerRank}</small><p>{copy.powerRule}</p></div><strong key={s.roundId}>{s.power??'?'}</strong></div>
      <div className={styles.dealerArea}><div className={styles.handLabel}><span>{copy.dealer}</span>{s.dealer.length>0&&!s.holeHidden&&<b>{dealerValue.total}</b>}</div><div className={styles.cards}>{s.dealer.map((c,i)=><PlayingCard key={i===1?"hole":c.id} card={c} label={copy.hidden}/>)}{s.holeHidden&&<PlayingCard key="hole" hidden label={copy.hidden}/>}</div></div>
      <div className={styles.tableSeal} aria-live="polite"><span>{s.phase==='deal'?copy.dealing:s.phase==='player'?copy.yourTurn:['dealer','reveal'].includes(s.phase)?copy.dealerTurn:s.result?outcome(s.result.outcome):copy.ready}</span>{s.result&&<strong>{copy.returned}: {fmt(s.result.returned)}</strong>}<small>{copy.baseRule}</small></div>
      <div className={styles.playerArea}><div className={styles.handLabel}><span>{copy.player}</span>{s.player.length>0&&<b data-bust={value.bust}>{value.total}{value.soft?` · ${copy.soft}`:''}</b>}</div><div className={styles.cards}>{s.player.length?s.player.map(c=><PlayingCard key={c.id} card={c} power={s.power} label={copy.hidden}/>):<div className={styles.emptyHand}>♠ <span>21</span> ♣</div>}</div></div>
      <div className={styles.history}><span>{copy.history}</span>{s.history.length?s.history.slice(0,3).map((o,i)=><small key={i}>{outcome(o)}</small>):<small>{copy.noHistory}</small>}</div>
    </div><p className={styles.soundHint}>{copy.soundHint}</p>
  </PlayGameShell></div>
}
