'use client';
/**
 * Landing section "From luck to a system". Split scene with a soft hairline.
 * LEFT, today: a small office. A staff member waits by the desk phone while the wall calendar flips month after
 * month; at last one envelope "From the City" slides onto the desk. Slow, a little sad (~5 s).
 * RIGHT, with Keystone: the OC map snaps to life at ~2.5 s. Every parcel pops in on a 20 ms wave (brass glow for
 * faith- or college-owned, stone for the rest), then the top eight by fit get rank badges and a pine line.
 * Night: desk lamp on, the map darker. Total ~7 s, then hold.
 */
import { motion } from 'motion/react';
import type { SceneProps } from './types';
import { useSceneExplainer } from '@/components/explainer/useSceneExplainer';
import { when } from '@/components/explainer/useExplainer';
import { palette as P, shade } from '@/lib/illustrationPalette';
import { Person } from '@/components/illustrations/Person';
import { ContactShadow, T } from '@/components/illustrations/primitives';
import { COUNTY_PATH, COAST_PATH, FREEWAYS } from '@/components/map/ocGeo';
import { parcels } from '@/lib/data';
import { ELIGIBLE_OWNERS } from '@/lib/sb4';
import { useT } from '@/lib/i18n';
import { spring, ease, dur } from '@/lib/motion';

const DURATION = 7000;
const W = 1440, H = 900, SPLIT = 720;
const DESK_Y = 540, FLOOR_Y = 560;
const MAP = { x: 775, y: 150, k: 0.62 };          // the 1000×1000 map frame placed in the right column
const T_MAP = 2.5, T_RANK = 3.9;

const sorted = [...parcels].sort((a, b) => a.mapY - b.mapY);     // north → south wave
const eligible = sorted.filter((p) => ELIGIBLE_OWNERS.includes(p.ownerType));
/** Eight ranked sites: fixed picks spread across the county (illustrative, not the live fit score). */
const TOP8 = [0, 6, 11, 17, 23, 29, 35, 42].map((i) => eligible[i % eligible.length]);
const RANK_LINE = TOP8.map((p, i) => `${i ? 'L' : 'M'}${p.mapX} ${p.mapY}`).join(' ');

const sans = { fontFamily: 'var(--font-sans)' } as const;

/**
 * Motion only restarts an animation when a value changes, so a transition-only change (finishing fast) would leave
 * pending animations on their old delays. When fast, nudge every target by an invisible 0.001 so each one re-runs
 * on the short transition; keyframe arrays collapse to their final value.
 */
function fin<T extends Record<string, unknown>>(t: T, fast: boolean): T {
  if (!fast) return t;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(t)) {
    const last = Array.isArray(v) ? v[v.length - 1] : v;
    out[k] = typeof last === 'number' ? last + 0.001 : typeof last === 'string' ? last.replace(/0%\)$/, '0.001%)') : last;
  }
  return out as T;
}

export function LuckScene(props: SceneProps) {
  const ex = useSceneExplainer(props, DURATION);
  const { night, active, reduced } = props;
  const { t } = useT();
  const on = ex.phase !== 'idle';
  const fast = ex.fast;
  const F = fast ? 0.001 : 0;
  const d = (s: number) => (reduced ? 0 : when(fast, s));
  const tr = (base: Record<string, unknown>, delay = 0) => (reduced ? { duration: 0 } : fast ? { duration: 0.22, ease: ease.out, delay: Math.min(delay * 0.04, 0.15) } : { ...base, delay });
  const months = t('luck.months').split(',');
  const wall = night ? shade(P.wallWarm, 0.5) : P.wallWarm;
  const wallShade = night ? shade(P.wallWarmShade, 0.5) : P.wallWarmShade;
  const floor = night ? shade(P.dirtShade, 0.5) : P.dirtShade;
  const water = night ? P.nightSkyHigh : P.ocean;
  const land = night ? P.roofDeep : P.wallSage;
  const landEdge = night ? P.asphaltLight : P.stoneLight;
  const road = night ? P.asphaltLight : P.sidewalk;
  const coast = night ? P.nightHorizon : P.oceanDeep;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="scene-svg" aria-hidden key={ex.key}>
      <defs>
        <linearGradient id="luck-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.windowLit} stopOpacity="0.42" />
          <stop offset="1" stopColor={P.windowLit} stopOpacity="0.04" />
        </linearGradient>
        <clipPath id="luck-left"><rect x={0} y={0} width={SPLIT} height={H} /></clipPath>
        <clipPath id="luck-right"><rect x={SPLIT} y={0} width={W - SPLIT} height={H} /></clipPath>
      </defs>

      <g className="scene-layer-back">
        {/* office wall and floor */}
        <g clipPath="url(#luck-left)">
          <rect x={0} y={0} width={SPLIT} height={FLOOR_Y} fill={wall} className={T} />
          <rect x={0} y={FLOOR_Y - 84} width={SPLIT} height={84} fill={wallShade} className={T} />
          <rect x={0} y={FLOOR_Y - 86} width={SPLIT} height={3} fill={shade(P.wallWarmShade, 0.25)} opacity={0.7} />
          <rect x={0} y={FLOOR_Y} width={SPLIT} height={H - FLOOR_Y} fill={floor} className={T} />
          {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={0} y={FLOOR_Y + 36 + i * 40} width={SPLIT} height={1.4} fill={P.dirt} opacity={night ? 0.12 : 0.35} />)}
          <rect x={0} y={FLOOR_Y} width={SPLIT} height={10} fill={P.shadow} opacity={0.35} />
        </g>
        {/* map water, neighbouring land, the county */}
        <g clipPath="url(#luck-right)">
          <rect x={SPLIT} y={0} width={W - SPLIT} height={H} fill={water} className={T} />
          <g transform={`translate(${MAP.x} ${MAP.y}) scale(${MAP.k})`}>
            <path d="M-300 -300 H1300 V260 L930 320 L-300 560 Z" fill={land} opacity={0.3} className={T} />
            <path d={COUNTY_PATH} fill={P.shadow} transform="translate(8 10)" opacity={0.5} />
            <path d={COUNTY_PATH} fill={land} stroke={landEdge} strokeWidth={2} className={T} />
            <path d={COAST_PATH} fill="none" stroke={coast} strokeWidth={4} strokeLinecap="round" className={T} />
            {FREEWAYS.map((f) => <path key={f.id} d={f.d} fill="none" stroke={road} strokeWidth={f.major ? 5 : 3} strokeLinecap="round" strokeLinejoin="round" className={T} />)}
          </g>
          {/* the map "lights up" with Keystone */}
          <motion.rect x={SPLIT} y={0} width={W - SPLIT} height={H} fill={night ? P.nightSkyHigh : P.wallDeep} initial={{ opacity: 0.45 }} animate={{ opacity: on ? F : 0.45 }} transition={tr({ duration: 0.6, ease: ease.out }, d(T_MAP))} className={T} />
        </g>
      </g>

      <g className="scene-layer-mid">
        {/* ---------- left: the office ---------- */}
        <g clipPath="url(#luck-left)">
          {/* wall calendar: pages flip one by one, Jan → Jun; Jul stays */}
          <g transform="translate(470 290)">
            <rect x={-4} y={-6} width={118} height={130} rx={3} fill={P.wallDeep} opacity={0.25} transform="translate(3 4)" />
            {months.slice().reverse().map((m, ri) => {
              const i = months.length - 1 - ri;
              const flips = i < months.length - 1;
              return (
                <motion.g key={m} style={{ originX: 0.5, originY: 0 }} initial={{ y: 0, rotate: 0, opacity: 1 }}
                  animate={on && flips ? fin({ y: [0, -14, 34], rotate: [0, -3, 9], opacity: [1, 1, 0] }, fast) : { y: 0, rotate: 0, opacity: 1 }}
                  transition={reduced ? { duration: 0 } : fast ? { duration: 0.2, delay: i * 0.03, ease: ease.out } : { duration: 0.6, delay: d(0.7 + i * 0.35), ease: ease.inOut, times: [0, 0.4, 1] }}>
                  <CalendarPage month={m} night={night} />
                </motion.g>
              );
            })}
            <circle cx={55} cy={-2} r={3} fill={P.brass} />
            <circle cx={54} cy={-3} r={1.2} fill={P.brassLight} />
          </g>
          {/* wall clock */}
          <g transform="translate(640 330)">
            <circle cx={2} cy={3} r={24} fill={P.shadow} opacity={0.5} />
            <circle cx={0} cy={0} r={24} fill={P.roof} />
            <circle cx={0} cy={0} r={20} fill={P.paint} />
            {[0, 90, 180, 270].map((a) => <rect key={a} x={-1} y={-18} width={2} height={4} fill={P.roofDeep} transform={`rotate(${a})`} />)}
            <path d="M0 0 L0 -12" stroke={P.roofDeep} strokeWidth={2.2} strokeLinecap="round" transform="rotate(300)" />
            <path d="M0 0 L0 -16" stroke={P.roofDeep} strokeWidth={1.6} strokeLinecap="round" transform="rotate(60)" />
            <motion.path d="M0 0 L0 -17" stroke={P.shirt[3]} strokeWidth={1} strokeLinecap="round" initial={{ rotate: 0 }} animate={{ rotate: active && !reduced ? 360 : 0 }} transition={{ repeat: Infinity, duration: 60, ease: 'linear' }} style={{ originX: 0.5, originY: 1 }} />
            <circle cx={0} cy={0} r={1.8} fill={P.roofDeep} />
          </g>

          {/* chair + staff member (seated behind the desk) */}
          <rect x={296} y={442} width={78} height={110} rx={12} fill={P.roof} />
          <rect x={304} y={452} width={62} height={92} rx={9} fill={P.roofLight} opacity={0.55} />
          <Person x={335} y={DESK_Y + 44} scale={2.4} seed={4} />
          {/* desk */}
          <ContactShadow w={540} h={26} x={400} y={700} opacity={0.8} />
          <rect x={162} y={DESK_Y + 16} width={14} height={150} fill={shade(P.trunk, 0.25)} />
          <rect x={614} y={DESK_Y + 16} width={14} height={150} fill={shade(P.trunk, 0.25)} />
          <rect x={176} y={DESK_Y + 16} width={438} height={126} fill={shade(P.trunk, 0.12)} />
          <rect x={176} y={DESK_Y + 16} width={438} height={6} fill={P.shadow} opacity={0.5} />
          <path d={`M150 ${DESK_Y} H640 L666 ${DESK_Y - 22} H176 Z`} fill={P.trunkLight} />
          <rect x={150} y={DESK_Y} width={490} height={16} fill={P.trunk} />
          <path d={`M640 ${DESK_Y} L666 ${DESK_Y - 22} V${DESK_Y - 6} L640 ${DESK_Y + 16} Z`} fill={shade(P.trunk, 0.3)} />
          {/* desk phone */}
          <g transform="translate(486 500)">
            <ContactShadow w={74} h={9} x={32} y={34} />
            <path d="M0 34 H60 L68 24 H8 Z" fill={P.roofLight} />
            <rect x={0} y={16} width={60} height={18} rx={2} fill={P.roof} />
            <rect x={8} y={18} width={44} height={14} fill={P.roofDeep} opacity={0.5} />
            {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={30 + c * 7} y={20 + r * 4} width={4} height={2.4} rx={0.6} fill={P.paint} opacity={0.75} />))}
            <rect x={-4} y={6} width={50} height={10} rx={5} fill={P.roofDeep} />
            <rect x={-4} y={6} width={50} height={4} rx={2} fill={P.roofLight} opacity={0.5} />
            <path d="M46 20 q14 10 20 16 q-10 -2 -8 6" fill="none" stroke={P.roofDeep} strokeWidth={1.4} />
          </g>
          {/* desk lamp (on at night) */}
          <g transform="translate(222 526)">
            <path d="M-10 -58 H30 L78 0 H-62 Z" fill="url(#luck-cone)" className={T} style={{ opacity: night ? 1 : 0 }} />
            <ellipse cx={8} cy={0} rx={56} ry={10} fill={P.windowLit} className={T} style={{ opacity: night ? 0.35 : 0 }} />
            <ellipse cx={2} cy={2} rx={18} ry={5} fill={P.shadow} />
            <ellipse cx={0} cy={0} rx={16} ry={5} fill={P.roofDeep} />
            <path d="M0 -2 L12 -66" stroke={P.roofDeep} strokeWidth={4} strokeLinecap="round" />
            <path d="M-10 -58 H30 L22 -82 H-2 Z" fill={P.brass} />
            <path d="M-10 -58 H6 L2 -82 H-2 Z" fill={P.brassLight} />
            <ellipse cx={10} cy={-58} rx={20} ry={4} fill={night ? P.honeyGlow : P.wallDeep} className={T} />
          </g>
          {/* the one envelope, from the city */}
          <motion.g initial={{ x: 220, opacity: 0 }} animate={on ? fin({ x: 0, opacity: 1 }, fast) : { x: 220, opacity: 0 }} transition={tr({ duration: 0.9, ease: ease.out }, d(3.4))}>
            <g transform="translate(372 538)">
              <ContactShadow w={118} h={8} x={58} y={0} />
              <path d="M0 0 H104 L124 -22 H20 Z" fill={P.paint} />
              <path d="M0 0 H104 L124 -22 H20 Z" fill="none" stroke={P.wallShade} strokeWidth={1} />
              <path d="M20 -22 L62 -4 L124 -22" fill="none" stroke={P.wallShade} strokeWidth={1} />
              <rect x={98} y={-19} width={10} height={8} fill={P.brass} transform="skewX(-42)" />
              <text x={34} y={-6} fontSize={9} fontWeight={600} fill="var(--ink-2)" style={sans}>{t('luck.fromCity')}</text>
            </g>
          </motion.g>
          {/* night: the room dims except under the lamp */}
          <rect x={0} y={0} width={SPLIT} height={H} fill={P.nightSkyHigh} className={T} style={{ opacity: night ? 0.3 : 0, pointerEvents: 'none' }} />
          <path d="M212 468 H252 L300 526 H150 Z" fill="url(#luck-cone)" className={T} style={{ opacity: night ? 0.9 : 0 }} />
        </g>

        {/* ---------- right: the county lights up ---------- */}
        <g clipPath="url(#luck-right)">
          <g transform={`translate(${MAP.x} ${MAP.y}) scale(${MAP.k})`}>
            {sorted.map((p, i) => {
              const el = ELIGIBLE_OWNERS.includes(p.ownerType);
              return (
                <motion.g key={p.id} style={{ originX: 0.5, originY: 0.5 }} initial={{ opacity: 0, scale: 0.6 }} animate={on ? fin({ opacity: 1, scale: 1 }, fast) : { opacity: 0, scale: 0.6 }}
                  transition={reduced ? { duration: 0 } : fast ? { duration: 0.2, delay: i * 0.004, ease: ease.out } : { ...spring.snappy, delay: d(T_MAP + i * 0.02) }}>
                  <g transform={`translate(${p.mapX} ${p.mapY})`}>
                    {el && <circle r={16} fill={P.honeyGlow} opacity={night ? 0.45 : 0.35} />}
                    <circle cx={1} cy={1.5} r={el ? 8 : 5.5} fill={P.shadow} />
                    <circle r={el ? 8 : 5.5} fill={el ? P.brass : P.stone} />
                    <circle cx={el ? -2.5 : -1.6} cy={el ? -2.5 : -1.6} r={el ? 3 : 2} fill={el ? P.brassLight : P.stoneLight} />
                  </g>
                </motion.g>
              );
            })}
            {/* top eight by fit: a pine line, then rank badges */}
            <motion.path d={RANK_LINE} fill="none" stroke={P.pine} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.85}
              initial={{ pathLength: 0, opacity: 0 }} animate={on ? fin({ pathLength: 1, opacity: 0.85 }, fast) : { pathLength: 0, opacity: 0 }} transition={tr({ duration: 0.9, ease: ease.inOut }, d(T_RANK + 0.05))} />
            {TOP8.map((p, i) => (
              <motion.g key={p.id} style={{ originX: 0.5, originY: 1 }} initial={{ opacity: 0, scale: 0.8, y: 6 }} animate={on ? fin({ opacity: 1, scale: 1, y: 0 }, fast) : { opacity: 0, scale: 0.8, y: 6 }}
                transition={reduced ? { duration: 0 } : fast ? { duration: 0.2, delay: 0.1 + i * 0.02, ease: ease.out } : { ...spring.snappy, delay: d(T_RANK + i * 0.06) }}>
                <g transform={`translate(${p.mapX} ${p.mapY - 22})`}>
                  <circle cx={1.5} cy={2} r={15} fill={P.shadow} />
                  <circle r={15} fill={P.pine} stroke={P.paint} strokeWidth={2.5} />
                  <text y={5.5} textAnchor="middle" fontSize={16} fontWeight={700} fill={P.paint} style={{ ...sans, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</text>
                </g>
              </motion.g>
            ))}
          </g>
        </g>
      </g>

      <g className="scene-layer-front">
        {/* the hairline between today and Keystone */}
        <line x1={SPLIT} y1={40} x2={SPLIT} y2={H - 40} stroke="var(--line)" strokeWidth={1.5} />
        {/* captions on solid backings */}
        <motion.g initial={{ opacity: 0, y: 8 }} animate={on ? fin({ opacity: 1, y: 0 }, fast) : { opacity: 0, y: 8 }} transition={tr({ duration: dur.medium, ease: ease.out }, d(4.3))}>
          <Card x={120} y={744} kicker={t('luck.today')} text={t('luck.wait')} />
        </motion.g>
        <motion.g initial={{ opacity: 0, y: 8 }} animate={on ? fin({ opacity: 1, y: 0 }, fast) : { opacity: 0, y: 8 }} transition={tr({ duration: dur.medium, ease: ease.out }, d(4.8))}>
          <Card x={790} y={744} kicker={t('luck.withKeystone')} text={t('luck.search')} legend={[[P.brass, t('luck.legendEligible')], [P.stone, t('luck.legendOther')]]} />
        </motion.g>
      </g>
    </svg>
  );
}

/** One calendar page: header band with the month, a grid of days. */
function CalendarPage({ month, night }: { month: string; night: boolean }) {
  return (
    <g>
      <rect x={0} y={0} width={110} height={120} rx={3} fill={night ? P.wallShade : P.wall} className={T} />
      <rect x={0} y={0} width={110} height={24} rx={3} fill={P.pine} />
      <rect x={0} y={18} width={110} height={6} fill={P.pine} />
      <text x={55} y={16.5} textAnchor="middle" fontSize={12} fontWeight={700} fill={P.paint} style={sans}>{month}</text>
      {Array.from({ length: 5 }).map((_, r) => Array.from({ length: 7 }).map((__, c) => (
        <rect key={`${r}${c}`} x={6 + c * 14.3} y={31 + r * 17} width={12} height={14} rx={1} fill={P.wallShade} opacity={r === 4 && c > 3 ? 0 : 0.55} />
      )))}
      <rect x={0} y={118} width={110} height={2} fill={P.shadow} opacity={0.4} />
    </g>
  );
}

/** Caption on a solid backing: small kicker, main line, optional legend row. */
function Card({ x, y, kicker, text, legend }: { x: number; y: number; kicker: string; text: string; legend?: [string, string][] }) {
  const w = Math.max(text.length * 15 * 0.55, kicker.length * 12 * 0.6, legend ? legend.reduce((a, [, l]) => a + l.length * 12 * 0.56 + 34, 0) : 0) + 32;
  const h = legend ? 92 : 68;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={14} fill="var(--surface)" stroke="var(--line)" />
      <text x={x + 16} y={y + 24} fontSize={12} fontWeight={600} fill="var(--ink-2)" style={sans}>{kicker}</text>
      <text x={x + 16} y={y + 48} fontSize={15} fontWeight={600} fill="var(--ink)" style={sans}>{text}</text>
      {legend && legend.map(([c, l], i) => {
        const lx = x + 16 + legend.slice(0, i).reduce((a, [, p]) => a + p.length * 12 * 0.56 + 34, 0);
        return (
          <g key={l}>
            <circle cx={lx + 5} cy={y + 71} r={5} fill={c} />
            <text x={lx + 16} y={y + 75} fontSize={12} fill="var(--ink-2)" style={sans}>{l}</text>
          </g>
        );
      })}
    </g>
  );
}
