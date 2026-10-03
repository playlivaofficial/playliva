'use client'

import { useCountry } from '@/components/country-context'
import { LocaleLink } from '@/components/locale-link'
import { geoEditorial } from '@/lib/geo-editorial'

/** Informational country context lives below discovery; it never grants GEO eligibility. */
export function GeoEditorialGuide({ surface }: { surface: 'home' | 'games' }) {
  const { locale } = useCountry()
  const country = geoEditorial(locale)
  if (!country) return null
  return <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8" data-geo-editorial={country.code}>
    <div className="rounded-2xl border border-border bg-card/40 p-5 sm:p-7">
      <h2 className="font-display text-2xl font-bold">{surface === 'home' ? `Descubrir juegos desde ${country.name}` : `Cómo usar este catálogo en ${country.name}`}</h2>
      <p className="mt-4 max-w-4xl leading-relaxed text-muted-foreground">{country.intro}</p>
      <h3 className="mt-5 text-lg font-semibold">{surface === 'home' ? `Moneda y créditos: ${country.currency}` : 'Qué comprobar antes de elegir un destino'}</h3>
      {surface === 'home'
        ? <p className="mt-2 max-w-4xl leading-relaxed text-muted-foreground">{country.money}</p>
        : <ol className="mt-3 list-decimal space-y-3 pl-5 text-muted-foreground">{country.checks.map(check => <li key={check}>{check}</li>)}</ol>}
      <p className="mt-4 text-sm text-muted-foreground">PlayLiva no acepta apuestas ni depósitos. Las recomendaciones comerciales se muestran solo si están aprobadas, activas y habilitadas para la ubicación de la visita.</p>
      <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-primary" aria-label={`Guía de ${country.name}`}>
        <LocaleLink href={surface === 'home' ? '/games' : '/'}>{surface === 'home' ? 'Explorar el catálogo' : `PlayLiva ${country.name}`}</LocaleLink>
        <LocaleLink href="/operators">Revisar operadores</LocaleLink>
        <LocaleLink href="/responsible-gaming">Juego responsable</LocaleLink>
      </nav>
    </div>
  </section>
}
