import test from 'node:test'
import assert from 'node:assert/strict'
import sessionModule from '../lib/originals/session.ts'
import mixModule from '../lib/originals/audio-mix.ts'
import timingModule from '../lib/originals/slot-speed.ts'
import helpModule from '../lib/originals/game-help.ts'
import capyModule from '../lib/originals/capybara/engine.ts'
import golacoModule from '../lib/originals/golaco/engine.ts'
const {createDemoSessionStore,decodeSession,audioPreferences,DEMO_STORAGE_KEY}=sessionModule

test('Casino preferences migrate legacy sound, persist independent buses and default to Normal without altering ledger',()=>{
 let raw=null;const storage={getItem:()=>raw,setItem:(_,v)=>raw=v},wallet=createDemoSessionStore(()=>storage,()=>1)
 wallet.hydrate();assert.deepEqual(audioPreferences(wallet.getSnapshot().session.settings),{music:false,sfx:false});assert.equal(Boolean(wallet.getSnapshot().session.settings.turbo),false)
 wallet.debit(100);const ledger=wallet.getSnapshot().session.transactions
 wallet.setSettings({sound:true,haptics:true,music:false,sfx:true,turbo:true})
 const restored=createDemoSessionStore(()=>storage);restored.hydrate();assert.deepEqual(restored.getSnapshot().session.settings,{sound:true,haptics:true,music:false,sfx:true,turbo:true});assert.deepEqual(restored.getSnapshot().session.transactions,ledger)
 const v=JSON.parse(raw);v.settings={sound:true,haptics:false};assert.deepEqual(audioPreferences(decodeSession(JSON.stringify(v)).settings),{music:true,sfx:true})
 v.settings.music='yes';assert.equal(decodeSession(JSON.stringify(v)),null)
 assert.equal(wallet.setSettings({sound:true,haptics:false,sfx:'yes'}),false)
 wallet.acquireRound('active');assert.equal(wallet.setSettings({sound:false,haptics:false,music:false,sfx:false}),true);assert.equal(wallet.reset().ok,false)
 assert.equal(DEMO_STORAGE_KEY,'playliva.originals.session')
})
test('Independent preference gates cannot be undone by automation on a music or effects bus',()=>{
 const nodes=[];const ctx={currentTime:5,createGain(){const n={gain:{value:1,cancelScheduledValues(){},setValueAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v}},connect(){}};nodes.push(n);return n}}
 const music={gain:{value:.12},connect(){}},sfx={gain:{value:.9},connect(){}},mix=mixModule.createAudioMix()
 mix.setMix({music:false,sfx:true});mix.connect(ctx,music,sfx,{});assert.equal(nodes[0].gain.value,0);assert.equal(nodes[1].gain.value,1)
 music.gain.value=1;assert.equal(nodes[0].gain.value,0)
 mix.setMix({music:true,sfx:false});assert.equal(nodes[0].gain.value,1);assert.equal(nodes[1].gain.value,0)
 mix.setMix({music:false,sfx:false});assert.equal(nodes[0].gain.value,0);assert.equal(nodes[1].gain.value,0)
})
for(const game of ['capybara','golaco'])test(game+': Normal/Turbo reveal identical outcomes, payouts, bonus growth, retriggers and completed cycles',()=>{
 function run(turbo){let at=0,draws=0;const wallet=createDemoSessionStore(()=>null,()=>1);wallet.setSettings({sound:false,haptics:false,turbo});const rows=game==='capybara'?4:3,scatter=game==='capybara'?'scatter':'taca';const base=game==='capybara'?['leaf','acai','pearl','flower','toucan']:['cone','luvas','apito','medalha','bandeira'];
 const draw=()=>{const g=base.map(s=>Array(rows).fill(s));if(draws===0){g[0][0]=scatter;g[1][0]=scatter;g[2][0]=scatter}if(draws===1){g[1][0]=game==='capybara'?'wild':'gol';g[2][0]=scatter}draws++;return g}
 const engine=(game==='capybara'?capyModule.createSlotEngine:golacoModule.createGolacoEngine)(wallet,{now:()=>at,id:()=>game,draw});assert.equal(engine.spin(100).ok,true);const first=engine.getSnapshot().revealAt
 // Changing stored preference cannot retime this already decided paid/bonus series.
 wallet.setSettings({sound:false,haptics:false,turbo:!turbo})
 const results=[];let previous='';for(let i=0;i<300;i++){const s=engine.getSnapshot();if(s.result&&s.result.id!==previous){results.push(s.result);previous=s.result.id}if(s.phase==='bonus-summary')break;at+=500;engine.tick()}
 const end=engine.getSnapshot();assert.equal(end.phase,'bonus-summary');assert.equal(end.bonusAwarded,9);assert.equal(end.completed,10)
 return {first,results,ledger:wallet.getSnapshot().session.transactions,completed:end.completed,draws}
 }
 const normal=run(false),turbo=run(true);assert.ok(normal.first>turbo.first);assert.deepEqual({...normal,first:0},{...turbo,first:0});assert.equal(timingModule.slotTiming(false,game).first+4*250,2200)
})
for(const locale of ['en','pt-BR','es-MX'])for(const slug of ['crash','liva-ginga','capybara-gold','golaco','blackjack','liva-21-brasil','roulette','liva-raio','mines'])test(slug+' localized lazy rules '+locale,async()=>{const help=await helpModule.loadGameHelp(slug,locale);assert.ok(help.sections.length>=4);assert.ok(help.sections.every(s=>s.title&&s.items.length&&s.items.every(Boolean)));if(['capybara-gold','golaco'].includes(slug)){assert.ok(help.paytable.length>=7);assert.ok(help.paytable.every(r=>r.rates.length===3&&r.rates.every(n=>n>0)));assert.ok(help.note)}})

// UX V2 preserves production math/configs and non-slot engines byte-for-byte.
import {readFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
test('Casino UX V2 production math and settlement remain unchanged',async()=>{const paths=["lib/originals/blackjack/cards.ts","lib/originals/blackjack/config.ts","lib/originals/blackjack/engine.ts","lib/originals/blackjack/settlement.ts","lib/originals/brasil21/engine.ts","lib/originals/capybara/config.ts","lib/originals/capybara/math.ts","lib/originals/crash/engine.ts","lib/originals/embaixadinha/engine.ts","lib/originals/football-cards.ts","lib/originals/golaco/config.ts","lib/originals/golaco/math.ts","lib/originals/mines/config.ts","lib/originals/mines/engine.ts","lib/originals/mines/math.ts","lib/originals/raio/engine.ts","lib/originals/raio/math.ts","lib/originals/roulette/config.ts","lib/originals/roulette/engine.ts"];const h=createHash('sha256');for(const path of paths)h.update(path+'\0'+(await readFile(new URL('../'+path,import.meta.url),'utf8')).replace(/\r\n/g,'\n')+'\0');assert.equal(h.digest('hex'),'74bdf89a1b7aa54c9bdfaf1ce30645fedac9e7813ac93877490faad0641ffbf9')})
