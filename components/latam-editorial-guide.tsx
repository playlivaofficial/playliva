import { LocaleLink } from '@/components/locale-link'
import { Section } from '@/components/section'
import { latamTopic } from '@/lib/latam-editorial'
import type { Locale } from '@/lib/types'

/** Server-rendered editorial links contain no outbound affiliate capabilities. */
export function LatamEditorialGuide({ path, locale }: { path: string; locale: Locale }) {
  const topic=latamTopic(path,locale)
  if (!topic) return null
  return <Section className="border-t border-border" id="regional-guide">
    <article className="max-w-4xl" data-latam-editorial={topic.country.code}>
      <h2 className="font-display text-2xl font-bold">{topic.name}: guía para {topic.country.name}</h2>
      {topic.paragraphs.map(paragraph=><p className="mt-4 leading-relaxed text-muted-foreground" key={paragraph}>{paragraph}</p>)}
      <h3 className="mt-6 text-lg font-semibold">Moneda y condiciones: {topic.country.currency}</h3>
      <p className="mt-3 leading-relaxed text-muted-foreground">{topic.country.money}</p>
      <h3 className="mt-6 text-lg font-semibold">Identidad del destino y revisión local</h3>
      <p className="mt-3 leading-relaxed text-muted-foreground">{topic.country.check}</p>
      <p className="mt-3 text-sm text-muted-foreground">Solo para personas adultas. La edición de idioma no cambia la ubicación ni habilita ofertas. Una fuente del proveedor no confirma disponibilidad comercial.</p>
      <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-3 text-primary" aria-label={`Siguiente lectura sobre ${topic.name}`}>
        {topic.links.map(link=><LocaleLink key={link.href} href={link.href}>{link.label}</LocaleLink>)}
        {!topic.links.some(link=>link.href==='/guides/bonos-casino') && <LocaleLink href="/guides/bonos-casino">Condiciones de bonos</LocaleLink>}
        <LocaleLink href="/offers">Ofertas vigentes para la visita</LocaleLink>
      </nav>
      <p className="mt-5 text-sm text-muted-foreground">Fuentes: <a href={topic.source} rel="noopener noreferrer" target="_blank" className="underline">documentación del proveedor</a> · <a href={topic.country.source} rel="noopener noreferrer" target="_blank" className="underline">{topic.country.authority}</a></p>
    </article>
  </Section>
}
