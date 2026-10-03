import type { Filters, PartnerConversionReport, Source } from '../model'
import type { MetricEvent } from '../metrics'
import { aggregateEvents, groupEvents } from '../metrics'
export function affiliateReport(events: MetricEvent[], filters: Filters) {
  return { metrics: aggregateEvents(events, filters), groups: {
    pageFamily: groupEvents(events, filters, 'pageFamily'), taxonomy: groupEvents(events, filters, 'taxonomy'), platform: groupEvents(events, filters, 'platform'), campaign: groupEvents(events, filters, 'campaign'), partnerCampaign: groupEvents(events, filters, 'partnerCampaign'), creative: groupEvents(events, filters, 'utmContent'), provider: groupEvents(events, filters, 'provider'),
    placement: groupEvents(events, filters, 'placement'), game: groupEvents(events, filters, 'game'), route: groupEvents(events, filters, 'route'),
    source: groupEvents(events, filters, 'source'), operator: groupEvents(events, filters, 'operator'), locale: groupEvents(events, filters, 'locale'),
    geo: groupEvents(events, filters, 'geo'), currency: groupEvents(events, filters, 'currency'), cta: groupEvents(events, filters, 'cta'), device: groupEvents(events, filters, 'device'),
  } }
}
export function conversionSource(): Source<PartnerConversionReport | null> {
  return { state: 'not_connected', label: 'Partner conversion reporting', detail: 'FTD, CPA, RevShare, commission and revenue need a reliable partner report or postback integration.', data: null }
}
