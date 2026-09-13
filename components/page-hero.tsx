import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Breadcrumbs, type BreadcrumbItem } from '@/components/breadcrumbs'

export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  children,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  /** Renders a breadcrumb trail (+ matching JSON-LD) above the eyebrow/title. */
  breadcrumbs?: BreadcrumbItem[]
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
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} className="mb-4" />
        )}
        {eyebrow && (
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="max-w-3xl text-balance font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  )
}
