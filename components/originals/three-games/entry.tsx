'use client'
import { lazy, Suspense } from 'react'
import { useCountry } from '@/components/country-context'
import { threeCopy } from '@/lib/originals/three-game-copy'
import type { ThreeGameKind } from '@/lib/originals/three-game-definitions'
const Samba=lazy(()=>import('./samba-game')),Levanta=lazy(()=>import('./levanta-game')),Carnaval=lazy(()=>import('./carnaval-game'))
export function ThreeGameEntry({kind}:{kind:ThreeGameKind}){const {locale}=useCountry();return <Suspense fallback={<p className="p-10 text-center" role="status">{threeCopy(locale).loading}</p>}>{kind==='samba-drop'?<Samba/>:kind==='skuptu-levanta'?<Levanta/>:<Carnaval/>}</Suspense>}
