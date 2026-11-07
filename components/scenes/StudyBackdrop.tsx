'use client';
/**
 * Ask Keystone backdrop: a quiet study (bookshelf, armchair, window with a tree outside, a reading lamp
 * that is lit at night). Static, blurred, ~35% strength along the bottom of the page.
 */
import { useTheme } from '@/lib/theme';
import { palette as P, shade, mix, seeded } from '@/lib/illustrationPalette';
import { Tree } from '@/components/illustrations/Tree';

const W = 1440;
const H = 520;
const FLOOR = 440;

const SPINES = [P.pine, P.brass, P.roofTerracotta, P.roof, P.stone, P.trunk, P.jacarandaDeep, P.treeDeep, P.wallClayShade, P.roofLight];

function Shelf({ x, y, w, seed }: { x: number; y: number; w: number; seed: number }) {
  const rnd = seeded(seed);
  const books: { x: number; w: number; h: number; c: string; lean?: boolean }[] = [];
  let cx = x + 6;
  while (cx < x + w - 14) {
    const bw = 8 + Math.floor(rnd() * 9);
    const bh = 30 + Math.floor(rnd() * 18);
    books.push({ x: cx, w: bw, h: bh, c: SPINES[Math.floor(rnd() * SPINES.length)], lean: rnd() > 0.9 });
    cx += bw + 1.5;
    if (rnd() > 0.85) cx += 14; // a gap with a small object
  }
  return (
    <g>
      {books.map((b, i) => (
        <g key={i} transform={b.lean ? `rotate(-8 ${b.x + b.w} ${y})` : undefined}>
          <rect x={b.x} y={y - b.h} width={b.w} height={b.h} rx={1} fill={b.c} />
          <rect x={b.x + b.w * 0.62} y={y - b.h} width={b.w * 0.38} height={b.h} fill={shade(b.c, 0.25)} />
          <rect x={b.x + 2} y={y - b.h + 6} width={b.w - 4} height={1.6} fill={P.paint} opacity={0.5} />
          <rect x={b.x + 2} y={y - 8} width={b.w - 4} height={1.2} fill={P.paint} opacity={0.4} />
        </g>
      ))}
      {/* shelf board */}
      <rect x={x} y={y} width={w} height={6} fill={P.trunkLight} />
      <rect x={x} y={y + 6} width={w} height={3} fill={shade(P.trunk, 0.2)} />
      <rect x={x} y={y + 9} width={w} height={4} fill={P.shadow} opacity={0.5} />
    </g>
  );
}

export function StudyBackdrop() {
  const { theme } = useTheme();
  const night = theme === 'dark';
  const wall = night ? mix(P.wallSage, P.nightSkyLow, 0.55) : P.wallSage;
  const wallShade = night ? mix(P.wallSageShade, P.nightSkyLow, 0.55) : P.wallSageShade;
  const floor = night ? shade(P.trunk, 0.35) : P.trunkLight;
  const lampGlow = night ? 1 : 0;
  return (
    <div
      className="absolute inset-x-0 bottom-0 h-[62%] min-h-[420px]"
      style={{ opacity: 0.35, filter: 'blur(6px)', maskImage: 'linear-gradient(to top, black 70%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to top, black 70%, transparent 100%)' }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMax slice" className="block" aria-hidden>
        {/* wall + wainscot */}
        <rect width={W} height={FLOOR} fill={wall} />
        <rect x={0} y={FLOOR - 90} width={W} height={90} fill={wallShade} opacity={0.6} />
        <rect x={0} y={FLOOR - 92} width={W} height={4} fill={P.wall} opacity={night ? 0.35 : 0.9} />
        {/* floor with boards */}
        <rect x={0} y={FLOOR} width={W} height={H - FLOOR} fill={floor} />
        {Array.from({ length: 12 }).map((_, i) => (
          <rect key={i} x={0} y={FLOOR + 8 + i * 7} width={W} height={1} fill={shade(floor, 0.25)} opacity={0.5} />
        ))}
        {/* rug */}
        <rect x={420} y={FLOOR + 12} width={620} height={52} rx={4} fill={night ? shade(P.roofTerracotta, 0.4) : P.roofTerracotta} opacity={0.85} />
        <rect x={436} y={FLOOR + 20} width={588} height={36} rx={2} fill="none" stroke={P.wallWarm} strokeWidth={2} opacity={0.5} />

        {/* window with a tree outside (right of centre) */}
        <g transform="translate(900 110)">
          <rect x={-10} y={-10} width={240} height={236} rx={4} fill={P.wall} />
          <rect x={0} y={0} width={220} height={216} fill={night ? P.nightSkyLow : P.sky} />
          <rect x={0} y={150} width={220} height={66} fill={night ? P.lawnDeep : P.lawn} />
          {night && <circle cx={176} cy={40} r={13} fill={P.moon} />}
          {night && <circle cx={182} cy={36} r={11} fill={P.nightSkyLow} opacity={0.95} />}
          <Tree x={70} y={156} kind="oak" scale={1.5} />
          <Tree x={190} y={160} kind="cypress" scale={0.9} />
          {/* mullions */}
          <rect x={107} y={0} width={6} height={216} fill={P.wall} />
          <rect x={0} y={105} width={220} height={6} fill={P.wall} />
          <rect x={-14} y={216} width={248} height={10} fill={P.wallShade} />
          <rect x={-14} y={226} width={248} height={3} fill={P.shadow} opacity={0.5} />
          {/* curtains */}
          <path d="M-26 -14 h34 q-6 120 10 240 h-44 z" fill={night ? shade(P.pine, 0.3) : P.pine} opacity={0.9} />
          <path d="M226 -14 h34 v240 h-44 q16 -120 10 -240 z" fill={night ? shade(P.pine, 0.4) : shade(P.pine, 0.15)} opacity={0.9} />
        </g>

        {/* bookshelf (left) */}
        <g>
          <rect x={120} y={60} width={330} height={FLOOR - 60} fill={P.trunk} />
          <rect x={132} y={72} width={306} height={FLOOR - 72} fill={shade(P.trunk, 0.3)} />
          <Shelf x={132} y={150} w={306} seed={11} />
          <Shelf x={132} y={232} w={306} seed={23} />
          <Shelf x={132} y={314} w={306} seed={37} />
          <Shelf x={132} y={396} w={306} seed={41} />
          <rect x={120} y={FLOOR - 18} width={330} height={18} fill={shade(P.trunk, 0.15)} />
          <ellipse cx={285} cy={FLOOR + 4} rx={180} ry={6} fill={P.shadow} />
        </g>

        {/* armchair (centre) with side table and reading lamp */}
        <g transform="translate(560 0)">
          <ellipse cx={120} cy={FLOOR + 6} rx={130} ry={8} fill={P.shadow} />
          {/* back */}
          <rect x={30} y={FLOOR - 170} width={180} height={120} rx={28} fill={P.pine} />
          <rect x={30} y={FLOOR - 170} width={180} height={120} rx={28} fill={P.pineLight} opacity={0.25} />
          <path d={`M30 ${FLOOR - 110} h180 v60 h-180 z`} fill={shade(P.pine, 0.18)} />
          {/* seat cushion */}
          <rect x={22} y={FLOOR - 78} width={196} height={34} rx={14} fill={P.pineLight} />
          <rect x={22} y={FLOOR - 56} width={196} height={12} rx={6} fill={shade(P.pine, 0.1)} />
          {/* arms */}
          <rect x={4} y={FLOOR - 98} width={34} height={58} rx={14} fill={shade(P.pine, 0.08)} />
          <rect x={202} y={FLOOR - 98} width={34} height={58} rx={14} fill={shade(P.pine, 0.3)} />
          {/* legs */}
          <rect x={20} y={FLOOR - 40} width={10} height={40} fill={P.trunk} />
          <rect x={210} y={FLOOR - 40} width={10} height={40} fill={shade(P.trunk, 0.25)} />
          {/* throw blanket */}
          <path d={`M60 ${FLOOR - 78} q30 -8 60 0 v20 q-30 10 -60 0 z`} fill={P.brass} opacity={0.75} />
          {/* side table */}
          <rect x={262} y={FLOOR - 82} width={70} height={6} rx={2} fill={P.trunkLight} />
          <rect x={262} y={FLOOR - 76} width={70} height={3} fill={shade(P.trunk, 0.2)} />
          <rect x={292} y={FLOOR - 76} width={8} height={76} fill={P.trunk} />
          <ellipse cx={297} cy={FLOOR + 2} rx={22} ry={4} fill={P.shadow} />
          {/* reading lamp */}
          <g>
            <ellipse cx={297} cy={FLOOR - 170} rx={110} ry={120} fill={P.windowLit} opacity={0.14 * lampGlow} />
            <path d={`M262 ${FLOOR - 160} h70 l12 42 h-94 z`} fill={night ? P.honeyGlow : P.wallWarm} />
            <path d={`M297 ${FLOOR - 160} h35 l12 42 h-47 z`} fill={night ? P.honey : P.wallWarmShade} opacity={0.8} />
            <rect x={294} y={FLOOR - 118} width={6} height={36} fill={P.brass} />
            <ellipse cx={297} cy={FLOOR - 82} rx={16} ry={4} fill={P.brass} />
            <ellipse cx={297} cy={FLOOR - 112} rx={30} ry={5} fill={P.windowLit} opacity={0.5 * lampGlow} />
          </g>
          {/* open book on the arm */}
          <path d={`M-4 ${FLOOR - 104} l22 -4 l22 4 v6 l-22 -4 l-22 4 z`} fill={P.paint} />
          <path d={`M18 ${FLOOR - 108} v10`} stroke={P.wallDeep} strokeWidth={1} />
        </g>

        {/* potted plant (right) and framed picture */}
        <g transform="translate(1250 0)">
          <ellipse cx={30} cy={FLOOR + 4} rx={34} ry={5} fill={P.shadow} />
          <path d={`M8 ${FLOOR} l4 -44 h36 l4 44 z`} fill={P.roofTerracotta} />
          <path d={`M30 ${FLOOR - 44} h22 l-4 44 h-18 z`} fill={P.roofTerracottaLight} opacity={0.5} />
          <circle cx={30} cy={FLOOR - 70} r={26} fill={P.tree} />
          <circle cx={16} cy={FLOOR - 82} r={14} fill={P.treeLight} />
          <circle cx={44} cy={FLOOR - 60} r={13} fill={P.treeDeep} />
        </g>
        <g transform="translate(540 120)">
          <rect x={0} y={0} width={110} height={80} fill={P.trunk} />
          <rect x={6} y={6} width={98} height={68} fill={night ? P.nightHorizon : P.skyDuskHigh} />
          <path d="M6 58 q30 -24 50 -6 q20 -20 48 4 v16 h-98 z" fill={night ? mix(P.lawnDeep, P.nightSkyLow, 0.5) : P.lawnShade} />
        </g>
      </svg>
    </div>
  );
}
