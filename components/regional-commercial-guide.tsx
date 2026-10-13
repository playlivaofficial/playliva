import { commercialSnapshot } from '@/lib/commercial/server'
import { GAMES, getOperatorsForGame } from '@/lib/data'
import { latamCountry } from '@/lib/latam-editorial'
import { LocaleLink } from '@/components/locale-link'
import { Section } from '@/components/section'
import type { Locale } from '@/lib/types'

/** Crawlable editorial references, not recommendations or outbound links.
 * Current request GEO continues to govern every existing commercial control. */
export function RegionalCommercialGuide({ locale }: { locale: Locale }) {
  const country=latamCountry(locale)
  if (!country) return null
  const snapshot=commercialSnapshot(country.code)
  const games=GAMES.filter(game=>getOperatorsForGame(game,country.code,snapshot.operators).length>0)
  return <Section className="border-t border-border">
    <article className="max-w-4xl" data-commercial-editorial={country.code}>
      <h2 className="font-display text-2xl font-bold">Cómo revisar un destino para {country.name}</h2>
      <p className="mt-4 leading-relaxed text-muted-foreground">{country.check}</p>
      <p className="mt-4 leading-relaxed text-muted-foreground">{country.money}</p>
      <p className="mt-4 text-sm text-muted-foreground">Estos enlaces llevan a información editorial sobre este país. No habilitan apuestas ni ofertas: los botones comerciales dependen de la ubicación real y de la revisión vigente. Solo para personas adultas; PlayLiva no acepta depósitos.</p>
      {snapshot.operators.length>0 && <nav className="mt-6" aria-label={`Perfiles publicados para ${country.name}`}>
        <h3 className="text-lg font-semibold">Perfiles para comprobar identidad y condiciones</h3>
        <ul className="mt-3 flex flex-wrap gap-4 text-primary">{snapshot.operators.map(operator=><li key={operator.id}><LocaleLink href={`/operators/${operator.slug}`}>Perfil de {operator.name} para {country.name}</LocaleLink></li>)}</ul>
      </nav>}
      {games.length>0 && <nav className="mt-6" aria-label={`Guías publicadas de disponibilidad en ${country.name}`}>
        <h3 className="text-lg font-semibold">Guías de disponibilidad por juego</h3>
        <ul className="mt-3 flex flex-wrap gap-4 text-primary">{games.map(game=><li key={game.id}><LocaleLink href={`/where-to-play/${game.slug}`}>Dónde jugar {game.title} en {country.name}</LocaleLink></li>)}</ul>
      </nav>}
      <nav className="mt-6 flex flex-wrap gap-4 text-primary" aria-label="Criterios para comparar ofertas"><LocaleLink href="/guides/bonos-casino">Leer rollover, límites y exclusiones</LocaleLink><LocaleLink href="/games">Explorar fichas de juegos</LocaleLink><a href={country.source} rel="noopener noreferrer" target="_blank">Fuente de {country.authority}</a></nav>
    </article>
  </Section>
}
