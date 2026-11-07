'use client';
/**
 * Landing section "Searching vs. waiting": "Stop waiting for land. Start finding it."
 * A quiet illustrated backdrop (paper sky, distant hills, a field) with two small vignettes framing the columns:
 * a desk with a phone and a wall calendar on the left (waiting), the OC map lighting up on the right (searching).
 * Night: the waiting side sits in shadow; a warm pendant lamp lights the Keystone side.
 * The parent renders the headline top-left; this scene puts three comparison rows in the lower ~65 % of the viewport:
 * row by row (0.9 s apart) the waiting value reveals slowly (900 ms, with a tiny vignette), the Keystone value snaps
 * in (250 ms) with a one-time brass halo, then the multiplier pill pops. A summary line and the RAND context close it.
 * Every number has an "i" popover with its formula, inputs and source; "Edit assumptions" opens a side panel.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import type { SceneProps } from './types';
import { useSceneExplainer } from '@/components/explainer/useSceneExplainer';
import { when } from '@/components/explainer/useExplainer';
import { palette as P, shade } from '@/lib/illustrationPalette';
import { Sky } from '@/components/illustrations/Sky';
import { Hills } from '@/components/illustrations/Ground';
import { Tree } from '@/components/illustrations/Tree';
import { ContactShadow, T } from '@/components/illustrations/primitives';
import { COUNTY_PATH, COAST_PATH, FREEWAYS } from '@/components/map/ocGeo';
import { parcels } from '@/lib/data';
import { ELIGIBLE_OWNERS } from '@/lib/sb4';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useT } from '@/lib/i18n';
import { spring, ease, dur } from '@/lib/motion';
import { useComparison, fmtUsd, fmtNum, type Figure, type Row } from '@/lib/comparison';
import { InfoButton } from '@/components/comparison/InfoButton';
import { AssumptionsPanel } from '@/components/comparison/AssumptionsPanel';

const DURATION = 7500;
const W = 1440, H = 900, GROUND = 600;
const ROW_T = [0.5, 1.4, 2.3];                                   // row starts, seconds
const STEP_MS = [200, ...ROW_T.flatMap((s) => [s * 1000, s * 1000 + 750, s * 1000 + 1000]), 3900, 4400, 4700];
const STEP = { hdr: 0, sum: 10, rand: 11, edit: 12 } as const;    // row i: L = 1 + i*3, R = 2 + i*3, P = 3 + i*3
const MAP = { x: 1208, y: 300, k: 0.2 };                          // the 1000×1000 map frame, right vignette
const SNAP = { stiffness: 900, damping: 60, mass: 1 };            // the Keystone values snap (~250 ms)
const sorted = [...parcels].sort((a, b) => a.mapY - b.mapY);

/** Step timer for the HTML rows: how many of `atMs` have fired (all at once when fast, done or reduced). */
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

export function SearchVsWaitScene(props: SceneProps) {
  const ex = useSceneExplainer(props, DURATION);
  const { night, active, reduced } = props;
  const { t, lang } = useT();
  const locale = lang === 'es' ? 'es-US' : 'en-US';
  const cmp = useComparison();
  const [editing, setEditing] = useState(false);
  const on = ex.phase !== 'idle';
  const fast = ex.fast;
  const F = fast ? 0.001 : 0;
  const d = (s: number) => (reduced ? 0 : when(fast, s));
  const tr = (base: Record<string, unknown>, delay = 0) => (reduced ? { duration: 0 } : fast ? { duration: 0.22, ease: ease.out, delay: Math.min(delay * 0.04, 0.15) } : { ...base, delay });
  const landed = useLanded(STEP_MS, ex.phase === 'playing', ex.phase === 'done', fast, reduced);
  const shown = (i: number) => landed > i;
  const ui = (delay = 0) => (reduced ? { duration: 0 } : { duration: dur.medium, ease: ease.out, delay: fast ? 0 : delay });

  const water = night ? P.nightSkyHigh : P.ocean;
  const land = night ? P.roofDeep : P.wallSage;
  const landEdge = night ? P.asphaltLight : P.stoneLight;
  const road = night ? P.asphaltLight : P.sidewalk;

  return (
    <div className="absolute inset-0" key={ex.key}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="scene-svg" aria-hidden>
        <defs>
          <linearGradient id="svw-cone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={P.windowLit} stopOpacity="0.38" />
            <stop offset="1" stopColor={P.windowLit} stopOpacity="0.03" />
          </linearGradient>
          <clipPath id="svw-map"><rect x={1196} y={250} width={214} height={330} rx={14} /></clipPath>
        </defs>
        <g className="scene-layer-back">
          <Sky w={W} h={H} night={night} id="svw" />
          <Hills w={W} y={GROUND - 90} night={night} id="svw" />
          <rect x={0} y={GROUND - 70} width={W} height={H - GROUND + 70} fill={night ? P.lawnDeep : P.lawnShade} className={T} />
          <rect x={0} y={GROUND - 20} width={W} height={H - GROUND + 20} fill={night ? shade(P.lawn, 0.45) : P.lawn} className={T} />
          <rect x={0} y={GROUND - 20} width={W} height={3} fill={P.lawnDeep} opacity={0.35} />
          {/* night: the waiting side sits in shadow */}
          <rect x={0} y={0} width={W / 2} height={H} fill={P.nightSkyHigh} className={T} style={{ opacity: night ? 0.32 : 0 }} />
        </g>

        <g className="scene-layer-mid">
          {/* ---------- left vignette: the desk, the phone, the calendar ---------- */}
          <g transform="translate(20 300)">
            {/* a slice of office wall with the calendar */}
            <rect x={0} y={0} width={196} height={250} fill={night ? shade(P.wallWarm, 0.5) : P.wallWarm} className={T} />
            <rect x={0} y={196} width={196} height={54} fill={night ? shade(P.wallWarmShade, 0.5) : P.wallWarmShade} className={T} />
            <rect x={0} y={194} width={196} height={3} fill={shade(P.wallWarmShade, 0.25)} opacity={0.7} />
            <rect x={0} y={250} width={196} height={30} fill={night ? shade(P.dirtShade, 0.5) : P.dirtShade} className={T} />
            <rect x={0} y={250} width={196} height={6} fill={P.shadow} opacity={0.35} />
            {/* calendar */}
            <g transform="translate(118 28)">
              <rect x={2} y={3} width={56} height={62} rx={2} fill={P.shadow} opacity={0.6} />
              <rect x={0} y={0} width={56} height={62} rx={2} fill={night ? P.wallShade : P.wall} className={T} />
              <rect x={0} y={0} width={56} height={13} rx={2} fill={P.pine} />
              <rect x={0} y={9} width={56} height={4} fill={P.pine} />
              {Array.from({ length: 4 }).map((_, r) => Array.from({ length: 7 }).map((__, c) => (
                <rect key={`${r}${c}`} x={3 + c * 7.3} y={17 + r * 10.5} width={6} height={8} rx={0.8} fill={P.wallShade} opacity={r === 3 && c > 4 ? 0 : 0.6} />
              )))}
              <rect x={25} y={38} width={6} height={8} rx={0.8} fill={P.shirt[3]} opacity={0.8} />
              <circle cx={28} cy={-1} r={2} fill={P.brass} />
            </g>
            {/* desk with phone */}
            <ContactShadow w={190} h={10} x={96} y={252} opacity={0.8} />
            <rect x={18} y={176} width={7} height={76} fill={shade(P.trunk, 0.25)} />
            <rect x={168} y={176} width={7} height={76} fill={shade(P.trunk, 0.25)} />
            <rect x={25} y={176} width={143} height={60} fill={shade(P.trunk, 0.12)} />
            <path d="M8 168 H184 L198 156 H22 Z" fill={P.trunkLight} />
            <rect x={8} y={168} width={176} height={9} fill={P.trunk} />
            <path d="M184 168 L198 156 V165 L184 177 Z" fill={shade(P.trunk, 0.3)} />
            <g transform="translate(60 136)">
              <ContactShadow w={44} h={5} x={20} y={20} />
              <path d="M0 20 H36 L42 14 H6 Z" fill={P.roofLight} />
              <rect x={0} y={9} width={36} height={11} rx={1.5} fill={P.roof} />
              <rect x={5} y={11} width={26} height={8} fill={P.roofDeep} opacity={0.5} />
              {[0, 1].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={18 + c * 4.3} y={12 + r * 3} width={2.6} height={1.6} rx={0.4} fill={P.paint} opacity={0.75} />))}
              <rect x={-3} y={3} width={30} height={6} rx={3} fill={P.roofDeep} />
              <rect x={-3} y={3} width={30} height={2.4} rx={1.2} fill={P.roofLight} opacity={0.5} />
            </g>
            {/* a small stack of folders: the by-hand vetting */}
            <g transform="translate(118 150)">
              <rect x={1.5} y={2} width={46} height={18} rx={1.5} fill={P.shadow} opacity={0.5} />
              <rect x={0} y={12} width={46} height={6} fill={P.wallClayShade} />
              <rect x={0} y={6} width={46} height={6} fill={P.wallClay} />
              <rect x={0} y={0} width={46} height={6} fill={P.wallClayShade} />
              <rect x={0} y={0} width={46} height={1.2} fill={P.paint} opacity={0.5} />
            </g>
          </g>
          <ContactShadow w={220} h={12} x={118} y={582} opacity={0.7} />

          {/* ---------- right vignette: the OC map lights up ---------- */}
          <g clipPath="url(#svw-map)">
            <rect x={1196} y={250} width={214} height={330} fill={water} className={T} />
            <g transform={`translate(${MAP.x} ${MAP.y}) scale(${MAP.k})`}>
              <path d="M-300 -300 H1300 V260 L930 320 L-300 560 Z" fill={land} opacity={0.3} className={T} />
              <path d={COUNTY_PATH} fill={P.shadow} transform="translate(10 12)" opacity={0.5} />
              <path d={COUNTY_PATH} fill={land} stroke={landEdge} strokeWidth={3} className={T} />
              <path d={COAST_PATH} fill="none" stroke={night ? P.nightHorizon : P.oceanDeep} strokeWidth={6} strokeLinecap="round" className={T} />
              {FREEWAYS.filter((f) => f.major).map((f) => <path key={f.id} d={f.d} fill="none" stroke={road} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" className={T} />)}
              {/* parcels pop in north to south once Keystone's first number lands */}
              {sorted.map((p, i) => {
                const el = ELIGIBLE_OWNERS.includes(p.ownerType);
                return (
                  <motion.g key={p.id} style={{ originX: 0.5, originY: 0.5 }} initial={{ opacity: 0, scale: 0.6 }} animate={on ? { opacity: 1 - F, scale: 1 + F } : { opacity: 0, scale: 0.6 }}
                    transition={reduced ? { duration: 0 } : fast ? { duration: 0.2, delay: i * 0.004, ease: ease.out } : { ...spring.snappy, delay: d(ROW_T[0] + 0.75 + i * 0.025) }}>
                    <g transform={`translate(${p.mapX} ${p.mapY})`}>
                      {el && <circle r={22} fill={P.honeyGlow} opacity={night ? 0.45 : 0.3} />}
                      <circle cx={1.5} cy={2} r={el ? 11 : 7} fill={P.shadow} />
                      <circle r={el ? 11 : 7} fill={el ? P.brass : P.stone} />
                      <circle cx={el ? -3.5 : -2} cy={el ? -3.5 : -2} r={el ? 4 : 2.5} fill={el ? P.brassLight : P.stoneLight} />
                    </g>
                  </motion.g>
                );
              })}
            </g>
            {/* the map wakes: a dim veil lifts */}
            <motion.rect x={1196} y={250} width={214} height={330} fill={night ? P.nightSkyHigh : P.wallDeep} initial={{ opacity: 0.4 }} animate={{ opacity: on ? F : 0.4 }} transition={tr({ duration: 0.6, ease: ease.out }, d(ROW_T[0] + 0.7))} />
          </g>
          <rect x={1196} y={250} width={214} height={330} rx={14} fill="none" stroke={night ? P.asphaltLight : P.stoneLight} strokeWidth={2} className={T} />
          <ContactShadow w={230} h={14} x={1303} y={582} opacity={0.7} />
          <Tree x={1176} y={GROUND - 18} kind="palm" scale={1.05} sway={active} seed={9} />
          <Tree x={1428} y={GROUND - 12} kind="oak" scale={0.95} sway={active} seed={3} />
        </g>

        <g className="scene-layer-front">
          {/* night: a warm pendant lamp over the Keystone side */}
          <g transform="translate(1303 0)" className={T} style={{ opacity: night ? 1 : 0 }}>
            <path d="M-120 236 H120 L250 600 H-250 Z" fill="url(#svw-cone)" />
            <ellipse cx={0} cy={600} rx={250} ry={22} fill={P.windowLit} opacity={0.22} />
            <rect x={-1.5} y={0} width={3} height={196} fill={P.roofDeep} />
            <path d="M-34 236 H34 L22 196 H-22 Z" fill={P.brass} />
            <path d="M-34 236 H-10 L-16 196 H-22 Z" fill={P.brassLight} />
            <ellipse cx={0} cy={236} rx={34} ry={6} fill={P.honeyGlow} />
          </g>
        </g>
      </svg>

      {/* ---------- HTML overlay: the three comparison rows ---------- */}
      <div className="absolute inset-x-0 top-[41%] bottom-0 pointer-events-none" aria-hidden={!on}>
        <div className="mx-auto max-w-[1440px] h-full px-5 md:px-10 lg:px-20 flex flex-col justify-end pb-[88px] sm:pb-[80px]">
          <motion.div
            className="pointer-events-auto relative mx-auto w-full max-w-[920px] rounded-[20px] px-4 sm:px-8 py-2 sm:py-5"
            style={{ background: 'var(--scrim)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: shown(STEP.hdr) ? 1 : 0 }} transition={reduced ? { duration: dur.medium } : ui()}
            data-testid="cmp-table"
          >
            {/* column headers */}
            <div className="grid grid-cols-2 sm:grid-cols-[1fr_minmax(150px,auto)_1fr] gap-x-4 sm:gap-x-6 text-[13px] leading-[18px] font-semibold">
              <span className="text-ink-2 text-right sm:text-right">{t('cmp.colWaiting')}</span>
              <span className="hidden sm:block" />
              <span className="text-pine">{t('cmp.colKeystone')}</span>
            </div>

            {cmp.rows.map((row, i) => (
              <CmpRow key={row.id} row={row} index={i} t={t} locale={locale}
                left={shown(1 + i * 3)} right={shown(2 + i * 3)} pill={shown(3 + i * 3)} reduced={reduced} fast={fast} />
            ))}

            {/* summary + context */}
            <motion.p className="mt-4 sm:mt-5 text-[15px] sm:text-[17px] leading-6 text-ink font-medium text-center" style={{ textWrap: 'balance' }}
              initial={{ opacity: 0, y: 8 }} animate={shown(STEP.sum) ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }} transition={ui()}>
              {t('cmp.summary')}
            </motion.p>
            <motion.p className="hidden sm:block mt-2 text-[13px] leading-[18px] text-ink-2 text-center" style={{ textWrap: 'pretty' }}
              initial={{ opacity: 0 }} animate={shown(STEP.rand) ? { opacity: 1 } : { opacity: 0 }} transition={ui()}>
              {t('cmp.rand')} <span className="whitespace-nowrap">{t('cmp.randSource')}</span>
            </motion.p>
            <motion.div className="mt-2 flex items-center justify-center gap-x-4 gap-y-1 flex-wrap text-[13px] leading-[18px]"
              initial={{ opacity: 0 }} animate={shown(STEP.edit) ? { opacity: 1 } : { opacity: 0 }} transition={ui()}>
              <span className="hidden sm:inline text-ink-2">{t('cmp.note')}</span>
              <button type="button" onClick={() => setEditing(true)} data-testid="edit-assumptions" className="h-11 -my-2 px-1 font-medium text-pine underline-offset-4 hover:underline pressable">{t('cmp.edit')}</button>
            </motion.div>
          </motion.div>
        </div>
      </div>
      <AssumptionsPanel open={editing} onClose={() => setEditing(false)} cmp={cmp} />
    </div>
  );
}

type Tr = (k: Parameters<ReturnType<typeof useT>['t']>[0], v?: Record<string, string | number>) => string;

/** One comparison row: waiting value (slow, with a vignette), Keystone value (snaps, brass halo), multiplier pill. */
function CmpRow({ row, index, t, locale, left, right, pill, reduced, fast }: { row: Row; index: number; t: Tr; locale: string; left: boolean; right: boolean; pill: boolean; reduced: boolean; fast: boolean }) {
  const ui = reduced ? { duration: 0 } : { duration: dur.medium, ease: ease.out };
  const pillText = row.id === 'sitesInView' ? t('cmp.row1.mult', { n: fmtNum(row.multiplier.value, locale) })
    : row.id === 'timeToVet' ? t('cmp.row2.mult', { n: fmtNum(row.multiplier.value, locale) })
    : t('cmp.row3.mult', { money: fmtUsd(-row.multiplier.value, locale) });
  const title = t(row.title);
  return (
    <div data-testid="cmp-row" data-row={row.id} className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-line/80 grid grid-cols-2 sm:grid-cols-[1fr_minmax(150px,auto)_1fr] gap-x-4 sm:gap-x-6 gap-y-1 items-center">
      <motion.span className="col-span-2 sm:col-span-3 text-[12px] leading-4 font-semibold text-ink-2" initial={{ opacity: 0 }} animate={left ? { opacity: 1 } : { opacity: 0 }} transition={ui}>{title}</motion.span>

      {/* waiting */}
      <motion.div className="text-right text-ink-2 min-w-0" initial={{ opacity: 0, y: 6 }} animate={left ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }} transition={ui}>
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <Vignette id={row.id} play={left} reduced={reduced} fast={fast} />
          <Big figure={row.waiting} shown={left} locale={locale} t={t} muted />
          <InfoButton figure={row.waiting} title={`${title} · ${t('cmp.colWaiting')}`} />
        </div>
        <p className="text-[13px] leading-[18px] mt-1" style={{ textWrap: 'pretty' }}>{t(row.waiting.label)}</p>
      </motion.div>

      {/* multiplier */}
      <div className="col-span-2 sm:col-span-1 order-last sm:order-none flex justify-center py-1 sm:py-0">
        <motion.span key={pillText} data-testid="cmp-multiplier" data-value={row.multiplier.value}
          className="inline-flex items-center h-8 px-3 rounded-full border border-transparent text-[13px] sm:text-[14px] font-semibold text-pine whitespace-nowrap"
          style={{ background: 'color-mix(in srgb, var(--brass) 18%, var(--surface))' }}
          initial={{ opacity: 0, scale: 0.9 }} animate={pill ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }} transition={reduced ? { duration: 0 } : spring.snappy}>
          {pillText}
          <InfoButton figure={row.multiplier} title={`${title} · ${t(row.multiplier.label)}`} className="ml-1" />
        </motion.span>
      </div>

      {/* keystone */}
      <motion.div className="text-pine min-w-0" initial={{ opacity: 0, y: 6 }} animate={right ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }} transition={reduced ? { duration: 0 } : { duration: 0.25, ease: ease.out }}>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="relative inline-flex">
            {/* one-time brass halo: an opacity-animated element, not a filter */}
            <motion.span aria-hidden className="absolute inset-x-[-8px] inset-y-[-4px] rounded-[14px] pointer-events-none" style={{ boxShadow: '0 0 28px 10px var(--brass)' }}
              initial={{ opacity: 0 }} animate={right && !reduced ? { opacity: [0, 0.55, 0] } : { opacity: 0 }} transition={{ duration: 0.9, times: [0, 0.25, 1], ease: 'easeOut' }} />
            <Big figure={row.keystone} shown={right} locale={locale} t={t} snap testId={index === 0 ? 'cmp-eligible' : undefined} />
          </span>
          <InfoButton figure={row.keystone} title={`${title} · ${t('cmp.colKeystone')}`} />
        </div>
        <p className="text-[13px] leading-[18px] mt-1 text-ink-2" style={{ textWrap: 'pretty' }}>{t(row.keystone.label)}</p>
      </motion.div>
    </div>
  );
}

/** A large rolling number with its unit; `snap` uses the stiff spring. */
function Big({ figure, shown, locale, t, snap, muted, testId }: { figure: Figure; shown: boolean; locale: string; t: Tr; snap?: boolean; muted?: boolean; testId?: string }) {
  const value = shown ? figure.value : 0;
  const money = figure.unit === 'money';
  const unit = figure.unit === 'days' ? t('cmp.unit.days') : figure.unit === 'minutes' ? t('cmp.unit.min') : figure.unit === 'count' && figure.label === 'cmp.row1.waitingLabel' ? t('cmp.unit.perYear') : '';
  return (
    <span data-testid={testId} data-value={testId ? figure.value : undefined} className="inline-flex items-baseline gap-1.5">
      <span className={`big-number ${muted ? 'text-ink-2' : 'text-pine'}`} style={{ fontSize: 'clamp(28px, 3.6vw, 52px)' }}>
        <AnimatedNumber value={value} immediate={false} locale={locale} springConfig={snap ? SNAP : undefined}
          prefix={money ? '$' : ''} format={{ maximumFractionDigits: figure.unit === 'minutes' || figure.unit === 'days' ? 1 : 0 }} />
      </span>
      {unit && <span className="text-[13px] sm:text-[15px] font-medium">{unit}</span>}
    </span>
  );
}

/** Tiny SVG vignette beside the waiting number: a letter arrives / a calendar page flips / a price tag swings in. */
function Vignette({ id, play, reduced, fast }: { id: Row['id']; play: boolean; reduced: boolean; fast: boolean }) {
  const slow = reduced ? { duration: 0 } : fast ? { duration: 0.2, ease: ease.out } : { duration: 0.9, ease: ease.out };
  let inner: ReactNode;
  if (id === 'sitesInView') {
    inner = (
      <motion.g initial={{ x: 16, opacity: 0 }} animate={play ? { x: 0, opacity: 1 } : { x: 16, opacity: 0 }} transition={slow}>
        <rect x={2} y={7} width={24} height={16} rx={1.5} fill={P.paint} stroke={P.wallShade} />
        <path d="M2 8 L14 17 L26 8" fill="none" stroke={P.wallShade} strokeWidth={1} />
        <rect x={20} y={9} width={4} height={3} fill={P.brass} />
      </motion.g>
    );
  } else if (id === 'timeToVet') {
    inner = (
      <g>
        <rect x={4} y={6} width={20} height={20} rx={1.5} fill={P.wall} stroke={P.wallShade} />
        <rect x={4} y={6} width={20} height={5} rx={1.5} fill={P.pine} />
        {[0, 1].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={6.5 + c * 5.5} y={13.5 + r * 5} width={4} height={3.5} rx={0.6} fill={P.wallShade} opacity={0.7} />))}
        <motion.g style={{ originX: '14px', originY: '6px' }} initial={{ y: 0, rotate: 0, opacity: 1 }} animate={play ? { y: [0, -5, 9], rotate: [0, -4, 10], opacity: [1, 1, 0] } : { y: 0, rotate: 0, opacity: 1 }}
          transition={reduced ? { duration: 0 } : fast ? { duration: 0.2, ease: ease.out } : { duration: 0.9, ease: ease.inOut, times: [0, 0.4, 1] }}>
          <rect x={4} y={6} width={20} height={20} rx={1.5} fill={P.wall} stroke={P.wallShade} />
          <rect x={4} y={6} width={20} height={5} rx={1.5} fill={P.pine} />
          <rect x={12} y={15} width={4} height={3.5} rx={0.6} fill={P.shirt[3]} opacity={0.85} />
        </motion.g>
      </g>
    );
  } else {
    inner = (
      <motion.g style={{ originX: '14px', originY: '3px' }} initial={{ rotate: -14, opacity: 0 }} animate={play ? { rotate: 0, opacity: 1 } : { rotate: -14, opacity: 0 }} transition={reduced ? { duration: 0 } : fast ? { duration: 0.2, ease: ease.out } : { ...spring.settle, duration: 0.9 }}>
        <path d="M14 3 L14 8" stroke={P.roofDeep} strokeWidth={1.2} />
        <path d="M6 12 L14 7 L22 12 V25 H6 Z" fill={P.brass} />
        <path d="M6 12 L14 7 V25 H6 Z" fill={P.brassLight} opacity={0.6} />
        <circle cx={14} cy={12} r={1.6} fill={P.paint} />
        <text x={14} y={22} textAnchor="middle" fontSize={7} fontWeight={700} fill={P.paint} style={{ fontFamily: 'var(--font-sans)' }}>$</text>
      </motion.g>
    );
  }
  return <svg width={28} height={28} viewBox="0 0 28 28" className="shrink-0 hidden sm:block" aria-hidden>{inner}</svg>;
}
