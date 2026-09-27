import sitemap from '@/app/sitemap'
import { trackedTargetUrl } from './content'

export const MANUAL_SOCIAL_PLATFORMS = ['tiktok', 'instagram', 'youtube'] as const
const routes = new Set(sitemap().map(row => new URL(row.url).pathname))

/** Same UTM convention as the existing Shorts manifest. No publishing or
 * partner sub-ID mapping. Only existing canonical content destinations. */
export function manualSocialLink(targetUrl: string, platform: typeof MANUAL_SOCIAL_PLATFORMS[number], creative: string, campaign = 'playliva_originals') {
  const url = new URL(targetUrl)
  if (!MANUAL_SOCIAL_PLATFORMS.includes(platform) || url.origin !== 'https://www.playliva.com' ||
    !routes.has(url.pathname) || !/^\/(pt-br|es-mx|en)\/(play|games|providers|crash|slots|live-casino|instant-games|table-games)(\/|$)/.test(url.pathname)) throw new Error('Choose an existing canonical game or discovery landing page.')
  url.search = ''; url.hash = ''
  return trackedTargetUrl({ targetUrl: url.toString(), utmSource: platform, utmMedium: 'organic_social', utmCampaign: campaign, utmContent: creative })
}
