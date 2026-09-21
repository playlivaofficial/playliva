'use client'

import { ChevronDown, Check } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'

export function CountrySelector({ compact = false }: { compact?: boolean }) {
  const { country, countries, marketCode, setCountryCode, countryName, nameOf, t } =
    useCountry()
  return (
    <Dropdown
      label={t('selector.country')}
      trigger={
        <>
          <span aria-hidden="true" className="text-base leading-none">
            {marketCode ? country.flag : '🌐'}
          </span>
          {!compact && <span className="hidden sm:inline">{marketCode ? countryName : t('geo.marketLabel')}</span>}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </>
      }
    >
      {(close) => (
        <>
          <p className="px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('selector.countryLabel')}
          </p>
          {countries.map((c) => (
            <DropdownItem
              key={c.code}
              active={c.code === marketCode}
              onClick={() => {
                setCountryCode(c.code)
                close()
              }}
            >
              <span aria-hidden="true" className="text-base">
                {c.flag}
              </span>
              <span className="flex-1">{nameOf(c.code)}</span>
              {c.code === marketCode && (
                <Check className="size-4 text-primary" />
              )}
            </DropdownItem>
          ))}
        </>
      )}
    </Dropdown>
  )
}
