/*
 * FINVOSMART — Finvosmart by Navgrow
 * Copyright (c) 2025-2026 Navgrow Engineering Service Pvt. Ltd. All rights reserved.
 *
 * `npm run lint`: ESLint with Next.js's own rules (Core Web Vitals and TypeScript). Next.js 16 no longer lints during
 * `next build` and has no `next lint`; this is the flat config ESLint 9 and 10 read.
 *
 * Errors are what breaks: the rules of hooks, Next.js's own checks, code that can't run. The rules below are warnings —
 * they are about style or the React Compiler (not used here), and the code written before the app was linted has
 * many of them; each is worth tidying as the code is touched, none stops a page working:
 *   @typescript-eslint/no-explicit-any        `any` where a type could be named
 *   react/no-unescaped-entities               an apostrophe written as ' in page text (React shows it correctly)
 *   react-hooks/set-state-in-effect           state set in an effect (an extra render, not a wrong one)
 *   react-hooks/refs, purity, immutability,
 *     use-memo, preserve-manual-memoization   what the React Compiler needs to optimise a component
 *   @typescript-eslint/no-require-imports, no-empty-object-type   style
 */
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/no-unescaped-entities': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'public/**', 'node_modules/**']),
])
