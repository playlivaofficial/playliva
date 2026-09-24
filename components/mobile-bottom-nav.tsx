'use client'

import { LocaleLink } from '@/components/locale-link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Gamepad2, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/components/country-context'
import { stripLocaleFromPath } from '@/lib/locale'

export function MobileBottomNav() {
  const pathname = usePathname()
  const activePath = stripLocaleFromPath(pathname)
  const { t } = useTranslation()

  // Crash already has a compact, persistent action surface. Keeping a second
  // fixed navigation layer here obscures Start/Cash Out on 320px screens.
  if (activePath === '/play/crash') return null
  if (activePath === '/play/capybara-gold') return null
  if (activePath === '/play/liva-ginga') return null
  if (activePath === '/play/golaco') return null
  if (activePath === '/play/blackjack') return null
  if (activePath === '/play/roulette') return null
  if (activePath === '/play/mines') return null

  const items = [
    { href: '/', label: t('nav.home') || 'Home', icon: Home },
    { href: '/play', label: t('nav.play'), icon: Gamepad2 },
    { href: '/games', label: t('nav.games'), icon: Compass },
    { href: 'https://livasports.com', label: t('nav.sports'), icon: Trophy },
  ]

  return (
    <nav
      aria-label={t('nav.menu')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map((item) => {
          const active =
            item.href === '/'
              ? activePath === '/'
              : activePath.startsWith(item.href)
          const Icon = item.icon
          return (
            <LocaleLink
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className={cn('size-5', active && 'drop-shadow-[0_0_8px_var(--primary)]')} />
              {item.label}
            </LocaleLink>
          )
        })}
      </div>
    </nav>
  )
}
