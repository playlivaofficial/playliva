import simulation from '../lib/originals/roulette/simulation.ts'
console.log(JSON.stringify(simulation.simulateRoulette(Number(process.argv[2] ?? 1000000), Number(process.argv[3] ?? 8132026)), null, 2))
