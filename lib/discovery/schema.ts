import {absoluteUrl} from '@/lib/seo'
import {segmentToLocale,type LocaleSegment} from '@/lib/locale'
import {discoveryEntries} from './catalog'
export function entitySchema(slug:string,segment:LocaleSegment){
 const game=discoveryEntries(segmentToLocale(segment)).find(g=>g.kind==='provider'&&g.slug===slug)
 if(!game)return null
 const url=absoluteUrl(`/${segment}${game.href}`)
 return {'@context':'https://schema.org','@type':'VideoGame','@id':url+'#game',name:game.title,url,description:game.summary,genre:game.categoryLabel,publisher:{'@type':'Organization',name:game.provider},...(game.image?{image:absoluteUrl(game.image)}:{})}
}
export function discoveryListSchema(items:{href:string;title:string}[],segment:string){return {'@context':'https://schema.org','@type':'ItemList',itemListElement:items.map((g,i)=>({'@type':'ListItem',position:i+1,name:g.title,url:absoluteUrl(`/${segment}${g.href}`)}))}}
