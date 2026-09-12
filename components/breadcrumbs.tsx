'use client'

import { usePathname } from 'next/navigation'
import { DEFAULT_LOCALE_SEGMENT, isLocaleSegment } from '@/lib/locale'
import { LocaleLink } from '@/components/locale-link'
import { ChevronRight } from 'lucide-react'
import { JsonLd } from '@/components/json-ld'
import { getBreadcrumbJsonLd, type BreadcrumbItem } from '@/lib/structured-data'
import { cn } from '@/lib/utils'

export type { BreadcrumbItem }

/**
 * Visible breadcrumb trail + matching BreadcrumbList JSON-LD for the page.
 * The final item is rendered as the current page (not a link) and is
 * excluded from the `item` field in the structured data, per schema.org
 * convention.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[]
  className?: string
}) {
  const firstSegment = usePathname().split('/')[1] ?? ''
  const segment = isLocaleSegment(firstSegment) ? firstSegment : DEFAULT_LOCALE_SEGMENT
  return (
    <>
      <JsonLd data={getBreadcrumbJsonLd(items, segment)} />
      <nav aria-label="Breadcrumb" className={cn('overflow-x-auto', className)}>
        <ol className="flex items-center gap-1.5 whitespace-nowrap text-sm text-muted-foreground">
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            return (
              <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                {index > 0 && (
                  <ChevronRight
                    className="size-3.5 shrink-0 text-muted-foreground/50"
                    aria-hidden="true"
                  />
                )}
                {isLast || !item.href ? (
                  <span
                    className="font-medium text-foreground"
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </span>
                ) : (
                  <LocaleLink href={item.href} className="transition-colors hover:text-foreground">
                    {item.label}
                  </LocaleLink>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
