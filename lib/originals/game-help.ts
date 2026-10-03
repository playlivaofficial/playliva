import type { Locale } from '@/lib/types'
import { settingsCopy } from './settings-copy'
export interface GameHelp { sections: { title:string; items:string[] }[]; paytable?: {symbol:string; rates:number[]}[]; note?:string }
/** Only the selected game's localized copy/config enters this lazy chunk graph. */
export async function loadGameHelp(slug:string,locale:Locale):Promise<GameHelp>{
 const t=settingsCopy(locale), sections:GameHelp['sections']=[]
 const add=(title:string,...items:string[])=>sections.push({title,items:items.flatMap(text=>text.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/u))})
 if(slug==='rio-drift'){const {driftCopy}=await import('./rio-drift/copy');const c=driftCopy(locale);add(c.rulesTitle,...c.rules);add(c.creditsTitle,c.credits);return {sections}}
 if(slug==='avia-de-janeiro'){const {aviaCopy}=await import('./avia/copy');const c=aviaCopy(locale);add(t.objective,...c.rules);add(t.credits,c.credits);return {sections}}
 if(['samba-drop','skuptu-levanta','carnaval-gold'].includes(slug)){
  const {threeCopy,threeRules}=await import('./three-game-copy');const c=threeCopy(locale)
  add(t.objective,...threeRules(slug as import('./three-game-definitions').ThreeGameKind,locale));add(t.limits,c.interruption);add(t.credits,c.credits)
  if(slug==='carnaval-gold'){const {CARNAVAL_CONFIG:config,PAYING_SYMBOLS,SYMBOLS,LINES}=await import('./carnaval/config');return {sections,note:c.payNote,paytable:PAYING_SYMBOLS.map(s=>({symbol:c.symbols[SYMBOLS.indexOf(s)],rates:config.paytable[s].map(n=>n*LINES.length/config.payScale)}))}}
  return {sections}
 }
 if(slug==='capybara-gold'){
  const [{capybaraCopy},{SLOT_CONFIG,PAYING_SYMBOLS}]=await Promise.all([import('./capybara/copy'),import('./capybara/config')]);const c=capybaraCopy(locale)
  add(t.objective,c.rules);add(t.feature,c.wildRules,c.bonusRules);add(t.limits,c.interruption);add(t.credits,c.notice)
  return {sections,note:c.paytableNote,paytable:PAYING_SYMBOLS.map(s=>({symbol:c.symbols[s],rates:SLOT_CONFIG.paytable[s].map(n=>n/SLOT_CONFIG.payScale)}))}
 }
 if(slug==='golaco'){
  const [{golacoCopy},{GOLACO_CONFIG,PAYING_SYMBOLS}]=await Promise.all([import('./golaco/copy'),import('./golaco/config')]);const c=golacoCopy(locale)
  add(t.objective,c.rules);add(t.feature,c.wildRules,c.bonusRules);add(t.limits,c.interruption);add(t.credits,c.notice)
  return {sections,note:c.paytableNote,paytable:PAYING_SYMBOLS.map(s=>({symbol:c.symbols[s],rates:GOLACO_CONFIG.paytable[s].map(n=>n/GOLACO_CONFIG.payScale)}))}
 }
 if(slug==='blackjack') {const {blackjackCopy}=await import('./blackjack/copy');const c=blackjackCopy(locale);add(t.objective,c.rules);add(t.values,t.cardValues);add(t.dealer,c.dealerRule);add(t.actions,c.actionRules,c.aceRules);add(t.payouts,c.payouts);add(t.limits,c.interruption);add(t.credits,c.notice)}
 else if(slug==='roulette'){const {rouletteCopy}=await import('./roulette/copy');const c=rouletteCopy(locale);add(t.objective,c.rules);add(t.bets,t.betCoverage);add(t.actions,c.controls);add(t.payouts,c.payouts);add(t.limits,c.interruption);add(t.credits,c.notice)}
 else if(slug==='liva-raio'||slug==='liva-21-brasil'){const {powerCopy}=await import('./power-copy');const c=powerCopy(locale),r=slug==='liva-raio'?c.raioRules:c.brasilRules;add(t.objective,...(slug==='liva-21-brasil'?[t.blackjackGoal,r[0]]:[r[0]]));if(slug==='liva-21-brasil'){add(t.values,t.cardValues);add(t.dealer,r[1])}else add(t.bets,t.betCoverage);add(t.actions,r[2]);add(t.payouts,r[3]);add(t.feature,...(slug==='liva-raio'?[r[1],...r.slice(4)]:r.slice(4)));add(t.credits,c.credits)}
 else if(slug==='mines'){const {minesCopy}=await import('./mines/copy');const c=minesCopy(locale);add(t.objective,c.rules);add(t.payouts,c.payouts);add(t.limits,c.interruption);add(t.credits,c.notice)}
 else {const c=slug==='liva-ginga'?(await import('./embaixadinha/copy')).embaixadinhaCopy(locale):(await import('./crash/copy')).crashCopy(locale);add(t.objective,c.step1,c.step2,c.step3);add(t.payouts,c.math);add(t.limits,c.interruption);add(t.credits,c.notice)}
 return {sections}
}
