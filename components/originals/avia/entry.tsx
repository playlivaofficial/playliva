'use client'
import dynamic from 'next/dynamic'
import { useCountry } from '@/components/country-context'
import { aviaCopy } from '@/lib/originals/avia/copy'

const Game = dynamic(() => import('./game'), { ssr: false, loading: () => <Loading /> })
function Loading() { const { locale } = useCountry(); return <div className="min-h-96 p-6"><h1 className="text-2xl font-bold">Liva Skyline</h1><p role="status">{aviaCopy(locale).syncing}</p></div> }
export function AviaEntry() { return <Game /> }
