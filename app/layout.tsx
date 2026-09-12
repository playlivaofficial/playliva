import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Inter, Space_Grotesk, Geist_Mono } from 'next/font/google'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
} from '@/lib/seo'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono-geist' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'PlayLiva — Find Your Next Game',
    template: `%s — ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  // Known pages opt into indexing and provide their own canonical through
  // pageMetadata. Unknown/error routes must never inherit homepage indexing.
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  // Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION once the property is added in
  // Google Search Console (Settings → Ownership verification → HTML tag).
  // Omitted entirely until a real value is provided — never fabricate one.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
  keywords: [
    'descoberta de jogos',
    'descubrimiento de juegos',
    'jogos crash',
    'juegos crash',
    'comparação de jogos',
    'comparación de juegos',
  ],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    locale: 'pt_BR',
    alternateLocale: ['es_MX'],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  icons: {
    // Cache-busting query string forces browsers to drop any previously
    // cached (default v0/Vercel) favicon and fetch the PlayLiva mark.
    icon: [
      { url: '/icon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon-32.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png?v=2', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: ['/favicon-32.png?v=2'],
    apple: [
      { url: '/apple-icon.png?v=2', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b1020',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Set by middleware for every locale-prefixed request. Falls back to the
  // default locale for the rare case a request reaches this layout without
  // going through middleware (e.g. static export tooling).
  const headerList = await headers()
  const localeSegment = headerList.get('x-locale') ?? ''
  const htmlLang = isLocaleSegment(localeSegment)
    ? segmentToLocale(localeSegment)
    : 'pt-BR'

  return (
    <html
      lang={htmlLang}
      className={`${inter.variable} ${spaceGrotesk.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
