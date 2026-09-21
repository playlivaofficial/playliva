const STATIC_IMAGES: Record<string, string> = {
  '/': '/icon-512.png',
  '/games': '/icon-512.png',
  '/play': '/icon-512.png',
  '/play/crash': '/originals/crash/island-crash-poster.webp',
  '/play/capybara-gold': '/originals/capybara-gold/river.webp',
  '/play/blackjack': '/games/blackjack-live.webp',
  '/play/roulette': '/games/lightning-roulette.jpg',
  '/play/mines': '/games/mines.jpeg',
  '/crash': '/games/aviator.png',
  '/best/crash-games': '/games/aviator.png',
  '/best/best-crash-games-brazil': '/games/aviator.png',
  '/slots': '/games/gates-of-olympus.png',
  '/live-casino': '/games/blackjack-live.webp',
  '/table-games': '/games/lightning-roulette.jpg',
  '/instant-games': '/games/mines.jpeg',
  '/offers': '/operators/betsson.png',
  '/operators': '/operators/betsson.png',
  '/operators/betsson-group-affiliates': '/operators/betsson.png',
}

/** Existing, rights-cleared art for selected high-value social previews. */
export function seoImagesForPath(path: string): string[] | undefined {
  const image = STATIC_IMAGES[path]
  return image ? [image] : undefined
}
