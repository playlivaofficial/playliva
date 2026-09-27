import { DiscoveryEvents } from '@/components/discovery/events'
import { catalogSummaries } from '@/lib/catalog'
import { discoveryEntries } from '@/lib/discovery/catalog'
import { discoveryCopy } from '@/lib/discovery/copy'
import { editorialLinks } from '@/lib/discovery/links'
import { InstantGuide } from '@/components/discovery/instant-guide'
import { JsonLd } from '@/components/json-ld'
import { discoveryListSchema } from '@/lib/discovery/schema'
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
import { RtpFact } from '@/components/rtp-fact'
import { EditorialByline } from '@/components/editorial-byline'

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
  return <DiscoveryEvents surface="reference" slug={game.slug}><div data-reference-detail={game.slug}>
    <PageHero eyebrow={`${c.reference} / ${summary.provider}`} title={game.title} description={content.summary} breadcrumbs={[{ label: c.home, href: '/' }, { label: c.games, href: '/games' }, { label: game.title }]} sponsor={<BetssonSponsoredBanner surface="game" layout="compact-header" />} />
    <div className={styles.earlyCta}><ProviderPlayRealCta gameSlug={game.slug} category={game.category} /></div>
    <article className={`${styles.article} ${styles.prose}`}>
      <EditorialByline path={`/games/${game.slug}`} locale={locale} />
      <RtpFact slug={game.slug} provider={summary.provider} locale={locale} />
      <div className={styles.articleGrid}>
        <div><h2>{c.overview}</h2><p>{content.overview}</p><h2>{c.how}</h2><p>{content.howItWorks}</p><h2>{c.features}</h2><ul className={styles.features}>{content.features.map(feature => <li key={feature}>{feature}</li>)}</ul></div>
        <aside><div className={styles.heroArt}><CatalogArtwork game={summary} hero /></div><div className={styles.links}><LocaleLink href={`/providers/${game.providerId}`}>{summary.provider}</LocaleLink><LocaleLink href={`/${game.category}`}>{summary.categoryLabel}</LocaleLink><LocaleLink href="/games">{c.back}</LocaleLink></div></aside>
      </div>
      {readingList && <div className={styles.links}><LocaleLink href={`/games-like/${game.slug}`}>{c.similar} {game.title} →</LocaleLink></div>}
      {comparisons.length > 0 && <section className={styles.related}><h2>{c.comparisons}</h2><div className={styles.links}>{comparisons.map(item => <LocaleLink key={item.slug} href={`/compare/${item.slug}`}>{getReferenceGame(item.a)!.title} vs {getReferenceGame(item.b)!.title}</LocaleLink>)}</div></section>}
      <section className={styles.related}><h2>{c.related}</h2><div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{game.relatedSlugs.map(slug => <CatalogCard key={slug} game={referenceSummary(getReferenceGame(slug)!, locale)} readLabel={c.read} />)}</div></section>
      {locale === 'pt-BR' && ['dream-catcher', 'monopoly-live'].includes(game.slug) && <section className={styles.related}>
        <h2>Continue explorando game shows ao vivo</h2>
        <p>Compare esta roda com outros formatos da Evolution sem presumir que regras, bônus ou disponibilidade sejam iguais.</p>
        <div className={styles.links}>
          <LocaleLink href="/live-casino">Cassino ao vivo</LocaleLink>
          <LocaleLink href="/games/crazy-time">Como funciona Crazy Time</LocaleLink>
          <LocaleLink href="/games-like/crazy-time">Alternativas ao Crazy Time</LocaleLink>
          <LocaleLink href="/compare/crazy-time-vs-lightning-roulette">Crazy Time vs Lightning Roulette</LocaleLink>
          <LocaleLink href="/providers/evolution">Jogos da Evolution</LocaleLink>
        </div>
      </section>}
      <Evidence games={[game]} locale={locale} />
    </article>
  </div></DiscoveryEvents>
}

export function ReferenceComparisonView({ comparison, locale }: { comparison: ReferenceComparison; locale: Locale }) {
  const c = catalogCopy(locale), a = getReferenceGame(comparison.a)!, b = getReferenceGame(comparison.b)!
  return <div data-reference-comparison={comparison.slug}>
    <PageHero eyebrow={c.comparisons} title={`${a.title} vs ${b.title}`} description={c.comparisonIntro} breadcrumbs={[{ label: c.home, href: '/' }, { label: c.games, href: '/games' }, { label: `${a.title} vs ${b.title}` }]} sponsor={<BetssonSponsoredBanner surface="comparison" layout="compact-header" />} />
    <article className={`${styles.article} ${styles.prose}`}><EditorialByline path={`/compare/${comparison.slug}`} locale={locale} /><h2>{c.shared}</h2><p>{comparison.shared[locale]}</p><h2>{c.contrast}</h2>
      <div className={styles.comparison}>{[a, b].map((game, index) => <section key={game.id} className={styles.compareCell}><h3>{game.title}</h3><p>{comparison.difference[locale][index]}</p><ul className={`${styles.features} mt-4`}>{game.content[locale].features.map(feature => <li key={feature}>{feature}</li>)}</ul><div className={styles.links}><LocaleLink href={`/games/${game.slug}`}>{c.read} →</LocaleLink></div></section>)}</div>
      <Evidence games={[a, b]} locale={locale} />
    </article>
  </div>
}

export function ReferenceReadingView({ list, locale }: { list: ReferenceReadingList; locale: Locale }) {
  const c = catalogCopy(locale), game = getReferenceGame(list.slug)!
  return <div data-reference-reading={list.slug}><PageHero eyebrow={c.related} title={`${c.similar} ${game.title}`} description={list.intro[locale]} breadcrumbs={[{ label: c.home, href: '/' }, { label: game.title, href: `/games/${game.slug}` }, { label: `${c.similar} ${game.title}` }]} sponsor={<BetssonSponsoredBanner surface="games-like" layout="compact-header" />} />
    <article className={`${styles.article} ${styles.prose}`}><EditorialByline path={`/games-like/${list.slug}`} locale={locale} /><p>{c.similarIntro}</p><div className="mt-6 grid gap-5 md:grid-cols-3">{list.alternatives.map(item => <ContentCard key={item.slug}><h2>{getReferenceGame(item.slug)!.title}</h2><p>{item.reason[locale]}</p><div className={styles.links}><LocaleLink href={`/games/${item.slug}`}>{c.read} →</LocaleLink></div></ContentCard>)}</div><Evidence games={[game]} locale={locale} /></article>
  </div>
}

export function ProviderIndexView({ locale }: { locale: Locale }) {
  const c = catalogCopy(locale)
  return <><PageHero eyebrow={c.reference} title={c.providers} description={c.providersIntro} breadcrumbs={[{ label: c.home, href: '/' }, { label: c.games, href: '/games' }, { label: c.providers }]} sponsor={<BetssonSponsoredBanner surface="providers" layout="compact-header" />} /><Section><div className="grid gap-5 md:grid-cols-2">{PROVIDERS.map(provider => <ContentCard key={provider.id}><h2 className="text-xl font-bold">{provider.name}</h2><p className="mt-3 text-muted-foreground leading-relaxed">{provider.overview[locale]}</p><div className={styles.links}><LocaleLink href={`/providers/${provider.id}`}>{catalogSummaries(locale).filter(g => g.providerId === provider.id).length} {c.catalogCount} →</LocaleLink></div></ContentCard>)}</div></Section></>
}

export function ProviderView({ providerId, locale }: { providerId: string; locale: Locale }) {
  const c = catalogCopy(locale), provider = getReferenceProvider(providerId)!, games = catalogSummaries(locale).filter(game => game.providerId === provider.id)
  const categories = [...new Set(games.map(game => game.category))]
  const title = provider.id === 'pragmatic-play' && locale === 'pt-BR'
    ? 'Jogos da Pragmatic Play: catálogo e mecânicas'
    : provider.id === 'evolution' && locale === 'pt-BR'
      ? 'Jogos da Evolution: cassino ao vivo e game shows'
    : provider.name
  return <DiscoveryEvents surface="provider" slug={provider.id}><div data-reference-provider={provider.id}>
    <PageHero eyebrow={c.providers} title={title} description={provider.overview[locale]} breadcrumbs={[{ label: c.home, href: '/' }, { label: c.providers, href: '/providers' }, { label: provider.name }]} sponsor={<BetssonSponsoredBanner surface="provider" layout="compact-header" />}>
      <div className={styles.links}>
        {categories.map(category => <LocaleLink key={category} href={`/${category}`}>{getCategoryName(category, locale)}</LocaleLink>)}
        {provider.id === 'pragmatic-play' && locale === 'pt-BR' && <><LocaleLink href="/games/gates-of-olympus">Gates of Olympus</LocaleLink><LocaleLink href="/games/sweet-bonanza">Sweet Bonanza</LocaleLink><LocaleLink href="/games/big-bass-bonanza">Big Bass Bonanza</LocaleLink></>}
        {provider.id === 'evolution' && locale === 'pt-BR' && <><LocaleLink href="/games/crazy-time">Crazy Time</LocaleLink><LocaleLink href="/games/lightning-roulette">Lightning Roulette</LocaleLink><LocaleLink href="/games/blackjack-live">Blackjack Live</LocaleLink></>}
      </div>
    </PageHero>
    {provider.id === 'evolution' && locale === 'pt-BR' && <Section className="border-b border-border">
      <ContentCard>
        <h2 className="text-xl font-bold">Formatos ao vivo da Evolution</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed">O catálogo reúne formatos com regras diferentes: roleta ao vivo, mesas de blackjack e game shows baseados em roda. Consulte cada guia para entender a mecânica documentada antes de comparar jogos.</p>
        <div className={styles.links}>
          <LocaleLink href="/live-casino">Cassino ao vivo</LocaleLink>
          <LocaleLink href="/games/dream-catcher">Dream Catcher</LocaleLink>
          <LocaleLink href="/games/monopoly-live">MONOPOLY Live</LocaleLink>
          <LocaleLink href="/games-like/crazy-time">Alternativas ao Crazy Time</LocaleLink>
          <LocaleLink href="/compare/crazy-time-vs-lightning-roulette">Crazy Time vs Lightning Roulette</LocaleLink>
        </div>
      </ContentCard>
    </Section>}
    <Section><p className="mb-6 max-w-3xl text-muted-foreground">{c.providerNote}</p><CatalogExplorer entries={games.sort((a, b) => a.title.localeCompare(b.title, locale))} compact /><JsonLd data={discoveryListSchema(games.slice(0,12).map(g => ({title:g.title,href:`/games/${g.slug}`})),locale.toLowerCase())}/><div className={styles.links}>{editorialLinks(games.map(g=>g.slug),locale).map(link=><LocaleLink key={link.href} href={link.href}>{link.title}</LocaleLink>)}</div></Section>
  </div></DiscoveryEvents>
}

export function CategoryReferenceSection({ category, locale }: { category: string; locale: Locale }) {
  const entries=discoveryEntries(locale),games=REFERENCE_GAMES.filter(game=>game.category===category),real=entries.filter(g=>g.kind==='provider'&&(g.category===category||category==='table-games'&&g.format==='blackjack'))
  const originals=entries.filter(g=>g.kind==='original'&&(g.category===category||category==='live-casino'&&g.category==='table-games'))
  const providers=[...new Map(real.map(g=>[g.providerId,g.provider])).entries()],c=catalogCopy(locale),d=discoveryCopy(locale)
  return <Section className="border-t border-border" id={`reference-${category}`}>
    {category==='instant-games'&&<InstantGuide locale={locale}/>}
    {games.length>0&&<><SectionHeading eyebrow={c.reference} title={c.catalog} description={c.catalogIntro}/><CatalogExplorer entries={games.map(g=>referenceSummary(g,locale)).sort((a,b)=>a.title.localeCompare(b.title,locale))} compact/></>}
    <nav aria-label={d.navigation} className={styles.related}><h2 className="text-xl font-bold">{d.providers}</h2><div className={styles.links}>{providers.map(([id,name])=><LocaleLink key={id} href={`/providers/${id}`}>{name}</LocaleLink>)}</div><div className={styles.links}>{editorialLinks(real.map(g=>g.slug),locale).map(link=><LocaleLink key={link.href} href={link.href}>{link.title}</LocaleLink>)}</div></nav>
    <div className={styles.related}><h2 className="text-xl font-bold">{d.own}</h2><p className="mt-3 text-muted-foreground">{d.crossNote}</p><div className={styles.links}>{originals.map(g=><LocaleLink key={g.href} href={g.href} prefetch={false}>{g.title} · PlayLiva Original</LocaleLink>)}</div></div>
  </Section>
}
