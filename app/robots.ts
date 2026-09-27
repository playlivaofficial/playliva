import type { MetadataRoute } from 'next'
import { SITE_URL, absoluteUrl } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        // Query-string variants (e.g. market/category filters) are
        // duplicate views of canonical pages — keep them out of the index.
        '/*?',
        // Tracked affiliate redirect — never a page worth indexing, and
        // crawling it would just spend crawl budget on 302s to operators.
        '/go',
        // Internal, development-only operator activation overview. Already
        // hard-404s in production and carries its own noindex metadata —
        // this is belt-and-suspenders only.
        '/dev',
        '/owner',
        '/api/owner',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: absoluteUrl('/'),
  }
}
