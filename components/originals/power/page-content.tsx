import { contentLocale } from '@/lib/locale'
import { notFound } from 'next/navigation'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { pageMetadata } from '@/lib/seo'
import { RAIO } from '@/lib/originals/raio/definition'
import { BRASIL21 } from '@/lib/originals/brasil21/definition'
import { powerCopy } from '@/lib/originals/power-copy'
import { originalsLinks } from '@/lib/originals/discovery'
import { OriginalSeoArticle } from '../original-seo-article'
import PowerEntry from './entry'
export function powerMetadata(kind:'raio'|'brasil21',segment:string){
  if(!isLocaleSegment(segment))notFound()
  const copy=powerCopy(segmentToLocale(segment)),raio=kind==='raio',game=raio?RAIO:BRASIL21
  return pageMetadata({title:raio?copy.raioTitle:copy.brasilTitle,description:raio?copy.raioDescription:copy.brasilDescription,path:`/play/${game.slug}`,localeSegment:segment})
}
export function PowerPage({kind,segment}:{kind:'raio'|'brasil21';segment:string}){
  if(!isLocaleSegment(segment))notFound()
  const locale=segmentToLocale(segment),copy=powerCopy(locale),raio=kind==='raio',game=raio?RAIO:BRASIL21
  return <><PowerEntry kind={kind}/><OriginalSeoArticle crumbs={{originals:copy.originals,game:game.title[contentLocale(locale)],path:`/play/${game.slug}`}} title={raio?copy.raioTitle:copy.brasilTitle} paragraphs={[raio?copy.raioIntro:copy.brasilIntro]} rulesTitle={copy.rules} rules={raio?copy.raioRules:copy.brasilRules} creditsTitle={copy.creditsTitle} credits={copy.credits} links={originalsLinks(locale,game.slug)}/></>
}
