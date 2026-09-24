import { Breadcrumbs } from '@/components/breadcrumbs'
import { LocaleLink } from '@/components/locale-link'

/**
 * Visible, crawlable descriptive content for an Original's play page, rendered
 * on the server under the game. Every sentence is shown to players; nothing
 * is hidden or duplicated for search engines. Breadcrumbs emit the site's
 * standard BreadcrumbList JSON-LD from the same visible trail.
 */
export function OriginalSeoArticle({ crumbs, title, paragraphs, rulesTitle, rules, creditsTitle, credits, links }: {
  crumbs: { originals: string; game: string; path: string }
  title: string
  paragraphs: readonly string[]
  rulesTitle: string
  rules: readonly string[]
  creditsTitle: string
  credits: string
  links: readonly { href: string; label: string }[]
}) {
  return <section className="mx-auto w-full max-w-7xl space-y-4 px-4 pb-10 pt-2 text-sm leading-relaxed text-muted-foreground sm:px-6" data-original-article>
    <Breadcrumbs items={[{ label: crumbs.originals, href: '/play' }, { label: crumbs.game }]} />
    <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
    {paragraphs.map(text => <p key={text} className="max-w-3xl">{text}</p>)}
    <h2 className="font-display text-lg font-semibold text-foreground">{rulesTitle}</h2>
    <ul className="max-w-3xl list-disc space-y-1.5 pl-5">{rules.map(rule => <li key={rule}>{rule}</li>)}</ul>
    <h2 className="font-display text-lg font-semibold text-foreground">{creditsTitle}</h2>
    <p className="max-w-3xl">{credits}</p>
    <nav aria-label={crumbs.originals}>
      <ul className="flex flex-wrap gap-2">{links.map(link => <li key={link.href}>
        <LocaleLink href={link.href} prefetch={false} className="inline-flex min-h-10 items-center rounded-full border border-border px-4 font-semibold text-foreground hover:bg-secondary">{link.label}</LocaleLink>
      </li>)}</ul>
    </nav>
  </section>
}
