import { contentLocale } from '@/lib/locale'
import { notFound } from 'next/navigation'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { pageMetadata } from '@/lib/seo'
import { EDITOR, editorialCopy } from '@/lib/editorial'
import { REFERENCE_GAMES } from '@/lib/catalog/games'
import { PageHero } from '@/components/page-hero'
import { Section } from '@/components/section'
import { LocaleLink } from '@/components/locale-link'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocaleSegment(locale)) notFound()
  const c = editorialCopy(segmentToLocale(locale))
  return pageMetadata({ title: `${EDITOR.name} — ${c.archive}`, description: EDITOR.bio[contentLocale(segmentToLocale(locale))], path: EDITOR.profile, localeSegment: locale })
}
export default async function AuthorArchive({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params
  if (!isLocaleSegment(segment)) notFound()
  const locale = segmentToLocale(segment), c = editorialCopy(locale)
  return <><PageHero title={`${EDITOR.name} — ${c.archive}`} description={EDITOR.bio[contentLocale(locale)]} breadcrumbs={[{ label: 'PlayLiva', href: '/' }, { label: c.archive }]} />
    <Section><p>{EDITOR.role[contentLocale(locale)]}</p><LocaleLink href="/editorial-policy" className="my-4 inline-flex min-h-11 items-center underline">{c.policy}</LocaleLink>
      <h2 className="mb-4 text-xl font-semibold">{c.archive}</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{REFERENCE_GAMES.map(game => <li key={game.id}><LocaleLink href={`/games/${game.slug}`} className="flex min-h-11 items-center underline underline-offset-4">{game.title}</LocaleLink></li>)}</ul>
    </Section></>
}
