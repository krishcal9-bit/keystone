# Keystone: find the land, unlock the homes — build spec (source of truth)

Complete one-shot build spec. Brand: Keystone. Tagline: "Homeownership that holds."

## 1. The problem and the product
Hackathon brief (Claude Impact Lab, UCI × SoCal Affordable Housing, with Habitat for Humanity of Orange County and the UCI Merage Center for Real Estate): prototype a scalable, repeatable solution that makes owning a home financially sustainable for low-income families.
The real bottleneck: Habitat can't sell homes it can't build, and in Orange County it can't build without land. OC land is among the most expensive in the country; land, not families or volunteers, limits how many homes Habitat OC delivers.
The opening almost nobody is using: California SB 4, the Affordable Housing on Faith and Higher Education Lands Act of 2023 (Gov. Code § 65913.16), in effect July 2, 2024 through January 1, 2036. Land owned by a religious institution or an independent nonprofit college as of January 1, 2024 can be developed for affordable housing with ministerial, by-right approval, without discretionary or CEQA review, if the project meets objective standards:
- All units for lower-income households, except up to 20% for moderate income and up to 5% for the institution's staff (manager units excluded).
- Deed restriction 45 years for ownership housing (55 for rental). Habitat homeownership fits.
- Minimum density in a metropolitan county like Orange County: 30 units/acre; 40 units/acre where the zone doesn't allow residential use. One story above the local height limit is allowed.
- A Phase I environmental site assessment is required (Phase II if warranted). A UC San Diego study found faith-based organizations own about 3,600 acres across 1,300 parcels in San Diego County alone, enough for roughly 4,900 affordable homes if just 10% were developed.

Keystone is Habitat OC's land engine. It finds faith- and college-owned parcels that could host Habitat homes, measures buildable space (including from a satellite screenshot), designs a feasible site plan in 3D, pitches it to the congregation in their language, and tracks every site from first contact to groundbreaking.
Sources (cite in an "About SB 4" panel and the README): HCD SB 4 fact sheet (hcd.ca.gov), UC San Diego Center for Housing Policy and Design report on faith-owned land. Every legal statement in the app must match them. Show "Not legal advice. Confirm with the city and counsel." wherever eligibility appears.

## 2. Data (no database)
- `data/parcels.json`: 60 sample parcels across Santa Ana, Anaheim, Garden Grove, Westminster, Fullerton, Orange, Costa Mesa, Irvine, Tustin, Huntington Beach. Owner types: congregations of varied faiths, two independent nonprofit colleges, ~10 ineligible controls. Fields: id, displayName, ownerType, ownerSince, city, mapX, mapY, lotAcres, buildingAcres, parkingAcres, parkingSpaces, openAcres, zoning, nearSchoolM, nearTransitM, nearGroceryM, slopePct, floodZone, hazards[], congregationLanguage ('en'|'es'|'vi'|'ko'), lotPolygon (normalized), buildingRect, parkingRects, streetSide.
- All names and locations are fictional ("… (sample)"). Show a persistent "Sample data" label wherever parcels appear. Never use a real congregation's name or address.
- `data/assumptions.json`: editable defaults with notes.
- User state (pipeline stages, notes, saved plans, scan results, practice transcripts) lives in localStorage via `lib/store.ts` with versioned keys, export/import JSON, safe reads.

## 3. The engine (`lib/sb4.ts`): deterministic, unit-tested; Claude never decides eligibility or numbers
checkEligibility, minDensity, buildableArea, unitCapacity, fitScore, impact, layoutPlan, areaFromPolygon. See the file.

## 4. Product surfaces
### 4.1 Landing (`/`)
Full-viewport sections (100svh). One press of Down (PageDown, Space, J) moves to the next section; Up (PageUp, K) back; smooth scroll cubic-bezier(0.77,0,0.175,1) ~700ms; extra presses ignored mid-move; keys never hijacked inside inputs/sliders. Round down-arrow button bottom-center (44px, pine outline, bobs 4px every 2.5s; last section → up arrow), section dots on the right edge (active dot is a pine pill that glides), scroll-snap (mandatory desktop, proximity mobile), touch swipe, Lenis.
Sections (each a full-bleed illustrated scene with its diagram integrated into the world):
1. Hero: dusk OC street scene with distinct homes, street lamps, a church on a corner lot whose empty parking lot is subtly highlighted. Left: headline "There's land for Habitat homes hiding in plain sight." (Fraunces), one-sentence SB 4 subline, two identical-size primary actions ("Find sites", "How SB 4 works"). Right: live mini-map of OC in the sky where parcel dots glow in one by one and a counter rolls to "60 sites · N potential homes".
2. "The law changed in 2024." Church-campus scene: sanctuary, kept parking, empty lot. Big type: "30 homes per acre, by right." Auto-plays: the empty parking lot glows, survey lines trace the buildable area, townhomes rise row by row (foundations, walls, roofs settle; nothing passes through anything), families walk in; church and kept parking untouched. Holds; "Next" cue on the down arrow. Down mid-sequence completes it; returning shows finished state with "Replay".
3. "Measure any lot from the sky." Aerial scene: satellite-style illustrated lot; a scan beam sweeps; polygons trace around building, parking, open land; area numbers roll up. Auto-plays then holds.
4. "See what a lot can hold." The 3D Plan Studio in miniature in a wide landscape: lot extrudes, homes build row by row with soft shadows, unit counter rolls, sun sweeps once.
5. "Ask any congregation, in their language." Warm study/desk scene: a letter writes itself onto textured paper in English, flips to Spanish and Vietnamese versions; a pen signs it.
6. "Habitat sees the whole pipeline." Elevated isometric neighborhood block with sites at different stages (empty lot, survey stakes, framing, finished homes); badges above each count up; a crane rotates slowly.
7. Closing band: dusk street running into the distance; window lights come on in a wave as a counter rolls to the total potential homes. "Keystone finds the ground. Habitat builds the homes." with "Find sites".
Transitions: camera moves to a new place: outgoing layers slide away at different speeds (foreground fastest), incoming layers rise in, sky crossfades 700–900ms; text reveals after the scene lands. Never a blank frame, never a header jump: all scenes stay mounted (opacity/transform), preload neighbors, header fixed outside the section container. Only the active scene runs ambient motion.

### 4.2 Site Finder (`/sites`)
Stylized in-house SVG map of Orange County (coastline, ocean, freeways as soft lines, city labels, subtle terrain). Markers sized by potential homes, colored by fit score. Hover: card grows from the marker (origin-aware, 160ms). Click: map flies to the parcel (spring) and marker morphs into Site Detail (shared element). Left panel: filters (city, owner type, min buildable acres, near transit, near schools, eligible only, congregation language), sort, results list with fit score, potential homes, one-line reason. Top totals: sites shown, eligible, potential homes, people housed; numbers roll. Heat overlay toggle.

### 4.3 Site Detail (`/sites/[id]`)
Illustrated top-down parcel diagram (lot outline, sanctuary, parking stalls, open land; buildable area in pine). Eligibility card with reasons, warnings, "Why" expander citing the SB 4 provision, not-legal-advice note. Numbers: buildable acres, SB 4 minimum units, practical Habitat homes, people housed, fit-score breakdown. "Keep parking" slider (0 to current spaces): area and units update live; kept stalls animate in/out; "+N homes" pill pops. Claude Feasibility Brief streams in (summary, top 3 risks, next 5 steps, questions). Actions: Open in Plan Studio, Scan this lot, Create pitch kit, Add to pipeline.

### 4.4 Lot Scan (`/scan`, and from Site Detail with ?parcel=id)
Drop a satellite screenshot (PNG/JPG/HEIC; max 10MB; resized client-side). Scale: meters across the image width, or "use this parcel's lot size". Claude vision returns JSON polygons (normalized coords) for buildings, parking, open/landscaped land, trees, access points, each with confidence. App draws polygons with animated outline trace (pathLength), labels each, computes areas, feeds the engine: "About 14 homes fit on the north parking lot while keeping 60 spaces." Vertices draggable; numbers update live. "Trace manually" fallback (click to add points) if extraction fails or no key. 3 bundled sample aerials generated as illustrated top-down lots (clearly fictional) so the demo works offline, plus a fixture response for each.

### 4.5 Plan Studio (`/plan/[id]`)
R3F scene: ground plane with soft terrain, the existing church as a massing model (pitched roof, steeple/bell tower, entrance), kept parking with painted stalls, trees (palm, jacaranda, oak), lamp posts, lot boundary. Generate from layoutPlan: townhome rows or stacked flats, drive aisle, yards, community green. Controls: unit type, target units, parking kept, garden on/off. Shows whether SB 4 minimum density is met or how far short. Build-up animation on generate: foundations slide in, walls extrude up, roofs drop and settle (bounce 0.15), windows light; rows build in sequence with overlap; never two stacked parts at once. Sun slider; before/after crossfade; orbit + preset views (aerial, street, three-quarter); cursor-aware light. Export PNG and one-page PDF.

### 4.6 Pitch Kit (`/pitch/[id]`)
Claude drafts a respectful, personalized letter from Habitat OC to the congregation's leadership in their language (EN/ES/VI/KO) plus an English copy for staff. Mission-first, specific to their lot, no pressure. Streams onto paper-textured document. One-page visual "What this could look like at [Congregation]" with render, families housed, what the congregation keeps (sanctuary, kept parking, control), SB 4 in three sentences; PDF export. Board Q&A prep: the 6 objections (parking, neighbors, liability, losing control of land, cost, timeline) with honest answers grounded in SB 4 and Habitat's model. Practice mode: Claude plays a skeptical board member in a chat; after 4 turns Claude gives feedback (what landed, what to tighten); transcript saved locally. Everything editable; copy to clipboard; nothing sent automatically.

### 4.7 Pipeline (`/pipeline`)
Table grouped by stage: Identified → Researched → Contacted → Meeting set → Board interested → Feasibility → Agreement → Groundbreaking. Stage change animates the row into its group (layout animation). Notes and last-activity date per site. Header totals per stage + potential homes unlocked, rolling. Slim stacked bar across the top showing homes by stage, morphing on change. Weekly brief button: Claude streams what moved, what's stalled (no activity in 21 days), the three best next actions. Export/import JSON. Seed 12 sites on first load.

### 4.8 Ask Keystone (`/ask`)
Q&A about SB 4 and Habitat partnerships. System prompt contains only the SB 4 facts (lib/sb4Facts.ts) and Habitat basics; every answer cites which fact it used and adds the not-legal-advice note when relevant; refuses to invent rules. Suggested questions as chips.

### 4.9 Global
Header (fixed, 64px, transparent over the landing hero, gains --surface + hairline after 24px scroll): lockup, nav, EN/ES toggle, light/dark toggle. Light/dark: system default, remembered, applied before first paint. EN/ES dictionaries for all UI copy. 404 and error pages in the same style.

## 5. Claude usage (server-side only)
`lib/claude.ts`: APP_ANTHROPIC_API_KEY ?? ANTHROPIC_API_KEY; model claude-sonnet-5-5; no temperature. Routes: /api/brief (streamed), /api/scan (vision → polygons JSON), /api/pitch (streamed letter), /api/objections, /api/practice, /api/weekly (streamed), /api/ask (streamed). Every route: Zod-validated input/output, 25s timeout, one retry, rules-based or fixture fallback so every tool works without a key or network, `{ error: { code, message } }` on failure. MOCK_CLAUDE=1 uses fixtures in `fixtures/`. Log purpose and token count per call.

## 6. Visual identity
Wordmark "Keystone" in Fraunces (opsz 144, weight 600, SOFT 30, WONK 0, −0.02em). Icon: stone arch, keystone brass with a key notch. UI type: Public Sans, tabular numerals. Scale: 13/15 helper, 18/28 body, 24/32 titles, 40–48 mobile / 72–96 desktop Fraunces headlines.
Tokens (light): paper #F6F7F5, surface #FFFFFF, ink #182420, ink-2 #4A5753, line #DDE3DF, pine #1E5C47, pine-soft #E4EFEA, brass #B8862B, signal-red #B3362B, signal-amber #9A6B12. Dark: paper #0F1513, surface #161E1B, ink #E8EDEA, ink-2 #A7B4AE, line #26312D, pine #4FA585, pine-soft #183229, brass #D9A64A, signal-red #E07A6F, signal-amber #D9A64A. Contrast ≥ 4.5:1.
Illustration palette only from lib/illustrationPalette.ts. Style: soft, dimensional; 2–3 tones per object; top-left light; contact shadows; atmospheric perspective; believable details (mullions, doormats, mailboxes, porch lights, cars, curbs, fences, sprinklers, varied trees); warm rounded people; no outline-only drawings, no clip-art, no floating objects, no copy-pasted houses. Scenes as React components in components/scenes and components/illustrations, split into named groups.
3D (R3F): low-poly primitives, MeshStandardMaterial matte, hemisphere + warm directional sun with soft shadows, emissive warm windows, orthographic/narrow FOV; frameloop demand when idle; dpr [1,2]; lazy-loaded; paused off screen; static fallback when WebGL unavailable or reduced motion.
Dark mode = night: navy-to-ink sky with moon and stars (scenery, not a control), windows/porch lights brass, street lamps on with cones, headlights, table lamps, work lights. Every outdoor scene has 3–6 street lamps. Theme switch: sky crossfades 600ms, lamps turn on one after another (80ms stagger, flicker on the first); reduced motion = instant.
Layout: 12-column grid, ≥ 80px side margins on desktop; big numbers as anchors; pairs of primary actions identical in size; hairlines over boxes; radii 8px controls / 14px panels, concentric; no identical shadowed card grids.
Banned: purple/indigo gradients, gradient text, gradient washes on UI, cream + terracotta, neon on black, ALL-CAPS eyebrows, 01/02/03 on non-sequences, emoji, sparkle icons, "Powered by AI" badges, "→" on buttons, hover lift + shadow on cards, particles/blobs/glassmorphism.

## 7. Motion system
Motion for React; CSS transitions only for color/opacity hovers; Lenis for landing; R3F for 3D; View Transitions for pages (fallback AnimatePresence). `<MotionConfig reducedMotion="user">`. Tokens in lib/motion.ts (spring.snappy/smooth/gentle/settle, ease.out/inOut/drawer, dur.micro/short/medium/long/scene, stagger 0.04); no component defines its own timing.
Principles: weight and settle for large objects (bounce ≤ 0.2), crisp UI (bounce 0); overlap and follow-through (parts land 60–120ms apart); anticipation; one ambient detail per scene (trees sway 1–2°, chimney smoke, cloud drift, 6–10s loops); layered parallax (back 0.15×, mid 0.4×, front 1×, max 16px); brass glow = "unlocked"; masks/clip-path/shared-element morphs over plain fades; entrances 400–700ms for big objects, 150–250ms for UI, exits ~30% faster; never ease-in; never from scale(0); only transform/opacity/clip-path/filter/pathLength.
Auto-play explainer rule: plays when active, holds with all content visible, "Next" cue when done; input mid-sequence completes it; returning shows finished state with "Replay".
Signature: rolling numbers (<AnimatedNumber>), vertical word swaps, keep-parking slider (thumb 20→24px on press, stalls animate, "+N homes" pill pops, navigator.vibrate(8)), map fly-to + marker morph, scan beam + polygon trace + numbers fly, Plan Studio build-up/sun/before-after with blur fuse, Pitch Kit text streams line by line + pen signs + page-turn language flip, pipeline rows glide + stacked bar morphs, segmented controls share one layoutId, buttons press scale 0.97, main CTA magnetic within 40px + label slide-up, toasts slide up 8px and leave after 2.4s reusing the verb ("Plan saved"), checkmarks draw as paths, focus rings fade 120ms.
Loading: < 300ms nothing; 300ms–1s inline spinner in the trigger; > 1s skeleton matching layout (1.6s shimmer). Streamed text grows its container with layout animation. Optimistic UI for stage changes, notes, saves.
Volume order: landing > Plan Studio > Site Finder/Detail/Lot Scan > Pitch Kit > Ask > Pipeline (no ambient motion). Inner pages have their scene behind them at lower intensity: Site Finder on the OC map; Site Detail and Lot Scan a soft blurred aerial neighborhood at ~35% along the bottom; Pitch Kit a blurred warm desk; Ask a quiet study; Pipeline a faint static skyline band in the header at 8–10%. One ambient motion per screen.
Premium details: film grain 3%; cursor-aware light on 3D (desktop); text-wrap balance/pretty; selection/caret colors; 44px hit areas; hover gated by (hover:hover) and (pointer:fine); every empty/loading/error/success state designed; CLS < 0.02.

## 8. The intro (every landing load, ~4.5s, skippable)
Click/scroll/key jumps to hero in 200ms. Reduced motion: hero with 150ms fade. R3F timeline: 1) dusk→light with blueprint grid and parcel boundary tracing (0–700ms); 2) stone arch assembles from both sides with settle + dust puffs, camera orbits ~25° (700–2000ms); 3) brass keystone descends, rotates 90°, locks; arch settles 2px; brass glow pulses (2000–2700ms); 4) camera pushes through the arch into a top-down OC map with parcel markers popping in (2700–3700ms); 5) scene blurs/dims to 30%; "Keystone" lockup reveals letter by letter (weight 300→600, 40ms stagger), tagline fades in; hold 1.2s; lockup flies to the header (shared element) while the map settles into the hero mini-map and the hero assembles. Hero DOM rendered underneath from the start. Clean console (THREE.Timer).

## 9. Per-page animation detail
Site Finder: map draws coastline (pathLength), freeways fade in, markers pop north→south 20ms wave (once per session). Filters: markers drop out shrink/fade, stay glide; totals roll. Ambient: one ocean shimmer.
Site Detail: diagram builds on arrival; eligibility checks tick one by one; brief streams with growing container. Ambient: one tree sway.
Lot Scan: image drops in with 4px settle; beam sweeps 800ms; polygons trace in category order; numbers fly to results. No ambient.
Plan Studio: camera eases between views; sun slider live. Ambient: garden trees sway.
Pitch Kit: paper slides up with shadow; text writes line by line; language switch page-turn (rotateY, 500ms); objection items rise 50ms apart; chat bubbles rise; typing indicator three brass dots. Ambient: desk-lamp flicker on at load.
Pipeline: rows stagger in first load only (20ms, max 8); stage change glides; totals roll; stacked bar morphs; weekly brief streams into a growing panel. No ambient.
Ask: answers stream; cited facts pop in as chips after the answer. No ambient.

## 10. Stack
Next.js 15 App Router, TypeScript strict, Tailwind v4, Motion, Lenis, three + R3F + drei, Zod, @anthropic-ai/sdk, Vitest, Playwright, @axe-core/playwright, @react-pdf/renderer, next/font (Fraunces, Public Sans).

## 11. Quality gates
`npm run check` = tsc, eslint, vitest, next build. Playwright e2e with MOCK_CLAUDE=1 covering landing, site finder, site detail, lot scan, plan studio, pitch kit, pipeline, theme, i18n, axe (zero serious/critical in light and dark). Resilience without key. Screenshots at 1440×900, 1024×768, 390×844 light and dark in docs/screenshots. pro-ui-craft Part 5 review in docs/UI_REVIEW.md. Lighthouse mobile / ≥ 80 perf, ≥ 95 a11y, CLS < 0.02. Verify on the live URL.

## 12. Build order
1 scaffold · 2 engine · 3 illustration system · 4 Site Finder · 5 Site Detail · 6 Plan Studio · 7 Lot Scan · 8 Pitch Kit · 9 Pipeline · 10 Landing · 11 Intro · 12 Ask + 404/error · 13 QA/README/tag v1.0-hackathon.

## 13. Lessons from the previous project
Keep scenes mounted; distinct homes; labels on solid backing; scenery never styled as a control; equal CTA sizes; exploded layers never pass through each other; each section one integrated scene; verify on the live URL; use APP_ANTHROPIC_API_KEY.

## 14. Demo script (3 minutes)
1 intro · 2 the pitch · 3 Down through "The law changed in 2024" · 4 Site Finder filter to eligible near transit · 5 open a sample church, drag keep parking 120→60 · 6 Lot Scan · 7 Plan Studio generate/before-after/sun · 8 Pitch Kit Spanish letter + objections · 9 Pipeline move to "Meeting set" · 10 dark mode lamps · 11 close.
