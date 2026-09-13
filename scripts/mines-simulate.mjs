import module from '../lib/originals/mines/simulation.ts'
console.log(JSON.stringify(module.simulateMines(Number(process.argv[2] ?? 100000), Number(process.argv[3] ?? 9132026)), null, 2))
