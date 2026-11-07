# Decisions log

Judgment calls made while building Keystone, in build order.

## Step 1 — scaffold
- **Branch.** The spec says to work on `main`. The harness also designated `claude/focused-albattani-vrubxz`; `main` is the source of truth and Vercel deploys from it, so all work lands on `main`. The designated branch is kept pointed at the same commits as a mirror.
- **Turbopack for production builds.** `next build` with webpack failed with "Could not find the module …Providers.tsx#Providers in the React Client Manifest" (a bundler bug with the `motion` v14 package graph). `next build --turbopack` builds cleanly, so `npm run build` uses it. Vercel runs the same script.
- **`@types/node` 22.** Vitest 5 requires `@types/node` ≥ 22; the Next template pins 20. Bumped.
- **UI language is EN/ES only** (per spec); generated content (letters) can be EN/ES/VI/KO. The UI language and theme are applied by one inline head script before paint.
- **Fonts via `next/font/google`.** Fraunces loaded with the `SOFT`, `WONK` and `opsz` axes so the wordmark can use opsz 144 / SOFT 30 / WONK 0.
- **Film grain** is a 128×128 generated noise PNG (`public/grain.png`) at 3 % opacity, `multiply` in light and `screen` in dark.
