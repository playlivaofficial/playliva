import {GAMES,COMPARISONS} from '@/lib/data'
import {REFERENCE_COMPARISONS,REFERENCE_READING_LISTS} from '@/lib/catalog/editorial'
import {discoveryEntries} from './catalog'
import type {Locale} from '@/lib/types'
/** Bounded contextual editorial paths shared by category and provider hubs. */
export function editorialLinks(slugs:string[],locale:Locale){
 const entries=discoveryEntries(locale),title=(slug:string)=>entries.find(g=>g.kind==='provider'&&g.slug===slug)?.title||slug
 const similar=locale==='pt-BR'?'Jogos como':locale==='es-MX'?'Juegos como':'Games like'
 const lists=[...GAMES.map(g=>g.slug),...REFERENCE_READING_LISTS.map(g=>g.slug)].filter(s=>slugs.includes(s)).map(s=>({href:`/games-like/${s}`,title:`${similar} ${title(s)}`}))
 const comparisons=[...COMPARISONS.map(c=>({slug:c.slug,a:GAMES.find(g=>g.id===c.gameAId)!.slug,b:GAMES.find(g=>g.id===c.gameBId)!.slug})),...REFERENCE_COMPARISONS].filter(c=>slugs.includes(c.a)&&slugs.includes(c.b)).map(c=>({href:`/compare/${c.slug}`,title:`${title(c.a)} vs ${title(c.b)}`}))
 return [...lists.slice(0,6),...comparisons.slice(0,3)]
}
