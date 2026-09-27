'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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
import {
  isLocaleSegment,
  localeToSegment,
  segmentToLocale,
  swapLocaleInPath,
} from '@/lib/locale'

interface CountryContextValue {
  /** Selected editorial market; commercial eligibility also requires request GEO. */
  country: Country
  countryCode: CountryCode
  /** Eligible commercial market from trusted request GEO and selected preference. */
  marketCode: CountryCode | null
  setCountryCode: (code: CountryCode) => void
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
  /** Public launch markets only (Brazil + Mexico). */
  countries: Country[]
}

const CountryContext = createContext<CountryContextValue | null>(null)

// Market preference persists in localStorage; LANGUAGE persists in the URL plus a cookie
// (read by middleware for the bare `/` redirect) — the two never share state.
const COUNTRY_STORAGE_KEY = 'playliva.country'
const LOCALE_COOKIE = 'playliva_locale'

function isPublicCountry(code: string): code is CountryCode {
  return PUBLIC_COUNTRIES.some((c) => c.code === code)
}

function isSupportedLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export function CountryProvider({
  children,
  initialLocale,
  initialCountryCode = DEFAULT_COUNTRY,
  visitorCountryCode = null,
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
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [countryCode, setCountryCodeState] =
    useState<CountryCode>(visitorCountryCode ?? initialCountryCode ?? DEFAULT_COUNTRY)
  const [marketReady, setMarketReady] = useState(visitorCountryCode !== null)

  // LANGUAGE is derived from the URL on every render, never from
  // independent client state — this keeps it perfectly in sync with
  // back/forward navigation and prevents any server/client mismatch.
  const locale = useMemo<Locale>(() => {
    const firstSegment = pathname.split('/')[1] ?? ''
    return isLocaleSegment(firstSegment)
      ? segmentToLocale(firstSegment)
      : initialLocale
  }, [pathname, initialLocale])

  // Restore the market preference. It cannot override trusted visitor GEO.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COUNTRY_STORAGE_KEY)
      if (stored && isPublicCountry(stored)) {
        setCountryCodeState(stored)
      }
      setMarketReady(true)
    } catch {
      setMarketReady(true)
    }
  }, [])

  const setCountryCode = useCallback((code: CountryCode) => {
    // Only allow public launch markets. LANGUAGE is untouched by this call.
    if (!isPublicCountry(code)) return
    setCountryCodeState(code)
    setMarketReady(true)
    try {
      window.localStorage.setItem(COUNTRY_STORAGE_KEY, code)
    } catch {
      // ignore storage write failures
    }
  }, [])

  const setLocale = useCallback(
    (next: Locale) => {
      // GEO is untouched by this call — only the interface language
      // changes, by navigating to the equivalent path under the new
      // locale segment. This is what keeps the visitor on the same
      // logical page across a language switch.
      if (!isSupportedLocale(next)) return
      const nextSegment = localeToSegment(next)
      try {
        document.cookie = `${LOCALE_COOKIE}=${nextSegment}; path=/; max-age=31536000`
      } catch {
        // ignore cookie write failures — the URL navigation below still works
      }
      router.push(swapLocaleInPath(pathname, nextSegment))
    },
    [pathname, router],
  )

  // Keep <html lang> in sync with the active LANGUAGE (not GEO) for a11y + SEO.
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<CountryContextValue>(() => {
    const country = getCountry(countryCode)
    const t = createTranslator(locale)
    return {
      country,
      countryCode,
      marketCode: marketReady && countryCode === visitorCountryCode ? countryCode : null,
      setCountryCode,
      locale,
      setLocale,
      t,
      countryName: getCountryName(countryCode, locale),
      nameOf: (code: CountryCode) => getCountryName(code, locale),
      countries: PUBLIC_COUNTRIES,
    }
  }, [countryCode, marketReady, visitorCountryCode, setCountryCode, locale, setLocale])

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
