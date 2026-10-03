import { contentLocale } from '@/lib/locale'
import type { ContentLocale } from '@/lib/types'
import type { Locale } from '@/lib/types'

// Discovery metadata only: never import the renderer, wallet or asset loader.
export const ISLAND_CRASH_POSTER = '/originals/crash/island-crash-poster.webp'
export const ISLAND_CRASH_PLAY_PATH = '/play/crash'

type DiscoveryCopy = {
  originals: string; freePlay: string; playFree: string; demoGames: string
  category: string; title: string; description: string; posterAlt: string
  virtualCredits: string; noDeposits: string; noWithdrawals: string; noValue: string
  disclaimer: string; homeTitle: string; homeDescription: string; heroLink: string
  hubLink: string; hubTitle: string; hubDescription: string; available: string
  categoryTitle: string; categoryDescription: string; discoverTitle: string
  discoverDescription: string; discoverLink: string; seoTitle: string; seoDescription: string; newBadge: string
}

const COPY: Record<ContentLocale, DiscoveryCopy> = {
  en: {
    originals: 'PlayLiva Originals', freePlay: 'FREE PLAY', playFree: 'Play Free',
    demoGames: 'Demo Games', category: 'Crash', title: 'PlayLiva Island Crash',
    description: 'One kick starts the adventure. Follow the multiplier and time your exit before the jungle landing.',
    posterAlt: 'The Island Crash kicker and castaway on a sunny tropical island.',
    virtualCredits: 'Virtual Liva Credits only', noDeposits: 'No deposits',
    noWithdrawals: 'No withdrawals', noValue: 'No monetary value',
    disclaimer: 'Demo games use virtual Liva Credits only. No deposits, no withdrawals, and no monetary value.',
    homeTitle: 'Play free on PlayLiva',
    homeDescription: 'Our original games. Your next adventure. Discover Island Crash, Liva Ginga, Liva Capybara Gold, Liva Golaço, Liva Blackjack, Liva Roulette Liva Mines, Liva Raio and Liva 21 Brasil with virtual credits.',
    heroLink: 'Play Island Crash for free', hubLink: 'Explore the Play hub',
    hubTitle: 'Original games. Free to play.',
    hubDescription: 'Meet PlayLiva Originals: Island Crash, Liva Ginga, Liva Capybara Gold, Liva Golaço, Liva Blackjack, Liva Roulette: Golden Orbit Liva Mines: Jungle Gold, Liva Raio and Liva 21 Brasil. Nine free-play adventures, right in your browser.',
    available: 'Ready to play', categoryTitle: 'Our island. Your free flight.',
    categoryDescription: 'Try our own crash-style demo before exploring the provider games below. Island Crash is a PlayLiva Original, not a provider or operator game.',
    discoverTitle: 'Keep discovering',
    discoverDescription: 'Looking for provider games? Explore the separate discovery catalog, comparisons and operator information for your market.',
    discoverLink: 'Explore provider games', seoTitle: 'PlayLiva Originals — Free Demo Games',
    seoDescription: 'Play Island Crash, Liva Ginga, Liva Capybara Gold, Liva Golaço and more PlayLiva Originals free. Virtual Liva Credits only. No deposits or monetary value.',
    newBadge: 'NEW',
  },
  'pt-BR': {
    originals: 'PlayLiva Originals', freePlay: 'JOGUE GRÁTIS', playFree: 'Jogar grátis',
    demoGames: 'Jogos demo', category: 'Crash', title: 'PlayLiva Island Crash',
    description: 'Um chute dá início à aventura. Acompanhe o multiplicador e escolha a hora de sair antes da aterrissagem na selva.',
    posterAlt: 'A personagem que chuta e o náufrago de Island Crash em uma ilha tropical ensolarada.',
    virtualCredits: 'Somente Liva Credits virtuais', noDeposits: 'Sem depósitos',
    noWithdrawals: 'Sem saques', noValue: 'Sem valor monetário',
    disclaimer: 'Os jogos demo usam apenas Liva Credits virtuais. Sem depósitos, sem saques e sem valor monetário.',
    homeTitle: 'Jogue grátis no PlayLiva',
    homeDescription: 'Nossos jogos originais. Sua próxima aventura. Descubra Island Crash, Liva Ginga, Liva Capybara Gold, Liva Golaço, Liva Blackjack, Liva Roulette Liva Mines, Liva Raio e Liva 21 Brasil com créditos virtuais.',
    heroLink: 'Jogue Island Crash grátis', hubLink: 'Ver a área de jogos grátis',
    hubTitle: 'Jogos originais. Diversão gratuita.',
    hubDescription: 'Conheça o PlayLiva Originals: Island Crash, Liva Ginga, Liva Capybara Gold, Liva Golaço, Liva Blackjack, Liva Roulette: Golden Orbit Liva Mines: Jungle Gold, Liva Raio e Liva 21 Brasil. Nove aventuras grátis, direto no navegador.',
    available: 'Pronto para jogar', categoryTitle: 'Nossa ilha. Seu voo grátis.',
    categoryDescription: 'Experimente nosso demo no estilo crash antes de explorar os jogos de provedores abaixo. Island Crash é um PlayLiva Original, não um jogo de provedor ou operador.',
    discoverTitle: 'Continue explorando',
    discoverDescription: 'Procura jogos de provedores? Explore o catálogo separado de jogos, comparações e informações de operadores para o seu mercado.',
    discoverLink: 'Explorar jogos de provedores', seoTitle: 'PlayLiva Originals — Jogos Demo Grátis',
    seoDescription: 'Jogue Island Crash, Liva Ginga, Liva Capybara Gold, Liva Golaço e outros PlayLiva Originals grátis. Só Liva Credits virtuais, sem depósitos.',
    newBadge: 'NOVO',
  },
  'es-MX': {
    originals: 'PlayLiva Originals', freePlay: 'JUEGA GRATIS', playFree: 'Jugar gratis',
    demoGames: 'Juegos demo', category: 'Crash', title: 'PlayLiva Island Crash',
    description: 'Una patada inicia la aventura. Sigue el multiplicador y elige cuándo salir antes del aterrizaje en la selva.',
    posterAlt: 'La pateadora y el náufrago de Island Crash en una isla tropical soleada.',
    virtualCredits: 'Solo Liva Credits virtuales', noDeposits: 'Sin depósitos',
    noWithdrawals: 'Sin retiros', noValue: 'Sin valor monetario',
    disclaimer: 'Los juegos demo usan solo Liva Credits virtuales. Sin depósitos, sin retiros y sin valor monetario.',
    homeTitle: 'Juega gratis en PlayLiva',
    homeDescription: 'Nuestros juegos originales. Tu próxima aventura. Descubre Island Crash, Liva Ginga, Liva Capybara Gold, Liva Golaço, Liva Blackjack, Liva Roulette Liva Mines, Liva Raio y Liva 21 Brasil con créditos virtuales.',
    heroLink: 'Juega Island Crash gratis', hubLink: 'Ver la sección de juegos gratis',
    hubTitle: 'Juegos originales. Diversión gratis.',
    hubDescription: 'Conoce PlayLiva Originals: Island Crash, Liva Ginga, Liva Capybara Gold, Liva Golaço, Liva Blackjack, Liva Roulette: Golden Orbit Liva Mines: Jungle Gold, Liva Raio y Liva 21 Brasil. Nueve aventuras gratis, directo en tu navegador.',
    available: 'Listo para jugar', categoryTitle: 'Nuestra isla. Tu vuelo gratis.',
    categoryDescription: 'Prueba nuestro demo estilo crash antes de explorar los juegos de proveedores de abajo. Island Crash es un PlayLiva Original, no un juego de proveedor u operador.',
    discoverTitle: 'Sigue descubriendo',
    discoverDescription: '¿Buscas juegos de proveedores? Explora el catálogo independiente de juegos, comparaciones e información de operadores para tu mercado.',
    discoverLink: 'Explorar juegos de proveedores', seoTitle: 'PlayLiva Originals — Juegos Demo Gratis',
    seoDescription: 'Juega Island Crash, Liva Ginga, Liva Capybara Gold, Liva Golaço y más PlayLiva Originals gratis. Solo Liva Credits virtuales, sin depósitos.',
    newBadge: 'NUEVO',
  },
}

export const originalsDiscoveryCopy = (locale: Locale): DiscoveryCopy => COPY[contentLocale(locale)]

const LINK_LABELS: Record<ContentLocale, { hub: string; crash: string; slots: string }> = {
  en: { hub: 'All PlayLiva Originals', crash: 'Crash games', slots: 'Slot games' },
  'pt-BR': { hub: 'Todos os PlayLiva Originals', crash: 'Jogos crash', slots: 'Jogos de slot' },
  'es-MX': { hub: 'Todos los PlayLiva Originals', crash: 'Juegos crash', slots: 'Juegos de slots' },
}
/** Internal links shown under an Original's play page (never the current page). */
export function originalsLinks(locale: Locale, currentSlug: string): { href: string; label: string }[] {
  const labels = LINK_LABELS[contentLocale(locale)]
  return [
    { href: '/play/avia-de-janeiro', label: 'Avia de Janeiro' },
    { href: '/play/samba-drop', label: 'Liva Samba Drop' },
    { href: '/play/skuptu-levanta', label: 'Skuptu Levanta' },
    { href: '/play/carnaval-gold', label: 'Liva Carnaval Gold' },
    { href: '/play', label: labels.hub },
    { href: '/play/liva-ginga', label: 'Liva Ginga' },
    { href: '/play/golaco', label: 'Liva Golaço' },
    { href: '/play/liva-raio', label: 'Liva Raio' },
    { href: '/play/liva-21-brasil', label: 'Liva 21 Brasil' },
    { href: ISLAND_CRASH_PLAY_PATH, label: 'Island Crash' },
    { href: '/play/capybara-gold', label: 'Liva Capybara Gold' },
    { href: '/crash', label: labels.crash },
    { href: '/slots', label: labels.slots },
  ].filter(link => link.href !== `/play/${currentSlug}`)
}
