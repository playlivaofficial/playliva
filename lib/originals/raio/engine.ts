import { type DemoSessionStore, MAX_CREDIT_UNITS, isDemoIdentifier } from '../session'
import { samplePocket, type RouletteRandom } from '../roulette/config'
import { aggregateBets, rouletteBet, type BetPlacement } from '../roulette/bets'
import { createOrbitPlan, type OrbitPlan } from '../roulette/presentation'
import { selectPowerNumbers, settleRaio, type PowerNumber } from './math'
import { RAIO } from './definition'
export const CHARGE_MS = 1000, SPIN_MS = 4200, RAIO_RESULT_MS = 1200
export type RaioPhase = 'ready'|'charge'|'spin'|'result'|'error'
export const raioActive = (phase: RaioPhase) => phase !== 'ready'
export interface RaioSnapshot { phase:RaioPhase; roundId:string|null; ticket:readonly BetPlacement[]; previous:readonly BetPlacement[]; powers:readonly PowerNumber[]; orbit:OrbitPlan|null; startedAt:number; result:ReturnType<typeof settleRaio>|null; completed:number; history:readonly number[]; error:string|null }
export function createRaioEngine(wallet:DemoSessionStore, options:{now?:()=>number;id?:()=>string;random?:RouletteRandom}={}) {
  const now=options.now??(()=>performance.now()), id=options.id??(()=>crypto.randomUUID())
  const initial:RaioSnapshot={phase:'ready',roundId:null,ticket:[],previous:[],powers:[],orbit:null,startedAt:0,result:null,completed:0,history:[],error:null}
  let state=initial, pending:ReturnType<typeof settleRaio>|null=null, locked=false, credited=false, resultAt=0
  const listeners=new Set<()=>void>(), used=new Set<string>()
  const publish=(next:Partial<RaioSnapshot>)=>{state=Object.freeze({...state,...next});listeners.forEach(fn=>fn())}
  const error=(reason:string)=>{publish({error:reason});return false}
  function edit(ticket:readonly BetPlacement[]) {
    if(state.phase!=='ready'||locked)return false
    wallet.hydrate(); const stake=ticket.reduce((s,b)=>s+b.amount,0)
    if(ticket.length>250||stake>1000000)return error('limit')
    if(stake>wallet.getSnapshot().session.balance)return error('credits')
    publish({ticket:Object.freeze([...ticket]),error:null});return true
  }
  return {
    getSnapshot:()=>state,getServerSnapshot:()=>initial,subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn)}},
    place(betId:string,amount:number){if(!rouletteBet(betId)||![100,500,1000,2500,5000].includes(amount))return false;return edit([...state.ticket,{betId,amount}])},
    undo(){return edit(state.ticket.slice(0,-1))},clear(){return edit([])},repeat(){return edit(state.previous)},
    spin(){
      if(state.phase!=='ready'||locked||!state.ticket.length)return false
      locked=true
      try{
        wallet.hydrate();const stake=state.ticket.reduce((s,b)=>s+b.amount,0),session=wallet.getSnapshot().session
        if(session.balance<stake)return error('credits')
        if(session.balance-stake+stake*260>MAX_CREDIT_UNITS||session.sequence>Number.MAX_SAFE_INTEGER-2)return error('limit')
        const roundId=id(),at=now()
        if(!isDemoIdentifier(roundId)||used.has(roundId)||!Number.isFinite(at))return error('unavailable')
        // Independent uniform pocket draw; visual boosts can never steer the result.
        const number=samplePocket(options.random),powers=selectPowerNumbers(options.random)
        const ticket=aggregateBets(state.ticket),result=settleRaio(ticket,number,powers),orbit=createOrbitPlan(number,state.orbit)
        if(!wallet.acquireRound(roundId))return error('busy')
        if(!wallet.debit(stake,{gameId:RAIO.id,roundId}).ok){wallet.releaseRound(roundId);return error('credits')}
        used.add(roundId);pending=result;credited=false
        publish({phase:'charge',roundId,ticket,powers,orbit,startedAt:at,result:null,error:null});return true
      }catch{return error('unavailable')}finally{locked=false}
    },
    tick(){
      if(locked||state.phase==='error'||!raioActive(state.phase))return
      locked=true
      try{
        const elapsed=now()-state.startedAt
        if(state.phase==='charge'&&elapsed>=CHARGE_MS)publish({phase:'spin'})
        if(state.phase==='spin'&&elapsed>=CHARGE_MS+SPIN_MS&&pending&&!credited){
          credited=true;resultAt=now()
          if(pending.returned&&!wallet.credit(pending.returned,{gameId:RAIO.id,roundId:state.roundId!}).ok){wallet.releaseRound(state.roundId!);publish({phase:'error',error:'unavailable'});return}
          publish({phase:'result',result:pending,previous:state.ticket,history:[pending.number,...state.history].slice(0,12)})
        }
        if(state.phase==='result'&&now()-resultAt>=RAIO_RESULT_MS){wallet.releaseRound(state.roundId!);publish({phase:'ready',ticket:[],completed:state.completed+1})}
      }finally{locked=false}
    },
    dispose(){if(state.roundId)wallet.releaseRound(state.roundId);listeners.clear()},
  }
}
