import {writeFile,mkdir} from 'node:fs/promises'
import samba from '../lib/originals/samba-drop/math.ts'
import simulation from '../lib/originals/carnaval/simulation.ts'
import config from '../lib/originals/carnaval/config.ts'
await mkdir('social/output/three-game',{recursive:true})
const tables=samba.ROWS.flatMap(rows=>samba.RISKS.map(risk=>samba.configuration(rows,risk)))
const slot=simulation.simulate(1000000,20260927)
const report={samba:tables,carnaval:{...slot,exactBaseBeforeRounding:simulation.exactBaseReturn().total,triggerOdds:simulation.triggerProbabilities(),winCapPerSpin:config.CARNAVAL_CONFIG.maxWinMultiple,maxFreeSpins:config.CARNAVAL_CONFIG.maxFreeSpins}}
await writeFile('social/output/three-game/math.json',JSON.stringify(report,null,2)+'\n')
let md='# Three-game mathematical verification\n\nLocal virtual-credit models, not certified real-money games.\n\n## Liva Samba Drop\n\nEach of n independent fair left/right bits picks one path. Bucket k has probability C(n,k)/2ⁿ. Original weights exp(a·z²), with a = 0.14/0.32/0.50 and z = (k−n/2)/√(n/4), are normalized to 0.97 and floored at 0.0001×. Returns then floor at 0.01 credit. Hit frequency is 100% (all buckets return some credits); the table reports the probability of returning more than the stake.\n\n| Rows | Risk | Expected return before credit rounding | Profit frequency | Maximum |\n|---|---|---:|---:|---:|\n'
for(const t of tables)md+=`| ${t.rows} | ${t.risk} | ${(t.expectedReturn*100).toFixed(6)}% | ${(t.profitFrequency*100).toFixed(4)}% | ${t.maxMultiplier}× |\n`
md+='\nMultiplier tables, left to right; exact bucket probabilities are exposed in the local game table.\n\n'
for(const t of tables)md+=`- **${t.rows} / ${t.risk}**: ${t.multipliers.map(m=>(m/10000).toFixed(4)+'×').join(', ')}\n`
md+='\n## Skuptu Levanta\n\nDraw floor(97/(1−u)), clamped to 100…10,000 hundredths, with a secure uniform uint32 u. The familiar demo survival curve is approximately 0.97/m. Multiplier grows as exp(t/7000), capped at 100×. Cashout must occur strictly before the private failure deadline; equality loses. Rounding, the immediate-failure mass and finite cap mean this is not a blanket 97% return claim for every strategy.\n\n## Liva Carnaval Gold\n\nIndependent 5×3, 20-fixed-line configuration, nine paying symbols, Wild on reels 2–5, Scatter Masks and bonus-only Samba Notes. A line pays only its longest contiguous left-to-right match. One total stake buys all 20 lines. 3/4/5+ Masks award 8/12/20 spins. Every Note increments the persistent meter before that spin pays (cap ×5). Each bonus Mask adds one spin, with 32 total free spins maximum. 500× cap per individual spin, maximum theoretical paid-series bound 16,500× across 33 capped spins; this bound is not a claimed achievable result.\n\nSimulation: 1,000,000 paid spins, xorshift seed 20260927, stake 1.00 credit. Runtime uses secure rejection sampling, never this test PRNG.\n\n'
md+='```json\n'+JSON.stringify(report.carnaval,null,2)+'\n```\n\nAverage final meter is measured at bonus completion, not averaged across every bonus spin. Normal/Turbo share identical draws and settlements and differ only in deadlines.\n'
await writeFile('docs/three-game-math.md',md)
console.log(JSON.stringify(report.carnaval,null,2))
