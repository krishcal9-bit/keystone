# UI review (pro-ui-craft Part 5)

Screen by screen, every issue found in the visual review and what was done about it. Screenshots in `docs/screenshots/`.

| Where | Before | After | Why |
|---|---|---|---|
| Buttons (all) | Tailwind `bg-surface`/`border` lost to an unlayered `button {}` reset: secondary buttons rendered as plain text | Element resets moved into `@layer base`; utilities win | The UI must show press/hover states and borders consistently |
| Site Finder map | 60 markers jittered 38 px around city centres; overlapping clusters, labels hidden | Jitter 62 px with 24 px minimum spacing, default view zoomed to the populated north-west, labels get a paint-order halo | Markers must be clickable and city labels legible |
| Site Finder mobile | Filter toggle read "Filters / Filters" | "Show / Hide" in pine | Duplicate labels read as a bug |
| Switch | Off-state track was the hairline colour: invisible on white | Track is ink-2 at 35 % | A control must be visible in both states |
| Site Detail numbers | Buildable wash covered kept stalls and the sanctuary | Wash masked around the building and the kept bay; dashed pine outline | The diagram must show exactly what becomes buildable |
| Site Detail gap panel | Gap markers floated between rows and overlapped totals | Hatched "not yet closed" band inside each bar, a dashed marker where "what closes it" ends, a Gap/Closed pill after the total | Labels on busy art are unreadable; one glance must show the gap |
| Plan Studio night | Scene nearly black; windows floated | Moonlight 1.1, hemisphere kept at 60 %, lamp point lights ×6 | Night is a lit scene, not an inverted one |
| Plan Studio status | "17 kept stalls" next to "60 / 120 spaces" | Pill shows kept spaces from the engine | Two different numbers for one thing confuses |
| Landing street scenes | Houses 100 px tall under a 260 px street; text overlapped the row | Mid/front layers scaled 1.35×, ground at 740 px, text in the sky on a scrim | The scene must read as a place, text must sit in a calm zone |
| Landing scrim | Scrim rendered behind the scene (negative z-index escaped) | `isolate` on the text block | Text must stay legible over art |
| Landing scale transforms | CSS parallax transform overrode the SVG `transform` attribute | Scale applied on a nested group | Parallax and scale must compose |
| Plan miniature | Lot filled and clipped the frame | Camera distance ×1.75 (zoom prop) | The whole lot must be visible as a miniature |
| Closing band | Centre-line dashes were grey squares; houses overlapped the headline | Thin rounded dashes; text block at the top, houses lower | Nothing cheap, nothing overlapping |
| Intro | Clock restarted on the fly phase (arch reappeared); handoff never fired without a header rect | Single rAF clock, phase refs, safety timeout | The hero must become interactive every time |
| Intro loading | 3D chunk could arrive after the arch phase started | Timeline holds at the blueprint until the canvas is created (max 1.5 s) | Never a blank frame |
| Hero counter mobile | Counter card overlapped the headline scrim | Hidden below `md` | One calm zone per section on phones |
| Sample data label | Hard-coded "Sample data" leaked English into the Spanish UI | Label reads the dictionary | i18n must be complete |
| Map a11y | `role="img"` SVG contained interactive markers (axe nested-interactive) | `role="group"` with the same label | Zero serious violations |
| Console | THREE.Clock deprecation and PCFSoftShadowMap warnings | PCFShadowMap; one targeted warn filter | The console must be clean |
| Ask protocol | Claude sometimes wrote `[F6]` inline | Client strips the `FACTS:` line and tolerates inline ids | Chips, not brackets |

## Checklist pass

- No `transition: all`; no `ease-in`; nothing enters from `scale(0)`; UI transitions ≤ 300 ms except signature moments; exits ~30 % faster; staggers capped.
- Hover effects gated by `(hover: hover) and (pointer: fine)`; 44 px hit areas on toggles, dots, arrows, slider thumbs; focus rings 2 px pine with offset.
- Radii: 8 px controls, 14 px panels, 6 px nested segments. Hairlines over shadows; no hover lift.
- Numbers roll with tabular numerals; words swap vertically; segmented controls share one `layoutId`.
- Empty, loading, error and success states designed on every tool (skeletons at > 1 s, inline spinners at 300 ms–1 s).
- Reduced motion: `MotionConfig reducedMotion="user"`, instant explainers, static 2D plan fallback, 150 ms intro fade.
- "One accessory" rule: removed the intro skip hint's animation and the map's second ambient (freeway shimmer) so each screen keeps one ambient detail.
