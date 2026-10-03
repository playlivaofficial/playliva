'use client'

import { contentLocale } from '@/lib/locale'
import dynamic from 'next/dynamic'
import { useCountry } from '@/components/country-context'
import { rouletteCopy } from '@/lib/originals/roulette/copy'
import { LIVA_ROULETTE } from '@/lib/originals/roulette/config'
function Poster() {
  const { locale } = useCountry()
  return <div role="status" className="mx-auto grid min-h-96 max-w-7xl place-items-center rounded-2xl bg-emerald-950 p-6 text-emerald-50"
    style={{ backgroundImage: "linear-gradient(#00162190,#001621b0),url('/originals/roulette/orbit-poster.svg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
    <div><p className="text-2xl font-bold">{LIVA_ROULETTE.title[contentLocale(locale)]}</p><p>{rouletteCopy(locale).loading}</p></div>
  </div>
}
const Game = dynamic(() => import('./roulette-game'), { loading: Poster })
export default function RouletteEntry() { return <Game /> }
