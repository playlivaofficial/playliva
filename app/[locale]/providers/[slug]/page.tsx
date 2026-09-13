import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PROVIDERS, getReferenceProvider } from '@/lib/catalog'
import { ProviderView } from '@/components/catalog/reference-views'
import { catalogLocale, referenceMetadata } from '@/lib/catalog/metadata'

export function generateStaticParams() { return PROVIDERS.map(provider => ({ slug: provider.id })) }
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params
  return referenceMetadata('providers', slug, locale) ?? { title: 'Not found', robots: { index: false } }
}
export default async function ProviderPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  if (!getReferenceProvider(slug)) notFound()
  return <ProviderView providerId={slug} locale={catalogLocale(locale)} />
}
