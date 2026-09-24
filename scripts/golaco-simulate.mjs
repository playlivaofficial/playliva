// Offline/dev only. Estimates, not certification or a guarantee of future play.
// node --import tsx scripts/golaco-simulate.mjs [paidSpins] [seed] [bonusSeriesPerAward]
import simulationModule from '../lib/originals/golaco/simulation.ts'
const spins = Number(process.argv[2] ?? 1000000), seed = Number(process.argv[3] ?? 20260924), series = Number(process.argv[4] ?? 100000)
console.log(JSON.stringify({ exactBase: simulationModule.exactBaseReturn(), trigger: simulationModule.triggerProbabilities() }, null, 2))
console.log(JSON.stringify(simulationModule.simulate(spins, seed), null, 2))
console.log(JSON.stringify(simulationModule.decompose(series, seed), null, 2))
