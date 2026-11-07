'use client';
/**
 * Landing section "The challenge": "Every home has to hit $0."
 * A lot (lawn, curb, survey stake, tree, lamps, hills) with a cost stack standing on it like a price tag.
 * Explainer (~9 s): one bar rises → splits into Land / Design / Permits & time / Build → "What closes it" rises
 * beside it, the red hatched Gap bridges the two tops → the Keystone move: Land shrinks to partner land, Permits
 * shortens, the gap closes most of the way → four brief facts land along the bottom with Keystone's answer under each.
 * The parent puts the headline in the left ~40 %; everything busy stays in the centre/right.
 */
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { SceneProps } from './types';
import { useSceneExplainer } from '@/components/explainer/useSceneExplainer';
import { when } from '@/components/explainer/useExplainer';
import { palette as P, shade } from '@/lib/illustrationPalette';
import { Sky } from '@/components/illustrations/Sky';
import { Hills, Street } from '@/components/illustrations/Ground';
import { Tree } from '@/components/illustrations/Tree';
import { StreetLamp, LampDefs } from '@/components/illustrations/StreetLamp';
import { ContactShadow, Fence, Sprinkler, T } from '@/components/illustrations/primitives';
import { CHALLENGE_ILLUSTRATIVE as C, BRIEF, fmtMoney, type Stack } from '@/lib/gap';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useT } from '@/lib/i18n';
import { spring, ease, dur } from '@/lib/motion';

const DURATION = 9000;
const W = 1440, H = 900;
const GROUND = 600;            // the lot's front edge, where the bars stand
const K = 0.48;                // px per $1k
const BAR_W = 104, DEPTH = 10;
const A_X = 915, B_X = 1135;   // cost bar, closes bar
const SIGNAL_RED = P.shirt[3]; // #B3362B, signal red from the illustration palette

/** Gap (cost − what closes it) before and after the Keystone move, from the shared constants. */
export function challengeGapSizes() {
  const closes = C.family + C.other;
  return { start: Math.max(0, C.today.total - closes), end: Math.max(0, C.keystone.total - closes) };
}

type SegId = 'land' | 'design' | 'permits' | 'build';
type Seg = { id: SegId; value: number; h: number; bottom: number; top: number };
const ORDER: SegId[] = ['build', 'permits', 'design', 'land'];
function layout(stack: Stack): Seg[] {
  let y = GROUND;
  return ORDER.map((id) => {
    const s = stack.segments.find((x) => x.id === id)!;
    const h = (s.value / 1000) * K;
    const seg = { id, value: s.value, h, bottom: y, top: y - h };
    y -= h;
    return seg;
  });
}
const TODAY = layout(C.today);
const KEY = layout(C.keystone);
const seg = (list: Seg[], id: SegId) => list.find((s) => s.id === id)!;
const topA0 = seg(TODAY, 'land').top;                                   // top of the cost bar today
const topAMid = topA0 + (seg(TODAY, 'land').h - seg(KEY, 'land').h);     // after the land shrink only
const topA1 = seg(KEY, 'land').top;                                     // after permits shorten too
const CLOSES = C.family + C.other;
const topB = GROUND - (CLOSES / 1000) * K;
const hFamily = (C.family / 1000) * K, hOther = (C.other / 1000) * K;
const SEG_COLOR: Record<SegId, string> = { land: P.pine, design: P.stone, permits: P.brass, build: P.roof };
const BAND_X0 = A_X + BAR_W + DEPTH + 4, BAND_X1 = B_X - 4;             // the bridge between the bars
const T_LAND = 3.8, T_PERMITS = 4.5;

/** Push labels (centre y, height) upward so none overlap; the lowest stays anchored. */
function spread<I extends { y: number; h: number }>(items: I[], gap = 6): I[] {
  const out = items.map((i) => ({ ...i }));
  for (let i = out.length - 2; i >= 0; i--) {
    const below = out[i + 1];
    const maxY = below.y - below.h / 2 - gap - out[i].h / 2;
    if (out[i].y > maxY) out[i].y = maxY;
  }
  return out;
}
/** Greedy word wrap for SVG text. */
function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Step timer for the HTML stats: how many of `atMs` have fired (all at once when fast, done or reduced). */
function useLanded(atMs: number[], playing: boolean, done: boolean, fast: boolean, reduced: boolean) {
  const [n, setN] = useState(0);
  const count = atMs.length, key = atMs.join(',');
  useEffect(() => {
    if (done || fast || reduced) { setN(count); return; }
    if (!playing) { setN(0); return; }
    const timers = key.split(',').map((t, i) => setTimeout(() => setN((c) => Math.max(c, i + 1)), Number(t)));
    return () => timers.forEach(clearTimeout);
  }, [playing, done, fast, reduced, count, key]);
  return n;
}

const sans = { fontFamily: 'var(--font-sans)' } as const;
const lbl = { ...sans, fontVariantNumeric: 'tabular-nums' } as const;

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

export function ChallengeScene(props: SceneProps) {
  const ex = useSceneExplainer(props, DURATION);
  const { night, active, reduced } = props;
  const { t } = useT();
  const on = ex.phase !== 'idle';
  const fast = ex.fast;
  const F = fast ? 0.001 : 0;
  const d = (s: number) => (reduced ? 0 : when(fast, s));
  /** Transition helper: instant when reduced, short when finishing fast, otherwise `base` after `delay` s. */
  const tr = (base: Record<string, unknown>, delay = 0) => (reduced ? { duration: 0 } : fast ? { duration: 0.22, ease: ease.out, delay: Math.min(delay * 0.04, 0.15) } : { ...base, delay });
  /** Keyframe transition (no springs): the land shrink then the permits shrink, as one eased move. */
  const trk = (delay: number, duration: number, times: number[]) => (reduced ? { duration: 0 } : fast ? { duration: 0.25, ease: ease.out } : { delay, duration, ease: ease.inOut, times });
  const gap = challengeGapSizes();
  const bandH0 = topB - topA0, bandMid = topB - topAMid, bandH1 = Math.max(topB - topA1, 2);
  const landed = useLanded([6000, 6250, 6500, 6750], ex.phase === 'playing', ex.phase === 'done', fast, reduced);
  const STATS: { value: number; prefix?: string; suffix?: string; digits?: number; label: string; answer: string }[] = [
    { value: BRIEF.medianHomePrice / 1e6, prefix: '$', suffix: 'M', digits: 2, label: t('challenge.stat1'), answer: t('challenge.answer1') },
    { value: BRIEF.yearsLandToKeys, prefix: '~', suffix: ` ${t('challenge.yrs')}`, label: t('challenge.stat2'), answer: t('challenge.answer2') },
    { value: BRIEF.cities, label: t('challenge.stat3'), answer: t('challenge.answer3') },
    { value: BRIEF.familyPayShareMin * 100, suffix: `–${BRIEF.familyPayShareMax * 100}%`, label: t('challenge.stat4'), answer: t('challenge.answer4') },
  ];

  // Labels for the cost bar sit to its left; two states (today / with Keystone), crossfaded at the Keystone move.
  const nameToday: Record<SegId, string> = { land: t('gap.land'), design: t('gap.design'), permits: t('gap.permits'), build: t('gap.build') };
  const nameKey: Record<SegId, string> = { ...nameToday, land: t('challenge.partnerLand'), permits: t('challenge.byRight') };
  const noteKey: Partial<Record<SegId, string[]>> = { land: wrap(t('challenge.partnerLandNote'), 26), permits: wrap(t('challenge.byRightNote'), 26) };
  const labelsFor = (segs: Seg[], names: Record<SegId, string>, notes: Partial<Record<SegId, string[]>>) =>
    spread(segs.map((s) => ({ seg: s, y: (s.top + s.bottom) / 2, h: 26 + (notes[s.id]?.length ?? 0) * 13, lines: notes[s.id] ?? [], name: names[s.id] })));
  const L0 = labelsFor(TODAY, nameToday, {});
  const L1 = labelsFor(KEY, nameKey, noteKey);
  const familyNote = wrap(t('gap.family', { share: `${BRIEF.familyPayShareMin * 100}–${BRIEF.familyPayShareMax * 100}` }), 18);

  return (
    <div className="absolute inset-0" key={ex.key}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="scene-svg" aria-hidden>
        <LampDefs />
        <defs>
          <pattern id="chal-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill={SIGNAL_RED} opacity={0.1} />
            <rect width="2.5" height="8" fill={SIGNAL_RED} opacity={0.55} />
          </pattern>
        </defs>
        <g className="scene-layer-back">
          <Sky w={W} h={H} night={night} id="chal" />
          <Hills w={W} y={GROUND - 70} night={night} id="chal" />
          <rect x={0} y={GROUND - 64} width={W} height={70} fill={night ? P.lawnDeep : P.lawnShade} className={T} />
        </g>
        <g className="scene-layer-mid">
          {/* the lot */}
          <rect x={0} y={GROUND - 48} width={W} height={56} fill={night ? shade(P.lawn, 0.45) : P.lawn} className={T} />
          <rect x={0} y={GROUND - 48} width={W} height={4} fill={P.lawnDeep} opacity={0.35} />
          <Fence x0={40} x1={560} y={GROUND - 46} h={12} />
          <Sprinkler x={430} y={GROUND - 10} />
          <Tree x={200} y={GROUND - 4} kind="oak" scale={1.45} sway={active} seed={2} />
          {/* survey stake beside the price tag */}
          <g transform={`translate(818 ${GROUND - 2})`}>
            <ContactShadow w={10} h={3} />
            <rect x={-1.5} y={-22} width={3} height={22} fill={P.trunk} />
            <rect x={-5} y={-26} width={10} height={6} fill={P.brass} />
            <path d="M-5 -26 h5 v6 h-5 z" fill={P.brassLight} opacity={0.7} />
          </g>

          {/* ---------- cost bar A: one block, then four segments ---------- */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: on ? 1 - F : 0 }} transition={tr({ duration: dur.short }, d(0.3))}>
            <ContactShadow w={BAR_W + 60} h={12} x={A_X + BAR_W / 2 + 6} y={GROUND + 1} />
            <Plinth x={A_X} />
          </motion.g>
          <motion.g style={{ originX: 0.5, originY: 1 }} initial={{ scaleY: 0.04, opacity: 0 }} animate={on ? fin({ scaleY: 1, opacity: 1 }, fast) : { scaleY: 0.04, opacity: 0 }} transition={tr({ ...spring.settle, duration: 0.7 }, d(0.3))}>
            {TODAY.map((s) => {
              const k = seg(KEY, s.id);
              const target = { y: k.bottom - s.bottom, scaleY: k.h / s.h };
              const move = { y: tr({ ...spring.settle, duration: 0.75 }, d(T_PERMITS)), scaleY: tr({ ...spring.settle, duration: 0.75 }, d(s.id === 'land' ? T_LAND : T_PERMITS)) };
              return (
                <motion.g key={s.id} style={{ originX: 0.5, originY: 1 }} initial={{ y: 0, scaleY: 1 }} animate={on ? fin(target, fast) : { y: 0, scaleY: 1 }} transition={move}>
                  <SegBlock x={A_X} top={s.top} h={s.h} color={SEG_COLOR[s.id]} />
                </motion.g>
              );
            })}
            {/* the single block that splits */}
            <motion.g initial={{ opacity: 1 }} animate={{ opacity: on ? F : 1 }} transition={tr({ duration: 0.45, ease: ease.out }, d(1.2))}>
              <SegBlock x={A_X} top={topA0} h={GROUND - topA0} color={P.stoneLight} />
            </motion.g>
          </motion.g>

          {/* ---------- closes bar B ---------- */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: on ? 1 - F : 0 }} transition={tr({ duration: dur.short }, d(2.4))}>
            <ContactShadow w={BAR_W + 60} h={12} x={B_X + BAR_W / 2 + 6} y={GROUND + 1} />
            <Plinth x={B_X} />
          </motion.g>
          <motion.g style={{ originX: 0.5, originY: 1 }} initial={{ scaleY: 0.04, opacity: 0 }} animate={on ? fin({ scaleY: 1, opacity: 1 }, fast) : { scaleY: 0.04, opacity: 0 }} transition={tr({ ...spring.settle, duration: 0.7 }, d(2.4))}>
            <SegBlock x={B_X} top={GROUND - hFamily} h={hFamily} color={P.oceanDeep} />
            <SegBlock x={B_X} top={topB} h={hOther} color={P.wallClayShade} />
          </motion.g>

          {/* ---------- the gap: a hatched bridge from B's top up to A's top; its top edge follows A down ---------- */}
          <motion.g data-testid="challenge-gap" data-gap-start={gap.start} data-gap-end={gap.end}
            initial={{ opacity: 0 }} animate={{ opacity: on ? 1 - F : 0 }} transition={tr({ duration: 0.4, ease: ease.out }, d(2.95))}>
            <motion.g initial={{ clipPath: 'inset(0% 0% 0% 0%)' }} animate={on ? fin({ clipPath: ['inset(0% 0% 0% 0%)', `inset(${(1 - bandMid / bandH0) * 100}% 0% 0% 0%)`, `inset(${(1 - bandH1 / bandH0) * 100}% 0% 0% 0%)`] }, fast) : { clipPath: 'inset(0% 0% 0% 0%)' }} transition={trk(d(T_LAND), T_PERMITS - T_LAND + 0.75, [0, 0.5, 1])}>
              <rect x={BAND_X0} y={topA0} width={BAND_X1 - BAND_X0} height={bandH0} fill="url(#chal-hatch)" />
              <rect x={BAND_X0} y={topA0} width={BAND_X1 - BAND_X0} height={bandH0} fill="none" stroke={SIGNAL_RED} strokeWidth={1.2} strokeDasharray="5 4" opacity={0.75} />
            </motion.g>
            {/* the ledge at B's top, which never moves */}
            <line x1={A_X + BAR_W + DEPTH} y1={topB} x2={B_X} y2={topB} stroke={SIGNAL_RED} strokeWidth={1.6} />
          </motion.g>

          {/* ---------- labels ---------- */}
          {/* bar titles; the cost title rides down with the bar */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: on ? 1 - F : 0 }} transition={tr({ duration: 0.5, ease: ease.out }, d(0.45))}>
            <motion.g initial={{ y: 0 }} animate={on ? fin({ y: [0, topAMid - topA0, topA1 - topA0] }, fast) : { y: 0 }} transition={trk(d(T_LAND), T_PERMITS - T_LAND + 0.75, [0, 0.5, 1])}>
              <Backed x={A_X + 2} y={topA0 - 24} text={t('challenge.cost')} anchor="start" fontSize={14} weight={600} />
            </motion.g>
          </motion.g>
          <motion.g initial={{ opacity: 0, y: 6 }} animate={on ? fin({ opacity: 1, y: 0 }, fast) : { opacity: 0, y: 6 }} transition={tr({ duration: 0.5, ease: ease.out }, d(2.55))}>
            <Backed x={B_X + BAR_W / 2 + DEPTH / 2} y={topB - 24} text={t('challenge.closes')} anchor="middle" fontSize={14} weight={600} />
          </motion.g>

          {/* segment labels, today (fade out as the Keystone labels arrive) */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: on ? [0, 1, 1, F] : 0 }} transition={reduced ? { duration: 0 } : fast ? { duration: 0.2, times: [0, 0.3, 0.6, 1] } : { duration: T_LAND + 0.7 - 1.25, times: [0, 0.1, 0.9, 1], delay: d(1.25), ease: 'linear' }}>
            {L0.map((l, i) => (
              <motion.g key={l.seg.id} initial={{ opacity: 0, x: 6 }} animate={on ? fin({ opacity: 1, x: 0 }, fast) : { opacity: 0, x: 6 }} transition={tr({ duration: dur.medium, ease: ease.out }, d(1.3 + i * 0.08))}>
                <SegLabel x={A_X - 14} y={l.y} name={l.name} value={fmtMoney(l.seg.value)} color={SEG_COLOR[l.seg.id]} segY={(l.seg.top + l.seg.bottom) / 2} segX={A_X} />
              </motion.g>
            ))}
          </motion.g>
          {/* segment labels, with Keystone */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: on ? 1 - F : 0 }} transition={tr({ duration: 0.5, ease: ease.out }, d(T_LAND + 0.6))}>
            {L1.map((l) => (
              <SegLabel key={l.seg.id} x={A_X - 14} y={l.y} name={l.name} value={fmtMoney(l.seg.value)} color={SEG_COLOR[l.seg.id]} note={l.lines} segY={(l.seg.top + l.seg.bottom) / 2} segX={A_X} />
            ))}
          </motion.g>

          {/* closes labels, right of B */}
          <motion.g initial={{ opacity: 0, x: -6 }} animate={on ? fin({ opacity: 1, x: 0 }, fast) : { opacity: 0, x: -6 }} transition={tr({ duration: dur.medium, ease: ease.out }, d(2.75))}>
            <SegLabel x={B_X + BAR_W + DEPTH + 14} y={GROUND - hFamily / 2} name={t('challenge.family')} value={fmtMoney(C.family)} color={P.oceanDeep} note={familyNote} align="left" segY={GROUND - hFamily / 2} segX={B_X + BAR_W + DEPTH} />
            <SegLabel x={B_X + BAR_W + DEPTH + 14} y={topB + hOther / 2 - 12} name={t('gap.other')} value={fmtMoney(C.other)} color={P.wallClayShade} align="left" segY={topB + hOther / 2} segX={B_X + BAR_W + DEPTH} />
          </motion.g>

          {/* gap labels: today (inside the bridge), then with Keystone (under the thin bridge) */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: on ? [0, 1, 1, F] : 0 }} transition={reduced ? { duration: 0 } : fast ? { duration: 0.2, times: [0, 0.3, 0.6, 1] } : { duration: T_LAND + 0.3 - 3.05, times: [0, 0.25, 0.8, 1], delay: d(3.05), ease: 'linear' }}>
            <Backed x={(BAND_X0 + BAND_X1) / 2} y={(topA0 + topB) / 2} text={`${t('gap.gap')} · ${fmtMoney(gap.start)}`} anchor="middle" fontSize={14} weight={700} color={SIGNAL_RED} />
          </motion.g>
          <motion.g initial={{ opacity: 0, y: 6 }} animate={on ? fin({ opacity: 1, y: 0 }, fast) : { opacity: 0, y: 6 }} transition={tr({ duration: 0.4, ease: ease.out }, d(T_PERMITS + 0.5))}>
            <Backed x={(BAND_X0 + BAND_X1) / 2} y={topB + 22} text={`${t('gap.gap')} · ${fmtMoney(gap.end)}`} anchor="middle" fontSize={14} weight={700} color={SIGNAL_RED} />
          </motion.g>

          {/* final line under the bars */}
          <motion.g initial={{ opacity: 0, y: 8 }} animate={on ? fin({ opacity: 1, y: 0 }, fast) : { opacity: 0, y: 8 }} transition={tr({ duration: dur.long, ease: ease.out }, d(5.3))}>
            <Backed x={(A_X + B_X + BAR_W) / 2} y={GROUND + 38} text={t('challenge.final')} anchor="middle" fontSize={16} weight={600} pad={12} />
          </motion.g>
        </g>
        <g className="scene-layer-front">
          <Street w={W + 2} y={GROUND + 8} streetH={440} night={night} />
          <StreetLamp x={600} y={GROUND + 26} scale={1.15} on={night} index={0} flicker />
          <StreetLamp x={1385} y={GROUND + 26} scale={1.15} on={night} index={1} />
        </g>
      </svg>

      {/* ---------- HTML overlay: the brief's facts with Keystone's answer under each ---------- */}
      <div className="absolute left-[4%] right-[4%] bottom-[9%] pointer-events-none" aria-hidden={!on}>
        <div className="flex justify-end mb-2">
          <span className="text-[12px] text-ink-2 px-2 py-0.5 rounded-[6px]" style={{ background: 'var(--scrim)' }}>{t('gap.illustrative')} · {t('gap.source')}</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
          {STATS.map((s, i) => {
            const shown = landed > i;
            return (
              <motion.div key={i} data-testid="challenge-stat" data-landed={shown ? 'true' : 'false'}
                initial={{ opacity: 0, y: 10 }} animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }} transition={reduced ? { duration: 0 } : { duration: dur.medium, ease: ease.out }}
                className="rounded-[14px] border border-line px-4 py-3 min-h-[118px]" style={{ background: 'var(--scrim)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
                <div className="big-number text-ink" style={{ fontSize: 'clamp(28px, 3vw, 44px)' }}>
                  <AnimatedNumber value={shown ? s.value : 0} immediate={false} prefix={s.prefix} suffix={s.suffix} format={{ maximumFractionDigits: s.digits ?? 0, minimumFractionDigits: s.digits ?? 0 }} />
                </div>
                <div className="text-[13px] leading-[18px] text-ink-2 mt-1">{s.label}</div>
                <motion.div initial={{ opacity: 0, y: 4 }} animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }} transition={reduced ? { duration: 0 } : { duration: dur.medium, ease: ease.out, delay: fast ? 0.1 : 0.45 }}
                  className="text-[13px] leading-[18px] font-semibold text-pine mt-2">
                  {s.answer}
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Text on a solid backing (UI copy, so it uses the theme tokens). */
function Backed({ x, y, text, anchor = 'start', fontSize = 13, weight = 600, color, pad = 8 }: { x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end'; fontSize?: number; weight?: number; color?: string; pad?: number }) {
  const w = text.length * fontSize * 0.56 + pad * 2, h = fontSize + pad * 1.4;
  const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
  return (
    <g>
      <rect x={x0} y={y - h / 2} width={w} height={h} rx={8} fill="var(--surface)" stroke="var(--line)" />
      <text x={x} y={y + fontSize * 0.36} textAnchor={anchor} fontSize={fontSize} fontWeight={weight} fill={color ?? 'var(--ink)'} style={lbl}>{text}</text>
    </g>
  );
}

/** Segment label: swatch, "name · value", optional note lines, with a leader to the segment. */
function SegLabel({ x, y, name, value, color, note = [], align = 'right', segY, segX }: { x: number; y: number; name: string; value: string; color: string; note?: string[]; align?: 'left' | 'right'; segY: number; segX: number }) {
  const title = `${name} · ${value}`;
  const w = Math.max(title.length * 13 * 0.56 + 32, ...note.map((n) => n.length * 11 * 0.56 + 32));
  const h = 26 + note.length * 13;
  const x0 = align === 'right' ? x - w : x;
  return (
    <g>
      <line x1={x} y1={y} x2={segX} y2={segY} stroke="var(--ink-2)" strokeWidth={1} opacity={0.5} />
      <circle cx={segX} cy={segY} r={2.2} fill="var(--ink-2)" opacity={0.7} />
      <rect x={x0} y={y - h / 2} width={w} height={h} rx={8} fill="var(--surface)" stroke="var(--line)" />
      <rect x={x0 + 9} y={y - h / 2 + 8.5} width={9} height={9} rx={2} fill={color} />
      <text x={x0 + 24} y={y - h / 2 + 17.5} fontSize={13} fontWeight={600} fill="var(--ink)" style={lbl}>{title}</text>
      {note.map((n, i) => <text key={i} x={x0 + 24} y={y - h / 2 + 31 + i * 13} fontSize={11} fill="var(--ink-2)" style={sans}>{n}</text>)}
    </g>
  );
}

/** A stone slab the bar stands on. */
function Plinth({ x }: { x: number }) {
  return (
    <g>
      <path d={`M${x - 8} ${GROUND} H${x + BAR_W + 8} L${x + BAR_W + 8 + DEPTH} ${GROUND - DEPTH * 0.6} H${x - 8 + DEPTH} Z`} fill={P.stoneLight} />
      <rect x={x - 8} y={GROUND} width={BAR_W + 16} height={5} fill={P.stone} />
      <path d={`M${x + BAR_W + 8} ${GROUND} L${x + BAR_W + 8 + DEPTH} ${GROUND - DEPTH * 0.6} V${GROUND + 5 - DEPTH * 0.6} L${x + BAR_W + 8} ${GROUND + 5} Z`} fill={P.stoneDeep} />
    </g>
  );
}

/** One bar segment: lit front face, shaded right face, a light cap. Local to the segment, so it scales from its bottom. */
function SegBlock({ x, top, h, color }: { x: number; top: number; h: number; color: string }) {
  return (
    <g>
      <rect x={x} y={top} width={BAR_W} height={h} fill={color} />
      <path d={`M${x + BAR_W} ${top} L${x + BAR_W + DEPTH} ${top - DEPTH * 0.6} V${top + h - DEPTH * 0.6} L${x + BAR_W} ${top + h} Z`} fill={shade(color, 0.26)} />
      <path d={`M${x} ${top} L${x + DEPTH} ${top - DEPTH * 0.6} H${x + BAR_W + DEPTH} L${x + BAR_W} ${top} Z`} fill={shade(color, -0.18)} />
      <rect x={x} y={top + h - 2} width={BAR_W} height={2} fill={P.shadow} opacity={0.5} />
    </g>
  );
}
