'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  DEFAULT_COUNTRY,
  PUBLIC_COUNTRIES,
  getCountry,
  getCountryName,
} from '@/lib/data'
import { LOCALES, createTranslator, type Translator } from '@/lib/i18n'
import type { Country, CountryCode, Locale } from '@/lib/types'
import { isCommercialGeo, type CommercialCurrency } from '@/lib/geo'
import { emptyCommercialSnapshot, type CommercialSnapshot } from '@/lib/commercial/types'
import { currentCommercialSnapshot, nextCommercialReviewExpiry } from '@/lib/commercial/expiry'
import { useCampaignExpiry } from '@/components/affiliates/use-campaign-expiry'
import {
  isLocaleSegment,
  localeToSegment,
  segmentToLocale,
  swapLocaleInPath,
  languageLocaleSegment,
  languageSwitchPath,
} from '@/lib/locale'

interface CountryContextValue {
  /** Detected country, or an editorial display baseline when GEO is unsupported. */
  country: Country
  countryCode: CountryCode
  /** Eligible commercial market from the existing trusted server resolver only. */
  marketCode: CountryCode | null
  commercial: CommercialSnapshot
  currency: CommercialCurrency | null
  /**
   * LANGUAGE — completely independent from GEO. A visitor's GEO never
   * changes when they switch language, and vice versa.
   */
  locale: Locale
  setLocale: (locale: Locale) => void
  /** Translator bound to the current LANGUAGE (not GEO). */
  t: Translator
  /** Localized display name of the current market, in the current language. */
  countryName: string
  /** Localized display name for any market, in the current language. */
  nameOf: (code: CountryCode) => string
  /** Public target markets only (Mexico, Colombia and Peru). */
  countries: Country[]
}

const CountryContext = createContext<CountryContextValue | null>(null)

// LANGUAGE persists in the URL and a cookie. Old market storage is ignored.
const LOCALE_COOKIE = 'playliva_locale'

function isSupportedLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export function CountryProvider({
  children,
  initialLocale,
  initialCountryCode = DEFAULT_COUNTRY,
  visitorCountryCode = null,
  commercial = emptyCommercialSnapshot(),
}: {
  children: ReactNode
  /**
   * The locale resolved server-side from the URL's `/{locale}` segment
   * (see `app/[locale]/layout.tsx`). Used only as a fallback if the current
   * pathname can't be parsed — the URL is otherwise always the source of
   * truth for the active LANGUAGE, so it can never drift from what the
   * visitor sees in the address bar.
   */
  initialLocale: Locale
  /** Editorial locale baseline; never grants commercial eligibility. */
  initialCountryCode?: CountryCode | null
  /** Trusted request GEO. A saved market preference cannot grant eligibility. */
  visitorCountryCode?: CountryCode | null
  commercial?: CommercialSnapshot
}) {
  const pathname = usePathname()
  const router = useRouter()
  // Refresh the shared context, not just individual banners: cached cards,
  // disclosures and operator availability must expire together.
  const currentCommercial = currentCommercialSnapshot(commercial)
  useCampaignExpiry(nextCommercialReviewExpiry(currentCommercial))

  // LANGUAGE is derived from the URL on every render, never from
  // independent client state — this keeps it perfectly in sync with
  // back/forward navigation and prevents any server/client mismatch.
  const locale = useMemo<Locale>(() => {
    const firstSegment = pathname.split('/')[1] ?? ''
    return isLocaleSegment(firstSegment)
      ? segmentToLocale(firstSegment)
      : initialLocale
  }, [pathname, initialLocale])

  const setLocale = useCallback(
    (next: Locale) => {
      // GEO is untouched by this call — only the interface language
      // changes, by navigating to the equivalent path under the new
      // locale segment. This is what keeps the visitor on the same
      // logical page across a language switch.
      if (!isSupportedLocale(next)) return
      const currentSegment = localeToSegment(locale)
      const nextSegment = languageLocaleSegment(next, visitorCountryCode, currentSegment)
      try {
        document.cookie = `${LOCALE_COOKIE}=${nextSegment}; path=/; max-age=31536000; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
      } catch {
        // ignore cookie write failures — the URL navigation below still works
      }
      const path = languageSwitchPath(pathname, nextSegment)
      const samePage = path === swapLocaleInPath(pathname, nextSegment)
      router.push(path + window.location.search + (samePage ? window.location.hash : ''))
    },
    [pathname, router, locale, visitorCountryCode],
  )

  // Keep <html lang> in sync with the active LANGUAGE (not GEO) for a11y + SEO.
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<CountryContextValue>(() => {
    // URL locale and stale localStorage cannot alter the server-authorized GEO.
    const marketCode = isCommercialGeo(visitorCountryCode) ? visitorCountryCode : null
    const effectiveCountryCode = visitorCountryCode ?? initialCountryCode ?? DEFAULT_COUNTRY
    const country = getCountry(effectiveCountryCode)
    const t = createTranslator(locale)
    const visibleCommercial = marketCode && currentCommercial.geo === marketCode ? currentCommercial : emptyCommercialSnapshot()
    return {
      country,
      countryCode: effectiveCountryCode,
      marketCode,
      commercial: visibleCommercial,
      currency: visibleCommercial.currency,
      locale,
      setLocale,
      t,
      countryName: getCountryName(effectiveCountryCode, locale),
      nameOf: (code: CountryCode) => getCountryName(code, locale),
      countries: PUBLIC_COUNTRIES,
    }
  }, [initialCountryCode, visitorCountryCode, currentCommercial, locale, setLocale])

  return (
    <CountryContext.Provider value={value}>{children}</CountryContext.Provider>
  )
}

export function useCountry() {
  const ctx = useContext(CountryContext)
  if (!ctx) {
    throw new Error('useCountry must be used within a CountryProvider')
  }
  return ctx
}

/** Convenience hook for components that only need translation + locale. */
export function useTranslation() {
  const { t, locale, setLocale } = useCountry()
  return { t, locale, setLocale }
}
