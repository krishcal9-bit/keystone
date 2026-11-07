'use client';
/**
 * Landing section "How it works". One church campus, four steps that auto-play in sequence (~16 s), then hold.
 *  1 Find (0–4 s)      the camera rises over Orange County: the map grows from an inset to the frame, eligible faith
 *                       and college parcels light up brass on a 20 ms wave, one church gets a pine ring, then the camera
 *                       descends: the map zooms past while the campus street scene rises into place.
 *  2 Check (4–8 s)     an eligibility card builds beside the lot, rows tick in with drawn checkmarks (engine numbers).
 *  3 Design (8–12.5 s) the unused lot glows brass, survey lines trace, townhomes rise row by row; a counter rolls to the
 *                       engine's homes number. Sanctuary and kept parking never move.
 *  4 Partner (12.5–16) a letter slides up on the right and writes itself in Spanish; the English version flips in.
 * The parent renders the section kicker/title (top-left). This scene renders the progress rail (left, below the
 * headline area), the per-step title + one-line explanation (bottom-left) and the card / counter / caption overlays.
 * Performance: only transform / opacity / clip-path / pathLength animate; map markers are plain circles with one
 * CSS transition; static art is plain SVG.
 */
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { SceneProps } from './types';
import { useSceneExplainer } from '@/components/explainer/useSceneExplainer';
import { when } from '@/components/explainer/useExplainer';
import { palette as P, shade } from '@/lib/illustrationPalette';
import { Sky } from '@/components/illustrations/Sky';
import { Hills, Street } from '@/components/illustrations/Ground';
import { Church } from '@/components/illustrations/Church';
import { Tree } from '@/components/illustrations/Tree';
import { StreetLamp, LampDefs } from '@/components/illustrations/StreetLamp';
import { Car } from '@/components/illustrations/Car';
import { Window, Door, ContactShadow, T } from '@/components/illustrations/primitives';
import { COUNTY_PATH, COAST_PATH, FREEWAYS } from '@/components/map/ocGeo';
import { parcels } from '@/lib/data';
import { ELIGIBLE_OWNERS, minDensity } from '@/lib/sb4';
import { siteStats } from '@/lib/siteStats';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useT, contentLangNames } from '@/lib/i18n';
import { spring, ease, dur, cssEase } from '@/lib/motion';

const DURATION = 16000;
const W = 1440, H = 900, S = 1.3, ground = 740 / S;
const STEP_AT = [0, 4000, 8000, 12500];               // ms: when each step starts
const T_RISE = 3.0;                                    // the campus rises into place

/* ---------- the county: a known bounding box so the camera can pivot on the church ---------- */
const site = parcels[0];
const OCEAN = { x: -700, y: -600, w: 2400, h: 2200 };
const PIVOT = { x: (site.mapX - OCEAN.x) / OCEAN.w, y: (site.mapY - OCEAN.y) / OCEAN.h };
const MARK = { x: 707, y: 322 };                       // where the church marker sits when the county fills the frame
const CHURCH_AT = { x: 292, y: 690 };                  // where the sanctuary stands in the street scene (viewBox px)
const northToSouth = [...parcels].sort((a, b) => a.mapY - b.mapY);
const eligible = northToSouth.filter((p) => ELIGIBLE_OWNERS.includes(p.ownerType));
const others = northToSouth.filter((p) => !ELIGIBLE_OWNERS.includes(p.ownerType));

/* ---------- the letter ---------- */
const SHEET = { x: 1140, y: 200, w: 250, h: 250 };   // below the night sky's moon

const sans = { fontFamily: 'var(--font-sans)' } as const;
const serif = { fontFamily: 'var(--font-display)', fontVariationSettings: '"SOFT" 30, "WONK" 0, "opsz" 14' } as const;

/**
 * Motion only restarts an animation when a value changes, so finishing fast (a transition-only change) would leave
 * pending animations on their old delays. When fast, nudge every target by an invisible 0.001 so each re-runs on the
 * short transition; keyframe arrays collapse to their final value.
 */
function fin<Tg extends Record<string, unknown>>(t: Tg, fast: boolean): Tg {
  if (!fast) return t;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(t)) {
    const last = Array.isArray(v) ? v[v.length - 1] : v;
    out[k] = typeof last === 'number' ? last + 0.001 : typeof last === 'string' ? last.replace(/0%\)$/, '0.001%)') : last;
  }
  return out as Tg;
}

/** Which step we are on (1–4) while playing; all four at once when fast, done or reduced; 1 before the start. */
function useStep(playing: boolean, done: boolean, fast: boolean, reduced: boolean, key: number) {
  const [n, setN] = useState(1);
  useEffect(() => {
    if (done || fast || reduced) { setN(4); return; }
    if (!playing) { setN(1); return; }
    const timers = STEP_AT.map((at, i) => setTimeout(() => setN((c) => Math.max(c, i + 1)), at));
    return () => timers.forEach(clearTimeout);
  }, [playing, done, fast, reduced, key]);
  return n;
}

export function HowItWorksScene(props: SceneProps) {
  const ex = useSceneExplainer(props, DURATION);
  const { night, active, reduced } = props;
  const { t, lang } = useT();
  const on = ex.phase !== 'idle';
  const fast = ex.fast;
  const step = useStep(ex.playing, ex.done, fast, reduced, ex.key);
  const F = <Tg extends Record<string, unknown>>(x: Tg) => fin(x, fast);
  const tr = (delay: number, base: Record<string, unknown> = { duration: dur.medium, ease: ease.out }) =>
    reduced ? { duration: 0 } : fast ? { duration: 0.22, ease: ease.out, delay: Math.min(delay * 0.02, 0.18) } : { ...base, delay };
  const ui = reduced ? { duration: 0 } : { duration: dur.medium, ease: ease.out };

  const stats = siteStats(site);
  const homes = stats.scenario.homes;
  const acres = stats.scenario.buildable.acres.toFixed(1);
  const density = minDensity(site);

  const water = night ? P.nightSkyHigh : P.ocean;
  const land = night ? P.roofDeep : P.wallSage;
  const landEdge = night ? P.asphaltLight : P.stoneLight;
  const road = night ? P.asphaltLight : P.sidewalk;
  const coast = night ? P.nightHorizon : P.oceanDeep;

  const homesRows = [
    { x: 800, y: ground - 46, s: 0.78, t: 9.2, wall: P.wallSage, roof: P.roof },
    { x: 902, y: ground - 46, s: 0.78, t: 9.4, wall: P.wall, roof: P.roofTerracotta },
    { x: 1004, y: ground - 46, s: 0.78, t: 9.6, wall: P.wallClay, roof: P.roofDeep },
    { x: 800, y: ground, s: 1, t: 10.0, wall: P.wallWarm, roof: P.roofDeep },
    { x: 950, y: ground, s: 1, t: 10.25, wall: P.wall, roof: P.roofTerracotta },
  ];
  const steps = [1, 2, 3, 4] as const;
  const titles = steps.map((i) => ({ title: t(`hiw.step${i}.title` as const), body: t(`hiw.step${i}.body` as const) }));
  const cardRows = [
    { label: t('hiw.card.owned'), check: true, at: 4.6 },
    { label: t('hiw.card.window'), check: true, at: 5.1 },
    { label: t('hiw.card.acres', { acres }), check: false, at: 5.6 },
    { label: t('hiw.card.density', { n: density }), check: false, at: 6.1 },
  ];
  const esLines = ([1, 2, 3, 4] as const).map((i) => t(`hiw.letter.es${i}`));
  const enLines = ([1, 2, 3, 4] as const).map((i) => t(`hiw.letter.en${i}`));
  const markerDelay = (i: number) => (reduced || fast ? 0 : 1200 + i * 20);

  return (
    <div className="absolute inset-0" key={ex.key} data-hiw-step={step}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="scene-svg" aria-hidden>
        <LampDefs />
        <style>{`
          .hiw-mk { opacity: 0; transform: scale(0.5); transform-box: fill-box; transform-origin: center; transition: opacity 0.35s ${cssEase.out}, transform 0.35s ${cssEase.out}; }
          [data-on="true"] .hiw-mk { opacity: 1; transform: none; }
          .hiw-mk-now { transition-duration: 0s !important; }
        `}</style>

        <g className="scene-layer-back">
          <Sky w={W} h={H} night={night} id="hiw" />
          <Hills w={W} y={640} night={night} id="hiw" />
        </g>

        <g className="scene-layer-mid">
          {/* the campus rises into place as the camera lands */}
          <motion.g initial={{ y: 320, opacity: 0 }} animate={on ? F({ y: 0, opacity: 1 }) : { y: 320, opacity: 0 }} transition={tr(T_RISE, spring.settle)}>
            <g transform={`scale(${S})`}>
              {/* lawn behind the campus */}
              <rect x={0} y={ground - 4} width={W / S + 2} height={6} fill={night ? P.lawnDeep : P.lawnShade} className={T} />
              <Tree x={60} y={ground + 2} kind="oak" scale={1.15} sway={active && !reduced} seed={3} />
              <Church x={150} y={ground} night={night} scale={1} tower="bell" />
              {/* kept parking with cars, never touched */}
              <g transform={`translate(340 ${ground})`}>
                <path d="M0 0 L340 0 L380 -40 L60 -40 Z" fill={night ? P.asphaltDeep : P.asphalt} className={T} />
                {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M${60 + i * 54} -40 L${i * 54 + 2} 0`} stroke={P.paint} strokeWidth={1.5} opacity={0.6} />)}
                <Car x={30} y={-6} scale={0.72} color="#5A7FA6" night={night} />
                <Car x={140} y={-6} scale={0.72} color="#D8D9D3" night={night} kind="wagon" />
                <Car x={250} y={-6} scale={0.72} color="#8A6FA8" night={night} />
              </g>
              <Tree x={738} y={ground + 2} kind="jacaranda" scale={0.95} sway={active && !reduced} seed={5} />
              {/* the empty part of the lot */}
              <g transform={`translate(750 ${ground})`}>
                <path d="M0 0 L330 0 L370 -70 L60 -70 Z" fill={night ? '#3B4A3F' : P.dirt} className={T} />
                <path d="M0 0 L330 0 L370 -70 L60 -70 Z" fill={P.lawn} opacity={0.35} />
                <motion.path d="M0 0 L330 0 L370 -70 L60 -70 Z" fill={P.honey} initial={{ opacity: 0 }} animate={{ opacity: on ? (fast || reduced ? 0.18 : [0, 0.45, 0.18]) : 0 }} transition={tr(8.2, { duration: 1.3, ease: ease.out })} />
                <motion.path d="M20 -8 L310 -8 L348 -62 L72 -62 Z" fill="none" stroke={P.pine} strokeWidth={2.5} strokeDasharray="10 6" initial={{ pathLength: 0, opacity: 0 }} animate={on ? F({ pathLength: 1, opacity: 1 }) : { pathLength: 0, opacity: 0 }} transition={tr(8.8, { duration: 1.0, ease: ease.inOut })} />
                {[[20, -8], [310, -8], [348, -62], [72, -62]].map(([x, y], i) => (
                  <motion.g key={i} initial={{ opacity: 0, y: -6 }} animate={on ? F({ opacity: 1, y: 0 }) : { opacity: 0, y: -6 }} transition={tr(8.8 + i * 0.22, { duration: dur.short, ease: ease.out })}>
                    <rect x={x - 1.5} y={y - 18} width={3} height={18} fill={P.trunk} />
                    <rect x={x - 5} y={y - 22} width={10} height={6} fill={P.brass} />
                  </motion.g>
                ))}
              </g>
              {homesRows.map((h, i) => <TownhomeBuild key={i} {...h} night={night} on={on} fast={fast} reduced={reduced} />)}
            </g>
          </motion.g>
        </g>

        <g className="scene-layer-front">
          <motion.g initial={{ y: 320, opacity: 0 }} animate={on ? F({ y: 0, opacity: 1 }) : { y: 320, opacity: 0 }} transition={tr(T_RISE + 0.08, spring.settle)}>
            <g transform={`scale(${S})`}>
              <Street w={W / S + 2} y={ground + 6} streetH={140} night={night} />
              <StreetLamp x={120} y={ground + 26} scale={1} on={night} index={0} flicker />
              <StreetLamp x={420} y={ground + 26} scale={1} on={night} index={1} />
              <StreetLamp x={700} y={ground + 26} scale={1} on={night} index={2} />
              <StreetLamp x={980} y={ground + 26} scale={1} on={night} index={3} />
              <Tree x={1075} y={ground + 2} kind="palm" scale={1.25} sway={active && !reduced} seed={6} />
            </g>
          </motion.g>
        </g>

        {/* ---------- step 1: the county, pivoting on the church ---------- */}
        <g transform={`translate(${MARK.x} ${MARK.y})`}>
          <motion.g
            style={{ originX: PIVOT.x, originY: PIVOT.y }}
            initial={{ scale: 0.24, x: 330, y: 120, opacity: 0 }}
            animate={on
              ? F({ scale: [0.24, 0.3, 0.8, 0.8, 2.4], x: [330, 300, 0, 0, CHURCH_AT.x - MARK.x], y: [120, 110, 0, 0, CHURCH_AT.y - MARK.y], opacity: [0, 1, 1, 1, 0] })
              : { scale: 0.24, x: 330, y: 120, opacity: 0 }}
            transition={reduced ? { duration: 0 } : fast ? { duration: 0.22, ease: ease.out } : { duration: 3.7, times: [0, 0.095, 0.38, 0.73, 1], ease: [ease.out, ease.inOut, 'linear', ease.inOut] }}
            data-on={on ? 'true' : 'false'}
          >
            <g transform={`translate(${-site.mapX} ${-site.mapY})`}>
              <rect x={OCEAN.x} y={OCEAN.y} width={OCEAN.w} height={OCEAN.h} rx={40} fill={water} stroke={landEdge} strokeWidth={2} className={T} />
              <path d={`M${OCEAN.x + 40} ${OCEAN.y + 40} H${OCEAN.x + OCEAN.w - 40} V260 L930 320 L${OCEAN.x + 40} 560 Z`} fill={land} opacity={0.3} className={T} />
              <path d={COUNTY_PATH} fill={P.shadow} transform="translate(8 10)" opacity={0.5} />
              <path d={COUNTY_PATH} fill={land} stroke={landEdge} strokeWidth={2} className={T} />
              <path d={COAST_PATH} fill="none" stroke={coast} strokeWidth={4} strokeLinecap="round" className={T} />
              {FREEWAYS.map((f) => <path key={f.id} d={f.d} fill="none" stroke={road} strokeWidth={f.major ? 5 : 3} strokeLinecap="round" strokeLinejoin="round" className={T} />)}
              {/* other owners: static stone dots */}
              {others.map((p) => <circle key={p.id} cx={p.mapX} cy={p.mapY} r={4.5} fill={night ? P.stoneDeep : P.stone} />)}
              {/* eligible parcels light up brass on a 20 ms wave: plain circles, one CSS transition */}
              {eligible.map((p, i) => (
                <g key={p.id} className={`hiw-mk${reduced ? ' hiw-mk-now' : ''}`} style={{ transitionDelay: `${markerDelay(i)}ms` }}>
                  <circle cx={p.mapX} cy={p.mapY} r={16} fill={P.honeyGlow} opacity={night ? 0.45 : 0.35} />
                  <circle cx={p.mapX + 1} cy={p.mapY + 1.5} r={8} fill={P.shadow} />
                  <circle cx={p.mapX} cy={p.mapY} r={8} fill={P.brass} />
                  <circle cx={p.mapX - 2} cy={p.mapY - 2} r={3} fill={P.brassLight} />
                </g>
              ))}
              {/* the one church: a pine ring */}
              <motion.circle cx={site.mapX} cy={site.mapY} r={26} fill="none" stroke={P.pine} strokeWidth={4} strokeLinecap="round" transform={`rotate(-90 ${site.mapX} ${site.mapY})`}
                initial={{ pathLength: 0, opacity: 0 }} animate={on ? F({ pathLength: 1, opacity: 1 }) : { pathLength: 0, opacity: 0 }} transition={tr(2.25, { duration: 0.5, ease: ease.inOut })} />
            </g>
          </motion.g>
        </g>

        {/* ---------- step 4: the letter, Spanish first, then the English version flips in ---------- */}
        <motion.g initial={{ y: 70, opacity: 0 }} animate={on ? F({ y: 0, opacity: 1 }) : { y: 70, opacity: 0 }} transition={tr(12.6, spring.settle)}>
          <Sheet lines={esLines} tab={contentLangNames.es} tabColor={P.brass} visible on={on} at={12.95} gap={0.3} F={F} tr={tr} night={night} />
          <motion.g initial={{ scaleX: 0.04, opacity: 0 }} animate={on ? F({ scaleX: 1, opacity: 1 }) : { scaleX: 0.04, opacity: 0 }}
            transition={reduced ? { duration: 0 } : fast ? { duration: 0.22, ease: ease.out, delay: 0.18 } : { scaleX: { duration: 0.55, ease: ease.inOut, delay: 14.7 }, opacity: { duration: 0.08, ease: ease.out, delay: 14.7 } }}
            style={{ originX: 0, originY: 0.5 }}>
            <Sheet lines={enLines} tab={contentLangNames.en} tabColor={P.pine} visible on={on} at={15.0} gap={0.16} F={F} tr={tr} night={night} offset={[10, -8]} rot={-1.5} />
          </motion.g>
        </motion.g>
      </svg>

      {/* ---------- progress rail (left, below the headline area) ---------- */}
      <div data-testid="hiw-rail" data-step={step} className="absolute left-5 md:left-10 lg:left-20 pointer-events-none select-none" style={{ top: '49%' }} aria-hidden>
        <div className="relative" style={{ height: 3 * 54 + 24 }}>
          <div className="absolute left-[11px] top-3 w-0.5 rounded-full bg-line" style={{ height: 3 * 54 }} />
          <motion.div className="absolute left-[11px] top-3 w-0.5 rounded-full bg-pine origin-top" style={{ height: 3 * 54 }}
            initial={false} animate={{ scaleY: ex.done ? 1 : (step - 1) / 3 }} transition={reduced ? { duration: 0 } : { duration: dur.long, ease: ease.inOut }} />
          {steps.map((i) => {
            const activeNode = step === i && !ex.done;
            const passed = step > i || ex.done;
            return (
              <div key={i} className="absolute left-0 flex items-center gap-2.5" style={{ top: (i - 1) * 54 }}>
                <motion.div className="h-6 rounded-full border flex items-center justify-center" initial={false}
                  animate={{ width: activeNode ? 64 : 24, backgroundColor: activeNode || passed ? 'var(--pine)' : 'var(--surface)', borderColor: activeNode || passed ? 'var(--pine)' : 'var(--line)' }}
                  transition={reduced ? { duration: 0 } : spring.snappy}>
                  {activeNode
                    ? <span className="text-[13px] leading-none font-semibold text-white whitespace-nowrap">{titles[i - 1].title}</span>
                    : <span className="block w-2 h-2 rounded-full" style={{ background: passed ? 'var(--paper)' : 'var(--line)' }} />}
                </motion.div>
                <motion.span className="text-[13px] leading-[18px] font-medium px-1.5 rounded-[6px] whitespace-nowrap" style={{ background: 'var(--surface)', border: '1px solid var(--line)', color: passed ? 'var(--ink)' : 'var(--ink-2)' }}
                  initial={false} animate={{ opacity: activeNode ? 0 : 1, x: activeNode ? -6 : 0 }} transition={ui}>
                  {titles[i - 1].title}
                </motion.span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- step title + one-line explanation (bottom-left, vertical word swap) ---------- */}
      <div className="absolute left-5 md:left-10 lg:left-20 bottom-6 pointer-events-none rounded-[14px] px-5 py-3.5" style={{ background: 'var(--scrim)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', width: 'min(560px, calc(100vw - 40px))' }}>
        <div className="relative" style={{ height: 'clamp(34px, 4.6vw, 58px)' }}>
          {steps.map((i) => {
            const state = step === i ? 'in' : step > i ? 'out' : 'wait';
            return (
              <motion.h3 key={i} data-testid="hiw-step" data-step={i} data-done={step > i || ex.done ? 'true' : 'false'} data-active={state === 'in' ? 'true' : 'false'}
                className="headline-md text-ink absolute left-0 top-0 whitespace-nowrap" initial={false}
                animate={state === 'in' ? { opacity: 1, y: 0 } : state === 'out' ? { opacity: 0, y: -8 } : { opacity: 0, y: 14 }} transition={ui}>
                {titles[i - 1].title}
              </motion.h3>
            );
          })}
        </div>
        <div className="relative mt-2" style={{ minHeight: 44 }}>
          {steps.map((i) => {
            const state = step === i ? 'in' : step > i ? 'out' : 'wait';
            return (
              <motion.p key={i} className="absolute left-0 top-0 text-[15px] leading-[22px] text-ink-2" style={{ textWrap: 'pretty' }} initial={false}
                animate={state === 'in' ? { opacity: 1, y: 0 } : state === 'out' ? { opacity: 0, y: -8 } : { opacity: 0, y: 10 }} transition={reduced ? { duration: 0 } : { duration: dur.medium, ease: ease.out, delay: state === 'in' ? 0.08 : 0 }}>
                {titles[i - 1].body}
              </motion.p>
            );
          })}
        </div>
      </div>

      {/* ---------- step 2: eligibility card ---------- */}
      <motion.div className="absolute pointer-events-none" style={{ left: '50%', top: '14%', width: 284 }}
        initial={{ opacity: 0, y: 14 }} animate={on ? F({ opacity: 1, y: 0 }) : { opacity: 0, y: 14 }} transition={tr(4.2, { duration: dur.long, ease: ease.out })} data-testid="hiw-card">
        <div className="rounded-[14px] border border-line px-4 pt-3 pb-3" style={{ background: 'var(--surface)' }}>
          <div className="text-[13px] leading-[18px] text-ink-2 truncate">{site.displayName}</div>
          <div className="text-[11px] leading-4 text-ink-2 mb-2">{site.city} · {t('common.sampleData')}</div>
          <ul className="flex flex-col gap-1.5">
            {cardRows.map((r, i) => (
              <motion.li key={i} className="flex items-center gap-2.5 text-[14px] leading-5 text-ink" initial={{ opacity: 0, x: -6 }} animate={on ? F({ opacity: 1, x: 0 }) : { opacity: 0, x: -6 }} transition={tr(r.at)}>
                <span className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0" style={{ background: r.check ? 'var(--pine-soft)' : 'var(--paper)', border: '1px solid var(--line)' }}>
                  {r.check ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                      <motion.path d="M2 6.4 L5 9.2 L10.2 3" fill="none" stroke="var(--pine)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
                        initial={{ pathLength: 0 }} animate={on ? F({ pathLength: 1 }) : { pathLength: 0 }} transition={tr(r.at + 0.12, { duration: 0.32, ease: ease.inOut })} />
                    </svg>
                  ) : <span className="block w-2 h-2 rounded-[2px]" style={{ background: 'var(--brass)' }} />}
                </span>
                <span className="tabular-nums">{r.label}</span>
              </motion.li>
            ))}
          </ul>
        </div>
        <motion.div className="mt-1.5 text-[11px] leading-4 text-ink-2 px-1.5 rounded-[6px] inline-block" style={{ background: 'var(--scrim)' }} initial={{ opacity: 0 }} animate={on ? F({ opacity: 1 }) : { opacity: 0 }} transition={tr(6.6)}>
          {t('hiw.card.source')}
        </motion.div>
      </motion.div>

      {/* ---------- step 3: homes counter ---------- */}
      <motion.div className="absolute pointer-events-none flex items-baseline gap-2 rounded-[8px] border border-line px-3 py-1.5" style={{ left: '61%', top: '58%', background: 'var(--surface)' }}
        initial={{ opacity: 0, y: 10 }} animate={on ? F({ opacity: 1, y: 0 }) : { opacity: 0, y: 10 }} transition={tr(10.6)} data-testid="hiw-counter">
        <span className="big-number text-pine" style={{ fontSize: 36, lineHeight: '36px' }}>
          <AnimatedNumber value={step >= 3 && on ? homes : 0} immediate={reduced} locale={lang === 'es' ? 'es-MX' : 'en-US'} />
        </span>
        <span className="text-[13px] leading-[18px] font-medium text-ink-2">{t('hiw.homes')}</span>
      </motion.div>

      {/* ---------- step 4: caption under the letter ---------- */}
      <motion.div className="absolute pointer-events-none rounded-[8px] border border-line px-3 py-2 text-[12.5px] leading-[17px] text-ink" style={{ left: `${(SHEET.x / W) * 100}%`, top: `${((SHEET.y + SHEET.h + 14) / H) * 100}%`, width: `${(SHEET.w / W) * 100}%`, background: 'var(--surface)', textWrap: 'pretty' }}
        initial={{ opacity: 0, y: 8 }} animate={on ? F({ opacity: 1, y: 0 }) : { opacity: 0, y: 8 }} transition={tr(15.2)} data-testid="hiw-caption">
        {t('hiw.caption')}
      </motion.div>
    </div>
  );
}

type Tr = (delay: number, base?: Record<string, unknown>) => Record<string, unknown>;
type Fin = <Tg extends Record<string, unknown>>(x: Tg) => Tg;

/** A small letter sheet whose lines write themselves left to right. */
function Sheet({ lines, tab, tabColor, on, at, gap, F, tr, night, offset = [0, 0], rot = 0 }: {
  lines: string[]; tab: string; tabColor: string; visible: boolean; on: boolean; at: number; gap: number; F: Fin; tr: Tr; night: boolean; offset?: [number, number]; rot?: number;
}) {
  const { x, y, w, h } = SHEET;
  return (
    <g transform={`translate(${x + offset[0]} ${y + offset[1]}) rotate(${rot} ${w / 2} ${h / 2})`}>
      <rect x={5} y={7} width={w} height={h} rx={2} fill={P.shadow} opacity={0.7} />
      <rect x={0} y={0} width={w} height={h} rx={2} fill={night ? P.wallShade : P.wall} className={T} />
      <rect x={0} y={0} width={w} height={2} fill="#FFFFFF" opacity={0.6} />
      <rect x={22} y={-14} width={70} height={22} rx={4} fill={tabColor} />
      <text x={57} y={1} textAnchor="middle" fontSize={11} fontWeight={600} fill={P.paint} style={sans}>{tab}</text>
      {/* letterhead */}
      <g transform="translate(22 26)">
        <path d="M0 16 L9 7 L18 16 V26 H0 Z" fill={P.pine} />
        <path d="M9 7 L18 16 V26 H10 Z" fill={P.pineLight} opacity={0.7} />
        <rect x={7} y={19} width={4} height={7} fill={P.wall} />
        <text x={26} y={17} fontSize={10.5} fontWeight={600} fill={P.pine} style={sans}>Habitat for Humanity</text>
        <text x={26} y={28} fontSize={8.5} fill={P.asphaltLight} style={sans}>Orange County</text>
      </g>
      <rect x={22} y={64} width={w - 44} height={1} fill={P.wallShade} />
      {lines.map((line, i) => (
        <motion.g key={i} initial={{ clipPath: 'inset(-4px 100% -4px 0%)' }} animate={on ? F({ clipPath: 'inset(-4px 0% -4px 0%)' }) : { clipPath: 'inset(-4px 100% -4px 0%)' }} transition={tr(at + i * gap, { duration: 0.42, ease: ease.out })}>
          <text x={24} y={i === 0 ? 96 : 104 + i * 26} fontSize={13} fill={P.roofDeep} style={serif}>{line}</text>
        </motion.g>
      ))}
      {/* signature rule */}
      <rect x={24} y={h - 44} width={90} height={1} fill={P.wallShade} />
      <text x={24} y={h - 30} fontSize={8.5} fill={P.asphaltLight} style={sans}>María Reyes · Habitat OC</text>
    </g>
  );
}

/** A townhome that assembles: slab slides in, walls rise from the slab, roof drops and settles, windows light. */
function TownhomeBuild({ x, y, s, t, wall, roof, night, on, fast, reduced }: { x: number; y: number; s: number; t: number; wall: string; roof: string; night: boolean; on: boolean; fast: boolean; reduced: boolean }) {
  const w = 120, h = 68, depth = 12;
  const d = (k: number) => (reduced ? 0 : when(fast, t + k));
  const quick = reduced ? { duration: 0 } : fast ? { duration: 0.18, ease: ease.out } : undefined;
  const F = <Tg extends Record<string, unknown>>(v: Tg) => fin(v, fast);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <motion.g initial={{ opacity: 0 }} animate={on ? F({ opacity: 1 }) : { opacity: 0 }} transition={quick ?? { delay: d(0), duration: 0.2 }}>
        <ContactShadow w={w + 40} h={9} x={w / 2} />
      </motion.g>
      {/* slab */}
      <motion.g initial={{ y: 18, opacity: 0 }} animate={on ? F({ y: 0, opacity: 1 }) : { y: 18, opacity: 0 }} transition={quick ?? { delay: d(0), ...spring.settle }}>
        <rect x={-6} y={-5} width={w + 12} height={5} fill={P.stoneLight} />
        <rect x={-6} y={-1.5} width={w + 12} height={1.5} fill={P.stoneDeep} opacity={0.6} />
      </motion.g>
      {/* walls grow upward from the slab */}
      <motion.g style={{ originY: 1, originX: 0.5 }} initial={{ scaleY: 0 }} animate={on ? F({ scaleY: 1 }) : { scaleY: 0 }} transition={quick ?? { delay: d(0.35), duration: 0.55, ease: ease.out }}>
        <rect x={0} y={-5 - h} width={w} height={h} fill={wall} />
        <path d={`M${w} ${-5 - h} L${w + depth} ${-5 - h - depth * 0.6} V${-5 - depth * 0.6} L${w} -5 Z`} fill={shade(wall, 0.22)} />
        <rect x={w / 2 - 1} y={-5 - h} width={2} height={h} fill={P.shadow} opacity={0.4} />
      </motion.g>
      {/* roof drops and settles */}
      <motion.g initial={{ y: -70, opacity: 0 }} animate={on ? F({ y: 0, opacity: 1 }) : { y: -70, opacity: 0 }} transition={quick ?? { delay: d(0.95), ...spring.settle }}>
        <path d={`M-4 ${-5 - h} L${w / 2} ${-5 - h - 26} L${w + 4} ${-5 - h} Z`} fill={shade(roof, -0.2)} />
        <path d={`M${w / 2} ${-5 - h - 26} L${w / 2 + depth} ${-5 - h - 26 - depth * 0.6} L${w + 4 + depth} ${-5 - h - depth * 0.6} L${w + 4} ${-5 - h} Z`} fill={roof} />
        <path d={`M-4 ${-5 - h} L${w / 2} ${-5 - h - 26} L${w + 4} ${-5 - h}`} stroke={shade(roof, 0.3)} strokeWidth={1.4} fill="none" />
        <path d={`M0 ${-5 - h} L${w / 2} ${-5 - h - 22} L${w} ${-5 - h} L${w} ${-1 - h} L0 ${-1 - h} Z`} fill={P.shadow} opacity={0.3} />
      </motion.g>
      {/* openings appear once the walls stand, then the windows light */}
      <motion.g initial={{ opacity: 0 }} animate={on ? F({ opacity: 1 }) : { opacity: 0 }} transition={quick ?? { delay: d(0.9), duration: 0.25 }}>
        <Window x={10} y={-5 - h + 10} w={16} h={18} night={night} />
        <Window x={w / 2 + 10} y={-5 - h + 10} w={16} h={18} night={night} />
        <Door x={10} y={-5 - 30} w={13} h={30} color={P.pine} night={night} mat={false} />
        <Window x={34} y={-5 - 32} w={18} h={18} night={night} />
        <Door x={w / 2 + 10} y={-5 - 30} w={13} h={30} color={P.brass} night={night} mat={false} />
        <Window x={w / 2 + 34} y={-5 - 32} w={18} h={18} night={night} />
      </motion.g>
      <motion.g initial={{ opacity: 0 }} animate={on ? F({ opacity: 1 }) : { opacity: 0 }} transition={quick ?? { delay: d(1.45), duration: 0.5 }}>
        {[10, w / 2 + 10, 34, w / 2 + 34].map((wx, i) => <rect key={i} x={wx - 3} y={i < 2 ? -5 - h + 7 : -5 - 35} width={22} height={24} rx={4} fill={P.windowLit} opacity={night ? 0.5 : 0.28} />)}
      </motion.g>
    </g>
  );
}
