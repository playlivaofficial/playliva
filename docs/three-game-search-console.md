# Search Console audit and release follow-up

Observed 27 September 2026 in the signed-in Google Search Console domain property `sc-domain:playliva.com`. The canonical site host is `https://www.playliva.com`.

## Existing Originals

All 12 URLs below returned HTTP 200 directly in the live production audit. Each had a self-canonical, indexable robots settings, reciprocal locale alternates, working social metadata, breadcrumbs and exactly one production sitemap entry. This establishes site-side eligibility, not inclusion in Google's index.

Google's URL Inspection reported **“URL is not on Google” / “URL is unknown to Google”** for every URL below. No referring sitemap was detected in those individual inspection records; crawl and Google-selected canonical fields were unavailable. Do not interpret unavailable canonical data as Google confirming the site's canonical.

| Inspected canonical URL | Indexing request |
|---|---|
| https://www.playliva.com/pt-br/play/liva-ginga | Accepted; success dialog verified |
| https://www.playliva.com/pt-br/play/golaco | Accepted; success dialog verified |
| https://www.playliva.com/pt-br/play/liva-raio | Accepted; success dialog verified |
| https://www.playliva.com/pt-br/play/liva-21-brasil | Accepted; success dialog verified |
| https://www.playliva.com/en/play/liva-ginga | Inspected only; not requested |
| https://www.playliva.com/en/play/golaco | Inspected only; not requested |
| https://www.playliva.com/en/play/liva-raio | Inspected only; not requested |
| https://www.playliva.com/en/play/liva-21-brasil | Inspected only; not requested |
| https://www.playliva.com/es-mx/play/liva-ginga | Inspected only; not requested |
| https://www.playliva.com/es-mx/play/golaco | Inspected only; not requested |
| https://www.playliva.com/es-mx/play/liva-raio | Inspected only; not requested |
| https://www.playliva.com/es-mx/play/liva-21-brasil | Inspected only; not requested |

The four accepted requests passed Google's live eligibility check and reached its priority crawl queue. **Acceptance is not proof of indexing.** No claim is made that any of these pages is now indexed. The eight secondary-locale pages were audited read-only; new-release PT-BR submissions remain the next priority after deployment.

The Sitemaps screen lists `https://www.playliva.com/sitemap.xml` with **Success**, submitted 14 August 2026, last read 9 September 2026 and 171 discovered pages. This was read-only verification. The requested refresh after the three-game deployment has not yet occurred.

## New games: submissions pending deployment

These nine exact URLs passed the local production-build SEO audit. None has been submitted to Google during this work because the release is still awaiting owner review:

1. https://www.playliva.com/pt-br/play/skuptu-levanta
2. https://www.playliva.com/pt-br/play/samba-drop
3. https://www.playliva.com/pt-br/play/carnaval-gold
4. https://www.playliva.com/en/play/skuptu-levanta
5. https://www.playliva.com/en/play/samba-drop
6. https://www.playliva.com/en/play/carnaval-gold
7. https://www.playliva.com/es-mx/play/skuptu-levanta
8. https://www.playliva.com/es-mx/play/samba-drop
9. https://www.playliva.com/es-mx/play/carnaval-gold

## Required post-release steps

1. After approval and production deployment, run `THREE_GAME_QA_URL=https://www.playliva.com node scripts/three-game-seo-audit.mjs` with the pinned runtime (set the environment variable with the host shell's syntax). Verify all 21 canonical pages, live robots and sitemap; do not submit any failing page.
2. Refresh/resubmit the production sitemap in the selected `playliva.com` property and verify the resulting UI status.
3. Inspect the nine new canonicals above, in that order: PT-BR first, then EN and ES-MX. Record each actual inspection result and request indexing only for an eligible, directly returning 200, self-canonical, indexable page.
4. Record each accepted request, quota failure or other concrete blocker individually. If login/CAPTCHA requires owner action, pause only at that step. Never submit localhost, preview, redirect, parameter, duplicate or noindex URLs.
5. Recheck the existing Originals' inspection status when appropriate. Report Google's actual state; never call a page indexed merely because an indexing request was accepted.

Audit evidence: `social/output/three-game/production-existing-seo.json` and `local-all-seo.json`. These generated reports remain ignored local QA artifacts; this document records the Search Console UI results for handoff.
