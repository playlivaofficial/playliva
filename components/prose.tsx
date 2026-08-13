import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Consistent long-form typography for content and legal pages. */
export function Prose({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'max-w-3xl space-y-6 text-base leading-relaxed text-muted-foreground',
        '[&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:tracking-tight [&_h2]:mt-10',
        '[&_h3]:font-display [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground [&_h3]:mt-6',
        '[&_p]:text-pretty',
        '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4',
        '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul>li]:pl-1',
        '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2',
        '[&_strong]:text-foreground [&_strong]:font-semibold',
        className,
      )}
    >
      {children}
    </div>
  )
}

/** Highlighted callout used for template / legal-review notices. */
export function TemplateNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm font-medium text-foreground">
      {children}
    </div>
  )
}
