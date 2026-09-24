// Offline/dev only. Estimates, not certification or a guarantee of future play.
// node --import tsx scripts/capybara-simulate.mjs [paidSpins] [seed] [bonusSeriesPerAward]
import simulationModule from '../lib/originals/capybara/simulation.ts'
const spins = Number(process.argv[2] ?? 1000000), seed = Number(process.argv[3] ?? 6242026), series = process.argv[4]
console.log(JSON.stringify(simulationModule.simulate(spins, seed), null, 2))
if (series) console.log(JSON.stringify(simulationModule.decompose(spins, Number(series), seed), null, 2))
