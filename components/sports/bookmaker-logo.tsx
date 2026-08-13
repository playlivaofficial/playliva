import { cn } from '@/lib/utils'

const PALETTE = [
  'bg-primary/20 text-primary',
  'bg-chart-3/25 text-chart-3',
  'bg-chart-4/25 text-chart-4',
]

/** Deterministic placeholder mark until real bookmaker logos are wired in. */
function paletteFor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[hash % PALETTE.length]
}

export function BookmakerLogo({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-lg text-xs font-bold',
        paletteFor(name),
        className,
      )}
    >
      {initials}
    </span>
  )
}
