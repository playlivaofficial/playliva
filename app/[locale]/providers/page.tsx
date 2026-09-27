import type { Metadata } from 'next'
import { ProviderIndexView } from '@/components/catalog/reference-views'
import { catalogLocale } from '@/lib/catalog/metadata'
import { catalogCopy } from '@/lib/catalog/copy'
import { pageMetadata } from '@/lib/discovery/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params, c = catalogCopy(catalogLocale(locale))
  return pageMetadata({ title: c.providers, description: c.providersIntro, path: '/providers', localeSegment: locale })
}
export default async function ProvidersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <ProviderIndexView locale={catalogLocale(locale)} />
}
