import { notFound } from 'next/navigation'
import { CountryProvider } from '@/components/country-context'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CookieBanner } from '@/components/cookie-banner'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { JsonLd } from '@/components/json-ld'
import { ConsentedAnalytics } from '@/components/analytics/consented-analytics'
import { getWebsiteJsonLd, getOrganizationJsonLd } from '@/lib/structured-data'
import { LOCALE_SEGMENTS, isLocaleSegment, segmentToLocale } from '@/lib/locale'

export function generateStaticParams() {
  return LOCALE_SEGMENTS.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: localeSegment } = await params
  if (!isLocaleSegment(localeSegment)) notFound()
  const locale = segmentToLocale(localeSegment)

  return (
    <>
      <JsonLd data={getWebsiteJsonLd()} />
      <JsonLd data={getOrganizationJsonLd()} />
      <CountryProvider initialLocale={locale}>
        <SiteHeader />
        <main className="min-h-screen pb-20 md:pb-0">{children}</main>
        <SiteFooter />
        <MobileBottomNav />
        <CookieBanner />
      </CountryProvider>
      {process.env.NODE_ENV === 'production' && <ConsentedAnalytics />}
    </>
  )
}
