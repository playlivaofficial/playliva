import { notFound } from 'next/navigation'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { pageMetadata } from '@/lib/seo'
import { EDITOR, RESEARCH_POLICY, editorialCopy } from '@/lib/editorial'
import { PageHero } from '@/components/page-hero'
import { Section } from '@/components/section'
import { LocaleLink } from '@/components/locale-link'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocaleSegment(locale)) notFound()
  const c = editorialCopy(segmentToLocale(locale))
  return pageMetadata({ title: `${c.policy} — PlayLiva`, description: c.research, path: '/editorial-policy', localeSegment: locale })
}
export default async function EditorialPolicy({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params
  if (!isLocaleSegment(segment)) notFound()
  const locale = segmentToLocale(segment), c = editorialCopy(locale)
  return <><PageHero title={c.policy} description={c.research} breadcrumbs={[{ label: 'PlayLiva', href: '/' }, { label: c.policy }]} />
    <Section><article className="max-w-3xl space-y-6 text-base leading-relaxed">
      <h2 className="text-xl font-semibold">{c.research}</h2>
      {RESEARCH_POLICY[locale].map(text => <p key={text}>{text}</p>)}
      <p>{c.updated}: <time dateTime="2026-09-14">2026-09-14</time></p>
      <nav className="flex flex-wrap gap-6" aria-label={c.sources}>
        <LocaleLink href={EDITOR.profile} className="underline">{EDITOR.name}</LocaleLink>
        <LocaleLink href="/affiliate-disclosure" className="underline">{locale === 'en' ? 'Affiliate disclosure' : locale === 'pt-BR' ? 'Divulgação de afiliados' : 'Divulgación de afiliados'}</LocaleLink>
        <LocaleLink href="/responsible-gaming" className="underline">{locale === 'en' ? 'Responsible gaming' : locale === 'pt-BR' ? 'Jogo responsável' : 'Juego responsable'}</LocaleLink>
        <LocaleLink href="/contact" className="underline">{locale === 'en' ? 'Contact' : locale === 'pt-BR' ? 'Contato' : 'Contacto'}</LocaleLink>
      </nav>
    </article></Section></>
}
