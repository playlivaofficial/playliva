'use client'

import { ChevronDown, Check, Globe } from 'lucide-react'
import { useTranslation } from '@/components/country-context'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import type { Locale } from '@/lib/types'

/**
 * Public LANGUAGE selector (English / Español / Português). This is
 * intentionally decoupled from GEO — switching language here never changes
 * the visitor's market, operators, affiliate links or offers. GEO/market
 * pickers live separately (see `components/geo-selectors.tsx`).
 */
const LANGUAGES: { code: Locale; flag: string; label: string }[] = [
  { code: 'en', flag: '🇬🇧', label: 'English' },
  { code: 'es-MX', flag: '🇲🇽', label: 'Español · México' },
  { code: 'es-CO', flag: '🇨🇴', label: 'Español · Colombia' },
  { code: 'es-PE', flag: '🇵🇪', label: 'Español · Perú' },
  { code: 'pt-BR', flag: '🇧🇷', label: 'Português' },
]

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useTranslation()
  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0]

  return (
    <Dropdown
      label={t('selector.language')}
      trigger={
        <>
          <Globe className="size-4 text-muted-foreground" aria-hidden="true" />
          {!compact && <span className="hidden sm:inline">{current.label}</span>}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </>
      }
    >
      {(close) => (
        <>
          <p className="px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('selector.languageLabel')}
          </p>
          {LANGUAGES.map((lang) => (
            <DropdownItem
              key={lang.code}
              active={lang.code === locale}
              onClick={() => {
                setLocale(lang.code)
                close()
              }}
            >
              <span aria-hidden="true" className="text-base">
                {lang.flag}
              </span>
              <span className="flex-1">{lang.label}</span>
              {lang.code === locale && <Check className="size-4 text-primary" />}
            </DropdownItem>
          ))}
        </>
      )}
    </Dropdown>
  )
}
