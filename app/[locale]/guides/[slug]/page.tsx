import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHero } from '@/components/page-hero'
import { Section } from '@/components/section'
import { LocaleLink } from '@/components/locale-link'
import { JsonLd } from '@/components/json-ld'
import { latamGuide } from '@/lib/latam-guides'
import { LATAM_GUIDE_SLUGS, LATAM_SEGMENTS, LATAM_UPDATED_AT } from '@/lib/latam-editorial'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { pageMetadata, absoluteUrl } from '@/lib/seo'

export function generateStaticParams() {
  return LATAM_SEGMENTS.flatMap(locale=>LATAM_GUIDE_SLUGS.map(slug=>({locale,slug})))
}
function guideFor(locale: string, slug: string) { return isLocaleSegment(locale) ? latamGuide(slug,segmentToLocale(locale)) : null }
export async function generateMetadata({params}:{params:Promise<{locale:string;slug:string}>}):Promise<Metadata> {
  const {locale,slug}=await params,guide=guideFor(locale,slug)
  if (!guide) return { title:'Not found', robots:{index:false,follow:false} }
  return pageMetadata({title:guide.title,description:guide.description,path:`/guides/${slug}`,localeSegment:locale,alternateLocaleSegments:LATAM_SEGMENTS,includeXDefault:false})
}
export default async function GuidePage({params}:{params:Promise<{locale:string;slug:string}>}) {
  const {locale,slug}=await params,guide=guideFor(locale,slug)
  if (!guide) notFound()
  const url=absoluteUrl(`/${locale}/guides/${slug}`)
  return <>
    <JsonLd data={{'@context':'https://schema.org','@type':'Article',headline:guide.title,description:guide.description,url,mainEntityOfPage:url,inLanguage:locale,datePublished:LATAM_UPDATED_AT,dateModified:LATAM_UPDATED_AT,author:{'@type':'Organization',name:'PlayLiva',url:absoluteUrl(`/${locale}/authors/playliva`)},publisher:{'@type':'Organization',name:'PlayLiva',url:absoluteUrl()}}}/>
    <PageHero title={guide.title} description={guide.description} breadcrumbs={[{label:'Inicio',href:'/'},{label:'Juegos',href:'/games'},{label:guide.title}]}/>
    <Section><article className="mx-auto max-w-4xl" data-latam-guide={slug}>
      <p className="text-sm text-muted-foreground">PlayLiva · Revisión editorial: <time dateTime={LATAM_UPDATED_AT}>13 de octubre de 2026</time> · <LocaleLink href="/editorial-policy" className="underline">Política editorial</LocaleLink></p>
      <nav aria-label="En esta guía" className="my-6 flex flex-wrap gap-4 text-primary">{guide.sections.map((section,i)=><a key={section.heading} href={`#paso-${i+1}`}>{section.heading}</a>)}</nav>
      {guide.sections.map((section,i)=><section key={section.heading} id={`paso-${i+1}`} className="mt-8 scroll-mt-24"><h2 className="font-display text-2xl font-bold">{section.heading}</h2>{section.paragraphs.map(p=><p key={p} className="mt-4 leading-relaxed text-muted-foreground">{p}</p>)}</section>)}
      <section className="mt-8"><h2 className="font-display text-2xl font-bold">Comprobaciones para {guide.country.name}</h2><p className="mt-4 leading-relaxed text-muted-foreground">{slug==='aviator-demo'?guide.country.demo:guide.country.money}</p><p className="mt-4 leading-relaxed text-muted-foreground">{guide.country.check}</p></section>
      <section className="mt-8"><h2 className="font-display text-2xl font-bold">Preguntas frecuentes</h2>{guide.faqs.map(faq=><div key={faq.question} className="mt-5"><h3 className="text-lg font-semibold">{faq.question}</h3><p className="mt-2 leading-relaxed text-muted-foreground">{faq.answer}</p></div>)}</section>
      <nav className="mt-8 flex flex-wrap gap-4 text-primary" aria-label="Guías relacionadas">{guide.links.map(link=><LocaleLink key={link.href} href={link.href}>{link.label}</LocaleLink>)}</nav>
      <aside className="mt-8 border-t border-border pt-5"><h2 className="text-lg font-semibold">Fuentes y alcance</h2><ul className="mt-3 space-y-3">{[...guide.sources,{url:guide.country.source,label:guide.country.authority}].map(source=><li key={source.url}><a className="text-primary underline" href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul><p className="mt-4 text-sm text-muted-foreground">Las fuentes documentan reglas o controles locales; no acreditan un bono vigente, una garantía de ganancias ni la autorización de una marca concreta. PlayLiva no acepta apuestas. Solo para personas adultas.</p></aside>
    </article></Section>
  </>
}
