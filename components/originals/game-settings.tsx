'use client'
import { useEffect, useRef, useState } from 'react'
import { Settings, Rabbit, X } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import { useDemoSession } from './demo-session'
import { audioPreferences } from '@/lib/originals/session'
import { settingsCopy } from '@/lib/originals/settings-copy'
import type { GameHelp } from '@/lib/originals/game-help'
import styles from './game-settings.module.css'
export function GameSettings({slug,ready,roundActive,haptics,fullscreen,onFullscreen,onAudioChange,holdNextRound}:{slug:string;ready:boolean;roundActive:boolean;haptics:boolean;fullscreen?:string;onFullscreen:()=>void;onAudioChange:(enabled:boolean)=>void;holdNextRound?:(open:boolean)=>void}){
 const {locale}=useCountry(),{wallet,session}=useDemoSession(),t=settingsCopy(locale)
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null)
 const [tab,setTab]=useState<'settings'|'rules'|'paytable'>('settings'),[help,setHelp]=useState<GameHelp|null>(null),[failed,setFailed]=useState(false)
 const slot=slug==='capybara-gold'||slug==='golaco'||slug==='carnaval-gold',mix=audioPreferences(session.settings)
 // Release the top layer at settlement so the existing affiliate offer can own focus.
 useEffect(()=>{if(!holdNextRound&&!roundActive&&dialog.current?.open){dialog.current.close();trigger.current?.focus()}},[roundActive,holdNextRound])
 async function info(next:'rules'|'paytable') {setTab(next);if(help)return;setFailed(false);try{const {loadGameHelp}=await import('@/lib/originals/game-help');setHelp(await loadGameHelp(slug,locale))}catch{setFailed(true)}}
 function toggle(key:'music'|'sfx'){const next={...mix,[key]:!mix[key]};if(wallet.setSettings({...session.settings,...next,sound:next.music||next.sfx}))onAudioChange(next.music||next.sfx)}
 function close(){dialog.current?.close();trigger.current?.focus()}
 return <div className={styles.root} data-casino-settings>
  <button data-casino-settings-trigger ref={trigger} type="button" disabled={!ready} onClick={()=>{setTab('settings');dialog.current?.showModal();holdNextRound?.(true)}} aria-haspopup="dialog" className={styles.trigger}><Settings size={18}/>{t.settings}{slot&&session.settings.turbo&&<Rabbit size={17} aria-label={t.turbo}/>}</button>
  <dialog ref={dialog} className={styles.dialog} aria-label={t.settings} onClose={()=>holdNextRound?.(false)} onCancel={e=>{e.preventDefault();close()}} onClick={e=>{if(e.target===e.currentTarget)close()}}>
   <div className={styles.panel}>
    <header><h2>{t.settings}</h2><button type="button" onClick={close} aria-label={t.close}><X size={20}/></button></header>
    <nav aria-label={t.settings}>{(['settings','rules',...(slot?['paytable']:[])] as const).map(key=><button type="button" key={key} aria-current={tab===key?'page':undefined} onClick={()=>key==='settings'?setTab('settings'):void info(key as 'rules'|'paytable')}>{t[key as keyof typeof t]}</button>)}</nav>
    {roundActive&&<p className={styles.notice}>{t.locked}</p>}
    {tab==='settings'?<div className={styles.options}>
     {(['music','sfx'] as const).map(key=><button type="button" role="switch" aria-checked={mix[key]} key={key} onClick={()=>toggle(key)}><span>{t[key]}</span><b>{mix[key]?t.on:t.off}</b></button>)}
     {haptics&&<button type="button" role="switch" aria-checked={session.settings.haptics} onClick={()=>wallet.setSettings({...session.settings,haptics:!session.settings.haptics})}><span>{locale==='pt-BR'?'Vibração':locale==='es-MX'?'Vibración':'Haptics'}</span><b>{session.settings.haptics?t.on:t.off}</b></button>}
     {slot&&<fieldset disabled={roundActive}><legend>{t.speed}</legend><div className={styles.speed}>{[false,true].map(turbo=><button type="button" key={String(turbo)} aria-pressed={Boolean(session.settings.turbo)===turbo} onClick={()=>wallet.setSettings({...session.settings,turbo})}>{turbo&&<Rabbit size={18}/>} {turbo?t.turbo:t.normal}</button>)}</div></fieldset>}
     {fullscreen&&<button type="button" onClick={()=>{close();onFullscreen()}}>{fullscreen}</button>}
    </div>:failed?<button type="button" onClick={()=>void info(tab)}>{t.retry}</button>:!help?<p role="status">{t.loading}</p>:tab==='rules'?<div className={styles.rules}>{help.sections.map(section=><section key={section.title}><h3>{section.title}</h3><ul>{section.items.map(item=><li key={item}>{item}</li>)}</ul></section>)}</div>:<div className={styles.rules}><p>{help.note}</p><table><caption>{t.match}</caption><thead><tr><th>{t.symbol}</th><th>3</th><th>4</th><th>5</th></tr></thead><tbody>{help.paytable?.map(row=><tr key={row.symbol}><th>{row.symbol}</th>{row.rates.map((n,i)=><td key={i}>{n.toLocaleString(locale)}×</td>)}</tr>)}</tbody></table></div>}
   </div>
  </dialog>
 </div>
}
