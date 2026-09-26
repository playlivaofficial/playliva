import { mkdir, writeFile } from 'node:fs/promises'
import cards from '../lib/originals/blackjack/cards.ts'
import brasil from '../lib/originals/brasil21/engine.ts'
import raio from '../lib/originals/raio/math.ts'
const rounds=300000
let seed=0x214b2026
const random={uint32(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return seed>>>0}}
let staked=0,returned=0,bonus=0,naturals=0,sum=0,squares=0
const basic=(hand,up,first)=>{
 const {total,soft}=cards.handValue(hand)
 if(first&&!soft&&((total===9&&up>=3&&up<=6)||(total===10&&up<=9)||(total===11&&up<=10)))return'double'
 if(soft){if(first&&((total>=15&&total<=17&&up>=4&&up<=6)||(total===18&&up>=3&&up<=6)))return'double';return total>=19||(total===18&&[2,7,8].includes(up))?'stand':'hit'}
 return total>=17||(total>=13&&up<=6)||(total===12&&up>=4&&up<=6)?'stand':'hit'
}
for(let i=0;i<rounds;i++){
 const deck=cards.createDeck(6);let remain=deck.length
 const draw=()=>{const at=cards.randomBelow(random,remain),card=deck[at];deck[at]=deck[--remain];return card}
 const p=[draw()],d=[draw()];p.push(draw());d.push(draw())
 const power=cards.RANKS[cards.randomBelow(random,13)];let stake=100
 if(!cards.handValue(p).blackjack&&!cards.handValue(d).blackjack){
  for(let decisions=0;decisions<21;decisions++){const action=basic(p,d[0].rank==='A'?11:cards.cardValue(d[0]),p.length===2);if(action==='stand')break;p.push(draw());if(action==='double'){stake*=2;break}if(cards.handValue(p).total>=21)break}
  if(!cards.handValue(p).bust)while(cards.handValue(d).total<17)d.push(draw())
 }
 const r=brasil.settleBrasil(p,d,stake,power);staked+=stake;returned+=r.returned;bonus+=Number(r.outcome==='power');naturals+=Number(cards.handValue(p).blackjack);const net=(r.returned-stake)/100;sum+=net;squares+=net*net
}
const error=1.96*Math.sqrt((squares/rounds-(sum/rounds)**2)/rounds)
const report={seed:'0x214b2026',rounds,roulette:{expectedReturn:raio.RAIO_EXPECTED_RETURN,selectedNumbers:4,meanBoost:69,maxBoost:260,boostHitPerSingleNumber:4/1369,ordinaryStraightTotal:32},blackjack:{returnedPerCredit:returned/staked,netPerInitialStake:sum/rounds,net95PercentInterval:[sum/rounds-error,sum/rounds+error],powerWinFrequency:bonus/rounds,naturalFrequency:naturals/rounds,strategy:'Documented hard/soft hit/stand/double heuristic; no split, surrender or insurance. Fresh six-deck shoe each hand. This is simulated, not a certified theoretical RTP.'}}
await mkdir('social/output/power-qa',{recursive:true});await writeFile('social/output/power-qa/math.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))
