'use client'

import { LocaleLink } from '@/components/locale-link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/components/country-context'

const KEY = 'playliva.cookie-consent'

export function CookieBanner() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const [managing, setManaging] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY)
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 600)
      return () => clearTimeout(timer)
    }
  }, [])

  const persist = (value: string) => {
    window.localStorage.setItem(KEY, value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 md:bottom-4 md:px-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-popover/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-5">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t('cookie.title')}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t('cookie.body')}{' '}
              <LocaleLink
                href="/cookie-policy"
                className="text-primary underline-offset-4 hover:underline"
              >
                {t('footer.cookies')}
              </LocaleLink>
              .
            </p>
          </div>

          {managing && (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/60 p-3">
              <label className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">
                  {t('cookie.necessary')}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t('cookie.always')}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="size-4 accent-[var(--primary)]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">{t('cookie.analytics')}</span>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
              </label>
              <label className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground">{t('cookie.marketing')}</span>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => setMarketing(e.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
              </label>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {!managing ? (
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setManaging(true)}
              >
                {t('cookie.customize')}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="lg"
                onClick={() =>
                  persist(
                    JSON.stringify({ necessary: true, analytics, marketing }),
                  )
                }
              >
                {t('cookie.save')}
              </Button>
            )}
            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                persist(
                  JSON.stringify({
                    necessary: true,
                    analytics: false,
                    marketing: false,
                  }),
                )
              }
            >
              {t('cookie.rejectAll')}
            </Button>
            <Button
              size="lg"
              onClick={() =>
                persist(
                  JSON.stringify({
                    necessary: true,
                    analytics: true,
                    marketing: true,
                  }),
                )
              }
            >
              {t('cookie.acceptAll')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
