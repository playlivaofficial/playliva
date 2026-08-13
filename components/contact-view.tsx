'use client'

import { Mail } from 'lucide-react'
import { useCountry } from '@/components/country-context'
import { PageHero } from '@/components/page-hero'
import { Section } from '@/components/section'
import { ContactForm } from '@/components/contact-form'

export function ContactView() {
  const { t } = useCountry()

  return (
    <div>
      <PageHero
        eyebrow={t('contact.title')}
        title={t('contact.title')}
        description={t('contact.sub')}
      />
      <Section>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="inline-grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <Mail className="size-5" />
              </div>
              <h2 className="mt-4 font-display text-lg font-bold text-foreground">
                {t('contact.emailCardTitle')}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {t('contact.emailCardText')}
              </p>
              <a
                href="mailto:hello@playliva.com"
                className="mt-2 inline-block text-sm font-semibold text-primary underline underline-offset-4"
              >
                hello@playliva.com
              </a>
              <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
                {t('contact.emailCardNote')}
              </p>
            </div>
          </div>
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </Section>
    </div>
  )
}
