'use client'

import { LocaleLink } from '@/components/locale-link'
import { usePathname } from 'next/navigation'
import { Home, Gamepad2, Zap, Tag } from 'lucide-react'
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

  const items = [
    { href: '/', label: t('nav.home') || 'Home', icon: Home },
    { href: '/games', label: t('nav.games'), icon: Gamepad2 },
    { href: '/play', label: t('play.title'), icon: Zap },
    { href: '/offers', label: t('nav.offers'), icon: Tag },
  ]

  return (
    <nav
      aria-label={t('nav.menu')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl md:hidden"
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
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground',
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
