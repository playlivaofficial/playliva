import { createHash } from 'node:crypto'
import { ANGLES, hookSimilarity, type Angle, type AutomationState, type GenerationGame, type GenerationJob } from './automation-model'

const hooks: Record<Angle, string[]> = {
  wow: ['Olha essa rodada de {game}!', 'O momento que muda tudo está chegando.', 'Segura essa sequência no {game}!', 'Pisca e você perde o melhor momento.', 'Essa partida merecia um replay.', 'O suspense cabe inteiro nessa tela.', 'Vem ver o que aconteceu nessa tentativa.', 'Já sentiu aquela tensão no último segundo?', 'A próxima jogada promete uma surpresa.', 'O ritmo acelerou por aqui!', 'Começou tranquilo. E agora?', 'Assiste até o fim dessa rodada.'],
  challenge: ['Qual seria a sua próxima decisão?', 'Você faria diferente no {game}?', 'Topa testar uma estratégia nova?', 'Consegue escolher antes da próxima jogada?', 'Até onde você iria nessa tentativa?', 'Conta aí: qual é o seu estilo de jogo?', 'Pausa aqui e faz a sua previsão.', 'Você prefere arriscar ou jogar com calma?', 'Uma escolha, várias possibilidades.', 'Como você resolveria essa rodada?', 'Qual detalhe você reparou primeiro?', 'Seu palpite combina com esse resultado?'],
  feature: ['Conheça o {game} jogando de graça.', 'Um Original do PlayLiva para mudar o ritmo.', 'O detalhe que dá personalidade a essa partida.', 'Aprenda observando uma rodada de verdade.', 'Uma pausa rápida com o {game}.', 'Diversão virtual, do começo ao fim.', 'Cada jogada tem seu próprio ritmo.', 'Seu próximo intervalo pode começar aqui.', 'Chega mais para conhecer esse Original.', 'O jeito mais fácil de entender é ver jogar.', 'Um cenário, uma rodada, uma nova descoberta.', 'Salva essa ideia para a próxima pausa.'],
}
export function mechanicFor(game: GenerationGame) {
  if (game.category.toLowerCase().includes('crash')) return 'Acompanhe o multiplicador e escolha quando retirar os créditos virtuais.'
  if (game.category.toLowerCase().includes('slot')) return 'Gire os símbolos e acompanhe as combinações na tela.'
  if (/blackjack|21-brasil/.test(game.slug)) return 'Peça outra carta ou pare. O objetivo é chegar perto de vinte e um sem passar.'
  if (/roulette|raio/.test(game.slug)) return 'Escolha uma opção na mesa e acompanhe o resultado da roleta.'
  if (game.slug === 'mines') return 'Revele casas e escolha quando encerrar sua tentativa.'
  if (game.slug === 'samba-drop') return 'Solte a bolinha e acompanhe o caminho até o multiplicador.'
  return 'Conheça as regras e acompanhe uma rodada deste Original.'
}
export function planCreative(game: GenerationGame, angle: Angle, batchId: string, now: string, state: AutomationState): GenerationJob {
  const recentBatches = new Set(state.batches.slice(-3).map(row => row.id))
  const recent = Object.values(state.jobs).filter(row => row.gameSlug === game.slug && recentBatches.has(row.batchId))
  const seed = createHash('sha256').update(`${batchId}:${game.slug}:${angle}`).digest().readUInt32BE(0)
  const choices = hooks[angle].map(template => template.replace('{game}', game.title))
  const hook = Array.from({ length: choices.length }, (_, index) => choices[(seed + index) % choices.length])
    .find(candidate => recent.every(row => hookSimilarity(candidate, row.creative.hook) < .7))
  if (!hook) throw new Error(`Social hook pool exhausted for ${game.slug}; no duplicate was queued.`)
  const id = `${batchId}-${game.slug}-${angle}`
  const variants = new Set(recent.filter(row => row.angle === angle).map(row => row.captureVariant))
  const captureVariant = Array.from({ length: 12 }, (_, index) => (seed + index) % 12).find(value => !variants.has(value))!
  const description = `${mechanicFor(game)} Jogue grátis no PlayLiva. Créditos virtuais sem valor monetário. 18+.`
  return { id, batchId, gameSlug: game.slug, angle, state: 'queued', attempts: 0, pinned: false, pinHistory: [], mediaStatus: 'pending', downloadCount: 0, captureVariant,
    voiceLine: `${hook} ${mechanicFor(game)} Jogue grátis no PlayLiva.`,
    creative: { id, gameSlug: game.slug, gameTitle: game.title, title: `${game.title} — ${hook}`, hook, description, caption: `${hook}\n${description}\nhttps://www.playliva.com/pt-br${game.route}`,
      locale: 'pt-BR', platform: 'Universal vertical', duration: 20, createdAt: now, updatedAt: null, reviewStatus: 'needs_review', approvedAt: null, renderStatus: 'pending', uploadStatus: 'not_uploaded', publishStatus: 'unpublished', publishedAt: null,
      youtube: { videoId: null, state: 'unknown', source: 'Manual posting only; no platform upload.', checkedAt: null, views: null, likes: null, comments: null }, uploadHistory: [], qc: null,
      media: { video: false, thumbnail: false }, utmCampaign: batchId, utmContent: id, targetUrl: `https://www.playliva.com/pt-br${game.route}`, hashtags: ['PlayLiva', 'JogueGratis', 'PlayLivaOriginals'] }
  }
}
export function planBatch(games: GenerationGame[], batchId: string, now: string, state: AutomationState, canary = false) {
  if (!games.length || new Set(games.map(game => game.slug)).size !== games.length) throw new Error('Social game registry is empty or contains duplicates.')
  return games.flatMap(game => (canary ? ANGLES.slice(0, 1) : ANGLES).map(angle => planCreative(game, angle, batchId, now, state)))
}
