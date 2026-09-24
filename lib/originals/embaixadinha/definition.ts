import type { OriginalGameDefinition } from '../definition'

/** Brand name stays identical across locales, like the other PlayLiva Originals. */
export const EMBAIXADINHA_NAME = 'Liva Embaixadinha'
export const EMBAIXADINHA: OriginalGameDefinition = Object.freeze({
  id: 'liva-embaixadinha', slug: 'embaixadinha', category: 'crash',
  title: { en: EMBAIXADINHA_NAME, 'pt-BR': EMBAIXADINHA_NAME, 'es-MX': EMBAIXADINHA_NAME },
})
export const EMBAIXADINHA_ASSETS = {
  craque: '/originals/embaixadinha/runtime/craque.glb?v=e89d6b090e19',
} as const
export const EMBAIXADINHA_POSTER = '/originals/embaixadinha/poster.webp'
