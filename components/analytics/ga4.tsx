import Script from 'next/script'

/**
 * Google Analytics 4 (gtag.js) loader.
 *
 * Renders nothing unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set — never
 * fabricate a measurement ID. Add the real "G-XXXXXXXXXX" ID from the GA4
 * property (Admin → Data Streams → Web) as that env var to enable this.
 */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  if (!measurementId) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  )
}
