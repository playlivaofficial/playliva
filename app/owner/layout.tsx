import type { Metadata } from 'next'
export const metadata: Metadata = { title: { default: 'Owner Growth — PlayLiva', template: '%s · PlayLiva Owner' }, description: 'Private PlayLiva owner workspace.', robots: { index: false, follow: false, noarchive: true }, openGraph: null, twitter: null, alternates: { canonical: null, languages: {} } }
export const dynamic = 'force-dynamic'
export default function OwnerLayout({ children }: { children: React.ReactNode }) { return children }
