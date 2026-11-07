'use client';
/**
 * Landing section 6 — "Habitat sees the whole pipeline."
 * An elevated 2:1 isometric block: a loop road around six lots, each at a pipeline stage
 * (empty lot → survey stakes → foundation → framing → roof going on → finished home with a family).
 * Explainer: the block rises into place, stage badges pop in and count up, the finished home's windows glow once.
 * Night: lamps on with pools, lit windows, work lights at the framing site, navy sky band with a moon.
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { palette as P, shade } from '@/lib/illustrationPalette';
import { ease, spring } from '@/lib/motion';
import { Person } from '@/components/illustrations/Person';
import { T } from '@/components/illustrations/primitives';
import { useSceneExplainer } from '@/components/explainer/useSceneExplainer';
import type { ExplainerPhase } from '@/components/explainer/useExplainer';
import type { SceneProps } from './types';

/* ---------- isometric helpers (true 2:1: one world unit along x or y moves 1 px across, 0.5 px down) ---------- */
const ORIGIN = { x: 940, y: 400 };
export const iso = (x: number, y: number, z = 0): [number, number] => [ORIGIN.x + (x - y), ORIGIN.y + (x + y) * 0.5 - z];
const pt = (p: [number, number]) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
const poly = (pts: [number, number, number][]) => `M${pts.map(([x, y, z]) => pt(iso(x, y, z))).join(' L')} Z`;

/** Flat quad on the ground (or at height z). */
function IsoRect({ x, y, w, d, z = 0, fill, opacity, className, stroke, strokeWidth }: { x: number; y: number; w: number; d: number; z?: number; fill: string; opacity?: number; className?: string; stroke?: string; strokeWidth?: number }) {
  return <path d={poly([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]])} fill={fill} opacity={opacity} className={className} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />;
}

/** Box with a light top, a lit left (+y) face and a shaded right (+x) face. */
function IsoBox({ x, y, z = 0, w, d, h, color, top, left, right, ao = true }: { x: number; y: number; z?: number; w: number; d: number; h: number; color: string; top?: string; left?: string; right?: string; ao?: boolean }) {
  const topC = top ?? shade(color, -0.12);
  const leftC = left ?? color;
  const rightC = right ?? shade(color, 0.22);
  return (
    <g>
      {ao && <path d={poly([[x - 2, y - 2, 0], [x + w + 4, y - 2, 0], [x + w + 4, y + d + 4, 0], [x - 2, y + d + 4, 0]])} fill={P.shadow} opacity={0.5} />}
      <path d={poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={leftC} />
      <path d={poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill={rightC} />
      <path d={poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={topC} />
    </g>
  );
}

/** Gable roof with the ridge along x. Left slope (facing +y) is lit; the back slope is shaded. */
function IsoGable({ x, y, z, w, d, rise, color = P.roof, overhang = 6, halfOpen = false }: { x: number; y: number; z: number; w: number; d: number; rise: number; color?: string; overhang?: number; halfOpen?: boolean }) {
  const x0 = x - overhang, x1 = x + w + overhang, y0 = y - overhang, y1 = y + d + overhang, ym = y + d / 2;
  return (
    <g>
      {/* gable end (+x) */}
      <path d={poly([[x + w, y, z], [x + w, y + d, z], [x + w, ym, z + rise]])} fill={shade(color, 0.3)} />
      {/* back slope */}
      <path d={poly([[x0, y0, z], [x1, y0, z], [x1, ym, z + rise], [x0, ym, z + rise]])} fill={shade(color, 0.12)} />
      {/* front slope (lit), or rafters when the roof is going on */}
      {halfOpen ? (
        <g>
          {Array.from({ length: 7 }).map((_, i) => {
            const rx = x0 + 4 + (i * (x1 - x0 - 8)) / 6;
            return <path key={i} d={`M${pt(iso(rx, y1, z))} L${pt(iso(rx, ym, z + rise))}`} stroke={P.honey} strokeWidth={2.6} strokeLinecap="round" />;
          })}
          <path d={`M${pt(iso(x0, y1 - 8, z + rise * 0.3))} L${pt(iso(x1, y1 - 8, z + rise * 0.3))}`} stroke={P.honey} strokeWidth={2.2} />
          <path d={poly([[x0, y1, z], [x0 + (x1 - x0) * 0.42, y1, z], [x0 + (x1 - x0) * 0.42, ym, z + rise], [x0, ym, z + rise]])} fill={shade(color, -0.14)} />
        </g>
      ) : (
        <path d={poly([[x0, y1, z], [x1, y1, z], [x1, ym, z + rise], [x0, ym, z + rise]])} fill={shade(color, -0.14)} />
      )}
      {/* ridge */}
      <path d={`M${pt(iso(x0, ym, z + rise))} L${pt(iso(x1, ym, z + rise))}`} stroke={shade(color, 0.35)} strokeWidth={1.5} />
    </g>
  );
}

function IsoWindow({ x, y, z, w, h, night, lit = true, face = 'left' }: { x: number; y: number; z: number; w: number; h: number; night: boolean; lit?: boolean; face?: 'left' | 'right' }) {
  const glow = night && lit;
  const pts: [number, number, number][] = face === 'left' ? [[x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h]] : [[x, y, z], [x, y + w, z], [x, y + w, z + h], [x, y, z + h]];
  const c = iso(face === 'left' ? x + w / 2 : x, face === 'left' ? y : y + w / 2, z + h / 2);
  return (
    <g>
      <ellipse cx={c[0]} cy={c[1]} rx={w * 1.3} ry={h * 0.9} fill={P.windowLit} className={T} style={{ opacity: glow ? 0.42 : 0 }} />
      <path d={poly(pts)} fill={P.wallDeep} />
      <path d={poly(pts)} fill={glow ? P.windowLit : P.window} className={T} transform={`translate(${face === 'left' ? 0.8 : -0.8} 0.4)`} />
      <path d={`M${pt(iso(face === 'left' ? x + w / 2 : x, face === 'left' ? y : y + w / 2, z))} L${pt(iso(face === 'left' ? x + w / 2 : x, face === 'left' ? y : y + w / 2, z + h))}`} stroke={P.wall} strokeWidth={0.9} />
    </g>
  );
}

function IsoTree({ x, y, scale = 1, kind = 0, sway }: { x: number; y: number; scale?: number; kind?: number; sway: boolean }) {
  const [sx, sy] = iso(x, y);
  const c = kind === 1 ? [P.jacaranda, P.jacarandaLight, P.jacarandaDeep] : [P.tree, P.treeLight, P.treeDeep];
  return (
    <g transform={`translate(${sx} ${sy}) scale(${scale})`}>
      <ellipse cx={10} cy={2} rx={22} ry={9} fill={P.shadow} />
      <g style={sway ? { animation: `ks-sway ${8 + (kind % 3)}s ease-in-out ${-(x % 5)}s infinite`, transformOrigin: '0px 0px' } : undefined}>
        <path d="M-3 0 L-2 -20 L2 -20 L3 0 Z" fill={P.trunk} />
        <path d="M0 -20 L1 0 L3 0 L2 -20 Z" fill={shade(P.trunk, 0.25)} />
        <circle cx={0} cy={-34} r={17} fill={c[0]} />
        <circle cx={-9} cy={-28} r={11} fill={c[0]} />
        <circle cx={10} cy={-29} r={10} fill={c[2]} />
        <circle cx={-5} cy={-40} r={10} fill={c[1]} />
      </g>
    </g>
  );
}

function IsoLamp({ x, y, on, index, flicker }: { x: number; y: number; on: boolean; index: number; flicker?: boolean }) {
  const [sx, sy] = iso(x, y);
  const h = 54;
  const delay = index * 80;
  return (
    <g transform={`translate(${sx} ${sy})`}>
      <ellipse cx={2} cy={1} rx={6} ry={3} fill={P.shadow} />
      <g className={T} style={{ opacity: on ? 1 : 0, transitionDelay: `${delay}ms`, animation: on && flicker ? 'ks-flicker 420ms steps(1) 1' : undefined }}>
        <ellipse cx={8} cy={4} rx={54} ry={27} fill={P.windowLit} opacity={0.34} />
        <path d={`M4 ${-h - 2} L-40 14 L56 14 L12 ${-h - 2} Z`} fill={P.windowLit} opacity={0.14} />
      </g>
      <rect x={-1.6} y={-h} width={3.2} height={h} fill={P.pine} />
      <rect x={0.2} y={-h} width={1.2} height={h} fill={P.pineLight} opacity={0.6} />
      <path d={`M0 ${-h} q0 -7 7 -7 h3`} stroke={P.pine} strokeWidth={2.4} fill="none" strokeLinecap="round" />
      <path d={`M5 ${-h - 9} h9 l-2 5 h-5 z`} fill={P.brass} />
      <rect x={6.5} y={-h - 4} width={6} height={2} rx={1} fill={on ? P.honeyGlow : P.wallDeep} className={T} style={{ transitionDelay: `${delay}ms` }} />
      <circle cx={9.5} cy={-h - 3} r={6} fill={P.windowLit} className={T} style={{ opacity: on ? 0.4 : 0, transitionDelay: `${delay}ms` }} />
    </g>
  );
}

function IsoPickup({ x, y, color, night }: { x: number; y: number; color: string; night: boolean }) {
  // long axis along x: bed at the back (low x), cab at the front
  return (
    <g>
      <path d={poly([[x - 2, y - 3, 0], [x + 44, y - 3, 0], [x + 44, y + 23, 0], [x - 2, y + 23, 0]])} fill={P.shadow} opacity={0.6} />
      {[[x + 6, y - 1], [x + 34, y - 1], [x + 6, y + 19], [x + 34, y + 19]].map(([wx, wy], i) => {
        const [cx, cy] = iso(wx, wy, 4);
        return <ellipse key={i} cx={cx} cy={cy} rx={5} ry={4.5} fill={P.roofDeep} />;
      })}
      <IsoBox x={x} y={y} z={4} w={42} d={20} h={10} color={color} ao={false} />
      <IsoBox x={x + 2} y={y + 2} z={14} w={22} d={16} h={-1} color={shade(color, 0.35)} ao={false} />
      <IsoBox x={x + 26} y={y} z={14} w={14} d={20} h={9} color={shade(color, 0.05)} ao={false} />
      <path d={poly([[x + 27, y + 20, 15], [x + 39, y + 20, 15], [x + 39, y + 20, 22], [x + 27, y + 20, 22]])} fill={night ? P.windowLitDeep : P.window} className={T} />
      <path d={poly([[x + 40, y + 1, 15], [x + 40, y + 19, 15], [x + 40, y + 19, 22], [x + 40, y + 1, 22]])} fill={night ? P.windowLitDeep : P.windowDeep} className={T} />
      {night && <ellipse cx={iso(x + 46, y + 10, 6)[0] + 18} cy={iso(x + 46, y + 10, 6)[1] + 8} rx={22} ry={9} fill={P.windowLit} opacity={0.35} className={T} />}
    </g>
  );
}

function IsoPerson({ x, y, seed, child, flip }: { x: number; y: number; seed: number; child?: boolean; flip?: boolean }) {
  const [sx, sy] = iso(x, y);
  return <Person x={sx} y={sy} seed={seed} child={child} flip={flip} scale={0.72} />;
}

/* ---------- lots ---------- */
const LOT = 120;
const ROWS = 2, COLS = 3;
const BLOCK_W = COLS * LOT, BLOCK_D = ROWS * LOT; // 360 × 240 interior
const WALK = 16, ROAD = 52, APRON = 50;

const SITES = [
  { col: 0, row: 0, label: 'Contacted', count: 14, stage: 'empty' },
  { col: 1, row: 0, label: 'Meeting set', count: 6, stage: 'survey' },
  { col: 2, row: 0, label: 'Board interested', count: 4, stage: 'foundation' },
  { col: 2, row: 1, label: 'Feasibility', count: 3, stage: 'framing' },
  { col: 1, row: 1, label: 'Agreement', count: 2, stage: 'roofing' },
  { col: 0, row: 1, label: 'Groundbreaking', count: 1, stage: 'finished' },
] as const;

const steps: { name: string; t: number }[] = [];
const idx: Record<string, number> = {};
const add = (name: string, t: number) => { steps.push({ name, t }); idx[name] = steps.length; };
add('ground', 0.0);
SITES.forEach((_, i) => add(`site${i}`, 0.18 + i * 0.09));
add('props', 0.75);
SITES.forEach((_, i) => add(`badge${i}`, 1.3 + i * 0.12));
add('glow', 3.0);
const TIMES = steps.map((s) => s.t);
const DURATION = 5000;

function useSteps(ex: { phase: ExplainerPhase; fast: boolean; key: number }, times: readonly number[], reduced: boolean) {
  const [step, setStep] = useState(0);
  const stepRef = useRef(0);
  const startRef = useRef(0);
  useEffect(() => { stepRef.current = 0; startRef.current = 0; setStep(0); }, [ex.key]);
  useEffect(() => {
    if (ex.phase === 'idle') return;
    if (!startRef.current) startRef.current = performance.now();
    const elapsed = performance.now() - startRef.current;
    const from = stepRef.current;
    const timers: number[] = [];
    // fast: the remaining steps still play in order, but all land within ~300 ms
    const per = Math.min(40, 260 / Math.max(1, times.length - from));
    for (let i = from + 1; i <= times.length; i++) {
      const delay = reduced ? 0 : ex.fast ? (i - from - 1) * per : Math.max(0, times[i - 1] * 1000 - elapsed);
      timers.push(window.setTimeout(() => { stepRef.current = i; setStep(i); }, delay));
    }
    return () => timers.forEach(clearTimeout);
  }, [ex.phase, ex.fast, ex.key, reduced, times]);
  return step;
}

/** Counts 0 → `to` with a rolling look once `run` is true. */
function RollingCount({ to, run, ms }: { to: number; run: boolean; ms: number }) {
  const [v, setV] = useState(run ? to : 0);
  useEffect(() => {
    if (!run) { setV(0); return; }
    if (ms <= 0) { setV(to); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      setV(Math.round(e * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to, ms]);
  return <tspan>{v}</tspan>;
}

export function IsoBlockScene(props: SceneProps) {
  const ex = useSceneExplainer(props, DURATION);
  const step = useSteps(ex, TIMES, props.reduced);
  const { night, reduced, active } = props;
  const fast = ex.fast;
  const on = (name: string) => step >= idx[name];
  const settle = reduced ? { duration: 0 } : fast ? { duration: 0.16, ease: ease.out } : spring.settle;
  const ambient = active && !reduced;

  const outer = { x: -APRON - ROAD - WALK, y: -APRON - ROAD - WALK, w: BLOCK_W + 2 * (APRON + ROAD + WALK), d: BLOCK_D + 2 * (APRON + ROAD + WALK) };
  const walkOut = { x: -ROAD - WALK, y: -ROAD - WALK, w: BLOCK_W + 2 * (ROAD + WALK), d: BLOCK_D + 2 * (ROAD + WALK) };
  const road = { x: -ROAD, y: -ROAD, w: BLOCK_W + 2 * ROAD, d: BLOCK_D + 2 * ROAD };
  const walkIn = { x: -WALK, y: -WALK, w: BLOCK_W + 2 * WALK, d: BLOCK_D + 2 * WALK };
  const lamps: [number, number][] = [[-ROAD - WALK - 4, -ROAD - 10], [BLOCK_W + ROAD + WALK + 4, -ROAD - 10], [-ROAD - WALK - 4, BLOCK_D + ROAD + 10], [BLOCK_W + ROAD + WALK + 4, BLOCK_D + ROAD + 10], [BLOCK_W / 2, BLOCK_D + ROAD + WALK + 4]];

  const riseTr = settle;
  const rise = (name: string) => ({ initial: { y: 24, opacity: 0 }, animate: { y: on(name) ? 0 : 24, opacity: on(name) ? 1 : 0 }, transition: riseTr });

  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="scene-svg" aria-hidden>
      <defs>
        <linearGradient id="iso-sky-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.sky} />
          <stop offset="1" stopColor={P.skyLow} />
        </linearGradient>
        <linearGradient id="iso-sky-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.nightSkyHigh} />
          <stop offset="0.8" stopColor={P.nightSkyLow} />
          <stop offset="1" stopColor={P.nightHorizon} />
        </linearGradient>
        <linearGradient id="iso-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.wallSage} />
          <stop offset="1" stopColor={P.lawn} />
        </linearGradient>
      </defs>

      {/* ---------- back: sky band + distant ground ---------- */}
      <g className="scene-layer-back">
        <rect x={-40} y={-40} width={1520} height={980} fill="url(#iso-ground)" />
        <rect x={-40} y={-40} width={1520} height={270} fill="url(#iso-sky-day)" />
        <rect x={-40} y={220} width={1520} height={30} fill={P.skyLow} opacity={0.6} />
        <g className={T} style={{ opacity: night ? 1 : 0 }}>
          <rect x={-40} y={-40} width={1520} height={270} fill="url(#iso-sky-night)" />
          <circle cx={1180} cy={92} r={30} fill={P.moon} />
          <circle cx={1193} cy={84} r={26} fill={P.nightSkyHigh} opacity={0.92} />
          {[[120, 60], [260, 120], [410, 40], [560, 150], [700, 70], [860, 130], [1010, 50], [1300, 160], [1400, 80], [980, 190]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.5 : 1} fill={P.star} opacity={0.55 + (i % 3) * 0.15} />
          ))}
        </g>
        {/* distant hills on the horizon */}
        <path d="M-40 232 Q200 185 420 220 T860 206 T1300 218 T1480 210 V270 H-40 Z" fill={P.lawnShade} className={T} style={{ opacity: night ? 0.5 : 0.8 }} />
        <path d="M-40 246 Q260 210 520 238 T1000 226 T1480 240 V290 H-40 Z" fill={P.lawnDeep} className={T} style={{ opacity: night ? 0.5 : 0.55 }} />
        {/* night dims the far ground */}
        <rect x={-40} y={240} width={1520} height={700} fill={P.nightSkyHigh} className={T} style={{ opacity: night ? 0.5 : 0 }} />
      </g>

      {/* ---------- mid: the block ---------- */}
      <g className="scene-layer-mid">
        <g key={ex.key}>
          {/* ground ring: apron, outer sidewalk, road, inner sidewalk, block lawn */}
          <motion.g {...rise('ground')}>
            <IsoRect {...outer} fill={P.lawn} />
            <IsoRect x={outer.x + 4} y={outer.y + 4} w={outer.w} d={outer.d} fill={P.shadow} opacity={0.18} />
            <IsoRect {...outer} fill={P.lawn} />
            {Array.from({ length: 9 }).map((_, i) => (
              <IsoRect key={i} x={outer.x} y={outer.y + i * (outer.d / 9)} w={outer.w} d={outer.d / 18} fill={P.lawnShade} opacity={0.35} />
            ))}
            <IsoRect {...walkOut} fill={P.sidewalk} />
            <IsoRect {...road} fill={P.asphalt} />
            <path d={poly([[road.x, road.y, 0], [road.x + road.w, road.y, 0], [road.x + road.w, road.y + road.d, 0], [road.x, road.y + road.d, 0]])} fill="none" stroke={P.curb} strokeWidth={2} />
            <IsoRect {...walkIn} fill={P.sidewalk} />
            <path d={poly([[walkIn.x, walkIn.y, 0], [walkIn.x + walkIn.w, walkIn.y, 0], [walkIn.x + walkIn.w, walkIn.y + walkIn.d, 0], [walkIn.x, walkIn.y + walkIn.d, 0]])} fill="none" stroke={P.curb} strokeWidth={2} />
            {/* sidewalk joints */}
            {Array.from({ length: 14 }).map((_, i) => {
              const t = walkIn.x + (i * walkIn.w) / 13;
              return <path key={i} d={`M${pt(iso(t, walkIn.y))} L${pt(iso(t, walkIn.y + WALK))} M${pt(iso(t, walkIn.y + walkIn.d - WALK))} L${pt(iso(t, walkIn.y + walkIn.d))}`} stroke={P.sidewalkShade} strokeWidth={1} />;
            })}
            {/* centre dashes */}
            {(() => {
              const m = ROAD / 2;
              const ring = poly([[-m, -m, 0], [BLOCK_W + m, -m, 0], [BLOCK_W + m, BLOCK_D + m, 0], [-m, BLOCK_D + m, 0]]);
              return <path d={ring} fill="none" stroke={P.paint} strokeWidth={1.4} strokeDasharray="10 12" opacity={0.75} />;
            })()}
            {/* crosswalk at the front corner */}
            {Array.from({ length: 5 }).map((_, i) => (
              <IsoRect key={i} x={BLOCK_W / 2 - 20 + i * 9} y={BLOCK_D + 2} w={4} d={ROAD - 4} fill={P.paint} opacity={0.8} />
            ))}
            <IsoRect x={0} y={0} w={BLOCK_W} d={BLOCK_D} fill={P.lawn} />
            {/* lot lines */}
            {[1, 2].map((c) => <path key={c} d={`M${pt(iso(c * LOT, 0))} L${pt(iso(c * LOT, BLOCK_D))}`} stroke={P.lawnShade} strokeWidth={1.2} />)}
            <path d={`M${pt(iso(0, LOT))} L${pt(iso(BLOCK_W, LOT))}`} stroke={P.lawnShade} strokeWidth={1.2} />
          </motion.g>

          {/* sites, painter's order: back row first (small x+y) */}
          {SITES.map((s, i) => (
            <motion.g key={s.stage} {...rise(`site${i}`)}>
              <Site site={s} night={night} ambient={ambient} fast={fast} reduced={reduced} glow={on('glow')} />
            </motion.g>
          ))}

          {/* street props: trees, pickup, lamps */}
          <motion.g {...rise('props')}>
            <IsoTree x={-ROAD - WALK - APRON * 0.5} y={BLOCK_D * 0.2} kind={0} sway={ambient} />
            <IsoTree x={BLOCK_W + ROAD + WALK + 30} y={BLOCK_D * 0.55} kind={1} scale={0.9} sway={ambient} />
            <IsoTree x={BLOCK_W * 0.25} y={-ROAD - WALK - 34} kind={1} scale={0.85} sway={ambient} />
            <IsoTree x={BLOCK_W * 0.8} y={-ROAD - WALK - 30} kind={0} scale={0.8} sway={ambient} />
            <IsoTree x={BLOCK_W * 0.15} y={BLOCK_D + ROAD + WALK + 30} kind={0} sway={ambient} />
            <IsoTree x={BLOCK_W * 0.9} y={BLOCK_D + ROAD + WALK + 36} kind={1} scale={0.95} sway={ambient} />
            <IsoPickup x={LOT * 2 + 30} y={BLOCK_D + 6} color="#5A7FA6" night={night} />
            {lamps.map(([x, y], i) => <IsoLamp key={i} x={x} y={y} on={night} index={i} flicker={i === 0} />)}
          </motion.g>
        </g>
        {/* night dims the block */}
        <rect x={-40} y={-40} width={1520} height={980} fill={P.nightSkyHigh} className={T} style={{ opacity: night ? 0.28 : 0, pointerEvents: 'none' }} />
      </g>

      {/* ---------- front: badges ---------- */}
      <g className="scene-layer-front">
        <g key={ex.key}>
          {SITES.map((s, i) => {
            const shown = on(`badge${i}`);
            const built = s.stage === 'roofing' || s.stage === 'finished' || s.stage === 'framing';
            const foot = iso(s.col * LOT + LOT / 2, s.row * LOT + LOT / 2 + (s.row === 1 ? 12 : -12), built ? (s.stage === 'framing' ? 42 : 66) : 2);
            const [ax, ay] = iso(s.col * LOT + LOT / 2, s.row * LOT + LOT / 2 + (s.row === 1 ? 12 : -12), s.row === 0 ? 150 : 112);
            const label = `${s.label} · `;
            const w = Math.round(label.length * 7.3 + String(s.count).length * 8 + 22);
            return (
              <motion.g
                key={s.stage}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: shown ? 1 : 0, scale: shown ? 1 : 0.94 }}
                transition={reduced ? { duration: 0 } : fast ? { duration: 0.16, ease: ease.out } : spring.snappy}
                style={{ transformOrigin: `${ax}px ${ay}px`, transformBox: 'view-box' }}
              >
                <line x1={ax} y1={ay} x2={foot[0]} y2={foot[1]} stroke={P.pine} strokeWidth={1.4} />
                <circle cx={foot[0]} cy={foot[1]} r={3} fill={P.pine} />
                <circle cx={foot[0]} cy={foot[1]} r={1.3} fill={P.paint} />
                <path d={`M${ax - 6} ${ay - 9} L${ax} ${ay} L${ax + 6} ${ay - 9} Z`} fill={P.pine} />
                <rect x={ax - w / 2 + 2} y={ay - 36} width={w} height={28} rx={7} fill={P.shadow} />
                <rect x={ax - w / 2} y={ay - 38} width={w} height={28} rx={7} fill={P.pine} />
                <text x={ax} y={ay - 19.5} textAnchor="middle" fontSize={13} fontWeight={600} fill={P.paint} style={{ fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>
                  {label}<RollingCount to={s.count} run={shown} ms={reduced ? 0 : fast ? 250 : 700} />
                </text>
              </motion.g>
            );
          })}
        </g>
      </g>
    </svg>
  );
}

/* ---------- one site per stage ---------- */
function Site({ site, night, ambient, fast, reduced, glow }: { site: (typeof SITES)[number]; night: boolean; ambient: boolean; fast: boolean; reduced: boolean; glow: boolean }) {
  const lx = site.col * LOT, ly = site.row * LOT;
  const front = site.row === 1; // front row faces the +y street
  // house footprint: 70 × 56, set toward the street side of the lot
  const hx = lx + 25, hy = front ? ly + 44 : ly + 20, hw = 70, hd = 56;
  const stripes = Array.from({ length: 6 }).map((_, i) => (
    <IsoRect key={i} x={lx + i * (LOT / 6)} y={ly} w={LOT / 12} d={LOT} fill={P.lawnShade} opacity={0.28} />
  ));
  const walkway = <IsoRect x={hx + hw / 2 - 5} y={front ? hy + hd : ly} w={10} d={front ? ly + LOT - (hy + hd) : hy - ly} fill={P.sidewalk} />;

  switch (site.stage) {
    case 'empty':
      return (
        <g>
          {stripes}
          <IsoRect x={lx + 8} y={ly + 8} w={LOT - 16} d={LOT - 16} fill={P.lawnShade} opacity={0.25} />
          <Bushes pts={[[lx + 14, ly + 100], [lx + 104, ly + 16], [lx + 100, ly + 100]]} />
          {/* "For partnership" sign on two posts */}
          {(() => {
            const [sx, sy] = iso(lx + 100, ly + 26);
            return (
              <g transform={`translate(${sx} ${sy})`}>
                <ellipse cx={4} cy={2} rx={30} ry={6} fill={P.shadow} />
                <rect x={-30} y={-44} width={3.5} height={44} fill={P.trunk} />
                <rect x={26} y={-44} width={3.5} height={44} fill={P.trunk} />
                <rect x={-42} y={-78} width={84} height={38} rx={2} fill={P.shadow} transform="translate(3 4)" />
                <rect x={-42} y={-78} width={84} height={38} rx={2} fill={P.wall} />
                <rect x={-42} y={-78} width={84} height={6} rx={2} fill={P.pine} />
                <text x={0} y={-57} textAnchor="middle" fontSize={11} fontWeight={600} fill={P.pine} style={{ fontFamily: 'var(--font-sans)' }}>For partnership</text>
                <text x={0} y={-45.5} textAnchor="middle" fontSize={8} fill={P.asphaltLight} style={{ fontFamily: 'var(--font-sans)' }}>Habitat for Humanity OC</text>
              </g>
            );
          })()}
        </g>
      );
    case 'survey': {
      const stakes: [number, number][] = [[hx, hy], [hx + hw, hy], [hx + hw, hy + hd], [hx, hy + hd]];
      return (
        <g>
          {stripes}
          <IsoRect x={hx - 6} y={hy - 6} w={hw + 12} d={hd + 12} fill={P.dirt} />
          <IsoRect x={hx + 10} y={hy + 8} w={30} d={20} fill={P.dirtShade} opacity={0.6} />
          {/* string lines between stakes, in brass */}
          <path d={`M${stakes.map(([x, y]) => pt(iso(x, y, 14))).join(' L')} Z`} fill="none" stroke={P.brass} strokeWidth={1.4} />
          {stakes.map(([x, y], i) => <IsoBox key={i} x={x - 1.5} y={y - 1.5} w={3} d={3} h={16} color={P.trunkLight} top={P.honey} ao={false} />)}
          {/* dirt pile + surveyor with tripod */}
          {(() => {
            const [px, py] = iso(lx + 100, ly + 100);
            return <ellipse cx={px} cy={py - 6} rx={16} ry={9} fill={P.dirtShade} />;
          })()}
          {(() => {
            const [tx, ty] = iso(lx + 16, ly + 104);
            return (
              <g transform={`translate(${tx} ${ty})`}>
                <ellipse cx={1} cy={1} rx={9} ry={3} fill={P.shadow} />
                <path d="M0 -28 L-8 0 M0 -28 L8 0 M0 -28 L0 2" stroke={P.roofDeep} strokeWidth={1.6} strokeLinecap="round" />
                <rect x={-4} y={-34} width={8} height={7} rx={1.5} fill={P.honey} />
              </g>
            );
          })()}
          <IsoPerson x={lx + 30} y={ly + 108} seed={4} />
        </g>
      );
    }
    case 'foundation':
      return (
        <g>
          {stripes}
          <IsoRect x={hx - 10} y={hy - 10} w={hw + 20} d={hd + 20} fill={P.dirt} />
          <IsoBox x={hx} y={hy} w={hw} d={hd} h={5} color={P.sidewalk} top={P.sidewalk} left={P.sidewalkShade} right={shade(P.sidewalk, 0.3)} />
          {/* anchor bolts + a stack of lumber and a mixer */}
          {[[hx + 10, hy + 4], [hx + 30, hy + 4], [hx + 50, hy + 4], [hx + 4, hy + 28], [hx + 4, hy + 48], [hx + 66, hy + 28], [hx + 66, hy + 48]].map(([x, y], i) => {
            const [cx, cy] = iso(x, y, 5);
            return <circle key={i} cx={cx} cy={cy} r={1.2} fill={P.roofDeep} />;
          })}
          <IsoBox x={lx + 8} y={ly + 92} w={40} d={10} h={8} color={P.honey} top={P.honeyGlow} />
          <IsoBox x={lx + 8} y={ly + 104} w={34} d={8} h={5} color={P.honey} top={P.honeyGlow} />
          <IsoPerson x={lx + 108} y={ly + 90} seed={2} flip />
          {walkway}
        </g>
      );
    case 'framing': {
      const studs: React.ReactNode[] = [];
      for (let i = 0; i <= 7; i++) studs.push(<IsoBox key={`l${i}`} x={hx + (i * hw) / 7 - 1} y={hy + hd - 2} w={2} d={2} h={30} color={P.honey} top={P.honeyGlow} ao={false} />);
      for (let i = 0; i <= 5; i++) studs.push(<IsoBox key={`r${i}`} x={hx + hw - 2} y={hy + (i * hd) / 5 - 1} w={2} d={2} h={30} color={P.honey} top={P.honeyGlow} ao={false} />);
      for (let i = 1; i < 7; i++) studs.push(<IsoBox key={`b${i}`} x={hx + (i * hw) / 7 - 1} y={hy} w={2} d={2} h={30} color={P.honey} top={P.honeyGlow} ao={false} />);
      for (let i = 1; i < 5; i++) studs.push(<IsoBox key={`k${i}`} x={hx} y={hy + (i * hd) / 5 - 1} w={2} d={2} h={30} color={P.honey} top={P.honeyGlow} ao={false} />);
      const [cx, cy] = iso(hx + hw + 36, hy + hd + 18);
      const [wx, wy] = iso(hx - 14, hy + hd + 10);
      return (
        <g>
          {stripes}
          <IsoRect x={hx - 10} y={hy - 10} w={hw + 20} d={hd + 20} fill={P.dirt} />
          <IsoBox x={hx} y={hy} w={hw} d={hd} h={5} color={P.sidewalk} top={P.sidewalk} left={P.sidewalkShade} right={shade(P.sidewalk, 0.3)} />
          <IsoRect x={hx} y={hy} z={5} w={hw} d={hd} fill={P.trunkLight} opacity={0.5} />
          {/* bottom plates */}
          <IsoBox x={hx} y={hy + hd - 2} z={5} w={hw} d={2} h={2} color={P.trunkLight} ao={false} />
          <IsoBox x={hx + hw - 2} y={hy} z={5} w={2} d={hd} h={2} color={P.trunkLight} ao={false} />
          <g transform="translate(0 -5)">{studs}</g>
          {/* top plates */}
          <IsoBox x={hx} y={hy + hd - 2} z={35} w={hw} d={2} h={2} color={P.trunkLight} ao={false} />
          <IsoBox x={hx + hw - 2} y={hy} z={35} w={2} d={hd} h={2} color={P.trunkLight} ao={false} />
          <IsoBox x={hx} y={hy} z={35} w={hw} d={2} h={2} color={P.trunkLight} ao={false} />
          <IsoBox x={hx} y={hy} z={35} w={2} d={hd} h={2} color={P.trunkLight} ao={false} />
          {/* work lights (night) */}
          <g transform={`translate(${wx} ${wy})`}>
            <ellipse cx={1} cy={1} rx={5} ry={2.5} fill={P.shadow} />
            <rect x={-1} y={-34} width={2} height={34} fill={P.roofDeep} />
            <rect x={-6} y={-40} width={12} height={7} rx={1.5} fill={P.roofDeep} />
            <rect x={-5} y={-39} width={10} height={5} rx={1} fill={night ? P.honeyGlow : P.wallDeep} className={T} />
            <g className={T} style={{ opacity: night ? 1 : 0 }}>
              <path d="M-5 -34 L-34 10 L44 10 L5 -34 Z" fill={P.windowLit} opacity={0.16} />
              <ellipse cx={5} cy={8} rx={40} ry={16} fill={P.windowLit} opacity={0.28} />
            </g>
          </g>
          {/* crane: mast, slewing boom (ambient), hook */}
          <g transform={`translate(${cx} ${cy})`}>
            <ellipse cx={3} cy={2} rx={14} ry={6} fill={P.shadow} />
            <rect x={-9} y={-6} width={18} height={6} fill={P.roofDeep} />
            <rect x={-3.5} y={-130} width={7} height={124} fill={P.roof} />
            <rect x={0.5} y={-130} width={3} height={124} fill={P.roofDeep} />
            {Array.from({ length: 10 }).map((_, i) => <path key={i} d={`M-3.5 ${-124 + i * 12} L3.5 ${-118 + i * 12}`} stroke={P.roofLight} strokeWidth={1} />)}
            <g style={{ transformOrigin: '0px -132px', animation: ambient && !reduced ? `ks-crane ${fast ? 9 : 9}s ease-in-out infinite alternate` : 'none' }}>
              <rect x={-56} y={-136} width={176} height={6} rx={1} fill={P.brass} />
              <rect x={-56} y={-136} width={176} height={2.5} fill={P.brassLight} />
              <rect x={-54} y={-140} width={24} height={9} fill={P.roofDeep} />
              <path d="M0 -136 L60 -152 L118 -134" stroke={P.brass} strokeWidth={1.4} fill="none" />
              <rect x={-1} y={-152} width={2} height={18} fill={P.roofDeep} />
              <line x1={84} y1={-130} x2={84} y2={-78} stroke={P.roofDeep} strokeWidth={1} />
              <path d="M84 -78 q-5 0 -5 5 q0 5 5 5 q5 0 5 -5" stroke={P.roofDeep} strokeWidth={1.6} fill="none" />
              <rect x={70} y={-70} width={28} height={8} rx={1} fill={P.honey} />
              <rect x={70} y={-70} width={28} height={3} fill={P.honeyGlow} />
            </g>
          </g>
          <IsoPerson x={lx + 14} y={ly + 36} seed={6} />
          {walkway}
        </g>
      );
    }
    case 'roofing':
      return (
        <g>
          {stripes}
          <IsoRect x={hx - 10} y={hy - 10} w={hw + 20} d={hd + 20} fill={P.dirt} />
          <IsoBox x={hx} y={hy} w={hw} d={hd} h={40} color={P.wallClay} top={P.wallClayShade} right={P.wallClayShade} />
          <IsoWindow x={hx + 10} y={hy + hd} z={16} w={12} h={14} night={night} lit={night} />
          <IsoWindow x={hx + 46} y={hy + hd} z={16} w={12} h={14} night={night} lit={night} />
          <IsoWindow x={hx + hw} y={hy + 14} z={16} w={12} h={14} night={night} lit={false} face="right" />
          <IsoGable x={hx} y={hy} z={40} w={hw} d={hd} rise={22} halfOpen />
          {/* bundles of shingles on the ground + ladder */}
          <IsoBox x={lx + 6} y={ly + 90} w={16} d={10} h={6} color={P.roof} top={P.roofLight} />
          <IsoBox x={lx + 24} y={ly + 92} w={16} d={10} h={6} color={P.roof} top={P.roofLight} />
          {(() => {
            const [ax, ay] = iso(hx + hw + 2, hy + hd + 2);
            return <path d={`M${ax + 10} ${ay} L${ax - 2} ${ay - 52} M${ax + 16} ${ay + 3} L${ax + 4} ${ay - 49} ${Array.from({ length: 6 }).map((_, i) => `M${ax + 10 - i * 2 - 2} ${ay - 8 - i * 8} L${ax + 16 - i * 2 - 2} ${ay - 5 - i * 8}`).join(' ')}`} stroke={P.honey} strokeWidth={1.6} strokeLinecap="round" />;
          })()}
          <IsoPerson x={lx + 108} y={ly + 104} seed={7} flip />
          {walkway}
        </g>
      );
    case 'finished':
      return (
        <g>
          {stripes}
          <IsoRect x={lx + 6} y={ly + 6} w={LOT - 12} d={LOT - 12} fill={P.lawnShade} opacity={0.25} />
          <IsoBox x={hx} y={hy} w={hw} d={hd} h={40} color={P.wallSage} top={P.wallSageShade} right={P.wallSageShade} />
          <IsoWindow x={hx + 8} y={hy + hd} z={18} w={14} h={14} night={night} />
          <IsoWindow x={hx + 48} y={hy + hd} z={18} w={14} h={14} night={night} />
          <IsoWindow x={hx + hw} y={hy + 10} z={18} w={14} h={14} night={night} face="right" />
          <IsoWindow x={hx + hw} y={hy + 34} z={18} w={14} h={14} night={night} face="right" />
          {/* door + porch step */}
          <path d={poly([[hx + 28, hy + hd, 0], [hx + 40, hy + hd, 0], [hx + 40, hy + hd, 22], [hx + 28, hy + hd, 22]])} fill={P.pine} transform="translate(0.6 0.3)" />
          <IsoBox x={hx + 26} y={hy + hd} w={16} d={6} h={2} color={P.stoneLight} ao={false} />
          <IsoGable x={hx} y={hy} z={40} w={hw} d={hd} rise={24} />
          {/* chimney */}
          <IsoBox x={hx + 52} y={hy + 12} z={54} w={7} d={7} h={14} color={P.wallClayShade} ao={false} />
          {/* brass glow pulses once over the windows */}
          <motion.g
            initial={{ opacity: 0, scale: 0.9 }}
            animate={glow ? { opacity: [0, 0.9, 0.45], scale: [0.9, 1.15, 1.08] } : { opacity: 0, scale: 0.9 }}
            transition={reduced ? { duration: 0 } : { duration: fast ? 0.3 : 1.3, ease: ease.out, times: [0, 0.45, 1] }}
            style={{ transformOrigin: `${iso(hx + hw / 2, hy + hd, 24)[0]}px ${iso(hx + hw / 2, hy + hd, 24)[1]}px`, transformBox: 'view-box' }}
          >
            <ellipse cx={iso(hx + 15, hy + hd, 25)[0]} cy={iso(hx + 15, hy + hd, 25)[1]} rx={18} ry={12} fill={P.honeyGlow} opacity={0.55} />
            <ellipse cx={iso(hx + 55, hy + hd, 25)[0]} cy={iso(hx + 55, hy + hd, 25)[1]} rx={18} ry={12} fill={P.honeyGlow} opacity={0.55} />
            <ellipse cx={iso(hx + hw, hy + 17, 25)[0]} cy={iso(hx + hw, hy + 17, 25)[1]} rx={16} ry={12} fill={P.honeyGlow} opacity={0.4} />
            <ellipse cx={iso(hx + hw, hy + 41, 25)[0]} cy={iso(hx + hw, hy + 41, 25)[1]} rx={16} ry={12} fill={P.honeyGlow} opacity={0.4} />
          </motion.g>
          <Bushes pts={[[hx - 4, hy + hd + 6], [hx + hw + 10, hy + hd + 4]]} />
          <IsoTree x={lx + 14} y={ly + 18} kind={1} scale={0.85} sway={ambient} />
          {walkway}
          {/* the family out front */}
          <IsoPerson x={lx + 72} y={ly + 112} seed={1} />
          <IsoPerson x={lx + 86} y={ly + 114} seed={5} flip />
          <IsoPerson x={lx + 80} y={ly + 118} seed={3} child />
        </g>
      );
  }
}

function Bushes({ pts }: { pts: [number, number][] }) {
  return (
    <g>
      {pts.map(([x, y], i) => {
        const [sx, sy] = iso(x, y);
        return (
          <g key={i} transform={`translate(${sx} ${sy})`}>
            <ellipse cx={2} cy={1} rx={9} ry={4} fill={P.shadow} />
            <circle cx={0} cy={-5} r={6} fill={P.tree} />
            <circle cx={-3} cy={-7} r={4} fill={P.treeLight} />
            <circle cx={4} cy={-4} r={3.5} fill={P.treeDeep} />
          </g>
        );
      })}
    </g>
  );
}
