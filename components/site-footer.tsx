'use client'

import { LocaleLink } from '@/components/locale-link'
import { Logo } from '@/components/logo'
import { useTranslation } from '@/components/country-context'
import { openCookiePreferences } from '@/lib/consent'

export function SiteFooter() {
  const { t } = useTranslation()

  const columns: {
    title: string
    links: { href: string; label: string }[]
  }[] = [
    {
      title: t('footer.discover'),
      links: [
        { href: '/play', label: t('nav.play') },
        { href: '/games', label: t('nav.games') },
        { href: '/crash', label: t('nav.crash') },
        { href: '/slots', label: t('nav.slots') },
        { href: '/live-casino', label: t('nav.liveCasino') },
        { href: '/table-games', label: t('nav.tableGames') },
        { href: '/instant-games', label: t('nav.instantGames') },
        { href: '/offers', label: t('nav.offers') },
      ],
    },
    {
      title: t('footer.company'),
      links: [
        { href: '/about', label: t('nav.about') },
        { href: '/contact', label: t('footer.contact') },
        { href: '/affiliate-disclosure', label: t('footer.affiliateDisclosure') },
        { href: '/operators', label: t('nav.operators') },
      ],
    },
    {
      title: t('footer.legal'),
      links: [
        { href: '/privacy-policy', label: t('footer.privacy') },
        { href: '/terms', label: t('footer.terms') },
        { href: '/responsible-gaming', label: t('footer.responsible') },
        { href: '/cookie-policy', label: t('footer.cookies') },
      ],
    },
  ]

  return (
    <footer className="border-t border-border bg-[linear-gradient(180deg,#101d32,#090f20)] pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo withTagline />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t('footer.tagline')}
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <LocaleLink
                      href={link.href}
                      className="inline-flex min-h-9 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </LocaleLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-12 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
          {t('footer.disclaimer')}
        </p>
        <button type="button" onClick={openCookiePreferences} className="mt-4 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
          {t('cookie.preferences')}
        </button>

        <div className="mt-6 flex flex-col gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          {/* The year is evaluated per-render from the same request/hydration
           * moment on server and client, so it renders identically on both
           * — no hydration mismatch and no suppressHydrationWarning needed. */}
          <p>{t('footer.rights', { year: new Date().getFullYear() })}</p>
          <p className="flex items-center gap-2">
            <span className="inline-grid size-6 place-items-center rounded-md border border-primary/40 text-xs font-bold text-primary">
              {t('notice.age')}
            </span>
            {t('footer.risk')}
          </p>
        </div>
      </div>
    </footer>
  )
}
