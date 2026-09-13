import type { Locale } from '@/lib/types'
import type { ReferenceGame } from '@/lib/catalog/types'
import type { ReferenceComparison, ReferenceReadingList } from '@/lib/catalog/editorial'
import { REFERENCE_COMPARISONS, getReferenceReadingList } from '@/lib/catalog/editorial'
import { REFERENCE_GAMES, PROVIDERS, getReferenceGame, getReferenceProvider, referenceSummary } from '@/lib/catalog'
import { catalogCopy } from '@/lib/catalog/copy'
import { PageHero } from '@/components/page-hero'
import { Section, SectionHeading } from '@/components/section'
import { ContentCard } from '@/components/content-card'
import { LocaleLink } from '@/components/locale-link'
import { CatalogArtwork } from './catalog-artwork'
import { CatalogCard } from './catalog-card'
import { CatalogExplorer } from './catalog-explorer'
import { getCategoryName } from '@/lib/content'
import styles from './catalog.module.css'
import { BetssonSponsoredBanner } from '@/components/affiliates/betsson-sponsored-banner'
import { ProviderPlayRealCta } from '@/components/affiliates/provider-play-real-cta'

function Evidence({ games, locale }: { games: ReferenceGame[]; locale: Locale }) {
  const c = catalogCopy(locale)
  return <aside className={styles.evidence} data-catalog-evidence>
    <h2>{c.sources}</h2><p>{c.checked}: <time dateTime="2026-09-13">{new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date('2026-09-13T12:00:00Z'))}</time></p>
    <ul className={styles.features}>{games.flatMap(game => game.sources.map((source, index) => <li key={source}><a href={source} target="_blank" rel="noopener noreferrer">{game.title} — {getReferenceProvider(game.providerId)!.name}{game.sources.length > 1 ? ` (${index + 1})` : ''}</a></li>))}</ul>
    <p className="mt-4">{c.evidence}</p><p className="mt-3">{c.chance}</p>
  </aside>
}

export function ReferenceGameView({ game, locale }: { game: ReferenceGame; locale: Locale }) {
  const c = catalogCopy(locale), content = game.content[locale], summary = referenceSummary(game, locale)
  const comparisons = REFERENCE_COMPARISONS.filter(item => item.a === game.slug || item.b === game.slug)
  const readingList = getReferenceReadingList(game.slug)
  return <div data-reference-detail={game.slug}>
    <PageHero eyebrow={`${c.reference} / ${summary.provider}`} title={game.title} description={content.summary} breadcrumbs={[{ label: c.home, href: '/' }, { label: c.games, href: '/games' }, { label: game.title }]} />
    <div className={styles.earlyCta}><ProviderPlayRealCta gameSlug={game.slug} category={game.category} /></div>
    <BetssonSponsoredBanner surface="game" layout="compact" />
    <article className={`${styles.article} ${styles.prose}`}>
      <div className={styles.articleGrid}>
        <div><h2>{c.overview}</h2><p>{content.overview}</p><h2>{c.how}</h2><p>{content.howItWorks}</p><h2>{c.features}</h2><ul className={styles.features}>{content.features.map(feature => <li key={feature}>{feature}</li>)}</ul></div>
        <aside><div className={styles.heroArt}><CatalogArtwork game={summary} hero /></div><div className={styles.links}><LocaleLink href={`/providers/${game.providerId}`}>{summary.provider}</LocaleLink><LocaleLink href={`/${game.category}`}>{summary.categoryLabel}</LocaleLink><LocaleLink href="/games">{c.back}</LocaleLink></div></aside>
      </div>
      {readingList && <div className={styles.links}><LocaleLink href={`/games-like/${game.slug}`}>{c.similar} {game.title} →</LocaleLink></div>}
      {comparisons.length > 0 && <section className={styles.related}><h2>{c.comparisons}</h2><div className={styles.links}>{comparisons.map(item => <LocaleLink key={item.slug} href={`/compare/${item.slug}`}>{getReferenceGame(item.a)!.title} vs {getReferenceGame(item.b)!.title}</LocaleLink>)}</div></section>}
      <section className={styles.related}><h2>{c.related}</h2><div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{game.relatedSlugs.map(slug => <CatalogCard key={slug} game={referenceSummary(getReferenceGame(slug)!, locale)} readLabel={c.read} />)}</div></section>
      <Evidence games={[game]} locale={locale} />
    </article>
  </div>
}

export function ReferenceComparisonView({ comparison, locale }: { comparison: ReferenceComparison; locale: Locale }) {
  const c = catalogCopy(locale), a = getReferenceGame(comparison.a)!, b = getReferenceGame(comparison.b)!
  return <div data-reference-comparison={comparison.slug}>
    <PageHero eyebrow={c.comparisons} title={`${a.title} vs ${b.title}`} description={c.comparisonIntro} breadcrumbs={[{ label: c.home, href: '/' }, { label: c.games, href: '/games' }, { label: `${a.title} vs ${b.title}` }]} />
    <BetssonSponsoredBanner surface="comparison" layout="full" />
    <article className={`${styles.article} ${styles.prose}`}><h2>{c.shared}</h2><p>{comparison.shared[locale]}</p><h2>{c.contrast}</h2>
      <div className={styles.comparison}>{[a, b].map((game, index) => <section key={game.id} className={styles.compareCell}><h3>{game.title}</h3><p>{comparison.difference[locale][index]}</p><ul className={`${styles.features} mt-4`}>{game.content[locale].features.map(feature => <li key={feature}>{feature}</li>)}</ul><div className={styles.links}><LocaleLink href={`/games/${game.slug}`}>{c.read} →</LocaleLink></div></section>)}</div>
      <Evidence games={[a, b]} locale={locale} />
    </article>
  </div>
}

export function ReferenceReadingView({ list, locale }: { list: ReferenceReadingList; locale: Locale }) {
  const c = catalogCopy(locale), game = getReferenceGame(list.slug)!
  return <div data-reference-reading={list.slug}><PageHero eyebrow={c.related} title={`${c.similar} ${game.title}`} description={list.intro[locale]} breadcrumbs={[{ label: c.home, href: '/' }, { label: game.title, href: `/games/${game.slug}` }, { label: `${c.similar} ${game.title}` }]} />
    <BetssonSponsoredBanner surface="games-like" layout="full" />
    <article className={`${styles.article} ${styles.prose}`}><p>{c.similarIntro}</p><div className="mt-6 grid gap-5 md:grid-cols-3">{list.alternatives.map(item => <ContentCard key={item.slug}><h2>{getReferenceGame(item.slug)!.title}</h2><p>{item.reason[locale]}</p><div className={styles.links}><LocaleLink href={`/games/${item.slug}`}>{c.read} →</LocaleLink></div></ContentCard>)}</div><Evidence games={[game]} locale={locale} /></article>
  </div>
}

export function ProviderIndexView({ locale }: { locale: Locale }) {
  const c = catalogCopy(locale)
  return <><PageHero eyebrow={c.reference} title={c.providers} description={c.providersIntro} breadcrumbs={[{ label: c.home, href: '/' }, { label: c.games, href: '/games' }, { label: c.providers }]} /><BetssonSponsoredBanner surface="providers" layout="full" /><Section><div className="grid gap-5 md:grid-cols-2">{PROVIDERS.map(provider => <ContentCard key={provider.id}><h2 className="text-xl font-bold">{provider.name}</h2><p className="mt-3 text-muted-foreground leading-relaxed">{provider.overview[locale]}</p><div className={styles.links}><LocaleLink href={`/providers/${provider.id}`}>{REFERENCE_GAMES.filter(g => g.providerId === provider.id).length} {c.catalogCount} →</LocaleLink></div></ContentCard>)}</div></Section></>
}

export function ProviderView({ providerId, locale }: { providerId: string; locale: Locale }) {
  const c = catalogCopy(locale), provider = getReferenceProvider(providerId)!, games = REFERENCE_GAMES.filter(game => game.providerId === provider.id)
  const categories = [...new Set(games.map(game => game.category))]
  return <div data-reference-provider={provider.id}><PageHero eyebrow={c.providers} title={provider.name} description={provider.overview[locale]} breadcrumbs={[{ label: c.home, href: '/' }, { label: c.providers, href: '/providers' }, { label: provider.name }]}><div className={styles.links}>{categories.map(category => <LocaleLink key={category} href={`/${category}`}>{getCategoryName(category, locale)}</LocaleLink>)}</div></PageHero><BetssonSponsoredBanner surface="provider" layout="full" /><Section><p className="mb-6 max-w-3xl text-muted-foreground">{c.providerNote}</p><CatalogExplorer entries={games.map(game => referenceSummary(game, locale)).sort((a, b) => a.title.localeCompare(b.title, locale))} compact /></Section></div>
}

export function CategoryReferenceSection({ category, locale }: { category: string; locale: Locale }) {
  const games = REFERENCE_GAMES.filter(game => game.category === category)
  if (!games.length) return null
  const c = catalogCopy(locale)
  return <Section className="border-t border-border" id={`reference-${category}`}><SectionHeading eyebrow={c.reference} title={c.catalog} description={c.catalogIntro} /><CatalogExplorer entries={games.map(game => referenceSummary(game, locale)).sort((a, b) => a.title.localeCompare(b.title, locale))} compact /></Section>
}
