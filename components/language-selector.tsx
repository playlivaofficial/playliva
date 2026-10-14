'use client'

import { ChevronDown, Check, Globe } from 'lucide-react'
import { useTranslation } from '@/components/country-context'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { contentLocale, languageSwitchPath, PUBLIC_LANGUAGES, swapLocaleInPath } from '@/lib/locale'
import { usePathname } from 'next/navigation'

/**
 * Public LANGUAGE selector (English / Español / Português). This is
 * intentionally decoupled from GEO — switching language here never changes
 * the visitor's market, operators, affiliate links or offers. GEO/market
 * detection and private Owner preview remain server-authorized.
 */
export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useTranslation()
  const pathname = usePathname()
  const guideFallback = languageSwitchPath(pathname, 'en') !== swapLocaleInPath(pathname, 'en')
  const current = PUBLIC_LANGUAGES.find(language => language.code === contentLocale(locale))!

  return (
    <Dropdown
      label={t('selector.language')}
      className="[&>button]:min-h-11 [&>button]:min-w-11"
      menuClassName="[&_button]:min-h-11"
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
          {guideFallback && <p className="max-w-52 px-2.5 py-1.5 text-xs leading-relaxed text-muted-foreground">
            Esta guía está disponible en español. English y Português abren su página relacionada.
          </p>}
          {PUBLIC_LANGUAGES.map((lang) => (
            <DropdownItem
              key={lang.code}
              active={lang.code === contentLocale(locale)}
              onClick={() => {
                setLocale(lang.code)
                close()
              }}
            >
              <span className="flex-1">{lang.label}</span>
              {lang.code === contentLocale(locale) && <Check className="size-4 text-primary" aria-hidden="true" />}
            </DropdownItem>
          ))}
        </>
      )}
    </Dropdown>
  )
}
