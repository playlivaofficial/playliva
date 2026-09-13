'use client'

import { LocaleLink } from '@/components/locale-link'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/components/country-context'

export function Logo({
  withTagline = false,
  className,
}: {
  withTagline?: boolean
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <LocaleLink
      href="/"
      aria-label={`PlayLiva · ${t('nav.home')}`}
      className={cn('group inline-flex flex-col leading-none', className)}
    >
      <span className="flex items-center gap-2">
        <svg
          viewBox="0 0 512 512"
          aria-hidden="true"
          className="size-8 drop-shadow-[0_0_16px_rgba(42,125,255,0.45)] transition-transform group-hover:scale-105"
        >
          <defs>
            <linearGradient
              id="playlivaNavMark"
              x1="120"
              y1="80"
              x2="380"
              y2="440"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0" stopColor="#59A6FF" />
              <stop offset="0.55" stopColor="#2A7DFF" />
              <stop offset="1" stopColor="#0E5BF0" />
            </linearGradient>
          </defs>
          <rect
            x="128"
            y="96"
            width="84"
            height="336"
            rx="42"
            fill="url(#playlivaNavMark)"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            fill="url(#playlivaNavMark)"
            d="M238 62a128 128 0 1 0 0 256 128 128 0 0 0 0-256Zm0 66a62 62 0 1 1 0 124 62 62 0 0 1 0-124Z"
          />
          <path
            d="M206 150 L206 230 L286 190 Z"
            fill="#FFFFFF"
            stroke="#FFFFFF"
            strokeWidth="12"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-display text-lg font-bold tracking-tight text-foreground">
          PLAY<span className="text-primary">LIVA</span>
        </span>
      </span>
      {withTagline && (
        <span className="mt-1 pl-10 text-xs font-medium text-muted-foreground">
          {t('brand.slogan')}
        </span>
      )}
    </LocaleLink>
  )
}
