import { contentLocale } from '@/lib/locale'
import type { Locale } from '@/lib/types'
import { EDITOR, editorialCopy, editorialRecord } from '@/lib/editorial'
import { LocaleLink } from '@/components/locale-link'

export function EditorialByline({ path, locale }: { path: string; locale: Locale }) {
  const record = editorialRecord(path)
  if (!record) return null
  const c = editorialCopy(locale)
  const date = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
  return <aside data-editorial-byline="playliva" className="my-5 space-y-1 text-sm leading-relaxed text-muted-foreground">
    <p><LocaleLink href={EDITOR.profile} className="underline underline-offset-4">{EDITOR.name}</LocaleLink> · {EDITOR.role[contentLocale(locale)]}</p>
    {record.publishedAt ? <p>{c.published}: <time dateTime={record.publishedAt}>{date(record.publishedAt)}</time></p> : <p>{c.unknown}</p>}
    {record.updatedAt && <p>{c.updated}: <time dateTime={record.updatedAt}>{date(record.updatedAt)}</time></p>}
    <LocaleLink href="/editorial-policy" className="inline-flex min-h-9 items-center underline underline-offset-4">{c.policy}</LocaleLink>
  </aside>
}
