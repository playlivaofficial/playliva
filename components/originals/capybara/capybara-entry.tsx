'use client'
import dynamic from 'next/dynamic'
import { useCountry } from '@/components/country-context'
import { capybaraCopy } from '@/lib/originals/capybara/copy'
function Poster() {
  const { locale } = useCountry()
  return <div role="status" className="mx-auto grid min-h-96 max-w-7xl place-items-center rounded-2xl bg-emerald-950 p-6 text-emerald-50"
    style={{ backgroundImage: "linear-gradient(#00332aaa,#00332aaa),url('/originals/capybara-gold/river.webp')", backgroundSize: 'cover' }}>
    <div><h1 className="text-2xl font-bold">Liva Capybara Gold</h1><p>{capybaraCopy(locale).loading}</p></div>
  </div>
}
const Game = dynamic(() => import('./capybara-game'), { loading: Poster })
export default function CapybaraEntry() { return <Game /> }
