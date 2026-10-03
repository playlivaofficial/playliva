import { notFound } from 'next/navigation'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { absoluteUrl, pageMetadata } from '@/lib/seo'
import { aviaCopy } from '@/lib/originals/avia/copy'
import { AVIA_PATH, AVIA_POSTER } from '@/lib/originals/avia/definition'
import { AviaEntry } from '@/components/originals/avia/entry'
import { OriginalSeoArticle } from '@/components/originals/original-seo-article'
import { JsonLd } from '@/components/json-ld'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params
  if (!isLocaleSegment(segment)) notFound()
  const c = aviaCopy(segmentToLocale(segment))
  return pageMetadata({ title: c.title, description: c.description, path: AVIA_PATH, localeSegment: segment, images: [AVIA_POSTER] })
}
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params
  if (!isLocaleSegment(segment)) notFound()
  const locale = segmentToLocale(segment), c = aviaCopy(locale), url = absoluteUrl(`/${segment}${AVIA_PATH}`)
  return <><JsonLd data={{ '@context': 'https://schema.org', '@type': 'VideoGame', '@id': `${url}#game`,
    name: 'Avia de Janeiro', description: c.description, url, image: absoluteUrl(AVIA_POSTER), inLanguage: locale,
    isAccessibleForFree: true, applicationCategory: 'GameApplication', gamePlatform: 'Web browser', playMode: 'https://schema.org/SinglePlayer',
    publisher: { '@type': 'Organization', name: 'PlayLiva', url: absoluteUrl('/') } }} />
    <AviaEntry /><OriginalSeoArticle crumbs={{ originals: 'PlayLiva Originals', game: 'Avia de Janeiro', path: AVIA_PATH }}
      title="Avia de Janeiro" paragraphs={c.paragraphs} rulesTitle={c.rulesTitle} rules={c.rules} creditsTitle={c.creditsTitle} credits={c.credits}
      links={[{ href: '/play/crash', label: 'Island Crash' }, { href: '/play/liva-ginga', label: 'Liva Ginga' }, { href: '/play/skuptu-levanta', label: 'Skuptu Levanta' }, { href: '/crash', label: locale === 'pt-BR' ? 'Jogos crash' : locale === 'es-MX' ? 'Juegos crash' : 'Crash games' }, { href: '/games/aviator', label: 'Aviator' }, { href: '/games/jetx', label: 'JetX' }]} /></>
}
