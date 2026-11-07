'use client';
/**
 * Landing section 5 — "Ask any congregation, in their language."
 * A warm study: a letter writes itself in English, a Spanish sheet is laid on top, then a Vietnamese
 * one, and a fountain pen signs it in brass ink. Night: moon in the window, the desk lamp pools light.
 * Layers: back (wall, window, photo, bookshelf) · mid (desk, lamp, mug, plant, pen holder) · front (sheets, pen).
 */
import { useEffect, useRef, useState } from 'react';
import { motion, type Transition } from 'motion/react';
import { palette as P, shade, seeded } from '@/lib/illustrationPalette';
import { ease, spring } from '@/lib/motion';
import { Tree } from '@/components/illustrations/Tree';
import { T } from '@/components/illustrations/primitives';
import { useSceneExplainer } from '@/components/explainer/useSceneExplainer';
import type { ExplainerPhase } from '@/components/explainer/useExplainer';
import type { SceneProps } from './types';

/* ---------- timeline (seconds from the start of the explainer) ---------- */
const LETTERS = {
  en: {
    tab: 'English',
    lines: [
      'Dear Pastor Alvarez,',
      'A 2024 California law, SB 4, lets your',
      'congregation build affordable homes on',
      'its own land, by right.',
      'Your lot on Harbor Blvd could hold about',
      '18 Habitat homes and keep the parking',
      'your families use on Sundays.',
      'May we walk the site together?',
      'With gratitude,',
    ],
  },
  es: {
    tab: 'Español',
    lines: [
      'Estimado Pastor Alvarez,',
      'Una ley de California de 2024, la SB 4,',
      'permite a su congregación construir',
      'viviendas asequibles en su propio terreno.',
      'Su lote en Harbor Blvd podría albergar',
      'unas 18 casas de Habitat y conservar el',
      'estacionamiento que usan los domingos.',
      '¿Podríamos recorrer el sitio juntos?',
      'Con gratitud,',
    ],
  },
  vi: {
    tab: 'Tiếng Việt',
    lines: [
      'Kính gửi Mục sư Alvarez,',
      'Luật SB 4 của California (2024) cho phép',
      'hội thánh xây nhà ở giá phải chăng ngay',
      'trên đất của mình.',
      'Khu đất trên Harbor Blvd có thể chứa',
      'khoảng 18 căn nhà Habitat và vẫn giữ',
      'bãi đậu xe quý vị dùng vào Chủ nhật.',
      'Chúng ta có thể cùng đi xem khu đất?',
      'Trân trọng,',
    ],
  },
} as const;

type Steps = { name: string; t: number }[];
const steps: Steps = [];
const idx: Record<string, number> = {};
const add = (name: string, t: number) => { steps.push({ name, t }); idx[name] = steps.length; };
LETTERS.en.lines.forEach((_, i) => add(`en${i}`, 0.05 + i * 0.09));
add('es', 1.7);
LETTERS.es.lines.forEach((_, i) => add(`es${i}`, 2.25 + i * 0.06));
add('vi', 3.4);
LETTERS.vi.lines.forEach((_, i) => add(`vi${i}`, 3.95 + i * 0.06));
add('pen', 4.7);
add('sign', 5.05);
add('rest', 6.15);
const TIMES = steps.map((s) => s.t);
const DURATION = 6500;

/** Advances through TIMES while the explainer plays; when `fast`, remaining steps fire 40 ms apart. */
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

/* ---------- geometry ---------- */
const SHEET_W = 440, SHEET_H = 470;
const SHEET_X = 660, SHEET_Y = 476;
const DESK_Y = 450;
const LAMP = { x: 1350, y: DESK_Y + 66 };
const SHADE = { x: LAMP.x - 120, y: LAMP.y - 232 };
const SIG = 'M46 372 c8 -30 26 -36 24 -10 c-2 20 -10 28 -16 20 c-4 -10 14 -28 32 -22 c16 6 2 26 28 20 c22 -6 28 -26 48 -16 c8 6 -4 18 14 12 c14 -4 22 -10 34 -8';
const SIG_PTS = [[46, 372], [66, 344], [70, 368], [56, 384], [88, 362], [116, 382], [148, 370], [182, 356], [196, 370], [224, 366]];

export function DeskScene(props: SceneProps) {
  const ex = useSceneExplainer(props, DURATION);
  const step = useSteps(ex, TIMES, props.reduced);
  const { night, reduced, active } = props;
  const fast = ex.fast;
  const on = (name: string) => step >= idx[name];
  const D = (s: number) => (reduced ? 0 : fast ? Math.min(s, 0.16) : s);
  const settle = reduced ? { duration: 0 } : fast ? { duration: 0.16, ease: ease.out } : spring.settle;
  const ambient = active && !reduced;

  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" className="scene-svg" aria-hidden>
      <defs>
        <linearGradient id="desk-sky-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.sky} />
          <stop offset="1" stopColor={P.skyLow} />
        </linearGradient>
        <linearGradient id="desk-sky-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.nightSkyHigh} />
          <stop offset="1" stopColor={P.nightSkyLow} />
        </linearGradient>
        <linearGradient id="desk-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.windowLit} stopOpacity="0.34" />
          <stop offset="1" stopColor={P.windowLit} stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="desk-wallshade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.shadow} />
          <stop offset="1" stopColor={P.shadow} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="desk-night" gradientUnits="userSpaceOnUse" cx={SHADE.x - 200} cy={DESK_Y + 200} r={600}>
          <stop offset="0" stopColor={P.nightSkyHigh} stopOpacity="0.06" />
          <stop offset="0.5" stopColor={P.nightSkyHigh} stopOpacity="0.34" />
          <stop offset="1" stopColor={P.nightSkyHigh} stopOpacity="0.66" />
        </radialGradient>
        <pattern id="desk-paper" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.7" fill={P.wallShade} opacity="0.35" />
          <circle cx="4.5" cy="4" r="0.5" fill={P.wallShade} opacity="0.25" />
        </pattern>
        <clipPath id="desk-window-clip"><rect x={1014} y={74} width={292} height={300} rx={2} /></clipPath>
      </defs>

      {/* ---------- back: wall, window, photo, bookshelf ---------- */}
      <g className="scene-layer-back">
        <rect x={-40} y={-40} width={1520} height={DESK_Y + 60} fill={P.wallWarm} />
        {/* wainscot + chair rail */}
        <rect x={-40} y={DESK_Y - 80} width={1520} height={100} fill={P.wallWarmShade} />
        <rect x={-40} y={DESK_Y - 84} width={1520} height={5} fill={P.wall} />
        <rect x={-40} y={DESK_Y - 79} width={1520} height={3} fill={P.shadow} opacity={0.35} />
        {Array.from({ length: 26 }).map((_, i) => (
          <rect key={i} x={-40 + i * 60} y={DESK_Y - 74} width={1.5} height={90} fill={P.shadow} opacity={0.18} />
        ))}

        <Bookshelf x={140} y={100} />
        <FramedPhoto x={616} y={176} />

        {/* window */}
        <g transform="translate(-190 0)">
          <rect x={994} y={54} width={332} height={352} rx={4} fill={P.shadow} opacity={0.25} transform="translate(5 6)" />
          <rect x={994} y={54} width={332} height={352} rx={3} fill={P.wall} />
          <rect x={994} y={54} width={332} height={352} rx={3} fill="none" stroke={P.wallShade} strokeWidth={1.5} />
          <g clipPath="url(#desk-window-clip)">
            <rect x={1014} y={74} width={292} height={300} fill="url(#desk-sky-day)" />
            <rect x={1014} y={74} width={292} height={300} fill="url(#desk-sky-night)" className={T} style={{ opacity: night ? 1 : 0 }} />
            <g className={T} style={{ opacity: night ? 1 : 0 }}>
              <circle cx={1252} cy={132} r={22} fill={P.moon} />
              <circle cx={1262} cy={126} r={19} fill={P.nightSkyHigh} opacity={0.92} />
              {[[1040, 100], [1090, 140], [1140, 96], [1200, 170], [1290, 200], [1070, 210], [1180, 118]].map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.4 : 1} fill={P.star} opacity={0.7} />
              ))}
            </g>
            {/* far hill + lawn */}
            <path d="M1014 330 Q1100 290 1180 312 T1306 300 V374 H1014 Z" fill={P.lawnShade} className={T} style={{ opacity: night ? 0.45 : 1 }} />
            <rect x={1014} y={330} width={292} height={44} fill={P.lawn} className={T} style={{ opacity: night ? 0.4 : 1 }} />
            <Tree x={1125} y={356} kind="oak" scale={2.6} sway={ambient} seed={3} />
            <Tree x={1280} y={366} kind="cypress" scale={1.4} sway={ambient} seed={5} />
          </g>
          {/* mullions */}
          <rect x={1156} y={74} width={8} height={300} fill={P.wall} />
          <rect x={1014} y={218} width={292} height={8} fill={P.wall} />
          <rect x={1156} y={74} width={2} height={300} fill={P.wallShade} opacity={0.6} />
          <rect x={1014} y={224} width={292} height={2} fill={P.wallShade} opacity={0.6} />
          {/* inner frame shadow + sill */}
          <rect x={1014} y={74} width={292} height={6} fill={P.shadow} opacity={0.3} />
          <rect x={1014} y={74} width={6} height={300} fill={P.shadow} opacity={0.2} />
          <rect x={984} y={398} width={352} height={14} rx={2} fill={P.wall} />
          <rect x={984} y={412} width={352} height={5} fill={P.wallShade} />
          <rect x={990} y={417} width={340} height={8} fill="url(#desk-wallshade)" opacity={0.6} />
        </g>
      </g>

      {/* ---------- mid: desk, lamp, mug, plant, pen holder ---------- */}
      <g className="scene-layer-mid">
        {/* desk top */}
        <rect x={-40} y={DESK_Y} width={1520} height={500} fill={P.wallClayShade} />
        {Array.from({ length: 11 }).map((_, i) => (
          <path key={i} d={`M-40 ${DESK_Y + 30 + i * 44} q360 ${i % 2 ? 8 : -6} 760 0 t760 ${i % 2 ? -4 : 6}`} stroke={shade(P.wallClayShade, 0.1)} strokeWidth={i % 3 === 0 ? 2 : 1.2} fill="none" opacity={0.55} />
        ))}
        <rect x={-40} y={DESK_Y} width={1520} height={3} fill={P.wallClay} />
        <rect x={-40} y={DESK_Y + 3} width={1520} height={22} fill="url(#desk-wallshade)" opacity={0.8} />

        {/* lamp pool (night) */}
        <g className={T} style={{ opacity: night ? 1 : 0 }}>
          <path d={`M${SHADE.x - 52} ${SHADE.y + 34} L${SHADE.x + 52} ${SHADE.y + 34} L${SHADE.x + 140} ${DESK_Y + 260} L${SHADE.x - 440} ${DESK_Y + 260} Z`} fill="url(#desk-cone)" />
          <ellipse cx={SHADE.x - 150} cy={DESK_Y + 215} rx={340} ry={95} fill={P.windowLit} opacity={0.22} />
        </g>

        <Plant x={600} y={DESK_Y + 54} />
        <DeskLamp x={LAMP.x} y={LAMP.y} night={night} />
        <PenHolder x={1250} y={DESK_Y + 136} />
        <Mug x={1172} y={DESK_Y + 215} steam={ambient} />
      </g>

      {/* ---------- front: sheets + pen ---------- */}
      <g className="scene-layer-front">
        <g key={ex.key}>
          <Sheet lang="en" offset={[-30, -22]} rot={-5} visible on={on} D={D} reduced={reduced} fast={fast} />
          <Sheet lang="es" offset={[-15, -11]} rot={-2} visible={on('es')} on={on} D={D} reduced={reduced} fast={fast} />
          <Sheet lang="vi" offset={[0, 0]} rot={1.5} visible={on('vi')} on={on} D={D} reduced={reduced} fast={fast}>
            <motion.path
              d={SIG}
              fill="none"
              stroke={P.brass}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: on('sign') ? 1 : 0, opacity: on('sign') ? 1 : 0 }}
              transition={{ pathLength: { duration: D(1.0), ease: ease.inOut }, opacity: { duration: 0.01 } }}
            />
          </Sheet>
          {/* pen lives in the top sheet's coordinate frame so it can trace the signature */}
          <g transform={`translate(${SHEET_X} ${SHEET_Y}) rotate(1.5 ${SHEET_W / 2} ${SHEET_H / 2})`}>
            <Pen on={on} D={D} settle={settle} />
          </g>
        </g>
        {/* night: ambient drops everywhere except under the lamp */}
        <rect x={-40} y={-40} width={1520} height={980} fill="url(#desk-night)" className={T} style={{ opacity: night ? 1 : 0 }} />
      </g>
    </svg>
  );
}

/* ---------- parts ---------- */

type OnFn = (n: string) => boolean;
type DFn = (s: number) => number;

function Sheet({ lang, offset, rot, visible, on, D, reduced, fast, children }: {
  lang: keyof typeof LETTERS; offset: [number, number]; rot: number; visible: boolean; on: OnFn; D: DFn; reduced: boolean; fast: boolean; children?: React.ReactNode;
}) {
  const L = LETTERS[lang];
  const order = (['en', 'es', 'vi'] as const).indexOf(lang);
  const tabColor = [P.pine, P.brass, P.roofTerracotta][order];
  const tabX = 36 + order * 86;
  return (
    <motion.g
      initial={{ scaleX: 0.04, opacity: 0 }}
      animate={{ scaleX: visible ? 1 : 0.04, opacity: visible ? 1 : 0 }}
      transition={{ scaleX: { duration: D(0.55), ease: ease.inOut }, opacity: { duration: D(0.08), ease: ease.out } }}
      style={{ originX: 0, originY: 0.5 }}
    >
      <g transform={`translate(${SHEET_X + offset[0]} ${SHEET_Y + offset[1]}) rotate(${rot} ${SHEET_W / 2} ${SHEET_H / 2})`}>
        {/* contact shadow, then the sheet */}
        <rect x={4} y={7} width={SHEET_W} height={SHEET_H + 30} rx={2} fill={P.shadow} opacity={0.7} />
        <rect x={0} y={0} width={SHEET_W} height={SHEET_H + 30} rx={2} fill={P.wall} />
        <rect x={0} y={0} width={SHEET_W} height={SHEET_H + 30} rx={2} fill="url(#desk-paper)" />
        <rect x={0} y={0} width={SHEET_W} height={2} fill="#FFFFFF" opacity={0.6} />
        {/* language tab */}
        <rect x={tabX} y={-18} width={70} height={26} rx={4} fill={tabColor} />
        <rect x={tabX} y={-18} width={70} height={10} rx={4} fill="#FFFFFF" opacity={0.12} />
        <text x={tabX + 35} y={-1} textAnchor="middle" fontSize={11} fontWeight={600} fill={P.paint} style={{ fontFamily: 'var(--font-sans)' }}>{L.tab}</text>
        {/* letterhead */}
        <g transform="translate(40 36)">
          <path d="M0 22 L12 10 L24 22 V36 H0 Z" fill={P.pine} />
          <path d="M12 10 L24 22 V36 H14 Z" fill={P.pineLight} opacity={0.7} />
          <rect x={9} y={26} width={6} height={10} fill={P.wall} />
          <text x={34} y={22} fontSize={13} fontWeight={600} fill={P.pine} style={{ fontFamily: 'var(--font-sans)' }}>Habitat for Humanity</text>
          <text x={34} y={37} fontSize={11} fill={P.asphaltLight} style={{ fontFamily: 'var(--font-sans)' }}>Orange County · Land &amp; Homes</text>
          <text x={360} y={37} fontSize={11} fill={P.asphaltLight} textAnchor="end" style={{ fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>Spring 2026</text>
        </g>
        <rect x={40} y={82} width={360} height={1.2} fill={P.wallShade} />
        {/* lines reveal left to right, 90 ms apart */}
        {L.lines.map((line, i) => {
          const shown = on(`${lang}${i}`);
          const y = i === 0 ? 118 : i === L.lines.length - 1 ? 340 : 150 + (i - 1) * 25;
          return (
            <motion.g
              key={i}
              initial={{ clipPath: 'inset(-4px 100% -4px 0)' }}
              animate={{ clipPath: shown ? 'inset(-4px 0% -4px 0)' : 'inset(-4px 100% -4px 0)' }}
              transition={{ duration: reduced ? 0 : fast ? 0.14 : 0.42, ease: ease.out }}
            >
              <text x={44} y={y} fontSize={15.5} fill={P.roofDeep} style={{ fontFamily: 'var(--font-display)', fontVariationSettings: '"SOFT" 30, "WONK" 0, "opsz" 14' }}>{line}</text>
            </motion.g>
          );
        })}
        {children}
        <text x={44} y={404} fontSize={10.5} fill={P.asphaltLight} style={{ fontFamily: 'var(--font-sans)' }}>María Reyes · Habitat for Humanity of Orange County</text>
      </g>
    </motion.g>
  );
}

function Pen({ on, D, settle }: { on: OnFn; D: DFn; settle: Transition }) {
  const start = SIG_PTS[0];
  const rest = [SHEET_W - 50, 418];
  const stage = on('rest') ? 'rest' : on('sign') ? 'sign' : on('pen') ? 'pen' : 'away';
  const target =
    stage === 'away' ? { x: start[0] + 230, y: start[1] + 150, opacity: 0, rotate: 8 }
    : stage === 'pen' ? { x: start[0], y: start[1], opacity: 1, rotate: 0 }
    : stage === 'sign' ? { x: SIG_PTS.map((p) => p[0]), y: SIG_PTS.map((p) => p[1]), opacity: 1, rotate: [0, -2, 2, -1, 1, 0, 1, -1, 0, 0] }
    : { x: rest[0], y: rest[1], opacity: 1, rotate: 30 };
  const transition =
    stage === 'sign' ? { duration: D(1.0), ease: 'linear' as const }
    : stage === 'rest' ? { duration: D(0.45), ease: ease.out }
    : settle;
  return (
    <motion.g initial={{ x: start[0] + 230, y: start[1] + 150, opacity: 0, rotate: 8 }} animate={target} transition={transition} style={{ originX: 0, originY: 0 }}>
      <g transform="rotate(-48)">
        {/* soft shadow on the paper, offset bottom-right */}
        <rect x={6} y={-9} width={118} height={12} rx={6} fill={P.shadow} opacity={0.45} transform="translate(0 6) skewX(-8)" />
        {/* nib */}
        <path d="M0 0 L16 -5 L16 5 Z" fill={P.brassLight} />
        <path d="M0 0 L16 5 L16 1 Z" fill={P.brass} />
        <line x1={3} y1={0} x2={13} y2={0} stroke={P.roofDeep} strokeWidth={0.8} opacity={0.5} />
        {/* grip + barrel */}
        <rect x={16} y={-5.5} width={14} height={11} rx={2} fill={P.roofDeep} />
        <rect x={30} y={-5} width={4} height={10} fill={P.brass} />
        <rect x={34} y={-6} width={78} height={12} rx={6} fill={P.roofDeep} />
        <rect x={34} y={-6} width={78} height={4.5} rx={2} fill={P.roofLight} opacity={0.7} />
        <rect x={108} y={-5.5} width={6} height={11} rx={3} fill={P.brass} />
        <rect x={62} y={-6} width={3} height={12} fill={P.brass} />
        {/* clip */}
        <rect x={68} y={-9} width={34} height={3} rx={1.5} fill={P.brassLight} />
      </g>
    </motion.g>
  );
}

function DeskLamp({ x, y, night }: { x: number; y: number; night: boolean }) {
  const sx = SHADE.x, sy = SHADE.y; // shade centre
  return (
    <g>
      <ellipse cx={x + 6} cy={y + 3} rx={34} ry={9} fill={P.shadow} />
      <ellipse cx={x} cy={y} rx={30} ry={8} fill={P.roofDeep} />
      <ellipse cx={x} cy={y - 3} rx={30} ry={8} fill={P.roof} />
      <ellipse cx={x - 8} cy={y - 4} rx={14} ry={3} fill={P.roofLight} opacity={0.6} />
      {/* arm: two segments with a brass joint */}
      <path d={`M${x} ${y - 6} L${x - 36} ${y - 150}`} stroke={P.roofDeep} strokeWidth={7} strokeLinecap="round" />
      <path d={`M${x - 36} ${y - 150} L${sx + 14} ${sy + 4}`} stroke={P.roofDeep} strokeWidth={6} strokeLinecap="round" />
      <path d={`M${x - 1} ${y - 6} L${x - 37} ${y - 150}`} stroke={P.roofLight} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      <circle cx={x - 36} cy={y - 150} r={6} fill={P.brass} />
      <circle cx={x - 38} cy={y - 152} r={2.5} fill={P.brassLight} />
      {/* shade: brass, lit left */}
      <path d={`M${sx - 22} ${sy - 32} L${sx + 22} ${sy - 32} L${sx + 62} ${sy + 32} L${sx - 62} ${sy + 32} Z`} fill={P.brass} />
      <path d={`M${sx - 22} ${sy - 32} L${sx + 2} ${sy - 32} L${sx - 10} ${sy + 32} L${sx - 62} ${sy + 32} Z`} fill={P.brassLight} />
      <path d={`M${sx + 10} ${sy - 32} L${sx + 22} ${sy - 32} L${sx + 62} ${sy + 32} L${sx + 34} ${sy + 32} Z`} fill={shade(P.brass, 0.2)} />
      <ellipse cx={sx} cy={sy + 32} rx={62} ry={9} fill={shade(P.brass, 0.3)} />
      <ellipse cx={sx} cy={sy + 32} rx={52} ry={6} fill={night ? P.honeyGlow : P.wallDeep} className={T} />
      <ellipse cx={sx} cy={sy + 34} rx={30} ry={14} fill={P.honeyGlow} className={T} style={{ opacity: night ? 0.5 : 0 }} />
      <ellipse cx={sx - 24} cy={sy - 26} rx={10} ry={4} fill="#FFFFFF" opacity={0.25} />
    </g>
  );
}

function Mug({ x, y, steam }: { x: number; y: number; steam: boolean }) {
  return (
    <g>
      <ellipse cx={x + 8} cy={y + 2} rx={36} ry={10} fill={P.shadow} />
      <ellipse cx={x} cy={y} rx={30} ry={9} fill={P.stoneLight} />
      <rect x={x - 22} y={y - 52} width={44} height={52} rx={5} fill={P.wall} />
      <rect x={x + 4} y={y - 52} width={18} height={52} rx={4} fill={P.wallShade} />
      <ellipse cx={x} cy={y} rx={22} ry={6} fill={P.wallShade} />
      <ellipse cx={x} cy={y - 52} rx={22} ry={7} fill={P.wallShade} />
      <ellipse cx={x} cy={y - 51} rx={18} ry={5} fill={P.trunk} />
      <ellipse cx={x - 4} cy={y - 52} rx={10} ry={2.5} fill={P.trunkLight} opacity={0.6} />
      <path d={`M${x + 22} ${y - 40} q18 0 18 14 q0 14 -18 14`} stroke={P.wallShade} strokeWidth={6} fill="none" strokeLinecap="round" />
      <path d={`M${x + 22} ${y - 40} q18 0 18 14 q0 14 -18 14`} stroke={P.wall} strokeWidth={3} fill="none" strokeLinecap="round" />
      <rect x={x - 16} y={y - 34} width={6} height={22} rx={3} fill={P.pine} opacity={0.9} />
      {[0, 0.9, 1.8].map((d, i) => (
        <ellipse key={i} cx={x - 6 + i * 6} cy={y - 62} rx={5} ry={9} fill={P.wall} opacity={0}
          style={{ transformOrigin: `${x}px ${y - 62}px`, animation: steam ? `ks-smoke 2.8s ease-out ${-d}s infinite` : 'none' }} />
      ))}
    </g>
  );
}

function Plant({ x, y }: { x: number; y: number }) {
  const leaf = (a: number, l: number, c: string) => (
    <path key={`${a}-${l}`} d={`M0 0 q${-l * 0.25} ${-l * 0.45} 0 ${-l} q${l * 0.25} ${-l * 0.55} 0 0`} fill={c} transform={`translate(0 -12) rotate(${a})`} />
  );
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={8} cy={2} rx={38} ry={9} fill={P.shadow} />
      <g>
        {leaf(-62, 96, P.treeDeep)}{leaf(-38, 118, P.tree)}{leaf(-12, 132, P.treeLight)}{leaf(14, 124, P.tree)}{leaf(42, 104, P.treeDeep)}{leaf(66, 84, P.tree)}
        {leaf(-26, 70, P.treeLight)}{leaf(28, 64, P.treeLight)}
      </g>
      <path d="M-30 -52 L30 -52 L24 0 L-24 0 Z" fill={P.roofTerracotta} />
      <path d="M4 -52 L30 -52 L24 0 L2 0 Z" fill={shade(P.roofTerracotta, 0.2)} />
      <rect x={-33} y={-58} width={66} height={9} rx={2} fill={P.roofTerracottaLight} />
      <rect x={-33} y={-49} width={66} height={3} fill={P.shadow} opacity={0.5} />
      <ellipse cx={0} cy={-52} rx={28} ry={4} fill={P.dirtShade} />
    </g>
  );
}

function PenHolder({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={6} cy={2} rx={24} ry={7} fill={P.shadow} />
      {[[-8, P.honey, -6], [0, P.roofTerracotta, 0], [8, P.pineLight, 5]].map(([dx, c, r], i) => (
        <g key={i} transform={`rotate(${r} ${dx} -40)`}>
          <rect x={(dx as number) - 3} y={-82} width={6} height={50} rx={1} fill={c as string} />
          <path d={`M${(dx as number) - 3} -82 l3 -8 l3 8 z`} fill={P.dirt} />
        </g>
      ))}
      <path d="M-18 -46 L18 -46 L16 0 L-16 0 Z" fill={P.pine} />
      <path d="M2 -46 L18 -46 L16 0 L2 0 Z" fill={shade(P.pine, 0.22)} />
      <ellipse cx={0} cy={-46} rx={18} ry={5} fill={P.pineLight} />
      <ellipse cx={0} cy={-46} rx={14} ry={3.5} fill={shade(P.pine, 0.4)} />
    </g>
  );
}

function Bookshelf({ x, y }: { x: number; y: number }) {
  const w = 320, h = 380;
  const rnd = seeded(11);
  const colors = [P.pine, P.brass, P.roofTerracotta, P.roof, P.jacarandaDeep, P.stone, P.treeDeep, P.roofDeep, P.honey, P.wallClayShade, P.trunk];
  const shelves = [0, 1, 2];
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={6} y={8} width={w} height={h} fill={P.shadow} opacity={0.5} />
      <rect x={0} y={0} width={w} height={h} fill={P.trunk} />
      <rect x={10} y={10} width={w - 20} height={h - 10} fill={shade(P.wallWarmShade, 0.22)} />
      {shelves.map((s) => {
        const sy = 10 + (s + 1) * 118;
        let bx = 16;
        const books: React.ReactNode[] = [];
        while (bx < w - 40) {
          const bw = 10 + Math.floor(rnd() * 14);
          const bh = 56 + Math.floor(rnd() * 40);
          const c = colors[Math.floor(rnd() * colors.length)];
          const lean = rnd() > 0.86;
          books.push(
            <g key={bx} transform={lean ? `rotate(-9 ${bx + bw} ${sy})` : undefined}>
              <rect x={bx} y={sy - bh} width={bw} height={bh} rx={1} fill={c} />
              <rect x={bx + bw * 0.62} y={sy - bh} width={bw * 0.38} height={bh} fill={shade(c, 0.22)} />
              <rect x={bx + 2} y={sy - bh + 8} width={bw - 4} height={2} fill={P.wall} opacity={0.35} />
              <rect x={bx + 2} y={sy - 10} width={bw - 4} height={2} fill={P.wall} opacity={0.35} />
            </g>,
          );
          bx += bw + (rnd() > 0.8 ? 10 : 1.5);
        }
        return (
          <g key={s}>
            {books}
            <rect x={10} y={sy} width={w - 20} height={8} fill={P.trunkLight} />
            <rect x={10} y={sy + 8} width={w - 20} height={3} fill={shade(P.trunk, 0.3)} />
            <rect x={10} y={sy - 6} width={w - 20} height={6} fill={P.shadow} opacity={0.25} />
          </g>
        );
      })}
      {/* top shelf: small plant and a box */}
      <rect x={0} y={0} width={w} height={10} fill={P.trunkLight} />
      <g transform="translate(60 0)">
        <rect x={-14} y={-26} width={28} height={26} rx={2} fill={P.stone} />
        <rect x={2} y={-26} width={12} height={26} fill={P.stoneDeep} />
        <circle cx={-4} cy={-34} r={9} fill={P.tree} /><circle cx={6} cy={-38} r={8} fill={P.treeLight} /><circle cx={0} cy={-44} r={7} fill={P.treeDeep} />
      </g>
      <g transform="translate(250 0)">
        <rect x={-26} y={-22} width={52} height={22} rx={1.5} fill={P.dirt} />
        <rect x={6} y={-22} width={20} height={22} fill={P.dirtShade} />
        <rect x={-26} y={-24} width={52} height={4} fill={P.dirtShade} />
      </g>
    </g>
  );
}

function FramedPhoto({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={5} y={6} width={140} height={106} fill={P.shadow} opacity={0.4} />
      <rect x={0} y={0} width={140} height={106} fill={P.trunk} />
      <rect x={6} y={6} width={128} height={94} fill={P.wall} />
      <rect x={16} y={16} width={108} height={74} fill={P.sky} />
      <path d="M16 66 Q50 48 80 60 T124 56 V90 H16 Z" fill={P.lawnShade} />
      <rect x={16} y={72} width={108} height={18} fill={P.lawn} />
      <rect x={58} y={56} width={26} height={18} fill={P.wallClay} />
      <path d="M54 56 L71 42 L88 56 Z" fill={P.roofTerracotta} />
      <rect x={68} y={64} width={6} height={10} fill={P.pine} />
      <circle cx={40} cy={60} r={8} fill={P.tree} /><rect x={39} y={64} width={2} height={10} fill={P.trunk} />
      <circle cx={104} cy={62} r={7} fill={P.jacaranda} /><rect x={103} y={66} width={2} height={8} fill={P.trunk} />
      <rect x={0} y={0} width={140} height={4} fill={P.trunkLight} opacity={0.5} />
    </g>
  );
}

