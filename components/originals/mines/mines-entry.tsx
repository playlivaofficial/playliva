'use client'
import dynamic from 'next/dynamic'
import { useCountry } from '@/components/country-context'
import { minesCopy } from '@/lib/originals/mines/copy'
import { LIVA_MINES } from '@/lib/originals/mines/config'
function Poster() {
  const { locale } = useCountry()
  return <div role="status" className="mx-auto grid min-h-96 max-w-7xl place-items-center rounded-2xl bg-emerald-950 p-6 text-emerald-50"
    style={{ backgroundImage: "linear-gradient(#00162190,#001621b0),url('/originals/mines/jungle-poster.svg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
    <div><p className="text-2xl font-bold">{LIVA_MINES.title[locale]}</p><p>{minesCopy(locale).loading}</p></div>
  </div>
}
const Game = dynamic(() => import('./mines-game'), { loading: Poster })
export default function MinesEntry() { return <Game/> }
