'use client'

import type { ReactNode } from 'react'
import { LocaleLink } from '@/components/locale-link'
import { useCountry } from '@/components/country-context'
import { getLegalPage, type LegalPageKey } from '@/lib/legal-content'
import { PageHero } from '@/components/page-hero'
import { Section } from '@/components/section'
import { Prose, TemplateNotice } from '@/components/prose'
import { Button } from '@/components/ui/button'

/** Parse a limited inline markup ( **bold** and [label](href) ) to nodes. */
function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  // Combined matcher for links and bold.
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1] && m[2]) {
      const label = m[1]
      const href = m[2]
      if (href.startsWith('/')) {
        nodes.push(
          <LocaleLink key={i++} href={href}>
            {label}
          </LocaleLink>,
        )
      } else {
        nodes.push(
          <a
            key={i++}
            href={href}
            {...(href.startsWith('http')
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            {label}
          </a>,
        )
      }
    } else if (m[3]) {
      nodes.push(<strong key={i++}>{m[3]}</strong>)
    }
    last = re.lastIndex
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export function LegalPage({
  pageKey,
  children,
}: {
  pageKey: LegalPageKey
  /** Optional extra content rendered after the prose (e.g. contact form). */
  children?: ReactNode
}) {
  const { locale, t } = useCountry()
  const page = getLegalPage(pageKey, locale)

  return (
    <div>
      <PageHero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.description}
      />
      <Section>
        {page.template && (
          <TemplateNotice>{t('legal.templateNotice')}</TemplateNotice>
        )}

        {page.cards && page.cards.length > 0 && (
          <div
            className={
              page.cards.length > 4
                ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
                : 'grid gap-4 sm:grid-cols-2'
            }
          >
            {page.cards.map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <h2 className="font-display text-base font-bold text-foreground">
                  {c.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {c.text}
                </p>
              </div>
            ))}
          </div>
        )}

        {page.sections && page.sections.length > 0 && (
          <Prose className={page.template || page.cards ? 'mt-10' : undefined}>
            {page.sections.map((s, idx) => (
              <div key={idx} className="space-y-6">
                {s.h && <h2>{s.h}</h2>}
                {s.body.map((p, i) => (
                  <p key={i}>{parseInline(p)}</p>
                ))}
              </div>
            ))}
          </Prose>
        )}

        {page.ageCallout && (
          <div className="mt-8 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
            <span className="inline-grid size-9 place-items-center rounded-lg border border-primary/40 text-sm font-bold text-primary">
              18+
            </span>
            <p className="text-sm font-medium text-foreground">
              {page.ageCallout}
            </p>
          </div>
        )}

        {page.buttons && page.buttons.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-3">
            {page.buttons.map((b) => (
              <Button
                key={b.href}
                size="lg"
                variant={b.variant === 'outline' ? 'outline' : 'default'}
                render={<LocaleLink href={b.href} />}
              >
                {b.label}
              </Button>
            ))}
          </div>
        )}

        {children}
      </Section>
    </div>
  )
}
