'use client'
import { DemoSessionProvider } from '../demo-session'
import dynamic from 'next/dynamic'
import { useCountry } from '@/components/country-context'
import { powerCopy } from '@/lib/originals/power-copy'
function Loading(){const {locale}=useCountry();return <div role="status" className="grid min-h-96 place-items-center rounded-2xl bg-emerald-950 text-white">{powerCopy(locale).loading}</div>}
const Raio=dynamic(()=>import('./raio-game'),{loading:Loading})
const Brasil=dynamic(()=>import('./brasil-game'),{loading:Loading})
export default function PowerEntry({kind}:{kind:'raio'|'brasil21'}){return <DemoSessionProvider>{kind==='raio'?<Raio/>:<Brasil/>}</DemoSessionProvider>}
