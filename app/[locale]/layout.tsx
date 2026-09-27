import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { visitorMarket } from '@/lib/visitor-market'
import { CountryProvider } from '@/components/country-context'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CookieBanner } from '@/components/cookie-banner'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { JsonLd } from '@/components/json-ld'
import { ConsentedAnalytics } from '@/components/analytics/consented-analytics'
import { AttributionCapture } from '@/components/analytics/attribution-capture'
import { getWebsiteJsonLd, getOrganizationJsonLd } from '@/lib/structured-data'
import { LOCALE_SEGMENTS, isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { productCopy } from '@/lib/product-discovery'
import { seoMarketForLocaleSegment } from '@/lib/seo-market'

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
      <CountryProvider
        initialLocale={locale}
        initialCountryCode={seoMarketForLocaleSegment(localeSegment)}
        visitorCountryCode={visitorMarket(await headers())}
      >
        <a href="#main-content" className="sr-only fixed left-4 top-3 z-[100] rounded-lg bg-foreground px-4 py-3 text-background focus:not-sr-only">{productCopy(locale).skipContent}</a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1} className="min-h-screen pb-20 outline-none md:pb-0">{children}</main>
        <SiteFooter />
        <MobileBottomNav />
        <CookieBanner />
        <AttributionCapture />
      </CountryProvider>
      {process.env.NODE_ENV === 'production' && <ConsentedAnalytics />}
    </>
  )
}
