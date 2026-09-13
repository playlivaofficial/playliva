'use client'
import dynamic from 'next/dynamic'
import { useCountry } from '@/components/country-context'
import { blackjackCopy } from '@/lib/originals/blackjack/copy'
import { LIVA_BLACKJACK } from '@/lib/originals/blackjack/definition'
function Poster() {
  const { locale } = useCountry()
  return <div role="status" className="mx-auto grid min-h-96 max-w-7xl place-items-center rounded-2xl bg-emerald-950 p-6 text-emerald-50"
    style={{ backgroundImage: "linear-gradient(#001f2290,#001f22b0),url('/originals/blackjack/table-poster.svg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
    <div><h1 className="text-2xl font-bold">{LIVA_BLACKJACK.title[locale]}</h1><p>{blackjackCopy(locale).loading}</p></div>
  </div>
}
const Game = dynamic(() => import('./blackjack-game'), { loading: Poster })
export default function BlackjackEntry() { return <Game /> }
