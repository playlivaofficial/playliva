import { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION, absoluteUrl } from '@/lib/seo'

/**
 * JSON-LD builders.
 *
 * Every field below is either a structural fact about the site itself
 * (name, URL) or derived from data already present elsewhere in the app
 * (breadcrumb labels/paths). Never add invented facts here — no fabricated
 * ratings, review counts, social profiles, or contact details that aren't
 * backed by a real, published source elsewhere in the app.
 */

export type JsonLdObject = Record<string, unknown>

/** Sitewide WebSite entity. Emitted once, in the root layout. */
export function getWebsiteJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
  }
}

/**
 * Sitewide Organization entity. Emitted once, in the root layout.
 * `sameAs` is intentionally omitted — add it only once real, live social
 * profile URLs exist for PlayLiva.
 */
export function getOrganizationJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
  }
}

export interface BreadcrumbItem {
  /** Visible label for the crumb. */
  label: string
  /** Site-relative path, e.g. "/games". Omit on the final (current) item. */
  href?: string
}

/** BreadcrumbList entity for a single page, built from its own crumb trail. */
export function getBreadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  }
}
