import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTypeScript from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  // Audited baseline: restoring saved GEO and closing navigation on route
  // changes use synchronous effects. Keep these two existing findings visible
  // without changing behavior in the tooling milestone. Other files retain
  // the preset's error severity; the lint script caps all warnings at three.
  {
    files: ['components/country-context.tsx', 'components/site-header.tsx'],
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  globalIgnores([
    '.next/**',
    '.vercel/**',
    'out/**',
    'build/**',
    'social/output/**',
    'next-env.d.ts',
  ]),
])
