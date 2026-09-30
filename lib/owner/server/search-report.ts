import type { SearchRow } from '../metrics'
import type { Filters, Source } from '../model'
import { publishedInventory } from './catalog'
import { searchStore } from './search-store'
import { aggregate, canonicalPage, freshness, shiftDay, signals, type SearchFact, type SeoState, type SearchRun, type Signal } from '../search-model'

export interface SearchData { clicks: number | null; impressions: number | null; ctr: number | null; position: number | null; queries: SearchRow[]; pages: SearchRow[]; intelligence?: { state: SeoState; runs: SearchRun[]; freshness: string; from: string; to: string; signals: Signal[]; countries: { name: string; clicks: number; impressions: number }[]; devices: { name: string; clicks: number; impressions: number }[] } }
const countryCode=(value:string)=>({br:'bra',mx:'mex',us:'usa',gb:'gbr',ge:'geo',es:'esp'}[value.toLowerCase()]??value.toLowerCase())
export async function searchSource(filters: Filters): Promise<Source<SearchData>> {
  const data: SearchData = { clicks: null, impressions: null, ctr: null, position: null, queries: [], pages: [] }
  if(!process.env.OWNER_DATABASE_URL) return {state:'not_connected',label:'Search Console performance',detail:'Durable Search Console storage is not connected. Historical browser observations remain separate.',data}
  try {
    const state=await searchStore.state(), runs=await searchStore.runs()
    if(!state.newest || !state.lastSuccess) return {state:'no_data',label:'Search Console performance',detail:'No successful persisted sync yet.',data:{...data,intelligence:{state,runs,freshness:'unavailable',from:'',to:'',signals:[],countries:[],devices:[]}}}
    const to=filters.period==='custom'?filters.to:state.newest
    const from=filters.period==='custom'?filters.from:filters.period==='all'?(state.coverageFrom??shiftDay(to,-55)):shiftDay(to,1-Number(filters.period))
    const days=Math.max(1,Math.round((Date.parse(to)-Date.parse(from))/86400000)+1)
    const facts=await searchStore.facts(shiftDay(from,-Math.max(days,56)))
    const route=filters.route || (filters.game?`/${filters.locale||'pt-br'}/play/${filters.game}`:'')
    const matches=(r:SearchFact)=> (!route||r.page===canonicalPage('https://www.playliva.com'+route)) && (!filters.locale||r.page.startsWith(`https://www.playliva.com/${filters.locale}/`)) && (!filters.geo||r.country===countryCode(filters.geo)) && (!filters.device||r.device===filters.device.toLowerCase())
    const current=(r:SearchFact)=>r.date>=from&&r.date<=to
    const selected=facts.filter(matches), withFilters=Boolean(route||filters.locale||filters.geo||filters.device)
    const totalRows=facts.filter(r=>r.grain===(withFilters?'page':'total')&&current(r)&&(!withFilters||matches(r)))
    const total=aggregate(totalRows)
    const rows=(grain:'query'|'page'):SearchRow[]=>{
      const grouped=new Map<string,SearchFact[]>()
      for(const r of selected.filter(r=>r.grain===grain)) {const key=JSON.stringify([r.page,r.query]);grouped.set(key,[...(grouped.get(key)??[]),r])}
      return [...grouped.values()].flatMap(group=>{
        const observed=group.filter(current);if(!observed.length)return []
        const prior=group.filter(r=>r.date>=shiftDay(from,-days)&&r.date<from), summary=aggregate(observed)
        return [{...summary,page:group[0].page,query:group[0].query,...(prior.length?{previousImpressions:aggregate(prior).impressions}:{})}]
      }).sort((a,b)=>b.clicks-a.clicks||b.impressions-a.impressions)
    }
    const breakdown=(key:'country'|'device')=>{
      const list=selected.filter(r=>r.grain==='page'&&current(r)), names=[...new Set(list.map(r=>r[key]))]
      return names.map(name=>({name,...aggregate(list.filter(r=>r[key]===name))})).sort((a,b)=>b.impressions-a.impressions).slice(0,20)
    }
    const health=freshness(state), rules=signals(facts,state.newest,new Set(publishedInventory().map(r=>'https://www.playliva.com'+r.route)),countryCode(filters.geo||'br'),filters.locale||'pt-br').filter(s=>!route||s.page==='https://www.playliva.com'+route)
    const coverage=state.coverageFrom&&from<state.coverageFrom?` Requested history before ${state.coverageFrom} is unavailable.`:''
    return {state:total.impressions?'connected':'no_data',label:'Persisted Google Search Console',observedAt:state.lastSuccess,detail:`Final web-search data, ${from} to ${to}. Freshness: ${health}. ${withFilters?'Page-level aggregation for the selected filters.':'Property-level totals include anonymized queries.'} Granular page/query/country/device rows can omit data that appears in less-granular Google reports. Missing rows are unknown, not zero. No Google requests occur when opening this view.${coverage}`,data:{...total,...(!totalRows.length?{clicks:null,impressions:null,ctr:null}:{}),position:total.impressions?total.position:null,pages:rows('page'),queries:rows('query'),intelligence:{state,runs,freshness:health,from,to,signals:rules,countries:breakdown('country'),devices:breakdown('device')}}}
  }catch{return {state:'unavailable',label:'Search Console performance',detail:'Persisted reporting is unavailable; Autopilot state cannot be confirmed. No edits will use missing evidence. Historical inspection records remain available.',data}}
}
