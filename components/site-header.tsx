'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Dropdown } from '@/components/ui/dropdown'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { LanguageSelector } from '@/components/language-selector'
import { LocaleLink } from '@/components/locale-link'
import { useTranslation } from '@/components/country-context'
import { stripLocaleFromPath } from '@/lib/locale'
import { cn } from '@/lib/utils'

const NAV: { href: string; key: string }[] = [
  { href: '/play', key: 'nav.play' },
  { href: '/games', key: 'nav.games' },
  { href: '/crash', key: 'nav.crash' },
  { href: '/slots', key: 'nav.slots' },
  { href: '/live-casino', key: 'nav.liveCasino' },
  { href: 'https://livasports.com', key: 'nav.sports' },
  { href: '/table-games', key: 'nav.tableGames' },
  { href: '/instant-games', key: 'nav.instantGames' },
  { href: '/offers', key: 'nav.offers' },
  { href: '/operators', key: 'nav.operators' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const activePath = stripLocaleFromPath(pathname)
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b transition-all duration-300',
        scrolled
          ? 'border-border bg-background/80 backdrop-blur-xl'
          : 'border-transparent bg-background/40 backdrop-blur-sm',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Logo />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV.slice(0, 6).map((item) => {
              const active = activePath === item.href || item.href === '/play' && activePath.startsWith('/play/')
              return (
                <LocaleLink
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-lg px-2 py-2 text-sm font-medium transition-colors',
                    item.href === '/play' && 'bg-primary/10',
                    active
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t(item.key)}
                </LocaleLink>
              )
            })}
            <Dropdown trigger={t('nav.more')} label={t('nav.more')} align="start">
              {(close) => NAV.slice(6).map((item) => (
                <LocaleLink key={item.href} href={item.href} role="menuitem" onClick={close}
                  className={cn('block rounded-lg px-3 py-2 text-sm hover:bg-muted', activePath === item.href && 'text-primary')}>
                  {t(item.key)}
                </LocaleLink>
              ))}
            </Dropdown>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            <LanguageSelector />
          </div>
          <Button size="lg" render={<LocaleLink href="/games" />} className="hidden sm:inline-flex">
            {t('cta.exploreGames')}
          </Button>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="md:hidden"><LanguageSelector compact /></div>
            <button
              type="button"
              aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="grid size-11 place-items-center rounded-lg border border-border bg-card/60 text-foreground"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto border-t border-border bg-background/95 backdrop-blur-xl lg:hidden">
          <nav
            className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6"
            aria-label={t('nav.menu')}
          >
            {NAV.map((item) => (
              <LocaleLink
                key={item.href}
                href={item.href}
                className={cn(
                  'min-h-11 rounded-lg px-3 py-2.5 text-base font-medium transition-colors',
                  item.href === '/play' && 'bg-primary/10',
                  activePath === item.href
                    ? 'bg-muted text-primary'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                {t(item.key)}
              </LocaleLink>
            ))}
            <div className="mt-2 border-t border-border pt-4">
              <Button render={<LocaleLink href="/games" />} size="lg" className="w-full">
                {t('cta.exploreGames')}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
