// Production policy: historical media remains readable; the site creates no media.
export const VIDEO_PRODUCTION_ENABLED = false
export const VIDEO_PRODUCTION_DISABLED = 'Automatic video generation is disabled.'
export const videoProductionPolicy = {
  assertEnabled() {
    if (!VIDEO_PRODUCTION_ENABLED) throw new Error(VIDEO_PRODUCTION_DISABLED)
  },
}
