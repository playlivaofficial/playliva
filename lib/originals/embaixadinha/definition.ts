import type { OriginalGameDefinition } from '../definition'

/** Brand name stays identical across locales, like the other PlayLiva Originals. */
export const EMBAIXADINHA_NAME = 'Liva Ginga'
export const EMBAIXADINHA: OriginalGameDefinition = Object.freeze({
  id: 'liva-embaixadinha', slug: 'liva-ginga', category: 'crash',
  title: { en: EMBAIXADINHA_NAME, 'pt-BR': EMBAIXADINHA_NAME, 'es-MX': EMBAIXADINHA_NAME },
})
export const EMBAIXADINHA_ASSETS = {
  craque: '/originals/embaixadinha/runtime/footballer.glb?v=6cc5baf76aad',
} as const
export const EMBAIXADINHA_POSTER = '/originals/embaixadinha/poster.webp'
