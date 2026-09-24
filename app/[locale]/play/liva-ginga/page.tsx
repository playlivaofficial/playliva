import { notFound } from 'next/navigation'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { pageMetadata } from '@/lib/seo'
import { EMBAIXADINHA, EMBAIXADINHA_POSTER } from '@/lib/originals/embaixadinha/definition'
import { embaixadinhaCopy } from '@/lib/originals/embaixadinha/copy'
import { originalsLinks } from '@/lib/originals/discovery'
import EmbaixadinhaEntry from '@/components/originals/embaixadinha/embaixadinha-entry'
import { OriginalSeoArticle } from '@/components/originals/original-seo-article'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params
  if (!isLocaleSegment(segment)) notFound()
  const copy = embaixadinhaCopy(segmentToLocale(segment))
  return pageMetadata({ title: copy.seoTitle, description: copy.description, path: `/play/${EMBAIXADINHA.slug}`,
    localeSegment: segment, images: [EMBAIXADINHA_POSTER] })
}

export default async function LivaGingaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: segment } = await params
  if (!isLocaleSegment(segment)) notFound()
  const locale = segmentToLocale(segment), copy = embaixadinhaCopy(locale)
  return <>
    <EmbaixadinhaEntry />
    <OriginalSeoArticle crumbs={{ originals: copy.breadcrumbOriginals, game: EMBAIXADINHA.title[locale], path: `/play/${EMBAIXADINHA.slug}` }}
      title={copy.articleTitle} paragraphs={[copy.articleIntro, copy.articleCrash]} rulesTitle={copy.rulesTitle} rules={copy.rules}
      creditsTitle={copy.creditsTitle} credits={copy.credits} links={originalsLinks(locale, EMBAIXADINHA.slug)} />
  </>
}
