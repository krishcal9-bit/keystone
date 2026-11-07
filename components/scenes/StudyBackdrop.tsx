'use client';
/**
 * Ask Keystone backdrop: a quiet study filling the page (bookshelf wall, armchair with a side table and
 * reading lamp, a tall window with a tree outside, a rug, a plant). Static, ~35 % with a radial mask so
 * the edges fade. Night: the lamp is lit and the window shows the moon.
 */
import { useTheme } from '@/lib/theme';
import { palette as P, shade, mix, seeded } from '@/lib/illustrationPalette';
import { Tree } from '@/components/illustrations/Tree';

const W = 1440;
const H = 900;
const FLOOR = 700;

const SPINES = [P.pine, P.brass, P.roofTerracotta, P.roof, P.stone, P.trunk, P.jacarandaDeep, P.treeDeep, P.wallClayShade, P.roofLight];

function Shelf({ x, y, w, seed }: { x: number; y: number; w: number; seed: number }) {
  const rnd = seeded(seed);
  const books: { x: number; w: number; h: number; c: string; lean?: boolean }[] = [];
  let cx = x + 8;
  while (cx < x + w - 20) {
    const bw = 11 + Math.floor(rnd() * 11);
    const bh = 40 + Math.floor(rnd() * 24);
    books.push({ x: cx, w: bw, h: bh, c: SPINES[Math.floor(rnd() * SPINES.length)], lean: rnd() > 0.9 });
    cx += bw + 2;
    if (rnd() > 0.85) cx += 22;
  }
  return (
    <g>
      {books.map((b, i) => (
        <g key={i} transform={b.lean ? `rotate(-8 ${b.x + b.w} ${y})` : undefined}>
          <rect x={b.x} y={y - b.h} width={b.w} height={b.h} rx={1} fill={b.c} />
          <rect x={b.x + b.w * 0.62} y={y - b.h} width={b.w * 0.38} height={b.h} fill={shade(b.c, 0.25)} />
        </g>
      ))}
      <rect x={x} y={y} width={w} height={8} fill={P.trunkLight} />
      <rect x={x} y={y + 8} width={w} height={4} fill={shade(P.trunk, 0.2)} />
      <rect x={x} y={y + 12} width={w} height={6} fill={P.shadow} opacity={0.5} />
    </g>
  );
}

export function StudyBackdrop({ opacity = 0.35 }: { opacity?: number }) {
  const { theme } = useTheme();
  const night = theme === 'dark';
  const wall = night ? mix(P.wallSage, P.nightSkyLow, 0.55) : P.wallSage;
  const wallShade = night ? mix(P.wallSageShade, P.nightSkyLow, 0.55) : P.wallSageShade;
  const floor = night ? shade(P.trunk, 0.4) : P.trunkLight;
  const lampGlow = night ? 1 : 0;
  const mask = 'radial-gradient(ellipse 74% 70% at 50% 52%, #000 38%, transparent 100%)';
  return (
    <div
      className="absolute inset-0 pointer-events-none select-none"
      style={{ opacity, maskImage: mask, WebkitMaskImage: mask }}
      aria-hidden
      data-backdrop="study"
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" className="block">
        {/* wall + wainscot */}
        <rect width={W} height={FLOOR} fill={wall} className="ks-t" />
        <rect x={0} y={FLOOR - 120} width={W} height={120} fill={wallShade} opacity={0.6} className="ks-t" />
        <rect x={0} y={FLOOR - 123} width={W} height={5} fill={P.wall} opacity={night ? 0.35 : 0.9} className="ks-t" />
        {/* floor with boards */}
        <rect x={0} y={FLOOR} width={W} height={H - FLOOR} fill={floor} className="ks-t" />
        {Array.from({ length: 8 }).map((_, i) => (
          <rect key={i} x={0} y={FLOOR + 14 + i * 24} width={W} height={1.5} fill={shade(floor, 0.3)} opacity={0.55} />
        ))}
        {/* rug */}
        <rect x={400} y={FLOOR + 24} width={700} height={120} rx={6} fill={night ? shade(P.roofTerracotta, 0.45) : P.roofTerracotta} opacity={0.85} className="ks-t" />
        <rect x={420} y={FLOOR + 38} width={660} height={92} rx={3} fill="none" stroke={P.wallWarm} strokeWidth={3} opacity={0.45} />

        {/* window with a tree outside (right of centre) */}
        <g transform="translate(900 110)">
          <rect x={-14} y={-14} width={328} height={380} rx={5} fill={P.wall} className="ks-t" />
          <rect x={0} y={0} width={300} height={352} fill={night ? P.nightSkyLow : P.sky} className="ks-t" />
          <rect x={0} y={250} width={300} height={102} fill={night ? P.lawnDeep : P.lawn} className="ks-t" />
          {night && <circle cx={236} cy={60} r={18} fill={P.moon} />}
          {night && <circle cx={244} cy={54} r={15} fill={P.nightSkyLow} opacity={0.95} />}
          <Tree x={96} y={258} kind="oak" scale={2.1} />
          <Tree x={250} y={262} kind="cypress" scale={1.2} />
          <rect x={147} y={0} width={8} height={352} fill={P.wall} className="ks-t" />
          <rect x={0} y={172} width={300} height={8} fill={P.wall} className="ks-t" />
          <rect x={-20} y={352} width={340} height={14} fill={P.wallShade} />
          <rect x={-20} y={366} width={340} height={4} fill={P.shadow} opacity={0.5} />
          {/* curtains */}
          <path d="M-36 -20 h48 q-8 190 14 390 h-62 z" fill={night ? shade(P.pine, 0.3) : P.pine} opacity={0.9} className="ks-t" />
          <path d="M308 -20 h48 v390 h-62 q22 -190 14 -390 z" fill={night ? shade(P.pine, 0.4) : shade(P.pine, 0.15)} opacity={0.9} className="ks-t" />
        </g>

        {/* bookshelf (left) */}
        <g>
          <rect x={100} y={70} width={380} height={FLOOR - 70} fill={P.trunk} />
          <rect x={114} y={84} width={352} height={FLOOR - 84} fill={shade(P.trunk, 0.3)} />
          <Shelf x={114} y={180} w={352} seed={11} />
          <Shelf x={114} y={290} w={352} seed={23} />
          <Shelf x={114} y={400} w={352} seed={37} />
          <Shelf x={114} y={510} w={352} seed={41} />
          <Shelf x={114} y={620} w={352} seed={53} />
          <rect x={100} y={FLOOR - 24} width={380} height={24} fill={shade(P.trunk, 0.15)} />
          <ellipse cx={290} cy={FLOOR + 6} rx={210} ry={8} fill={P.shadow} />
        </g>

        {/* armchair (centre) with side table and reading lamp */}
        <g transform="translate(540 0)">
          <ellipse cx={150} cy={FLOOR + 8} rx={170} ry={10} fill={P.shadow} />
          <rect x={36} y={FLOOR - 240} width={230} height={160} rx={36} fill={P.pine} className="ks-t" />
          <rect x={36} y={FLOOR - 240} width={230} height={160} rx={36} fill={P.pineLight} opacity={0.25} />
          <path d={`M36 ${FLOOR - 150} h230 v70 h-230 z`} fill={shade(P.pine, 0.18)} />
          <rect x={26} y={FLOOR - 110} width={250} height={44} rx={18} fill={P.pineLight} className="ks-t" />
          <rect x={26} y={FLOOR - 80} width={250} height={16} rx={8} fill={shade(P.pine, 0.1)} />
          <rect x={2} y={FLOOR - 134} width={44} height={76} rx={18} fill={shade(P.pine, 0.08)} />
          <rect x={256} y={FLOOR - 134} width={44} height={76} rx={18} fill={shade(P.pine, 0.3)} />
          <rect x={24} y={FLOOR - 56} width={12} height={56} fill={P.trunk} />
          <rect x={266} y={FLOOR - 56} width={12} height={56} fill={shade(P.trunk, 0.25)} />
          <path d={`M74 ${FLOOR - 110} q40 -10 80 0 v26 q-40 12 -80 0 z`} fill={P.brass} opacity={0.75} />
          {/* side table */}
          <rect x={332} y={FLOOR - 118} width={90} height={8} rx={3} fill={P.trunkLight} />
          <rect x={332} y={FLOOR - 110} width={90} height={4} fill={shade(P.trunk, 0.2)} />
          <rect x={372} y={FLOOR - 110} width={10} height={110} fill={P.trunk} />
          <ellipse cx={377} cy={FLOOR + 3} rx={28} ry={5} fill={P.shadow} />
          {/* reading lamp */}
          <g>
            <ellipse cx={377} cy={FLOOR - 230} rx={150} ry={160} fill={P.windowLit} opacity={0.14 * lampGlow} className="ks-t" />
            <path d={`M330 ${FLOOR - 224} h94 l16 56 h-126 z`} fill={night ? P.honeyGlow : P.wallWarm} className="ks-t" />
            <path d={`M377 ${FLOOR - 224} h47 l16 56 h-63 z`} fill={night ? P.honey : P.wallWarmShade} opacity={0.8} className="ks-t" />
            <rect x={373} y={FLOOR - 168} width={8} height={50} fill={P.brass} />
            <ellipse cx={377} cy={FLOOR - 118} rx={22} ry={5} fill={P.brass} />
            <ellipse cx={377} cy={FLOOR - 160} rx={40} ry={7} fill={P.windowLit} opacity={0.5 * lampGlow} className="ks-t" />
          </g>
          {/* open book on the arm */}
          <path d={`M-6 ${FLOOR - 142} l30 -5 l30 5 v8 l-30 -5 l-30 5 z`} fill={P.paint} />
          <path d={`M24 ${FLOOR - 147} v13`} stroke={P.wallDeep} strokeWidth={1} />
        </g>

        {/* potted plant (right) and a framed picture */}
        <g transform="translate(1280 0)">
          <ellipse cx={40} cy={FLOOR + 6} rx={46} ry={7} fill={P.shadow} />
          <path d={`M10 ${FLOOR} l6 -60 h48 l6 60 z`} fill={P.roofTerracotta} className="ks-t" />
          <path d={`M40 ${FLOOR - 60} h30 l-6 60 h-24 z`} fill={P.roofTerracottaLight} opacity={0.5} />
          <circle cx={40} cy={FLOOR - 96} r={36} fill={P.tree} className="ks-t" />
          <circle cx={22} cy={FLOOR - 112} r={19} fill={P.treeLight} className="ks-t" />
          <circle cx={60} cy={FLOOR - 82} r={18} fill={P.treeDeep} className="ks-t" />
        </g>
        <g transform="translate(560 150)">
          <rect x={6} y={8} width={150} height={110} fill={P.shadow} />
          <rect x={0} y={0} width={150} height={110} fill={P.trunk} />
          <rect x={8} y={8} width={134} height={94} fill={night ? P.nightHorizon : P.skyDuskHigh} className="ks-t" />
          <path d="M8 78 q40 -32 68 -8 q28 -28 66 6 v26 h-134 z" fill={night ? mix(P.lawnDeep, P.nightSkyLow, 0.5) : P.lawnShade} className="ks-t" />
        </g>
      </svg>
    </div>
  );
}
