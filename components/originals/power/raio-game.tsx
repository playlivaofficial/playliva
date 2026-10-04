'use client'
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { useCountry } from '@/components/country-context'
import { useDemoSession } from '../demo-session'
import { PlayGameShell } from '../play-game-shell'
import { createRaioEngine, raioActive } from '@/lib/originals/raio/engine'
import { RAIO } from '@/lib/originals/raio/definition'
import { ROULETTE_BETS } from '@/lib/originals/roulette/bets'
import { pocketColor } from '@/lib/originals/roulette/config'
import { formatCredits } from '@/lib/originals/credits'
import { powerCopy } from '@/lib/originals/power-copy'
import { trackFreePlay } from '@/lib/originals/analytics'
import { useTableAudio } from './use-table-audio'
import { RaioWheel } from './raio-wheel'
import styles from './power.module.css'
export default function RaioGame(){
  const {locale,countryCode}=useCountry(),{wallet,session}=useDemoSession(),copy=powerCopy(locale)
  const [engine]=useState(()=>createRaioEngine(wallet)),s=useSyncExternalStore(engine.subscribe,engine.getSnapshot,engine.getServerSnapshot)
  const [chip,setChip]=useState(1000),[combination,setCombination]=useState('split:1-2')
  const active=raioActive(s.phase),audio=useTableAudio('raio',session.settings.sound,active&&s.phase!=='result'&&s.phase!=='error'),seen=useRef('')
  const context=useMemo(()=>({originalId:RAIO.id,originalSlug:RAIO.slug,category:RAIO.category,country:countryCode,locale,roundId:s.roundId??undefined}),[countryCode,locale,s.roundId])
  useEffect(()=>()=>engine.dispose(),[engine])
  useEffect(()=>{
    const key=`${s.roundId}:${s.phase}`;if(seen.current===key)return;seen.current=key
    if(s.phase==='charge'){audio.cue('charge');trackFreePlay('demo_table_action',{...context,winTier:'spin'});trackFreePlay('demo_round_start',context);trackFreePlay('demo_table_feature',{...context,winTier:'four-power-numbers'})}
    if(s.phase==='spin')audio.cue('feature')
    if(s.phase==='result'&&s.result){audio.cue(s.result.boosted?'power':s.result.profit>0?'win':s.result.returned?'push':'loss');trackFreePlay('demo_table_result',{...context,winTier:s.result.boosted?'boosted':s.result.returned?'return':'loss'})}
    if(s.phase==='ready'&&s.roundId)trackFreePlay('demo_round_complete',context)
  },[s.phase,s.roundId,s.result,audio,context])
  const fmt=(v:number)=>formatCredits(v,locale),total=s.ticket.reduce((sum,b)=>sum+b.amount,0)
  const amount=(id:string)=>s.ticket.filter(b=>b.betId===id).reduce((sum,b)=>sum+b.amount,0)
  const place=(id:string)=>{audio.unlock();if(engine.place(id,chip)){audio.cue('chip');trackFreePlay('demo_table_action',{...context,winTier:'place-chip'})}}
  const typeLabel=(type:string)=>({split:copy.split,street:copy.street,corner:copy.corner,'six-line':copy.six,'first-four':copy.firstFour,dozen:copy.dozen,column:copy.column,red:copy.red,black:copy.black,odd:copy.odd,even:copy.even,low:copy.low,high:copy.high}[type]??type)
  const controls=<div className={styles.controls}>
    <div className={styles.actionBar}><div><small>{copy.stake}</small><strong>{fmt(total)}</strong></div><button className={styles.primary} disabled={active||!total||s.phase==='error'} onClick={()=>{audio.unlock();engine.spin()}}>{copy.spin} <span aria-hidden="true">↗</span></button></div>
    <fieldset disabled={active||s.phase==='error'} className={styles.ticket}><legend>{copy.chips}</legend><div className={styles.chips}>{[100,500,1000,2500,5000].map(v=><button key={v} aria-pressed={chip===v} onClick={()=>setChip(v)}>{fmt(v)}</button>)}</div>
      <div className={styles.ticketTools}><button onClick={()=>{if(engine.undo())audio.cue('remove')}} disabled={!s.ticket.length}>{copy.undo}</button><button onClick={()=>{if(engine.clear())audio.cue('remove')}} disabled={!s.ticket.length}>{copy.clear}</button><button disabled={!s.previous.length||s.ticket.length>0} onClick={()=>{if(engine.repeat())audio.cue('chip')}}>{copy.repeat}</button></div>
      <p className={styles.hint}>{copy.straightHint}</p>
      <div className={styles.numberGrid} aria-label={copy.numbers}>{Array.from({length:37},(_,n)=>{const id=`straight:${n}`,value=amount(id),power=active?s.powers.find(p=>p.number===n):undefined;return <button key={n} data-color={pocketColor(n)} data-power={Boolean(power)} data-selected={value>0} aria-label={`${copy.straight} ${n}${value?` · ${fmt(value)}`:''}`} onClick={()=>place(id)}><b>{n}</b>{power&&<small>{power.multiplier}×</small>}{value>0&&<i>{fmt(value)}</i>}</button>})}</div>
      <div className={styles.outside}>{(['red','black','odd','even','low','high'] as const).map(type=><button key={type} onClick={()=>place(`${type}:${type}`)}>{copy[type]}{amount(`${type}:${type}`)>0&&<small>{fmt(amount(`${type}:${type}`))}</small>}</button>)}</div>
      <label className={styles.combo}>{copy.inside}<select value={combination} onChange={e=>setCombination(e.target.value)} aria-label={copy.choose}>{ROULETTE_BETS.filter(b=>!['straight','red','black','odd','even','low','high'].includes(b.type)).map(b=><option key={b.id} value={b.id}>{typeLabel(b.type)} · {b.type==='dozen'||b.type==='column'?b.id.split(':')[1]:b.numbers.join(' / ')} · {b.profitOdds+1}×</option>)}</select><button onClick={()=>place(combination)}>{copy.place}</button></label>
      {s.ticket.length>0&&<div className={styles.ticketSummary}>{Object.entries(Object.groupBy(s.ticket,b=>b.betId)).map(([id,items])=><span key={id}>{id.startsWith('straight:')?`${copy.straight} ${id.split(':')[1]}`:`${typeLabel(id.split(':')[0])}${['red','black','odd','even','low','high'].includes(id.split(':')[0])?'':` ${id.split(':')[1]}`}`} <b>{fmt(items!.reduce((sum,b)=>sum+b.amount,0))}</b></span>)}</div>}
    </fieldset>{s.error&&<p role="alert">{copy.errors[s.error as keyof typeof copy.errors]??copy.errors.unavailable}</p>}
  </div>
  return <div className={styles.game} data-power-game="liva-raio" data-phase={s.phase} onPointerDown={()=>audio.unlock()}><PlayGameShell game={RAIO} compact controls={controls} roundActive={active}>
    <div className={styles.raioStage} data-boosted-win={s.result?.boosted&&s.phase==='result'}>
      <div className={styles.stageHeader}><span>PLAYLIVA ORIGINALS</span><b>LIVA <em>RAYO</em></b><small>{copy.free}</small></div>
      <div className={styles.chargeLine} data-charging={s.phase==='charge'}/>
      <div className={styles.wheelLayout}><div className={styles.wheelWrap}><RaioWheel engine={engine} audio={audio}/></div>
        <div className={styles.powerBoard}><p>{copy.powerNumbers}</p><div className={styles.powerTiles}>{[0,1,2,3].map(i=><div key={`${s.roundId}-${i}`} className={styles.powerTile}><b>{s.powers[i]?.number??'—'}</b><span>{s.powers[i]?`${s.powers[i].multiplier}×`:'⚡'}</span></div>)}</div><small>{copy.powerHint}</small>
          <div className={styles.result} aria-live="polite"><span>{s.phase==='charge'?copy.charge:s.phase==='spin'?copy.spinning:s.result?copy.landed:copy.ready}</span><strong>{s.result?.number??'⚡'}</strong>{s.result&&<><b>{s.result.profit>0?(s.result.boosted?copy.boostWin:copy.win):s.result.profit===0?copy.push:s.result.returned?copy.partial:copy.loss}</b><small>{copy.returned}: {fmt(s.result.returned)}</small><small>{copy.profit}: {s.result.profit<0?'−':s.result.profit>0?'+':''}{fmt(Math.abs(s.result.profit))}</small></>}</div>
        </div></div>
      <div className={styles.history}><span>{copy.history}</span>{s.history.length?s.history.map((n,i)=><b key={i} data-color={pocketColor(n)}>{n}</b>):<small>{copy.noHistory}</small>}</div>
    </div><p className={styles.soundHint}>{copy.soundHint}</p>
  </PlayGameShell></div>
}
