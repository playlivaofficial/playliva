import { contentLocale } from '@/lib/locale'
import { notFound } from 'next/navigation'
import { isLocaleSegment, segmentToLocale } from '@/lib/locale'
import { THREE_GAMES, type ThreeGameKind } from '@/lib/originals/three-game-definitions'
import { threeCopy,threeRules } from '@/lib/originals/three-game-copy'
import { threeGameMetadata, threeGameJsonLd, threeSeoCopy } from '@/lib/originals/three-game-seo'
import { JsonLd } from '@/components/json-ld'
import { originalsLinks } from '@/lib/originals/discovery'
import { OriginalSeoArticle } from '../original-seo-article'
import { ThreeGameEntry } from './entry'
export function threeMetadata(kind:ThreeGameKind,segment:string){if(!isLocaleSegment(segment))notFound();return threeGameMetadata(kind,segment)}
export function ThreeGamePage({kind,segment}:{kind:ThreeGameKind;segment:string}){if(!isLocaleSegment(segment))notFound();const locale=segmentToLocale(segment),copy=threeCopy(locale),game=THREE_GAMES.find(g=>g.slug===kind)!;return <><JsonLd data={threeGameJsonLd(kind,segment)}/><ThreeGameEntry kind={kind}/><OriginalSeoArticle crumbs={{originals:'PlayLiva Originals',game:game.title[contentLocale(locale)],path:`/play/${kind}`}} title={game.title[contentLocale(locale)]} paragraphs={threeSeoCopy(kind,locale).paragraphs} rulesTitle={copy.rules} rules={[...threeRules(kind,locale),copy.interruption]} creditsTitle={copy.creditsTitle} credits={copy.credits} links={originalsLinks(locale,kind)}/></>}
