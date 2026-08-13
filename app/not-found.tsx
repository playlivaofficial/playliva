import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DEFAULT_LOCALE_SEGMENT } from '@/lib/locale'

/**
 * Renders only for 404s that occur OUTSIDE a valid `/{locale}` segment
 * (e.g. a request middleware couldn't map to any route at all). It sits
 * outside `CountryProvider`, so no translation context is available here —
 * intentionally minimal and locale-agnostic. The rich, translated 404 for
 * pages within a valid locale lives at `app/[locale]/not-found.tsx`.
 */
export default function NotFound() {
  return (
    <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-grid">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 mx-auto h-64 max-w-3xl rounded-full bg-primary/20 blur-[100px]"
      />
      <div className="relative mx-auto max-w-xl px-4 text-center sm:px-6">
        <p className="font-display text-6xl font-bold text-primary text-glow">
          404
        </p>
        <h1 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Page not found
        </h1>
        <p className="mx-auto mt-3 max-w-md text-pretty leading-relaxed text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" render={<Link href={`/${DEFAULT_LOCALE_SEGMENT}`} />}>
            Back home
          </Button>
        </div>
      </div>
    </section>
  )
}
