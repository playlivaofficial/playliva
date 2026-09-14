# M12 — compliance, trust and technical hardening checkpoint

Evidence checked 14 September 2026. **Not a production release or legal
certification. M12 / PlayLiva v1 is not closed.**

## Integration and release boundary

Branch: `codex/m12-final-hardening`. Integrated baseline:
`dbaa8f1f4635527d1429b1dcaa083ccff1076cf0`, including Cursor's
`76d646cfde3233e9e36186a42dbc124e10742e23` Originals layout correction.
A final remote fetch still returned that main SHA. Work is isolated from the
shared checkout; its unrelated untracked directory was not touched.

The shared Originals shell is unchanged: title/demo identity, existing Play
Real block, viewport, controls, then supporting content. All five engines,
wallet/session/math, renderers, gameplay assets, catalog artwork and provider
records remain unchanged. No dependency, lockfile, runtime, CI workflow or
application host-normalization change is included.

The authorized fallback is a stable feature checkpoint and hosted CI, not a
main merge while the publication-policy requirements below remain unresolved.
Cursor's [main CI run 49](https://github.com/playlivaofficial/playliva/actions/runs/34796565620)
was independently observed successful at the baseline, and the
[existing Vercel Production deployment](https://vercel.com/nikapopkha3-4447s-projects/playliva/4ZfYVNZHKFYZzEfczU7bbqNA4dP7)
was observed Ready with source SHA matching `dbaa8f1f...`. Those are not M12
deployment results. Exact feature SHA and hosted run evidence belong in the
checkpoint handoff, after the commit exists.

## Official evidence versus policy decisions

1. [Ministry of Finance guidance, updated 15 July 2026](https://www.gov.br/fazenda/pt-br/assuntos/noticias/2026/julho/ministerio-da-fazenda-amplia-exigencias-de-publicidade-de-apostas-no-pais)
   confirms one of three Ministry warning phrases, horizontal and legible,
   occupying at least 10% of the advertisement, effective 17 July. The central
   configuration retains the three phrases; the component displays the
   dependency-risk phrase and 18+. This verifies the guidance's requirements,
   not every possible placement-specific interpretation of the full law.
2. [Justice Ministry official archive of Portaria 73/2026](https://bibliotecadigital.mj.gov.br/bitstream/1/17359/1/PRI_GM_2026_73.html)
   was read with its [official archival record](https://bibliotecadigital.mj.gov.br/handle/1/17359).
   Articles 4, 6 and 8 address prohibited promotion, prior authorization checks,
   identifiable advertisers and protection of minors. In particular, article
   4 VII(f) includes indirect targeting and particularly appealing elements.
   The archive notes that its representation does not replace the DOU original.
3. [Current SPA legislation index](https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/apostas-de-quota-fixa/legislacao)
   and [responsible-gambling legislation index](https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/jogo-responsavel/legislacao/jogo-responsavel)
   were reviewed for amendments. The exact DOU pages for 1.964/2026 and the
   complete currently amended 1.231/2024 could not be retrieved reliably
   (403 / HTTP2 transport errors). Official guidance was available; a complete
   consolidated-law review must not be claimed.
4. [Official SPA authorized-company register](https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/transparencia-ativa-processos-de-autorizacao-de-apostas-de-quota-fixa/empresas-autorizadas),
   list updated 8 September 2026, identifies BETSSON, SIMULCASTING BRASIL SOM E
   IMAGEM S.A., CNPJ 17.385.948/0001-05, `betsson.bet.br`, SPA/MF 371 of
   24 February 2025. The record was checked on 14 September, not inferred from
   commercial approval.

**Unresolved product/legal decision:** the original M12 brief preferred removing
real-money promotion from `/play/*`. The latest integration instruction requires
preserving Cursor's placement, so this checkpoint retains it and does not
pretend the original conservative policy was adopted. No official evidence
found establishes a mascot/free-play exemption. A documented compliance decision
on separation is required before this acceptance criterion can pass; release
authorization and an 18+ label are not legal clearance. No game engine needs to
change to resolve that policy.

The 30-day authorization evidence-review deadline is a conservative PlayLiva
operating policy, **not the government's licence expiration date**. Likewise,
withholding unverified offers and omitting unknown RTP/dates are publication
safeguards, not invented legal conclusions.

## Advertisement treatment and authorization

`lib/compliance/brazil.ts` owns wording, sources, evidence and checks;
`BrazilAdWarning` is the only rendered warning implementation. It identifies
the legal advertiser/CNPJ/authorization, uses black text on white, 16px bold
horizontal text and 18+, and sizes the warning band against the complete ad
area, including padding. It is not added to purely editorial cards or articles.

| Promotional component | Boundary covered |
| --- | --- |
| `BetssonSponsoredBanner` | Complete sponsored block on homepage, categories, Games, Providers, Comparisons, Games Like, Best lists, Offers, Play hub and existing Originals supporting content |
| `ProviderPlayRealCta` | Existing early provider-game CTA and commercial disclosure |
| `PlayRealCta` | Existing Original-page block, only when BR operator options exist |
| `OperatorCard` | Complete eligible operator card and disclosure |
| `OperatorProfileView` | Operator hero promotion and separate terms/CTA block |
| `OfferCard` | Complete eligible offer and disclosure; currently no published offers |

BR remains a selected market, independent of EN/PT-BR/ES-MX language. Brazilian
warnings stay Portuguese with `lang="pt-BR"` in all three UI languages. Existing
affiliate approval, category support and exact-game availability remain
additional conditions: the authorization registry grants none of them.

BR promotion and redirects fail closed for missing, inactive, future or stale
evidence and unrelated/lookalike destinations. Only HTTPS on the recorded
licensed domain or its subdomains is permitted. Existing configured partner
URLs are unchanged. Cached promotional HTML stays invisible until hydration
rechecks evidence, then is removed on expiration; checks also run on resize,
tab restore, a minute interval and the review deadline. With JavaScript off,
promotional blocks remain hidden rather than displaying unchecked cached ads.

Operational review is due **before 2026-10-14 00:00 UTC**. Recheck the official
register and legal changes, retain evidence, explicitly update the record,
rerun tests and redeploy. A build must not silently refresh verification dates.
This is a dated snapshot, not a real-time revocation feed or legal monitoring
service. Stale source status must never be renewed merely to make a test green.

## RTP and factual operator/offer content

RTP coverage: **3 of 42 provider-game records**, each 97% as rendered on the
official [SPRIBE Aviator](https://spribe.co/games/aviator),
[Dice](https://spribe.co/games/dice) and [36-number Keno](https://spribe.co/games/keno)
pages checked in the browser on 14 September 2026. Keno 80 is not substituted.
The separate registry requires exact provider/game/source/value/edition and a
verification date. Unknown values are omitted. Localized presentation explains
long-term theoretical return, not an individual prediction or verified operator
configuration. Original game mathematics are not changed.

The operator review now contains sourced legal identity, domain, authorization,
check date and review deadline. PIX, payment/withdrawal details, Portuguese
support, native apps and full current provider coverage remain explicitly
unverified; empty feature rows are omitted. No superlatives or invented pros,
cons, payout speeds or licences were added. The directory label now says Visit
Operator instead of implying a verified offer.

Offers require existing active/market/operator conditions plus title, terms,
HTTPS source, source verification, expiry, and a dated market-specific
`reviewed-permitted` compliance record with legal source. Missing/stale evidence
fails closed. These fields are a manual publication-review contract, not an
automatic legal approval system. Sponsored Partner remains separate from the
truthfully empty Verified Offers list. No bonus, promotion or operator was
created or approved.

## Attribution, privacy and implementation scope

The existing `/go` resolver, base/category/offer destinations, partner-issued
tracking support and consent-independent functional attribution are preserved.
Regression tests compare actual configured destinations and exercise malformed
context, market, category and exact-game fallback cases. BR authorization is
an additional restriction on eligibility, not a new attribution parameter.

No current operator has a configured sub-ID template. Source inspection does
not establish which NetRefer field this specific affiliate account accepts;
authenticated partner documentation or an account-level confirmation was not
available. **Capability is unverified, not proven unsupported.** Arbitrary
query parameters were not added. Partner/account evidence is still required to
close the brief's actual sub-ID verification criterion.

There is no durable click store. No console-log substitute, raw IP/full user
agent record, new database, backend, cookie identifier or referral-correlation
service was added. A future separately reviewed storage boundary would need
documented purpose, minimal random event IDs/context, retention/deletion,
access control and consent/legal assessment before implementation. A client
analytics event is not a durable server attribution record.

Existing generic operator IDs, GEO/status/rank/category/game-availability APIs
remain available, and the regulatory gate is operator-keyed. The requested new
multi-operator referral/presentation expansion and new sub-ID forwarding were
not implemented in this safety/privacy hardening scope. Brand-specific sponsor
presentation still exists. Do not mark the entire multi-operator expansion
acceptance criterion complete.

### Internal event map

All application events below pass the existing analytics-consent gate; rejected
events are discarded, not replayed. This is an instrumentation inventory, not
a conversion optimization plan.

| Event / surface | Existing source and coverage |
| --- | --- |
| Page views | Consented GA4/Vercel loaders when configured; no new measurement ID or tag |
| `game_view` | Legacy game detail / Games Like |
| `comparison_view` | Legacy comparisons |
| `category_view` | Crash hub / curated best lists |
| `where_to_play_view`, `operator_view` | Existing availability/profile views |
| `affiliate_impression`, `affiliate_click` | Existing affiliate button visibility and click handlers |
| `free_play_open` | Shared Original provider |
| `demo_round_start`, `demo_round_complete`, `demo_balance_reset` | Existing Original event adapter |
| `play_real_view`, `play_real_click` | Existing Original CTA adapter |
| Homepage/discovery links and M11 reference interactions | Navigation/page views; no dedicated comprehensive custom click map exists |

The central payload now allowlists events and explicit short context fields,
normalizes the legacy locale alias, strips query strings/fragments/full URLs
and rejects extra fields. Wallet/balance/history, persistent guest IDs, raw IP,
full user agent, arbitrary free text and payload event overrides are excluded.
An ephemeral round ID remains permitted. GA page location is sanitized and
referrer blanked; Vercel `beforeSend` drops events after revocation and strips
URL queries/fragments. No GA/GTM/Vercel account dashboard, enhanced-measurement
setting or downstream retention configuration was independently certified.

## Editorial trust, localization and SEO

- Central organizational author: PlayLiva, with an honest publisher bio, not
  a fabricated individual expert. Localized `/authors/playliva` archive and
  `/editorial-policy` add six indexable URLs.
- M11 content dates use its recorded 13 September release/source checkpoint.
  Legacy original dates are unknown and explicitly omitted; build time is not
  editorial review time. Operator facts carry their actual 14 September update.
- Research policy explains provider/edition sourcing, separate availability
  evidence, Originals versus provider games, disclosures, correction drafts,
  and why public artwork access is not a redistribution licence.
- Legacy Where-to-Play pages replace eight repeated methodology bullets with
  existing game-specific mechanics/context and a shared research-policy link.
  Exact availability is not expanded.
- Sitemap **324** entries, preserving all previous 318 plus six trust URLs.
  Unknown last-modified dates are omitted instead of regenerating them on every
  build. EN/pt-BR/es-MX/x-default reciprocal alternates/canonicals are unchanged.
- Rendered Organization/WebSite/Breadcrumb JSON-LD is parsed and validated for
  appropriate use and duplication. Script-closing text is safely escaped.
  No fabricated ratings, reviews, FAQ, Game/VideoGame or duplicate schemas were
  added. ItemList is not implemented; no rich-result eligibility is claimed.
- Crawl checks status, unique localized titles, descriptions, one *visible* H1,
  canonical/hreflang, breadcrumbs, index/noindex, placeholders, sitemap, RTP,
  ad warning boundaries, assets and protected outbound behavior. Hidden Next
  streaming replacements are not falsely counted as visible duplicate H1s.
- Existing legal templates remain noindex pending actual legal review. Search
  Console ownership, indexing reports and field metrics were not accessed.

## Mobile, accessibility and local delivery evidence

**96 responsive combinations:** 24 PT-BR templates at 320x720, 360x800, 390x844
and 1440x1000. Coverage: homepage, Games, all five categories, Play hub, Aviator,
SPRIBE Keno, Play'n GO provider, Lightning/Speed Baccarat comparison, Games Like
Reactoonz, Best Crash, Operators, Betsson profile, Offers, both new trust pages
and all five Originals. Six additional EN/ES article/profile/policy checks ran
at 390x844.

All measured pages had zero document overflow, one visible H1, and no completed
broken-image loads. This does not count unloaded lazy images as verified.
Warning text stayed horizontal at 16px; minimum observed area ratios were
15.08%, 15.28%, 15.41% and 22.48% across the four respective sizes. Screenshots
were visually inspected for 320px article/archive/controls, smartphone catalog
cards and desktop Originals. All 42 artwork paths also pass catalog integrity.

Mobile catalog search finds the two Sugar Rush variants; combining Evolution
returns the truthful empty state. Clearing filters and paging puts keyboard
focus on the result region about 80px below the header, with zero overflow.
Mines keyboard navigation scrolls the controls fully into view without overlay.
No fixed bottom navigation is present on Original game routes. The new warning
uses high contrast; new links/labels/headings are semantic. Two decorative
shared animation utilities now respect reduced motion. Existing engine-level
reduced-motion handling is unchanged. This is not a formal WCAG audit.

**Visible tradeoff:** keeping Cursor's ad above the game and adding a legible
warning moves Original controls below the initial 320x720 screen (approximately
y991-1155 depending on game). They remain scrollable and keyboard-accessible;
do not claim first-screen Start visibility. Resolving the promotion policy may
also resolve this layout cost. No engine/control relocation was made.

Local production build, reused no-cache gzip proxy, 390x844 on desktop hardware,
two seconds after load. These are initial-load proxies, not production, field
Core Web Vitals, a full-session CLS score or physical low-end phone results.
No network/CPU throttle was available through the supported browser controls.
Image bytes include observed shared/prefetched resources and may vary by load.

| PT-BR page | JS gzip bytes | CSS gzip bytes | Image bytes | LCP proxy ms | CLS proxy |
| --- | ---: | ---: | ---: | ---: | ---: |
| Homepage | 268118 | 18884 | 71865 | 552 | 0 |
| Games | 241661 | 18884 | 742932 | 412 | 0 |
| Slots | 279594 | 18884 | 457041 | 1288 | 0 |
| Crash | 279594 | 18884 | 592873 | 1156 | 0 |
| Live Casino | 279594 | 18884 | 73114 | 1108 | 0 |
| Instant Games | 279594 | 18884 | 73106 | 1040 | 0 |
| Play hub | 261349 | 18884 | 309885 | 1072 | 0 |
| Play'n GO | 241338 | 18884 | 352033 | 392 | 0 |
| Aviator | 264166 | 18884 | 807183 | 1168 | 0 |
| Reactoonz | 264166 | 18884 | 103719 | 1032 | 0 |
| Island Crash | 418456 | 21404 | 127115 | 464 | 0 |
| Capybara Gold | 256905 | 21793 | 218633 | 612 | 0 |
| Blackjack | 254778 | 22048 | 71865 | 1072 | 0 |
| Roulette | 255526 | 21784 | 71865 | 1040 | 0 |
| Mines | 253541 | 21664 | 71865 | 1056 | 0 |

Island Crash additionally loaded the unchanged **4,422,328 raw GLB bytes**;
this probe does not gzip binary models. Its initial long-task blocking proxy
was 862ms versus 0-105ms on other sampled pages. It remains the heaviest loading
path and is not low-end certified. Other sampled routes loaded no GLB models.
No engine payload was moved into discovery or new artwork added.

## Gates and remaining release requirements

Pinned tools: **Node 24.20.0 / pnpm 10.30.3**. After Cursor integration, the final
frozen install, lint/typecheck, **246 tests**, production build/catalog validation and
**393 public/legal/demo URL probes plus locale-404/outbound checks** passed.
`git diff --check` also passed. Hosted CI is recorded in the checkpoint handoff.
The test increase is 14 M12 cases over the 232-test
Cursor baseline, with existing suites strengthened rather than removed.
Build generates 399 pages; that is not the sitemap or crawl count.

Baseline warnings remain: three ESLint warnings (two synchronous effects and
the existing unused JSON-LD suppression), ignored build scripts for esbuild,
msw and unrs-resolver, and Next middleware deprecation. Warning budgets/type validation were
not weakened. Protected snapshots were updated only for five intentional M12
files: eligibility, privacy payloads, warning-bearing operator/Original CTA
containers and sitemap. All other protected hashes and Original aggregate
checks remain unchanged.

Before declaring M12/v1 complete:

1. Resolve `/play/*` advertising separation with documented compliance evidence
   or a clearly authorized conservative publication policy; complete current
   consolidated-law verification. Do not treat this checkpoint as clearance.
2. Resolve existing catalog-art redistribution documentation (M11 explicitly
   records missing Play'n GO/Evolution written-permission evidence), and have
   the still-template legal pages reviewed. Technical asset validity is not a
   rights clearance. No licensed-asset claim is invented here.
3. Obtain actual account-specific affiliate sub-ID evidence; retain the honest
   no-durable-store boundary. The unimplemented referral expansion must not be
   silently described as delivered.
4. Recheck evidence freshness, fetch latest main, preserve newer work, rerun
   all gates/QA and verify hosted CI at the exact release SHA.
5. Only after all required gates are resolved: authorized main integration,
   main CI, Vercel Ready/current-production SHA verification, full production
   crawl and mobile/interaction QA. None of these M12 production outcomes is
   implied by the local passes in this report.
