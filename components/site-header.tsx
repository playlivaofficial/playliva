'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, ChevronDown, Menu, X } from 'lucide-react'
import { Dropdown } from '@/components/ui/dropdown'
import { Logo } from '@/components/logo'
import { LanguageSelector } from '@/components/language-selector'
import { LocaleLink } from '@/components/locale-link'
import { useCountry } from '@/components/country-context'
import { stripLocaleFromPath } from '@/lib/locale'
import { productCopy } from '@/lib/product-discovery'
import { cn } from '@/lib/utils'

const NAV: { href: string; key: string }[] = [
  { href: '/play', key: 'nav.play' },
  { href: '/games', key: 'nav.games' },
  { href: '/crash', key: 'nav.crash' },
  { href: '/slots', key: 'nav.slots' },
  { href: '/live-casino', key: 'nav.liveCasino' },
  { href: '/instant-games', key: 'nav.instantGames' },
  { href: 'https://livasports.com', key: 'nav.sports' },
]
const SECONDARY = [
  { href: '/table-games', key: 'nav.tableGames' },
  { href: '/offers', key: 'nav.offers' },
  { href: '/operators', key: 'nav.operators' },
  { href: '/about', key: 'nav.about' },
  { href: '/responsible-gaming', key: 'footer.responsible' },
]

export function SiteHeader() {
  const pathname = usePathname(), activePath = stripLocaleFromPath(pathname)
  const { t, locale } = useCountry(), copy = productCopy(locale)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => { setMenuOpen(false) }, [pathname])
  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); toggle.current?.focus() }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  const active = (href: string) => activePath === href || href === '/play' && activePath.startsWith('/play/')
  return <header data-site-header className={cn('sticky top-0 z-50 w-full border-b backdrop-blur-xl transition-colors', scrolled ? 'border-border bg-background/95' : 'border-border/70 bg-background/90')}>
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
      <Logo />
      <nav className="hidden min-w-0 items-center gap-1 xl:flex" aria-label={copy.navPrimary}>
        {NAV.map(item => <LocaleLink key={item.href} href={item.href} aria-current={active(item.href) ? 'page' : undefined}
          className={cn('inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-medium transition-colors', item.href === '/play' && 'bg-primary/12', active(item.href) ? 'bg-primary/12 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
          {t(item.key)}{item.href.startsWith('https:') && <ArrowUpRight size={13} aria-hidden="true" />}
        </LocaleLink>)}
        <Dropdown trigger={<>{t('nav.more')}<ChevronDown size={13} aria-hidden="true" /></>} label={t('nav.more')} align="end">
          {close => SECONDARY.map(item => <LocaleLink key={item.href} href={item.href} role="menuitem" onClick={close}
            className="flex min-h-11 items-center rounded-lg px-3 py-2 text-sm hover:bg-muted">{t(item.key)}</LocaleLink>)}
        </Dropdown>
      </nav>
      <div className="flex shrink-0 items-center gap-2">
        <LanguageSelector compact />
        <button ref={toggle} type="button" aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={menuOpen} aria-controls="site-mobile-menu" onClick={() => setMenuOpen(value => !value)}
          className="grid size-11 place-items-center rounded-xl border border-border bg-card text-foreground xl:hidden">
          {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </div>
    </div>
    {menuOpen && <div id="site-mobile-menu" className="max-h-[calc(100dvh-9rem)] overflow-y-auto border-t border-border bg-background xl:hidden">
      <nav className="mx-auto max-w-7xl px-4 py-5 sm:px-6" aria-label={t('nav.menu')}>
        <div className="grid grid-cols-2 gap-2">
          {NAV.map(item => <LocaleLink key={item.href} href={item.href} aria-current={active(item.href) ? 'page' : undefined}
            className={cn('flex min-h-12 items-center justify-between gap-2 rounded-xl border border-border px-3 py-3 text-sm font-medium', active(item.href) ? 'bg-primary/15 text-primary' : 'bg-card text-foreground hover:bg-muted')}>
            {t(item.key)}{item.href.startsWith('https:') && <ArrowUpRight size={15} aria-hidden="true" />}
          </LocaleLink>)}
        </div>
        <p className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('nav.more')}</p>
        <div className="grid grid-cols-2 gap-x-2">{SECONDARY.map(item => <LocaleLink key={item.href} href={item.href} className="flex min-h-11 items-center rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">{t(item.key)}</LocaleLink>)}</div>
      </nav>
    </div>}
  </header>
}
