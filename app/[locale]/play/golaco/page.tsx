import { notFound } from 'next/navigation'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { pageMetadata } from '@/lib/seo'
import { GOLACO, GOLACO_POSTER } from '@/lib/originals/golaco/definition'
import { golacoCopy } from '@/lib/originals/golaco/copy'
import { originalsLinks } from '@/lib/originals/discovery'
import GolacoEntry from '@/components/originals/golaco/golaco-entry'
import { OriginalSeoArticle } from '@/components/originals/original-seo-article'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params
  if (!isLocaleSegment(segment)) notFound()
  const copy = golacoCopy(segmentToLocale(segment))
  return pageMetadata({ title: copy.seoTitle, description: copy.description, path: `/play/${GOLACO.slug}`,
    localeSegment: segment, images: [GOLACO_POSTER] })
}

export default async function GolacoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params
  if (!isLocaleSegment(segment)) notFound()
  const locale = segmentToLocale(segment), copy = golacoCopy(locale)
  return <>
    <GolacoEntry />
    <OriginalSeoArticle crumbs={{ originals: copy.breadcrumbOriginals, game: GOLACO.title[locale], path: `/play/${GOLACO.slug}` }}
      title={copy.articleTitle} paragraphs={[copy.articleIntro, copy.articleBonus]} rulesTitle={copy.rulesTitle} rules={copy.ruleList}
      creditsTitle={copy.creditsTitle} credits={copy.credits} links={originalsLinks(locale, GOLACO.slug)} />
  </>
}
