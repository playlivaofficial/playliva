import test from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM, VirtualConsole } from 'jsdom'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import { registerHooks } from 'node:module'
// Match the CSS-only module shim used by the game UI tests. Application logic
// and assertions still execute; browser QA covers actual computed styling.
const cssHooks = registerHooks({ load(url, context, next) {
  if (url.endsWith('.module.css')) return { format: 'commonjs', shortCircuit: true, source: 'module.exports = {}' }
  return next(url, context)
} })
const profileImport = await import('../components/operator-profile-view.tsx')
const profileModule = profileImport.default ?? profileImport
cssHooks.deregister()
import dataModule from '../lib/data.ts'
const { OperatorProfileView } = profileModule
import countryContextModule from '../components/country-context.tsx'
const { CountryProvider, useCountry } = countryContextModule
import cookieBannerModule from '../components/cookie-banner.tsx'
const { CookieBanner } = cookieBannerModule
import siteFooterModule from '../components/site-footer.tsx'
const { SiteFooter } = siteFooterModule
import siteHeaderModule from '../components/site-header.tsx'
const { SiteHeader } = siteHeaderModule
import contactFormModule from '../components/contact-form.tsx'
const { ContactForm } = contactFormModule
import affiliateButtonModule from '../components/affiliate-button.tsx'
const { AffiliateButton } = affiliateButtonModule
import consentedAnalyticsModule from '../components/analytics/consented-analytics.tsx'
const { ConsentedAnalytics } = consentedAnalyticsModule
import googleAnalyticsModule from '../lib/google-analytics.ts'
const { connectGoogleAnalytics } = googleAnalyticsModule
import consentModule from '../lib/consent.ts'
const { parseConsent, saveConsent, hasAnalyticsConsent, CONSENT_STORAGE_KEY } = consentModule
import trackingModule from '../lib/tracking.ts'
const { track } = trackingModule

function TestMarketControl() {
  const { setCountryCode } = useCountry()
  return React.createElement('button', { onClick: () => setCountryCode('MX') }, 'Test MX')
}

test('consent UI gates loaders/events, supports revocation/revisit, and preserves navigation/contact truth', async () => {
  // Script execution and resource loading are disabled: no test sends analytics.
  const dom = new JSDOM('<div id="root"></div>', {
    url: 'https://site.example.invalid/en', virtualConsole: new VirtualConsole(),
  })
  const saved = new Map()
  for (const key of ['window', 'self', 'document', 'location', 'navigator', 'Event', 'StorageEvent', 'FormData', 'HTMLElement', 'HTMLInputElement', 'Node']) {
    saved.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] })
  }
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  const priorObserver = globalThis.IntersectionObserver
  globalThis.IntersectionObserver = class { observe() {} disconnect() {} }
  const root = createRoot(document.getElementById('root'))
  // Opaque unit-test sentinel, never a deployed GA ID; JSDOM makes no requests.
  const measurement = 'unit-test-only'
  let disconnect
  const click = async (element) => {
    assert.ok(element, 'expected control exists')
    await act(() => element.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true })))
  }
  const button = (text) => [...document.querySelectorAll('button')].find((b) => b.textContent === text)
  try {
    assert.equal(parseConsent('{broken'), null)
    assert.equal(parseConsent('{"analytics":"yes"}'), null)
    disconnect = connectGoogleAnalytics(measurement)
    track('affiliate_click', { placement: 'unit-test' })
    assert.equal(document.querySelector('#playliva-ga4'), null)
    assert.equal(window.dataLayer, undefined)
    await act(async () => {
      root.render(React.createElement(AppRouterContext.Provider, { value: { push() {} } },
        React.createElement(PathnameContext.Provider, { value: '/en' },
          React.createElement(CountryProvider, { initialLocale: 'en' },
            React.createElement(CookieBanner), React.createElement(SiteHeader), React.createElement(SiteFooter),
            React.createElement(ContactForm), React.createElement(ConsentedAnalytics),
            React.createElement(AffiliateButton, { operatorSlug: 'betsson-group-affiliates', category: 'crash' }, 'Partner link'),
            React.createElement(OperatorProfileView, { operator: dataModule.getOperator('betsson-group-affiliates') }),
            React.createElement(TestMarketControl)))))
    })
    const desktopSports = document.querySelector('header nav[aria-label="Primary"] a[href="https://livasports.com"]')
    assert.ok(desktopSports, 'Sports is a direct desktop navigation entry')
    assert.equal(desktopSports.textContent, 'Sports')
    assert.equal(desktopSports.getAttribute('target'), null, 'network navigation stays in the same tab')
    assert.equal(document.querySelector('header nav[aria-label="Primary"] a[href="/en/play"]')?.textContent, 'Play')
    await click(document.querySelector('button[aria-label="More"]'))
    assert.deepEqual([...document.querySelectorAll('header [role="menuitem"]')].map(a => a.getAttribute('href')),
      ['/en/table-games', '/en/offers', '/en/operators', '/en/about', '/en/responsible-gaming'])
    await act(() => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
    assert.equal(document.querySelector('header [role="menu"]'), null)
    await click(document.querySelector('button[aria-label="Open menu"]'))
    const headerLinks = [...document.querySelectorAll('header a')].map(a => a.getAttribute('href'))
    for (const path of ['play', 'games', 'crash', 'slots', 'live-casino', 'table-games', 'instant-games', 'offers', 'operators']) {
      assert.ok(headerLinks.includes(`/en/${path}`), `mobile navigation: ${path}`)
    }
    assert.ok(headerLinks.every(href => !href.includes('/sports')))
    const mobileSports = document.querySelector('header nav[aria-label="Menu"] a[href="https://livasports.com"]')
    assert.ok(mobileSports, 'mobile Sports links directly to the network root')
    assert.equal(mobileSports.getAttribute('target'), null)
    await click(document.querySelector('button[aria-label="Close menu"]'))
    const link = document.querySelector('a[href^="/go?"]')
    assert.ok(link)
    const href = link.getAttribute('href')
    assert.equal(new URL(href, location.href).searchParams.get('country'), 'BR')
    assert.equal(document.querySelector('script[src*="insights"]'), null)
    await click(button('Cookie preferences')) // persistent footer control
    await click(button('Reject optional'))
    assert.equal(hasAnalyticsConsent(), false)
    assert.equal(document.querySelector('#playliva-ga4'), null)
    assert.equal(window.dataLayer, undefined)
    link.addEventListener('click', (e) => e.preventDefault())
    await click(link)
    assert.equal(link.getAttribute('href'), href)
    assert.equal(window.dataLayer, undefined)

    await click(button('Cookie preferences'))
    await click(button('Accept all'))
    assert.equal(hasAnalyticsConsent(), true)
    assert.ok(document.querySelector('#playliva-ga4'))
    assert.ok(document.querySelector('script[src*="insights"]'))
    assert.equal(window[`ga-disable-${measurement}`], false)
    await click(link)
    assert.ok(window.dataLayer.some((item) => item?.event === 'affiliate_click'))
    assert.ok(window.dataLayer.some((item) => Array.isArray(item) && item[0] === 'event' && item[1] === 'affiliate_click'))
    // Vercel's installed callback must also reject events after unmount/revoke.
    const beforeSend = window.vaq.find((item) => item[0] === 'beforeSend')[1]
    const pageEvent = { type: 'pageview', url: `${location.origin}/en?email=private%40example.invalid#private` }
    assert.deepEqual(beforeSend(pageEvent), { type: 'pageview', url: `${location.origin}/en` })

    await click(button('Cookie preferences'))
    await click(button('Reject optional'))
    assert.equal(window[`ga-disable-${measurement}`], true)
    assert.equal(document.querySelector('#playliva-ga4'), null)
    assert.equal(beforeSend(pageEvent), null)
    const length = window.dataLayer.length
    track('affiliate_click', { placement: 'rejected' })
    window.gtag('event', 'should_not_send')
    assert.equal(window.dataLayer.length, length)
    assert.equal(link.getAttribute('href'), href)

    // A new loader/controller on a return visit still sees saved rejection.
    disconnect()
    disconnect = connectGoogleAnalytics(measurement)
    assert.equal(document.querySelector('#playliva-ga4'), null)
    await act(() => saveConsent({ necessary: true, analytics: true, marketing: false }))
    assert.ok(document.querySelector('#playliva-ga4'))
    disconnect()
    disconnect = connectGoogleAnalytics(measurement)
    assert.ok(document.querySelector('#playliva-ga4'))
    // Another tab revoking consent must stop this tab as well.
    const rejection = JSON.stringify({ necessary: true, analytics: false, marketing: false })
    window.localStorage.setItem(CONSENT_STORAGE_KEY, rejection)
    await act(() => window.dispatchEvent(new StorageEvent('storage', { key: CONSENT_STORAGE_KEY, newValue: rejection })))
    assert.equal(window[`ga-disable-${measurement}`], true)
    assert.equal(beforeSend(pageEvent), null)

    await click(button('Test MX'))
    assert.equal(document.querySelector('a[href^="/go?"]'), null, 'MX must not inherit BR profile or CTA destinations')

    const form = document.querySelector('form')
    form.elements.name.value = 'Unit Test'
    form.elements.email.value = 'person@example.invalid'
    form.elements.message.value = 'Draft only'
    await act(() => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    assert.ok(document.body.textContent.includes('PlayLiva does not send the message here'))
    assert.equal(document.body.textContent.includes('Message sent'), false)
    assert.equal(form.elements.message.value, 'Draft only')
    // Restricted browsers must still be able to revoke analytics immediately.
    await act(() => saveConsent({ necessary: true, analytics: true, marketing: false }))
    const storageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('blocked') } })
    Object.defineProperty(document, 'cookie', { configurable: true, get() { throw new Error('blocked') }, set() { throw new Error('blocked') } })
    try {
      await act(() => saveConsent({ necessary: true, analytics: false, marketing: false }))
      assert.equal(hasAnalyticsConsent(), false)
      assert.equal(window[`ga-disable-${measurement}`], true)
      assert.equal(beforeSend(pageEvent), null)
    } finally {
      Object.defineProperty(window, 'localStorage', storageDescriptor)
      delete document.cookie
    }
  } finally {
    disconnect?.()
    await act(() => root.unmount())
    dom.window.close()
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
    globalThis.IntersectionObserver = priorObserver
    delete globalThis.IS_REACT_ACT_ENVIRONMENT
  }
})
