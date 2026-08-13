'use client'

import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { forwardRef } from 'react'
import type { ComponentProps } from 'react'
import { isLocaleSegment } from '@/lib/locale'

type NextLinkProps = ComponentProps<typeof NextLink>

/**
 * Drop-in replacement for `next/link`'s `Link` that automatically prefixes
 * internal, root-relative hrefs with the current locale segment (e.g.
 * `/games` → `/en/games` while browsing under `/en`). Import this aliased
 * as `Link` anywhere an internal link needs to stay within the current
 * locale.
 *
 * Left untouched: external URLs, hashes/fragments, and `/go/...` (the
 * tracked affiliate redirect, which is never locale-prefixed).
 */
export const LocaleLink = forwardRef<HTMLAnchorElement, NextLinkProps>(
  function LocaleLink({ href, ...props }, ref) {
    const pathname = usePathname()

    const resolvedHref = (() => {
      if (typeof href !== 'string') return href
      if (!href.startsWith('/')) return href
      if (href.startsWith('/go')) return href

      const firstSegment = pathname.split('/')[1] ?? ''
      const currentSegment = isLocaleSegment(firstSegment) ? firstSegment : null
      if (!currentSegment) return href

      const hrefFirstSegment = href.split('/')[1] ?? ''
      if (isLocaleSegment(hrefFirstSegment)) return href

      return href === '/' ? `/${currentSegment}` : `/${currentSegment}${href}`
    })()

    return <NextLink ref={ref} href={resolvedHref} {...props} />
  },
)
