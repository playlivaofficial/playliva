import { notFound } from 'next/navigation'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { absoluteUrl, pageMetadata } from '@/lib/seo'
import { driftCopy } from '@/lib/originals/rio-drift/copy'
import { RIO_DRIFT_PATH, RIO_DRIFT_POSTER, RIO_DRIFT_SHARE } from '@/lib/originals/rio-drift/definition'
import { DriftEntry } from '@/components/originals/rio-drift/entry'
import { OriginalSeoArticle } from '@/components/originals/original-seo-article'
import { JsonLd } from '@/components/json-ld'
import { applySearchTitle } from '@/lib/owner/server/search-metadata'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params
  if (!isLocaleSegment(segment)) notFound()
  const c = driftCopy(segmentToLocale(segment))
  return applySearchTitle(pageMetadata({ title: c.title, description: c.description, path: RIO_DRIFT_PATH, localeSegment: segment, images: [RIO_DRIFT_SHARE] }))
}
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params
  if (!isLocaleSegment(segment)) notFound()
  const locale = segmentToLocale(segment), c = driftCopy(locale), url = absoluteUrl(`/${segment}${RIO_DRIFT_PATH}`)
  return <><JsonLd data={{ '@context': 'https://schema.org', '@type': 'VideoGame', '@id': `${url}#game`,
    name: 'Rio Drift', description: c.description, url, image: absoluteUrl(RIO_DRIFT_POSTER), inLanguage: locale, genre: c.racing,
    isAccessibleForFree: true, applicationCategory: 'GameApplication', gamePlatform: 'Web browser', playMode: 'https://schema.org/SinglePlayer',
    publisher: { '@type': 'Organization', name: 'PlayLiva', url: absoluteUrl('/') } }} />
    <DriftEntry /><OriginalSeoArticle crumbs={{ originals: 'PlayLiva Originals', game: 'Rio Drift', path: RIO_DRIFT_PATH }}
      title={`Rio Drift · ${c.racing}`} paragraphs={c.paragraphs} rulesTitle={c.rulesTitle} rules={c.rules} creditsTitle={c.creditsTitle} credits={c.credits}
      links={[{ href: '/arcade', label: c.arcadeTitle }, { href: '/play', label: 'PlayLiva Originals' }, { href: '/games?kind=original&category=arcade', label: c.racing }]} /></>
}
