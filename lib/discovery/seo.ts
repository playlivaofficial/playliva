import {pageMetadata as baseMetadata} from '@/lib/seo'
import {isLocaleSegment,DEFAULT_LOCALE_SEGMENT} from '@/lib/locale'
import {discoveryIndexability,discoveryLocales} from './indexability'
export function pageMetadata(opts:Parameters<typeof baseMetadata>[0]){
 const segment=isLocaleSegment(opts.localeSegment)?opts.localeSegment:DEFAULT_LOCALE_SEGMENT
 const index=opts.index!==false&&discoveryIndexability(opts.path,segment).index
 return baseMetadata({...opts,index,alternateLocaleSegments:index?(opts.alternateLocaleSegments??discoveryLocales(opts.path)):[],includeXDefault:index&&opts.includeXDefault!==false})
}
