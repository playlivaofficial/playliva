import { notFound } from 'next/navigation'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { pageMetadata, absoluteUrl } from '@/lib/seo'
import { driftCopy } from '@/lib/originals/rio-drift/copy'
import { RIO_DRIFT_PATH, RIO_DRIFT_SHARE } from '@/lib/originals/rio-drift/definition'
import { DriftFeature } from '@/components/originals/rio-drift/feature'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { LocaleLink } from '@/components/locale-link'
import { JsonLd } from '@/components/json-ld'

export async function generateMetadata({params}:{params:Promise<{locale:string}>}) {
  const {locale:segment}=await params
  if(!isLocaleSegment(segment))notFound()
  const c=driftCopy(segmentToLocale(segment))
  return pageMetadata({title:c.arcadeTitle,description:c.arcadeDescription,path:'/arcade',localeSegment:segment,images:[RIO_DRIFT_SHARE]})
}
export default async function Page({params}:{params:Promise<{locale:string}>}) {
  const {locale:segment}=await params
  if(!isLocaleSegment(segment))notFound()
  const c=driftCopy(segmentToLocale(segment))
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6" data-arcade-category>
    <Breadcrumbs items={[{label:'PlayLiva Originals',href:'/play'},{label:c.category}]} />
    <h1 className="font-display text-3xl font-bold">{c.arcadeTitle}</h1>
    <p className="max-w-3xl text-muted-foreground">{c.arcadeIntro}</p>
    <p className="max-w-3xl text-muted-foreground">{c.arcadeDetails}</p>
    <DriftFeature surface="category" />
    <h2 className="text-xl font-semibold">{c.rulesTitle}</h2>
    <ul className="list-disc space-y-2 pl-5 text-muted-foreground">{c.rules.slice(0,4).map(rule=><li key={rule}>{rule}</li>)}</ul>
    <p className="text-muted-foreground">{c.credits}</p>
    <nav className="flex flex-wrap gap-6 text-primary" aria-label="PlayLiva Originals"><LocaleLink href="/play">PlayLiva Originals →</LocaleLink><LocaleLink href="/games?kind=original&category=arcade">{c.racing} →</LocaleLink></nav>
    <JsonLd data={{'@context':'https://schema.org','@type':'CollectionPage',name:c.arcadeTitle,description:c.arcadeDescription,url:absoluteUrl(`/${segment}/arcade`),inLanguage:segmentToLocale(segment),hasPart:{'@type':'VideoGame',name:'Rio Drift',url:absoluteUrl(`/${segment}${RIO_DRIFT_PATH}`)}}} />
  </main>
}
