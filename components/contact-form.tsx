'use client'

import { contactDraft } from '@/lib/contact'
import { useCountry } from '@/components/country-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function ContactForm() {
  const { t } = useCountry()

  const topics = [
    t('contact.topicGeneral'),
    t('contact.topicPartnership'),
    t('contact.topicAffiliate'),
    t('contact.topicOperator'),
    t('contact.topicResponsible'),
  ]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const values = new FormData(e.currentTarget)
    window.location.href = contactDraft({
      name: String(values.get('name') ?? ''),
      email: String(values.get('email') ?? ''),
      topic: String(values.get('topic') ?? ''),
      message: String(values.get('message') ?? ''),
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="grid gap-5">
        <p className="text-sm text-muted-foreground">{t('contact.draftNote')}{' '}
          <a href="mailto:hello@playliva.com" className="underline underline-offset-4">hello@playliva.com</a>
        </p>
        <div className="grid gap-2">
          <Label htmlFor="name">{t('contact.name')}</Label>
          <Input
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder={t('contact.namePlaceholder')}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">{t('contact.email')}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t('contact.emailPlaceholder')}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="topic">{t('contact.topic')}</Label>
          <select
            id="topic"
            name="topic"
            defaultValue={topics[0]}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="message">{t('contact.message')}</Label>
          <Textarea
            id="message"
            name="message"
            required
            rows={5}
            placeholder={t('contact.messagePlaceholder')}
          />
        </div>
        <Button type="submit" size="lg" className="w-full sm:w-auto">
          {t('contact.openDraft')}
        </Button>
      </div>
    </form>
  )
}
