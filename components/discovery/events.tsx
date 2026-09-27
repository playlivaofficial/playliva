'use client'
import {useEffect,useRef,type ReactNode} from 'react'
import {track} from '@/lib/tracking'
/** Event identifiers only: no search terms, input values or parameter strings. */
export function DiscoveryEvents({children,surface,slug}:{children:ReactNode;surface:string;slug?:string}){
 const root=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  const element=root.current
  if(surface==='provider')track('provider_view',{pageSlug:slug,surface})
  if(surface==='reference')track('game_view',{gameSlug:slug,pageType:'game',surface})
  function clicked(event:MouseEvent){const link=(event.target as Element).closest<HTMLAnchorElement>('a[data-provider-card]');if(link)track('discovery_click',{surface,gameSlug:link.dataset.providerCard,placement:link.dataset.originalCard?'original_cross_discovery':'related_game'})}
  function submitted(){track('discovery_search',{surface,placement:'game_directory'})}
  element?.addEventListener('click',clicked);element?.addEventListener('submit',submitted)
  return()=>{element?.removeEventListener('click',clicked);element?.removeEventListener('submit',submitted)}
 },[surface,slug])
 return <div ref={root}>{children}</div>
}
