import { LocaleLink } from '@/components/locale-link'
import { Section } from '@/components/section'
import { searchIntentGuide } from '@/lib/search-intent'
import type { Locale } from '@/lib/types'

/** Server content: contextual reading links, never an outbound capability. */
export function SearchIntentContent({ path, locale }: { path: string; locale: Locale }) {
  const guide = searchIntentGuide(path, locale)
  if (!guide) return null
  return <div data-search-intent={`${locale}:${path}`}>
    {guide.sections.map(section => <section className="mt-6" key={section.heading}>
      <h3 className="text-lg font-semibold">{section.heading}</h3>
      {section.paragraphs.map(paragraph => <p className="mt-3 leading-relaxed text-muted-foreground" key={paragraph}>{paragraph}</p>)}
      {section.links && <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-primary" aria-label={section.heading}>
        {section.links.map(link => <LocaleLink className="underline underline-offset-4" key={link.href} href={link.href}>{link.label}</LocaleLink>)}
      </nav>}
    </section>)}
  </div>
}

export function SearchIntentGuide({ path, locale }: { path: string; locale: Locale }) {
  const guide = searchIntentGuide(path, locale)
  if (!guide) return null
  return <Section className="border-t border-border">
    <article className="max-w-4xl">
      <h2 className="font-display text-2xl font-bold">{guide.title}</h2>
      <SearchIntentContent path={path} locale={locale} />
      <p className="mt-5 text-sm text-muted-foreground">Fuente: <a className="underline" href={guide.source.url} target="_blank" rel="noopener noreferrer">{guide.source.label}</a>. Revisión editorial: 14 de octubre de 2026.</p>
    </article>
  </Section>
}
