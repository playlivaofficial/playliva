// Compatibility URL: middleware issues the locale/query-preserving HTTP 301.
// Fail closed if middleware is bypassed; never serve a duplicate indexable game.
import { notFound } from 'next/navigation'
export const metadata = { robots: { index: false, follow: true } }
export default function LegacyFootballPage() { notFound() }
