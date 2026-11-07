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

## Judge Guide + guided tour
- **Tour state is one versioned key** (`keystone:v1:tour` → `{ active, step, startedAt }`), 0-based `step`; `step === 7` is the "That's the tour" card. `startTour()` only writes state and returns the first route; the caller navigates. The overlay follows the `keystone:store` event, so the header's lane pill can start it later without wiring.
- **Missing selectors degrade to card-only.** The overlay polls the step selector for 3 s after each navigation (pages hydrate and stream); if it never appears the step card still shows, without a highlight. Off-route it collapses to a compact "Resume tour" card; Esc skips anywhere.
- **Highlight animates with Motion `layout`** (transform-based FLIP) rather than animating top/width, so the 2 px outline stays crisp while it glides; reduced motion makes it instant.

## Steps 6–11 — Plan Studio, landing, intro
- **Turbopack dev with a separate dist dir.** `next dev` writes `.next-dev` (via `NEXT_DIST_DIR`) so a running dev server never collides with `next build` or `tsc`.
- **Page transitions** use a `template.tsx` rise-and-fade (250–350 ms) rather than the View Transitions API: App Router client navigations do not give a reliable "new" snapshot for `document.startViewTransition`, and a broken morph is worse than a clean crossfade. The map fly-to zoom plus the detail diagram building on arrival approximates the marker-to-diagram shared element.
- **Plan Studio kept parking** is drawn from the same stall geometry as the diagram (`lib/stalls.ts`); the plan uses `layoutPlan` with `keepClear` around the church and the kept stalls and `keepSpaces: 0`, because the existing lot already provides the parking.
- **Practical density** for stacked flats in Plan Studio is capped by the engine (1.1× minimum); townhomes usually fall short, and the status pill says exactly how far.
- **THREE.Clock deprecation.** R3F 9 constructs a `THREE.Clock`; three r187 logs a deprecation on construction. `components/three/quiet.ts` drops that one message so the console stays clean; all scene timing uses `performance.now()`.
- **Intro handoff.** The intro timeline is a single `requestAnimationFrame` clock that never restarts on phase changes; the flying lockup is a FLIP to the header lockup's measured rect, with a safety timeout so the hero always becomes interactive.
- **Landing sections** stay mounted; inactive sections pause ambient CSS animations via `data-ambient="off"`; layered transitions use `--shift` on `.scene-layer-*`.

## Add-on — lane branding, challenge framing, Judge Guide
- **Gap model** (`lib/gap.ts`) is illustrative per-home arithmetic from `data/assumptions.json` (`gap.*`): market land per home = buildable acres × $3M/acre ÷ homes; partner land = $0; permits + carrying cost for 48 vs 20 months; family capacity = AMI tier × 30–35 % × (1 − taxes/insurance share) × 30 years at Habitat's 0 % mortgage. Every panel says "Illustrative. Real numbers vary by site." and cites the Claude Impact Lab challenge brief for the framing figures.
- **City rules** are a placeholder checklist per city (sample data), with SB 4's ministerial override stated from the HCD fact sheet.
- **Challenge section** uses fixed illustrative dollar amounts so the bar reads the same on every load; the e2e test asserts the final gap is smaller than the initial gap from `data-gap-start/end`.
