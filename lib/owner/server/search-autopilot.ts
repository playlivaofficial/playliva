import { randomUUID } from 'node:crypto'
import { getGame } from '@/lib/data'
import { getGameContent, getCategoryName } from '@/lib/content'
import { getReferenceGame } from '@/lib/catalog'
import { referenceMetadata } from '@/lib/catalog/metadata'
import { pageMetadata } from '@/lib/discovery/seo'
import { publishedInventory } from './catalog'
import { eligibleExperiment, freshness, googleDay, measureExperiment, shiftDay, signals, titleCandidate, type Experiment, type SearchFact, type SeoState } from '../search-model'
import { searchStore, type SearchStore } from './search-store'

export function searchTarget(page: string) {
  const match=/^https:\/\/www\.playliva\.com\/pt-br\/games\/([a-z0-9-]+)$/.exec(page)
  if(!match) return null
  const slug=match[1], game=getGame(slug), reference=getReferenceGame(slug)
  let metadata=referenceMetadata('games',slug,'pt-br')
  if(!metadata && game) {
    const content=getGameContent(game,'pt-BR')
    metadata=pageMetadata({title:content.seo?.game?.title??`${game.title} — ${getCategoryName(game.category,'pt-BR')}`,path:`/games/${slug}`,localeSegment:'pt-br'})
  }
  const name=reference?.title??game?.title, title=metadata?.title
  if(!name || typeof title!=='string' || !metadata?.robots || typeof metadata.robots!=='object' || metadata.robots.index!==true) return null
  const next=titleCandidate(name)
  return next ? {previous:title,next} : null
}
export function evaluateSearch(state: SeoState, facts: SearchFact[], inventory: Set<string>, target=searchTarget, now=new Date()): SeoState {
  if(!state.enabled || !state.newest || !['current','delayed'].includes(freshness(state,now))) return state
  const next=structuredClone(state), at=now.toISOString()
  next.lastEvaluation=at
  next.experiments=next.experiments.map(experiment=>{
    if(experiment.status!=='measuring') return experiment
    const current=target(experiment.page)
    const measured:Experiment=!inventory.has(experiment.page)||!current||current.previous!==experiment.previous||current.next!==experiment.next
      ? {...experiment,status:'inconclusive',endedAt:at}
      : measureExperiment(experiment,facts,state.newest!,now)
    if(measured.status!==experiment.status||measured.measurements.length!==experiment.measurements.length) next.audit.push({at,action:measured.status==='rolled_back'?'loser / rollback':'measurement',experiment:experiment.id,page:experiment.page,reason:measured.status==='inconclusive'&&measured.measurements.length<3?'Source metadata or indexability changed; stop rather than overwrite.':`Status ${measured.status}; ${measured.measurements.map(m=>`${m.window}D ${m.verdict}`).join(', ')}. Inconclusive results restore the baseline.`})
    return measured
  })
  for(const signal of signals(facts,state.newest,inventory)) {
    const candidate=target(signal.page)
    if(!candidate || !eligibleExperiment(signal,next,now,candidate.previous,candidate.next)) continue
    const experiment:Experiment={id:randomUUID(),page:signal.page,action:'title',...candidate,reason:signal.reason,evidence:signal,baseline:{from:shiftDay(state.newest,-27),to:state.newest,measure:signal.windows[2].current},startedAt:at,startDate:shiftDay(googleDay(now),1),measurements:[],status:'measuring'}
    next.experiments.push(experiment)
    next.audit.push({at,action:'title applied',experiment:experiment.id,page:experiment.page,reason:'High-confidence PT-BR/Brazil historical CTR decline at stable rank. One title only; verified catalog name.'})
    break
  }
  return next
}
export async function evaluateAutopilot(store:SearchStore=searchStore,now=new Date()) {
  const state=await store.state()
  if(!state.newest) return {evaluated:false,changedPages:[] as string[]}
  const next=evaluateSearch(state,await store.facts(shiftDay(state.newest,-90)),new Set(publishedInventory().map(row=>'https://www.playliva.com'+row.route)),searchTarget,now)
  if(next===state) return {evaluated:false,changedPages:[] as string[]}
  if(!await store.save(next)) return {evaluated:false,changedPages:[] as string[],reason:'Owner state changed concurrently; retry on the next daily run.'}
  const changedPages=next.experiments.filter(e=>JSON.stringify(state.experiments.find(old=>old.id===e.id))!==JSON.stringify(e)).map(e=>new URL(e.page).pathname)
  return {evaluated:true,changedPages:[...new Set(changedPages)],experiments:next.experiments.length}
}
export async function setAutopilot(enabled:boolean,store:SearchStore=searchStore,now=new Date()) {
  const state=await store.state()
  if(state.enabled===enabled) return []
  const next={...state,enabled}, at=now.toISOString(), pages:string[]=[]
  if(!enabled) next.experiments=state.experiments.map(e=>{
    if(!['pending','measuring','winner'].includes(e.status)) return e
    pages.push(new URL(e.page).pathname)
    next.audit.push({at,action:'owner rollback',experiment:e.id,page:e.page,reason:'Owner kill switch restored the source title.'})
    return {...e,status:'rolled_back' as const,endedAt:at}
  })
  next.audit.push({at,action:enabled?'enabled':'disabled',reason:'Owner control. Daily reporting continues; no video actions.'})
  if(!await store.save(next)) throw new Error('Search control changed concurrently. Reload before trying again.')
  return pages
}
