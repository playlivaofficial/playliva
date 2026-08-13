import type { Locale } from './types'

export function formatMatchDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
  }).format(new Date(iso))
}

export function formatMatchTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatOdds(value: number): string {
  return value.toFixed(2)
}
