// Offline engine verification, NOT a basic-strategy house-edge estimator.
import simulationModule from '../lib/originals/blackjack/simulation.ts'
console.log(JSON.stringify(simulationModule.simulateBlackjack(Number(process.argv[2] ?? 1000000), Number(process.argv[3] ?? 7132026)), null, 2))
