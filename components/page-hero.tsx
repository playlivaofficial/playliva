import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Breadcrumbs, type BreadcrumbItem } from '@/components/breadcrumbs'

export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  sponsor,
  children,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  /** Renders a breadcrumb trail (+ matching JSON-LD) above the eyebrow/title. */
  breadcrumbs?: BreadcrumbItem[]
  /** Compact sponsored unit. DOM order is title, then sponsor, then description. */
  sponsor?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-border bg-[radial-gradient(ellipse_at_80%_0%,#24477955,transparent_65%)]',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 max-w-3xl rounded-full bg-primary/20 blur-[100px]"
      />
      <div
        className={cn(
          'relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
          sponsor ? 'py-8 sm:py-10' : 'py-10 sm:py-14',
        )}
      >
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} className="mb-4" />
        )}
        <div className={sponsor ? 'page-hero-with-sponsor' : undefined}>
          <div className={sponsor ? 'page-hero-title' : undefined} data-page-hero-title="">
            {eyebrow && (
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                {eyebrow}
              </p>
            )}
            <h1 className="max-w-3xl text-balance font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {title}
            </h1>
          </div>
          {sponsor ? (
            <div className="page-hero-sponsor" data-page-hero-sponsor="" data-sponsor-slot="hero">
              {sponsor}
            </div>
          ) : null}
          {(description || children) && (
            <div className={cn(sponsor && 'page-hero-lede')} data-page-hero-lede="">
              {description && (
                <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
                  {description}
                </p>
              )}
              {children && <div className="mt-8">{children}</div>}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
