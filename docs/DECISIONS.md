# Decisions log

Judgment calls made while building Keystone, in build order.

## Step 1 — scaffold
- **Branch.** The spec says to work on `main`. The harness also designated `claude/focused-albattani-vrubxz`; `main` is the source of truth and Vercel deploys from it, so all work lands on `main`. The designated branch is kept pointed at the same commits as a mirror.
- **Turbopack for production builds.** `next build` with webpack failed with "Could not find the module …Providers.tsx#Providers in the React Client Manifest" (a bundler bug with the `motion` v14 package graph). `next build --turbopack` builds cleanly, so `npm run build` uses it. Vercel runs the same script.
- **`@types/node` 22.** Vitest 5 requires `@types/node` ≥ 22; the Next template pins 20. Bumped.
- **UI language is EN/ES only** (per spec); generated content (letters) can be EN/ES/VI/KO. The UI language and theme are applied by one inline head script before paint.
- **Fonts via `next/font/google`.** Fraunces loaded with the `SOFT`, `WONK` and `opsz` axes so the wordmark can use opsz 144 / SOFT 30 / WONK 0.
- **Film grain** is a 128×128 generated noise PNG (`public/grain.png`) at 3 % opacity, `multiply` in light and `screen` in dark.

## Step 2 — engine and data
- **Reasons are structured.** `checkEligibility` returns `reasons: { id, pass, label, detail, provision }[]` and `warnings: { id, label, detail }[]` rather than bare strings so the UI can tick each check and cite the SB 4 provision in the "Why" expander.
- **Practical density assumptions.** Townhomes use ~1,850 sq ft of land per unit (≈23/acre) so they usually fall short of the SB 4 minimum (30–40/acre), which is exactly the case the engine flags with a stacked-flats suggestion. Stacked flats use ~750 sq ft/unit and are capped at 1.1× the SB 4 minimum to keep projects at Habitat scale. All numbers are in `data/assumptions.json` with notes.
- **"Potential homes"** for a parcel = the recommended scenario: keep half of today's parking, townhomes if they meet the minimum, otherwise stacked flats at the minimum (+10 %). The 60 sample sites total about 4,900 homes, close to the UC San Diego estimate for San Diego County, which is a coincidence but a reassuring one.
- **Lot geometry.** Each parcel carries a normalized `lotPolygon` plus `buildingRect` and `parkingRects` in the same frame so the diagram, Lot Scan and Plan Studio share one shape; `metersPerUnitForLot` scales it so the polygon area equals the lot acreage.
- **Sample data generator** lives in `scripts/gen-parcels.py` (seeded). Every name is invented and carries "(sample)". Two congregations acquired land after January 1, 2024 so the ownership-date rule is visible in the data.
