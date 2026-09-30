# Owner GEO preview

Sign in at `/owner/login`, then use **Preview GEO** at the top of `/owner/growth`.
Choose **Brazil (BR)** and **Open PlayLiva**. The site-wide owner strip shows
`BR preview` and the actual country (for example `GE`). **Mexico (MX)** tests
non-BR suppression. **Reset to Real GEO**, or **Default / Real GEO**, restores
normal request GEO. Preview applies to this owner login/browser only, across
tabs and routes. A fresh login starts in Real GEO. Logout, expiry and password
rotation invalidate it. Retained tabs revalidate on focus and every minute;
outbound links always recheck authorization on the server.

LivaSports uses a signed `__Host-livasports_owner` cookie with an authenticated
preview flag, strict-origin mutations and a separate real-country resolver.
PlayLiva keeps its existing opaque `__Host-playliva_owner` credential and stores
the selected preview country in that session's existing durable server record.
No new credentials, public cookies, localStorage GEO grants, query switches,
environment settings or database migration are needed. Existing records without
the optional field default to Real GEO. Updates recheck session validity inside
the existing atomic store operation and never extend the login lifetime.

Because owner-session checks now participate in public rendering, Next tracing
also reaches the local owner filesystem adapter. The deployment configuration
explicitly excludes `assets-source/` (immutable authoring inputs, never runtime
files) from function bundles. Public game assets remain unchanged. The production
route gate checks the public page, owner page, outbound and preview API traces.

The shared CountryProvider receives the server-authorized commercial country;
all existing banners, sponsors, Offers, affiliate CTAs and recurring Originals
popups therefore use the same eligibility. Preview temporarily takes precedence
over the saved editorial market without changing it. Language remains separate:
PT-BR alone never grants eligibility. `/go` independently resolves the same
authorized commercial country. Campaign approvals, deadlines, destinations,
popup cadence (after completed cycles 3, 6, 9...) and public non-BR suppression
remain unchanged. Preview does not bypass the destination operator's own GEO
checks. It only previews PlayLiva.

Owner endpoints are private/no-store with Cookie variation; public page rendering
already uses request-time headers and remains dynamic. Preview telemetry is
excluded from client tracking and server event intake. Affiliate navigation keeps
the existing approved destination and attribution; no partner transactions are
performed as part of verification.

Regression tests cover unauthorized/cross-origin/invalid/oversized requests,
duplicate and forged cookies, query spoofing, session isolation, expiration,
credential rotation, concurrent logout, reset, real BR/MX/GE behavior, outbound
redirects, server HTML, saved preferences, locale independence and recurring
popup eligibility. Run the normal README quality gates before deployment.
