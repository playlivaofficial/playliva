'use client'
import dynamic from 'next/dynamic'
import { useCountry } from '@/components/country-context'
import { driftCopy } from '@/lib/originals/rio-drift/copy'
const Game = dynamic(() => import('./game'), { ssr: false, loading: () => <Loading /> })
function Loading() { const { locale } = useCountry(); return <div className="min-h-96 p-6"><h1 className="text-2xl font-bold">Liva Turbo Crash</h1><p role="status">{driftCopy(locale).loading}</p></div> }
export function DriftEntry() { return <Game /> }
