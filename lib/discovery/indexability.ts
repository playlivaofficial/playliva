import {GAMES,COMPARISONS,GAME_LISTS} from '@/lib/data'
import {getCategoryContent,getComparisonContent,getGameListContent} from '@/lib/content'
import {PROVIDERS} from '@/lib/catalog'
import {REFERENCE_COMPARISONS,REFERENCE_READING_LISTS} from '@/lib/catalog/editorial'
import {isGameListIndexableForLocale,isWhereToPlayIndexable} from '@/lib/seo-market'
import {LOCALE_SEGMENTS,segmentToLocale,type LocaleSegment} from '@/lib/locale'
import {discoveryEntries,entityContent,relatedDiscovery} from './catalog'
import type {CategorySlug} from '@/lib/types'

export interface QualityDecision {index:boolean;reasons:string[]}
export function entityQuality(slug:string,segment:LocaleSegment):QualityDecision {
 const locale=segmentToLocale(segment),entries=discoveryEntries(locale).filter(g=>g.kind==='provider'),game=entries.find(g=>g.slug===slug),content=entityContent(slug,locale),reasons:string[]=[]
 if(!game||!PROVIDERS.some(p=>p.id===game.providerId))reasons.push('Missing catalog identity/provider')
 if(!game?.image)reasons.push('Approved artwork missing')
 if(!content||content.overview.length<80||content.mechanics.length<60||content.features.length<2)reasons.push('Unique explanation/mechanics incomplete')
 if(game&&entries.some(g=>g.slug!==slug&&g.summary===game.summary))reasons.push('Duplicate summary')
 return {index:reasons.length===0,reasons}
}
/** One policy for robots, reciprocal alternates, sitemap and owner inventory. No new GEO rules. */
export function discoveryIndexability(path:string,segment:LocaleSegment):QualityDecision {
 if(path.startsWith('/owner')||path.includes('?'))return {index:false,reasons:['Private or faceted URL']}
 const [,family,slug]=path.split('/'),locale=segmentToLocale(segment)
 const verdict=(index:boolean,reason:string)=>({index,reasons:index?[]:[reason]})
 if(family==='games'&&slug)return entityQuality(slug,segment)
 if(family==='where-to-play'&&slug){const game=GAMES.find(g=>g.slug===slug);return verdict(Boolean(game&&isWhereToPlayIndexable(game,segment)),'No eligible meaningful operator option for this locale baseline')}
 if(family==='providers'&&slug){const provider=PROVIDERS.find(p=>p.id===slug),games=discoveryEntries(locale).filter(g=>g.kind==='provider'&&g.providerId===slug);return verdict(Boolean(provider&&provider.overview[locale].length>=100&&games.filter(g=>entityQuality(g.slug,segment).index).length>=2),'Provider needs a useful intro and two qualifying game entities')}
 if(family==='games-like'&&slug){const reference=REFERENCE_READING_LISTS.find(g=>g.slug===slug),legacy=GAMES.find(g=>g.slug===slug);return verdict(entityQuality(slug,segment).index&&Boolean(reference?reference.intro[locale].length>=80&&reference.alternatives.filter(a=>a.reason[locale].length>=40&&entityQuality(a.slug,segment).index).length>=2:legacy&&relatedDiscovery(discoveryEntries(locale).find(g=>g.kind==='provider'&&g.slug===slug)!,discoveryEntries(locale),'provider').length>=2),'Alternatives need a qualifying anchor and two explained related games')}
 if(family==='compare'&&slug){const reference=REFERENCE_COMPARISONS.find(c=>c.slug===slug),legacy=COMPARISONS.find(c=>c.slug===slug);return verdict(Boolean(reference?entityQuality(reference.a,segment).index&&entityQuality(reference.b,segment).index&&reference.difference[locale].every(s=>s.length>=60):legacy&&[legacy.gameAId,legacy.gameBId].every(id=>{const game=GAMES.find(g=>g.id===id);return game&&entityQuality(game.slug,segment).index})&&getComparisonContent(legacy,locale).differences.length>0),'Comparison needs two documented entities and meaningful differences')}
 if(family==='best'&&slug){if(slug==='crash-games')return verdict(true,'');const list=GAME_LISTS.find(l=>l.slug===slug);return verdict(Boolean(list&&isGameListIndexableForLocale(list,segment)&&list.gameIds.length>=2&&getGameListContent(list,locale).intro.length>=80),'Ranking lacks locale-market intent or enough documented inventory')}
 if(['crash','slots','live-casino','table-games','instant-games'].includes(family)){const games=discoveryEntries(locale).filter(g=>g.kind==='provider'&&(g.category===family||family==='table-games'&&g.format==='blackjack'));return verdict(games.length>0&&getCategoryContent(family as CategorySlug,locale).description.length>=60,'Category needs real inventory and explanatory copy')}
 return verdict(true,'')
}
export const discoveryLocales=(path:string)=>LOCALE_SEGMENTS.filter(segment=>discoveryIndexability(path,segment).index)
