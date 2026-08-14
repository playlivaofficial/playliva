import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { OPERATORS, COUNTRIES, isOperatorRecommendable } from '@/lib/data'

// Never rendered outside development — no admin auth exists in this
// project, so gating on environment is the only safe way to keep this off
// production. It is also excluded from `robots.ts`/`sitemap.ts` (it is not
// listed there at all), and this hard 404 in production means those are
// belt-and-suspenders rather than the actual gate.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Operator activation overview (dev only)',
  robots: { index: false, follow: false },
}

/**
 * Internal, development-only view of the affiliate activation matrix.
 * Read-only — flipping a partner live is done by editing `OPERATORS` in
 * `lib/data.ts` (see the activation checklist at the bottom of this page),
 * never here.
 */
export default function DevOperatorsOverviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound()
  }

  const countryNames = new Map(COUNTRIES.map((c) => [c.code, c.name]))

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 font-mono text-sm text-foreground">
      <h1 className="font-sans text-2xl font-bold">
        Operator activation overview
      </h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Development-only. Never linked publicly, not in the sitemap, marked
        noindex, and hard-404s outside development. Shows the current
        affiliate-readiness state of every operator record — nothing here is
        editable from this page.
      </p>

      <div className="mt-8 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <Th>Operator</Th>
              <Th>Status</Th>
              <Th>Verified</Th>
              <Th>Affiliate URL</Th>
              <Th>Supported GEOs</Th>
              <Th>Verified games</Th>
              <Th>Last verified</Th>
              <Th>Public CTA</Th>
            </tr>
          </thead>
          <tbody>
            {OPERATORS.map((operator) => {
              const geoCount = operator.countries.length
              const urlCount = Object.values(operator.affiliateUrl).filter(
                Boolean,
              ).length
              const gameCount = Object.values(
                operator.verifiedGames ?? {},
              ).reduce((sum, ids) => sum + (ids?.length ?? 0), 0)
              const eligibleGeos = operator.countries.filter((geo) =>
                isOperatorRecommendable(operator, geo),
              )

              return (
                <tr
                  key={operator.id}
                  className="border-b border-border last:border-b-0"
                >
                  <Td>
                    <div className="font-semibold">{operator.name}</div>
                    <div className="text-muted-foreground">
                      {operator.slug}
                      {operator.isMock && (
                        <span className="ml-1.5 rounded bg-secondary px-1.5 py-0.5 text-[11px]">
                          mock
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <StatusBadge status={operator.affiliateStatus} />
                  </Td>
                  <Td>{operator.verified ? 'yes' : 'no'}</Td>
                  <Td>
                    {urlCount > 0
                      ? `${urlCount}/${geoCount} GEOs configured`
                      : 'not configured'}
                  </Td>
                  <Td>
                    {operator.countries
                      .map((c) => countryNames.get(c) ?? c)
                      .join(', ') || '—'}
                  </Td>
                  <Td>{gameCount}</Td>
                  <Td>{operator.lastVerifiedAt ?? '—'}</Td>
                  <Td>
                    {eligibleGeos.length > 0 ? (
                      <span className="text-primary">
                        {eligibleGeos.join(', ')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">hidden</span>
                    )}
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-border p-4 text-muted-foreground">
        <p className="font-sans font-semibold text-foreground">
          To activate a real partner
        </p>
        <p className="mt-1">
          In <code>lib/data.ts</code>, on that operator&apos;s record, set:
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-secondary/40 p-3 text-xs">
{`affiliateStatus: 'approved'
verified: true
affiliateUrl: { <GEO>: '<real tracked URL>' }
verifiedGames: { <GEO>: ['<game-id>', ...] }
lastVerifiedAt: '<ISO date>'`}
        </pre>
        <p className="mt-2">
          No other file needs to change — CTA rendering, `/go` redirects,
          impression/click tracking, the sitemap, and indexing all key off
          these same fields.
        </p>
      </div>
    </main>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 align-top">{children}</td>
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-secondary text-secondary-foreground',
    approved: 'bg-primary/15 text-primary',
    paused: 'bg-muted text-muted-foreground',
    rejected: 'bg-destructive/15 text-destructive',
  }
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-semibold ${
        styles[status] ?? 'bg-secondary text-secondary-foreground'
      }`}
    >
      {status}
    </span>
  )
}
