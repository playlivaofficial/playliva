import catalog from '../lib/catalog/validate.ts'
import sitemapModule from '../app/sitemap.ts'
const errors = catalog.validateCatalog()
const urls = sitemapModule.default().map(entry => entry.url)
if (new Set(urls).size !== urls.length) errors.push('Duplicate sitemap URLs')
if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else console.log(`Catalog integrity passed; ${urls.length} unique localized sitemap URLs.`)
