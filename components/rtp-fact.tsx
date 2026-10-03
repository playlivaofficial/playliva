import { contentLocale } from '@/lib/locale'
import type { Locale } from '@/lib/types'
import { getRtpEvidence } from '@/lib/rtp'

export function RtpFact({ slug, provider, locale }: { slug: string; provider: string; locale: Locale }) {
  const evidence = getRtpEvidence(slug, provider)
  if (!evidence) return null
  const copy = {
    en: ['according to the provider', 'Checked', 'RTP describes a theoretical long-term average, not a prediction or a guarantee of your return. The operator’s exact configuration has not been verified.'],
    'pt-BR': ['segundo o provedor', 'Verificado em', 'O RTP descreve uma média teórica de longo prazo, não uma previsão ou garantia de retorno pessoal. A configuração exata do operador não foi verificada.'],
    'es-MX': ['según el proveedor', 'Verificado el', 'El RTP describe un promedio teórico a largo plazo, no una predicción ni una garantía de retorno personal. La configuración exacta del operador no se ha verificado.'],
  }[contentLocale(locale)]
  const value = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(Number(evidence.publishedPercent.slice(0, -1)))
  return <aside className="my-6 space-y-2 rounded-xl border border-border p-4 text-sm leading-relaxed" data-rtp-fact={slug}>
    <h2 className="font-semibold">RTP — {value}% ({copy[0]})</h2>
    <p>{evidence.variant[contentLocale(locale)]}</p>
    <p><a href={evidence.source} className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">{provider}</a> · {copy[1]} <time dateTime={evidence.verifiedAt}>{evidence.verifiedAt}</time></p>
    <p className="text-muted-foreground">{copy[2]}</p>
  </aside>
}
