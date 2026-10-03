import crawl from '@/data/owner/discovery-crawl.json'
import {discoveryEntries} from '@/lib/discovery/catalog'
import {entityQuality,discoveryIndexability} from '@/lib/discovery/indexability'
import {PROVIDERS} from '@/lib/catalog'
import {GAMES,CATEGORIES} from '@/lib/data'
import {LOCALE_SEGMENTS,segmentToLocale} from '@/lib/locale'
import {RTP_EVIDENCE} from '@/lib/rtp'
import {editorialLinks} from '@/lib/discovery/links'
import {publishedInventory} from './catalog'
import type {Opportunity} from '../metrics'
import type {Filters} from '../model'
export function discoveryHealth(filters:Filters){
 const entries=discoveryEntries('pt-BR'),real=entries.filter(g=>g.kind==='provider'),originals=entries.filter(g=>g.kind==='original')
 const included=(path:string)=>(!filters.locale||path.startsWith('/'+filters.locale+'/'))&&(!filters.route||filters.route===path)&&(!filters.game||path.endsWith('/play/'+filters.game))
 const quality=LOCALE_SEGMENTS.flatMap(segment=>real.map(game=>({route:`/${segment}/games/${game.slug}`,title:game.title,locale:segment,...entityQuality(game.slug,segment)}))).filter(g=>included(g.route))
 const excludedAvailability=LOCALE_SEGMENTS.flatMap(segment=>GAMES.map(game=>({route:`/${segment}/where-to-play/${game.slug}`,decision:discoveryIndexability(`/where-to-play/${game.slug}`,segment)}))).filter(g=>included(g.route)&&!g.decision.index)
 const links=crawl.pages.filter(g=>included(g.path)),weak=links.filter(g=>g.inbound<2),inventory=publishedInventory().filter(g=>included(g.route))
 const opportunities:Opportunity[]=[...quality.filter(g=>!g.index).map(g=>({id:'entity-'+g.route.replaceAll('/','-'),kind:'entity-quality',topic:g.title,route:'https://www.playliva.com'+g.route,priority:1,source:'Catalog quality gate',reason:g.reasons.join('; '),action:'Add source-supported, localized content or approved artwork before indexing.'})),...weak.map(g=>({id:'links-'+g.path.replaceAll('/','-'),kind:'weak-links',topic:g.path,route:'https://www.playliva.com'+g.path,priority:g.inbound===0?1:2,source:`Rendered crawl: ${crawl.environment}`,reason:`${g.inbound} incoming links from distinct sitemap pages in the ${crawl.observedAt.slice(0,10)} crawl.`,action:'Add a relevant category/provider/entity link. Re-crawl to verify the improvement.'}))]
 return {realGames:real.length,originals:originals.length,artwork:real.filter(g=>g.image).length,verifiedRtp:Object.keys(RTP_EVIDENCE).length,unknownRtp:real.length-Object.keys(RTP_EVIDENCE).length,quality,excludedAvailability,weak,opportunities,sitemapCount:inventory.length,crawl:{observedAt:crawl.observedAt,environment:crawl.environment,base:crawl.base,count:links.length,orphans:links.filter(g=>g.inbound===0).length,duplicates:crawl.duplicates.length,failures:crawl.failures.length},
  providers:PROVIDERS.map(p=>({name:p.name,route:`/providers/${p.id}`,games:real.filter(g=>g.providerId===p.id).length})),
  clusters:[...CATEGORIES.map(c=>{const games=real.filter(g=>g.category===c.slug||c.slug==='table-games'&&g.format==='blackjack');return {category:c.slug,games:games.length,originals:originals.filter(g=>g.category===c.slug||c.slug==='live-casino'&&g.category==='table-games').length,providers:new Set(games.map(g=>g.providerId)).size,editorialPaths:editorialLinks(games.map(g=>g.slug),segmentToLocale('pt-br')).length}}),{category:'arcade',games:0,originals:originals.filter(g=>g.category==='arcade').length,providers:0,editorialPaths:0}]}
}
