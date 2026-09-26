export const SYMBOLS = ['crown','mask','note','drums','fan','jewel','macaw','tambourine','heart','diamond','club','spade'] as const
export type CarnavalSymbol = typeof SYMBOLS[number]
export type PayingSymbol = Exclude<CarnavalSymbol, 'crown' | 'mask' | 'note'>
export const PAYING_SYMBOLS: readonly PayingSymbol[] = ['drums','fan','jewel','macaw','tambourine','heart','diamond','club','spade']
export const REELS = 5, ROWS = 3
export const STAKES = [100,200,500,1000,2500,5000] as const
/** Twenty fixed, distinct line geometries. One total stake buys every line. */
export const LINES: readonly (readonly number[])[] = Object.freeze([
 [0,0,0,0,0],[1,1,1,1,1],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],
 [0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0],
 [2,1,1,1,2],[1,0,1,2,1],[1,2,1,0,1],[0,1,0,1,0],[2,1,2,1,2],
 [0,2,0,2,0],[2,0,2,0,2],[0,2,1,2,0],[2,0,1,0,2],[1,0,2,0,1],
].map(line => Object.freeze(line)))
export interface CarnavalConfig {
 readonly weights: Readonly<Record<CarnavalSymbol,number>>; readonly bonusWeights: Readonly<Record<CarnavalSymbol,number>>
 readonly paytable: Readonly<Record<PayingSymbol,readonly [number,number,number]>>; readonly payScale:number
 readonly scatterTrigger:number; readonly scatterAwards:readonly [number,number,number]; readonly retriggerSpins:number
 readonly maxFreeSpins:number; readonly maxStreak:number; readonly maxWinMultiple:number
}
export const CARNAVAL_CONFIG: CarnavalConfig = Object.freeze({
 weights:Object.freeze({crown:48,mask:29,note:0,drums:48,fan:62,jewel:74,macaw:86,tambourine:100,heart:118,diamond:132,club:145,spade:158}),
 bonusWeights:Object.freeze({crown:70,mask:11,note:28,drums:52,fan:64,jewel:76,macaw:88,tambourine:100,heart:116,diamond:130,club:142,spade:154}),
 paytable:Object.freeze({drums:[8000,25000,100000],fan:[6500,20000,70000],jewel:[5500,17000,55000],macaw:[4500,13000,40000],tambourine:[3500,10000,30000],heart:[2400,7500,22000],diamond:[2000,6000,18000],club:[1700,5000,15000],spade:[1500,4500,12000]} as const),
 payScale:2760,scatterTrigger:3,scatterAwards:Object.freeze([8,12,20] as const),retriggerSpins:1,maxFreeSpins:32,maxStreak:5,maxWinMultiple:500,
})
export function validateCarnavalConfig(c:CarnavalConfig) {
 for(const table of [c.weights,c.bonusWeights]) if(SYMBOLS.some(s=>!Number.isSafeInteger(table[s])||table[s]<0)) throw Error('Invalid weights')
 if(c.weights.note!==0||c.bonusWeights.note<=0||c.payScale<=0||c.maxFreeSpins<20||c.maxFreeSpins>60||c.maxStreak!==5||c.maxWinMultiple!==500||PAYING_SYMBOLS.some(s=>c.paytable[s].length!==3||c.paytable[s].some(n=>!Number.isSafeInteger(n)||n<=0))) throw Error('Invalid Carnaval configuration')
}
