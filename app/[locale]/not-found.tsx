'use client'

import { LocaleLink } from '@/components/locale-link'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/components/country-context'

export default function LocaleNotFound() {
  const { t } = useTranslation()
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-grid">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 max-w-3xl rounded-full bg-primary/20 blur-[100px]"
      />
      <div className="relative mx-auto max-w-xl px-4 text-center sm:px-6">
        <p className="font-display text-6xl font-bold text-primary text-glow">
          404
        </p>
        <h1 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t('notFound.title')}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty leading-relaxed text-muted-foreground">
          {t('notFound.body')}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" render={<LocaleLink href="/" />}>
            {t('cta.backHome')}
          </Button>
          <Button size="lg" variant="outline" render={<LocaleLink href="/games" />}>
            {t('cta.exploreGames')}
          </Button>
        </div>
      </div>
    </section>
  )
}
