import 'server-only'
import type { Metadata } from 'next'
import { unstable_cache, revalidatePath, revalidateTag } from 'next/cache'
import { searchStore } from './search-store'
import { ownerStateKey } from './postgres'
import { isSearchTitleTarget } from '../search-model'

export const SEARCH_METADATA_TAG='playliva-search-titles'
// One small cached state read, never a Google request or owner-session lookup.
const overrides=unstable_cache(async(scope:string)=>{
  if(scope!==ownerStateKey()) return []
  const state=await searchStore.state()
  return state.enabled ? state.experiments.filter(e=>['measuring','winner'].includes(e.status)).map(e=>({page:e.page,previous:e.previous,next:e.next})) : []
},['search-title-overrides-v1'],{revalidate:86400,tags:[SEARCH_METADATA_TAG]})

export async function applySearchTitle(metadata:Metadata):Promise<Metadata> {
  if(!process.env.OWNER_DATABASE_URL || process.env.VERCEL_ENV==='preview') return metadata
  const page=String(metadata.alternates?.canonical??'')
  if(!isSearchTitleTarget(page) || typeof metadata.title!=='string' || typeof metadata.robots!=='object' || metadata.robots?.index!==true) return metadata
  try {
    const override=(await overrides(ownerStateKey())).find(e=>e.page===page && e.previous===metadata.title)
    return override ? {...metadata,title:override.next} : metadata
  } catch { return metadata } // Public pages remain available during storage outages.
}
export function refreshSearchTitles(pages:string[]) {
  if(!pages.length) return
  revalidateTag(SEARCH_METADATA_TAG,{expire:0})
  for(const page of new Set(pages)) revalidatePath(page)
}
