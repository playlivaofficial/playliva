import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime.js'
import { AppRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime.js'
import countryModule from '../components/country-context.tsx'
import headerModule from '../components/site-header.tsx'
import mobileModule from '../components/mobile-bottom-nav.tsx'

test('desktop and mobile Play preserve every locale; game keeps the unobstructed M5.1 control surface', () => {
  for (const [locale, segment, label] of [['en', 'en', 'Play'], ['pt-BR', 'pt-br', 'Jogar'], ['es-MX', 'es-mx', 'Jugar']]) {
    const render = (path, child) => renderToStaticMarkup(React.createElement(AppRouterContext.Provider, { value: { push() {} } },
      React.createElement(PathnameContext.Provider, { value: path },
        React.createElement(countryModule.CountryProvider, { initialLocale: locale, visitorCountryCode: 'BR' }, child))))
    const doc = new JSDOM(render(`/${segment}/play`, React.createElement(React.Fragment, null,
      React.createElement(headerModule.SiteHeader), React.createElement(mobileModule.MobileBottomNav)))).window.document
    const entries = doc.querySelectorAll(`a[href="/${segment}/play"]`)
    assert.equal(entries.length, 2)
    for (const entry of entries) assert.equal(entry.textContent, label)
    assert.equal(doc.querySelector('a[href="https://livasports.com"]')?.getAttribute('target'), null)
    for (const slug of ['crash', 'capybara-gold', 'blackjack', 'roulette', 'mines']) {
      assert.equal(render(`/${segment}/play/${slug}`, React.createElement(mobileModule.MobileBottomNav)), '')
    }
    for (const slug of ['games', 'crash', 'slots', 'live-casino', 'instant-games']) assert.ok(doc.querySelector(`header nav a[href="/${segment}/${slug}"]`))
    assert.ok(doc.querySelector('nav.fixed a[href="https://livasports.com"]'))
    assert.ok(render(`/${segment}/crash`, React.createElement(mobileModule.MobileBottomNav)).includes(`/${segment}/play`))
  }
})
