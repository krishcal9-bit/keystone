# Keystone — working notes for Claude Code

Keystone is Habitat for Humanity OC's land engine: it finds faith- and college-owned parcels that
qualify for California SB 4 by-right affordable housing, measures buildable space, lays out a 3D site
plan, drafts the pitch to the congregation, and tracks the pipeline. Brand: "Homeownership that holds."

## Engine (`lib/sb4.ts`) — deterministic, unit-tested, Claude never decides numbers
- `checkEligibility(parcel, today)`: owner type ∈ {congregation, college}; `ownerSince` ≤ 2024-01-01;
  today within 2024-07-02 … 2036-01-01. Flood zone / hazards → warnings, never silent passes.
- `minDensity(parcel)`: 30 u/acre; 40 if zoning ≠ residential.
- `buildableArea(parcel, keepSpaces)`: openAcres + parkingAcres − keepSpaces×350 sqft, minus 10 % setbacks, ≥ 0.
- `unitCapacity(area, parcel, type)`: SB 4 minimum (area × density) vs practical Habitat count
  (townhome 900 sqft footprint + yard, or stacked flats); flags when practical < minimum.
- `fitScore(parcel)`: 0–100 with a per-factor breakdown. `impact(units)`: homes, people (×3.4), affordability-years (×45).
- `layoutPlan(polygon, opts)`: pure procedural site plan (rows, drive aisle, kept stalls, yards, green).
- `areaFromPolygon(points, metersPerUnit)`. All in Vitest (`tests/`).
- Every legal statement matches the HCD SB 4 fact sheet. Show "Not legal advice. Confirm with the city and counsel." wherever eligibility appears. All parcels are fictional: show "Sample data".

## Design
- Tokens live in `app/globals.css` (`--paper --surface --ink --ink-2 --line --pine --pine-soft --brass --signal-*`),
  light + dark via `html[data-theme]`; dark = night (moon, lit windows, lamps on), never inverted colours.
- Type: Fraunces (`.headline`, `.wordmark`, opsz 144 / SOFT 30 / WONK 0) + Public Sans; tabular numerals everywhere.
- Radii: 8 px controls, 14 px panels, concentric. Hairlines over shadows. No card grids with hover-lift.
- Illustration palette only from `lib/illustrationPalette.ts`; top-left light; every object has light face,
  shadow face and contact shadow; no outline-only art, no floating objects, no copy-pasted houses.
- Banned: purple gradients, gradient text, ALL-CAPS eyebrows, emoji, sparkles, "→" on buttons, glassmorphism, blobs.

## Motion (`lib/motion.ts` is the only source of timing)
- `spring.snappy|smooth|gentle|settle`, `ease.out|inOut|drawer`, `dur.micro…scene`, `stagger = 0.04`.
- Motion for React for components; CSS only for colour/opacity hovers; Lenis on the landing; R3F for 3D.
- `<MotionConfig reducedMotion="user">` wraps the app. Only transform/opacity/clip-path/filter/pathLength animate.
- Never `ease-in`, never from `scale(0)`; exits ~30 % faster; big objects settle (bounce ≤ 0.2), UI bounce 0.
- Explainers auto-play when active, then hold; input mid-sequence completes rather than skips; return shows "Replay".
- Rolling numbers via `<AnimatedNumber>`; word swaps vertical; segmented controls share one `layoutId`.
- Landing scenes stay mounted (opacity/transform), header is fixed outside the section container.

## Claude (`lib/claude.ts`, server only)
- Key: `APP_ANTHROPIC_API_KEY ?? ANTHROPIC_API_KEY`; model `claude-sonnet-5-5`; never set temperature.
- Routes under `app/api/*`: Zod in/out, 25 s timeout, one retry, rules/fixture fallback, `{ error: { code, message } }`.
- `MOCK_CLAUDE=1` serves `fixtures/`. Log purpose + token counts to the server console.

## Build order (§12) — push to `main` after each
1 scaffold/tokens/header/i18n · 2 engine + data · 3 illustration system · 4 Site Finder · 5 Site Detail ·
6 Plan Studio · 7 Lot Scan · 8 Pitch Kit · 9 Pipeline · 10 Landing · 11 Intro · 12 Ask + 404 · 13 QA/README/tag.

## Commands
`npm run check` (tsc, eslint, vitest, next build --turbopack) must pass before every push. `npm run e2e` runs Playwright with `MOCK_CLAUDE=1`.
Record judgment calls in `docs/DECISIONS.md`.
