import type { DiscoveryEntry } from './catalog'
import { normalizeSearch } from '@/lib/catalog/query'
export const DIRECTORY_PAGE_SIZE=12
export type DirectoryParams={q?:string;category?:string;provider?:string;kind?:string;format?:string;page?:string}
export function searchScore(game:DiscoveryEntry,query:string):number {
  const q=normalizeSearch(query),title=normalizeSearch(game.title)
  if(!q)return 1
  if(title===q)return 100
  if(title.startsWith(q))return 90
  if(game.aliases.some(a=>normalizeSearch(a)===q))return 85
  if(title.includes(q))return 80
  const words=q.split(/\s+/),text=normalizeSearch([game.searchText,...game.aliases,game.format].join(' '))
  if(words.every(w=>title.includes(w)))return 75
  if(words.every(w=>text.includes(w)))return 50
  // A bounded, one-character typo fallback. Exact/provider matches always rank above it.
  if(q.length>=5&&!q.includes(' ')){
    const near=(word:string)=>{if(Math.abs(word.length-q.length)>1)return false;let i=0,j=0,edits=0;while(i<word.length&&j<q.length){if(word[i]===q[j]){i++;j++;continue}if(++edits>1)return false;if(word.length>=q.length)i++;if(q.length>=word.length)j++}return edits+(word.length-i)+(q.length-j)<=1}
    if(title.split(/\s+/).some(near))return 10
  }
  return 0
}
export function queryDirectory(entries:DiscoveryEntry[],params:DirectoryParams={}) {
  const q=(params.q||'').trim().slice(0,100)
  const unique=[...new Map(entries.map(g=>[g.href,g])).values()]
  const matches=unique.filter(g=>(!params.category||g.category===params.category)&&(!params.provider||g.providerId===params.provider)&&(!params.kind||g.kind===params.kind)&&(!params.format||g.format===params.format))
    .map(g=>({g,score:searchScore(g,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.g.title.localeCompare(b.g.title)||a.g.href.localeCompare(b.g.href)).map(x=>x.g)
  const pages=Math.max(1,Math.ceil(matches.length/DIRECTORY_PAGE_SIZE)),page=Math.min(pages,Math.max(1,Math.floor(Number(params.page)||1)))
  return {total:matches.length,pages,page,items:matches.slice((page-1)*DIRECTORY_PAGE_SIZE,page*DIRECTORY_PAGE_SIZE)}
}
export const hasDirectoryFacets=(params:Record<string,unknown>)=>Object.values(params).some(value=>Array.isArray(value)?value.some(Boolean):Boolean(value))
