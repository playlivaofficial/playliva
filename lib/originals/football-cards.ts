import type { Locale } from '@/lib/types'

/**
 * Discovery-card strings for the football Originals. Kept apart from the full
 * game copy so the homepage, hub and category cards do not ship every rule
 * and article paragraph in three languages. The game copy spreads these in.
 */
type Card = { readonly category: string; readonly posterAlt: string; readonly discovery: string }
export const FOOTBALL_CARDS: Record<'embaixadinha' | 'golaco', Record<Locale, Card>> = {
  embaixadinha: {
    'pt-BR': {
      category: 'Crash',
      posterAlt: 'Craque em 3D com camisa amarela 10 fazendo embaixadinha em uma quadra colorida de comunidade, com casas no morro ao fundo.',
      discovery: 'Embaixadinhas numa quadra ensolarada. Cada toque sobe o multiplicador — retire antes de a bola cair.',
    },
    en: {
      category: 'Crash',
      posterAlt: 'A stylized 3D footballer in a yellow number 10 shirt juggling a ball on a colourful community court, with hillside houses behind.',
      discovery: 'Keepie-uppies on a sunny street court. Every touch lifts the multiplier — cash out before the ball drops.',
    },
    'es-MX': {
      category: 'Crash',
      posterAlt: 'Un futbolista 3D estilizado con playera amarilla número 10 haciendo dominadas en una cancha colorida de barrio, con casas en el cerro al fondo.',
      discovery: 'Dominadas en una cancha soleada de barrio. Cada toque sube el multiplicador: retira antes de que caiga el balón.',
    },
  },
  golaco: {
    'pt-BR': {
      category: 'Slots',
      posterAlt: 'Troféu dourado, bola de ouro, chuteira, luvas e camisa 10 em um estádio iluminado ao pôr do sol, com o logotipo Golaço.',
      discovery: 'Estádio lotado, troféus e bola de ouro. Cada gol no bônus Final de Ouro aumenta a Sequência de Gols até ×5.',
    },
    en: {
      category: 'Slots',
      posterAlt: 'A golden trophy, golden ball, boot, gloves and number 10 shirt in a floodlit stadium at sunset, with the Golaço logo.',
      discovery: 'A packed stadium, trophies and a golden ball. Every goal in the Final de Ouro bonus lifts the Goal Streak up to ×5.',
    },
    'es-MX': {
      category: 'Slots',
      posterAlt: 'Un trofeo dorado, balón de oro, tachones, guantes y playera 10 en un estadio iluminado al atardecer, con el logotipo Golaço.',
      discovery: 'Estadio lleno, trofeos y balón de oro. Cada gol en el bono Final de Ouro sube la Racha de Goles hasta ×5.',
    },
  },
}
