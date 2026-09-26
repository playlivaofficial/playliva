import type { OriginalGameDefinition } from './definition'
export type ThreeGameKind = 'samba-drop' | 'skuptu-levanta' | 'carnaval-gold'
const game = <S extends ThreeGameKind>(slug: S, name: string, category: OriginalGameDefinition['category']): OriginalGameDefinition & { slug: S } =>
  Object.freeze({ id: slug, slug, category, title: { en: name, 'pt-BR': name, 'es-MX': name } })
export const SAMBA_DROP = game('samba-drop', 'Liva Samba Drop', 'instant-games')
export const LEVANTA = game('skuptu-levanta', 'Skuptu Levanta', 'crash')
export const CARNAVAL = game('carnaval-gold', 'Liva Carnaval Gold', 'slots')
export const THREE_GAMES = [SAMBA_DROP, LEVANTA, CARNAVAL] as const
export const gamePoster = (slug: string) => `/originals/${slug === 'skuptu-levanta' ? 'levanta' : slug}/poster.webp`
