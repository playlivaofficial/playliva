import type { MetadataRoute } from 'next'
import { SITE_NAME } from '@/lib/seo'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Find your next game.`,
    short_name: SITE_NAME,
    description:
      'Independent game discovery for your market. Explore popular games and see where to play them.',
    start_url: '/',
    display: 'standalone',
    // Matches the PlayLiva dark navy + electric blue design system.
    background_color: '#0b1020',
    theme_color: '#0b1020',
    icons: [
      {
        src: '/icon-192.png?v=2',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png?v=2',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png?v=2',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
