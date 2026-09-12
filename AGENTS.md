# PlayLiva project rules

- Use this GitHub repository as the source of truth:
  https://github.com/playlivaofficial/playliva. Inspect branch, HEAD, status and
  local changes before work; preserve changes made by others.
- Read `README.md` and use Node 24.20.0 / pnpm 10.30.3. Keep runtime pins and CI
  aligned. Preserve the pnpm lockfile; avoid unrelated dependency upgrades.
- Keep changes within the requested milestone. Tooling work must not change
  visual design, routes, SEO, locale/GEO behavior, affiliate destinations,
  operator records, sports/demo behavior or product architecture.
- Preserve existing behavior unless a demonstrated bug fix or product change
  is in scope. Do not silently fold audit findings into unrelated tasks.
  Avoid broad refactors, framework migrations, or new backends/databases.
- Locale and market are independent. Do not infer affiliate eligibility from
  language, category alone, or placeholder data. Never invent partner links,
  offers, approval status, licenses, analytics IDs, or secrets.
- Never expose or commit local environment values. Only optional public
  variable names belong in `.env.example`; keep real values in ignored local
  files or authorized deployment settings.
- Do not commit, push, deploy, or delete files without authorization for that
  action. Explicit user authorization applies; do not ask again unnecessarily.
- Run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, and
  `pnpm build` before handoff. Report exact tool versions, outcomes, remaining
  warnings and changed files. Explain external blockers rather than hiding
  failures or altering product behavior to accommodate the environment.
- Keep TypeScript build validation enabled. Do not weaken lint/type checks,
  raise the documented warning budget, or add suppressions to conceal new
  issues. The two file-scoped baseline lint exceptions are documented in
  `eslint.config.mjs` and `README.md`.
- Do not add application host-normalization redirects: the existing canonical
  host behavior is owned by Vercel domain settings. Deployment settings need
  separate verification and must not be assumed from source comments.
