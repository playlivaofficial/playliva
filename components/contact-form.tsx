'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export function ContactForm() {
  const { t } = useCountry()
  const [submitted, setSubmitted] = useState(false)

  const topics = [
    t('contact.topicGeneral'),
    t('contact.topicPartnership'),
    t('contact.topicAffiliate'),
    t('contact.topicOperator'),
    t('contact.topicResponsible'),
  ]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // Prototype only — no backend. Simulate a successful submission.
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/10 p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <h2 className="mt-4 font-display text-xl font-bold text-foreground">
          {t('contact.successTitle')}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {t('contact.successNote')}
        </p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => setSubmitted(false)}
        >
          {t('contact.sendAnother')}
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card p-6 sm:p-8"
      noValidate
    >
      <div className="grid gap-5">
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
          {t('contact.send')}
        </Button>
      </div>
    </form>
  )
}
