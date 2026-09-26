import { type DemoSessionStore, MAX_CREDIT_UNITS, isDemoIdentifier } from '../session'
import { createDeck, shuffledCards, secureCardRandom, randomBelow, RANKS, handValue, type Card, type Rank, type CardRandom } from '../blackjack/cards'
import { BRASIL21 } from './definition'
export { handValue } from '../blackjack/cards'
export type BrasilPhase='ready'|'deal'|'player'|'hit'|'reveal'|'dealer'|'result'|'error'
export const brasilActive=(phase:BrasilPhase)=>phase!=='ready'
export const CARD_MS=210, REVEAL_MS=360, HAND_RESULT_MS=1300
export type HandOutcome='blackjack'|'power'|'win'|'loss'|'push'|'bust'
export function settleBrasil(player:readonly Card[],dealer:readonly Card[],stake:number,power:Rank){
  const p=handValue(player),d=handValue(dealer)
  let outcome:HandOutcome,returned=0
  if(p.bust)outcome='bust'
  else if(p.blackjack&&d.blackjack){outcome='push';returned=stake}
  else if(d.blackjack)outcome='loss'
  else if(p.blackjack){const boosted=player.some(c=>c.rank===power);outcome=boosted?'power':'blackjack';returned=stake*(boosted?4:2.2)}
  else if(d.bust||p.total>d.total){outcome='win';returned=stake*2}
  else if(p.total===d.total){outcome='push';returned=stake}
  else outcome='loss'
  return Object.freeze({outcome,returned:Math.round(returned),stake,profit:Math.round(returned)-stake})
}
export interface BrasilSnapshot {phase:BrasilPhase;roundId:string|null;player:readonly Card[];dealer:readonly Card[];holeHidden:boolean;power:Rank|null;stake:number;doubled:boolean;result:ReturnType<typeof settleBrasil>|null;completed:number;error:string|null;history:readonly HandOutcome[]}
export function createBrasilEngine(wallet:DemoSessionStore,options:{now?:()=>number;id?:()=>string;random?:CardRandom;deck?:()=>Card[];power?:()=>Rank}={}){
  const now=options.now??(()=>performance.now()),id=options.id??(()=>crypto.randomUUID()),random=options.random??secureCardRandom
  const initial:BrasilSnapshot={phase:'ready',roundId:null,player:[],dealer:[],holeHidden:true,power:null,stake:0,doubled:false,result:null,completed:0,error:null,history:[]}
  let state=initial,cards:Card[]=[],cursor=0,deadline=0,locked=false,settled=false,hole:Card|null=null
  const listeners=new Set<()=>void>(),used=new Set<string>()
  const publish=(next:Partial<BrasilSnapshot>)=>{state=Object.freeze({...state,...next});listeners.forEach(fn=>fn())}
  const draw=()=>{const c=cards[cursor++];if(!c)throw Error('Deck exhausted');return c}
  const fail=(error:string)=>{publish({error});return false}
  const reveal=()=>{publish({phase:'reveal',dealer:[state.dealer[0],hole!],holeHidden:false});deadline=now()+REVEAL_MS}
  const settle=()=>{
    if(settled)return
    settled=true
    const result=settleBrasil(state.player,state.dealer,state.stake,state.power!)
    if(result.returned&&!wallet.credit(result.returned,{gameId:BRASIL21.id,roundId:state.roundId!}).ok){wallet.releaseRound(state.roundId!);publish({phase:'error',error:'unavailable'});return}
    publish({phase:'result',result,history:[result.outcome,...state.history].slice(0,8)});deadline=now()+HAND_RESULT_MS
  }
  return{
    getSnapshot:()=>state,getServerSnapshot:()=>initial,subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn)}},
    start(stake:number){
      if(state.phase!=='ready'||locked)return false
      if(![100,500,1000,2500,5000,10000].includes(stake))return fail('limit')
      locked=true
      try{
        wallet.hydrate();const session=wallet.getSnapshot().session
        if(session.balance<stake)return fail('credits')
        if(session.balance+stake*7>MAX_CREDIT_UNITS||session.sequence>Number.MAX_SAFE_INTEGER-3)return fail('limit')
        const roundId=id();if(!isDemoIdentifier(roundId)||used.has(roundId))return fail('unavailable')
        // Fresh independent six-deck shoe each hand; animation never chooses cards.
        const deck=options.deck?.()??shuffledCards(createDeck(6),random),power=options.power?.()??RANKS[randomBelow(random,13)]
        if(deck.length<20||!RANKS.includes(power))return fail('unavailable')
        if(!wallet.acquireRound(roundId))return fail('busy')
        if(!wallet.debit(stake,{gameId:BRASIL21.id,roundId}).ok){wallet.releaseRound(roundId);return fail('credits')}
        cards=deck;cursor=0;settled=false;hole=null;used.add(roundId)
        publish({phase:'deal',roundId,player:[],dealer:[],holeHidden:true,power,stake,doubled:false,result:null,error:null});deadline=now()+CARD_MS;return true
      }catch{return fail('unavailable')}finally{locked=false}
    },
    act(action:'hit'|'stand'|'double'){
      if(state.phase!=='player'||locked)return false
      locked=true
      try{
        if(action==='stand'){reveal();return true}
        if(action==='double'){
          if(state.player.length!==2)return false
          if(!wallet.debit(state.stake,{gameId:BRASIL21.id,roundId:state.roundId!}).ok)return fail('credits')
          publish({stake:state.stake*2,doubled:true})
        }
        publish({phase:'hit',player:[...state.player,draw()],error:null});deadline=now()+CARD_MS;return true
      }finally{locked=false}
    },
    tick(){
      if(locked||state.phase==='error'||!brasilActive(state.phase)||state.phase==='player'||now()<deadline)return
      locked=true
      try{
        if(state.phase==='deal'){
          const dealt=state.player.length+state.dealer.length+(hole?1:0)
          if(dealt===0||dealt===2)publish({player:[...state.player,draw()]})
          else if(dealt===1)publish({dealer:[draw()]})
          else if(dealt===3)hole=draw()
          else{if(handValue(state.player).blackjack||handValue([state.dealer[0],hole!]).blackjack)reveal();else publish({phase:'player'});return}
          deadline=now()+CARD_MS
        }else if(state.phase==='hit'){
          if(state.doubled||handValue(state.player).total>=21)reveal();else publish({phase:'player'})
        }else if(state.phase==='reveal'){
          if(handValue(state.player).bust||handValue(state.player).blackjack||handValue(state.dealer).blackjack)settle()
          else{publish({phase:'dealer'});deadline=now()+CARD_MS}
        }else if(state.phase==='dealer'){
          if(handValue(state.dealer).total<17){publish({dealer:[...state.dealer,draw()]});deadline=now()+CARD_MS}else settle()
        }else if(state.phase==='result'){wallet.releaseRound(state.roundId!);publish({phase:'ready',completed:state.completed+1})}
      }catch{wallet.releaseRound(state.roundId!);publish({phase:'error',error:'unavailable'})}finally{locked=false}
    },
    dispose(){if(state.roundId)wallet.releaseRound(state.roundId);listeners.clear()},
  }
}
