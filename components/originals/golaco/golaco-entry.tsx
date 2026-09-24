'use client'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useCountry } from '@/components/country-context'
import { golacoCopy } from '@/lib/originals/golaco/copy'
import { GOLACO_POSTER } from '@/lib/originals/golaco/definition'
function Poster() {
  const { locale } = useCountry()
  return <div role="status" className="relative mx-auto grid min-h-96 max-w-7xl place-items-end overflow-hidden rounded-2xl bg-emerald-950 p-6 text-emerald-50">
    <Image src={GOLACO_POSTER} alt="" fill sizes="(max-width: 767px) 100vw, 1280px" priority className="object-cover opacity-80" />
    <div className="relative"><p className="text-2xl font-bold">Liva Golaço</p><p>{golacoCopy(locale).loading}</p></div>
  </div>
}
const Game = dynamic(() => import('./golaco-game'), { loading: Poster })
export default function GolacoEntry() { return <Game /> }
