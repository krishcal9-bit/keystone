'use client';
/**
 * Pitch Kit backdrop: a warm desk seen from the chair, filling the page. Wall across the top ~30 %,
 * wood desk surface across the lower ~70 %, a brass-shaded lamp at top-right with a warm cone, a plant,
 * a mug, a stack of paper and a pen. ~40 % opacity with a radial mask so edges fade. The lamp cone
 * flickers on once at load (ks-flicker) and glows stronger at night: the only motion on the page.
 * The letter (PaperSheet) stays the brightest object; nothing here is lighter than its paper.
 */
import { palette as P, shade } from '@/lib/illustrationPalette';

const T = 'ks-t';
const W = 1440, H = 900, DESK = 270, FRONT = 830;

export function DeskBackdrop({ night = false, opacity = 0.4 }: { night?: boolean; opacity?: number }) {
  const wall = night ? P.nightHorizon : P.wallWarm;
  const wallLow = night ? shade(P.nightHorizon, 0.25) : P.wallWarmShade;
  const deskTop = night ? shade(P.trunkLight, 0.4) : P.trunkLight;
  const deskHi = night ? shade(P.trunkLight, 0.28) : '#9A7A5C';
  const deskEdge = night ? shade(P.trunk, 0.35) : P.trunk;
  const deskFront = night ? shade(P.trunk, 0.55) : shade(P.trunk, 0.18);
  const paper = night ? P.wallShade : P.wall;
  const paperShade = night ? P.wallDeep : P.wallShade;
  const coneOpacity = night ? 1 : 0.5;
  const poolOpacity = night ? 0.6 : 0.3;
  const mask = 'radial-gradient(ellipse 74% 70% at 50% 52%, #000 40%, transparent 100%)';

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none"
      style={{ opacity, maskImage: mask, WebkitMaskImage: mask }}
      aria-hidden
      data-backdrop="desk"
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
        {/* wall, chair rail, baseboard */}
        <rect x={0} y={0} width={W} height={DESK} fill={wall} className={T} />
        <rect x={0} y={DESK - 36} width={W} height={36} fill={wallLow} className={T} />
        <rect x={0} y={DESK - 38} width={W} height={4} fill={night ? shade(P.wallWarm, 0.5) : P.wall} opacity={0.8} className={T} />
        {/* lamp glow on the wall */}
        <ellipse cx={1110} cy={DESK} rx={330} ry={150} fill={P.honeyGlow} opacity={poolOpacity * 0.45} className={T} />

        {/* desk top: far edge highlight, surface, wood grain, front edge, front face */}
        <rect x={0} y={DESK} width={W} height={FRONT - DESK} fill={deskTop} className={T} />
        <rect x={0} y={DESK} width={W} height={4} fill={deskHi} opacity={0.9} className={T} />
        {[330, 390, 460, 540, 630, 720, 790].map((y, i) => (
          <path key={y} d={`M0 ${y} C ${360 + i * 40} ${y - 10 + (i % 2) * 14}, ${900 - i * 30} ${y + 12 - (i % 3) * 8}, ${W} ${y - 4}`} stroke={deskEdge} strokeWidth={1.4} opacity={0.22} fill="none" className={T} />
        ))}
        <rect x={0} y={FRONT} width={W} height={12} fill={deskEdge} className={T} />
        <rect x={0} y={FRONT + 12} width={W} height={H - FRONT - 12} fill={deskFront} className={T} />
        {/* pool of lamplight on the desk */}
        <ellipse cx={1040} cy={470} rx={320} ry={120} fill={P.honeyGlow} opacity={poolOpacity} className={T} />

        {/* plant: terracotta pot, soil, three leaf clusters */}
        <g transform="translate(150 150)">
          <ellipse cx={70} cy={168} rx={78} ry={14} fill={P.shadow} />
          <path d="M22 100 l8 64 h80 l8 -64 z" fill={P.roofTerracotta} className={T} />
          <path d="M78 100 h40 l-8 64 h-32 z" fill={shade(P.roofTerracotta, 0.25)} className={T} />
          <rect x={18} y={92} width={104} height={14} rx={3} fill={P.roofTerracottaLight} className={T} />
          <rect x={30} y={96} width={80} height={8} fill={shade(P.trunk, 0.3)} />
          <ellipse cx={46} cy={52} rx={34} ry={44} fill={P.treeDeep} className={T} />
          <ellipse cx={96} cy={46} rx={36} ry={48} fill={P.tree} className={T} />
          <ellipse cx={70} cy={28} rx={30} ry={40} fill={P.treeLight} className={T} />
          <path d="M70 100 L62 40 M70 100 L96 48 M70 100 L46 60" stroke={P.treeDeep} strokeWidth={3} strokeLinecap="round" />
        </g>

        {/* paper stack: three sheets, slightly fanned, bottom ones shaded */}
        <g transform="translate(520 330)">
          <rect x={12} y={14} width={300} height={210} fill={P.shadow} opacity={0.9} />
          <g transform="rotate(-5 150 105)"><rect x={0} y={0} width={300} height={210} fill={paperShade} className={T} /></g>
          <g transform="rotate(3 150 105)"><rect x={0} y={0} width={300} height={210} fill={shade(paper, 0.06)} className={T} /></g>
          <rect x={0} y={0} width={300} height={210} fill={paper} className={T} />
          <rect x={0} y={0} width={300} height={210} fill={P.wallShade} opacity={night ? 0.25 : 0.12} className={T} />
          {[34, 56, 78, 100, 122, 144].map((y, i) => <rect key={y} x={30} y={y} width={i === 5 ? 120 : 240 - (i % 2) * 30} height={5} fill={P.wallDeep} opacity={0.7} />)}
          <path d="M180 176 C 192 164, 206 172, 200 182 C 194 192, 216 186, 228 178" stroke={P.brass} strokeWidth={2.6} fill="none" strokeLinecap="round" />
        </g>

        {/* mug: sage, shaded right face, handle, coffee */}
        <g transform="translate(380 500)">
          <ellipse cx={46} cy={112} rx={58} ry={11} fill={P.shadow} />
          <rect x={0} y={10} width={92} height={100} rx={12} fill={P.wallSage} className={T} />
          <rect x={54} y={10} width={38} height={100} rx={12} fill={P.wallSageShade} opacity={0.85} className={T} />
          <path d="M92 36 C 126 34, 126 86, 92 84" stroke={P.wallSage} strokeWidth={13} fill="none" strokeLinecap="round" className={T} />
          <path d="M92 36 C 126 34, 126 86, 92 84" stroke={P.wallSageShade} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.6} />
          <ellipse cx={46} cy={12} rx={46} ry={11} fill={P.wallSageShade} className={T} />
          <ellipse cx={46} cy={13} rx={38} ry={8} fill={shade(P.trunk, 0.4)} />
          <ellipse cx={36} cy={11} rx={14} ry={3} fill={P.trunkLight} opacity={0.5} />
        </g>

        {/* pen with brass clip */}
        <g transform="translate(860 620) rotate(-14)">
          <rect x={5} y={6} width={190} height={11} rx={5} fill={P.shadow} />
          <rect x={0} y={0} width={190} height={11} rx={5} fill={P.roof} />
          <rect x={0} y={0} width={190} height={4} rx={2} fill={P.roofLight} />
          <rect x={132} y={-2} width={34} height={5} rx={2} fill={P.brass} />
          <path d="M190 1 L206 5.5 L190 10 Z" fill={P.brassLight} />
        </g>

        {/* lamp at top-right: base on the desk, stem, arm, brass shade with light and shadow faces */}
        <g>
          <ellipse cx={1190} cy={372} rx={66} ry={13} fill={P.shadow} />
          <ellipse cx={1190} cy={364} rx={56} ry={12} fill={P.roofDeep} />
          <ellipse cx={1190} cy={359} rx={56} ry={12} fill={P.roof} />
          <rect x={1184} y={160} width={12} height={200} fill={P.roof} />
          <rect x={1184} y={160} width={5} height={200} fill={P.roofLight} />
          <path d="M1190 162 C 1190 120, 1140 108, 1104 128" stroke={P.roof} strokeWidth={10} fill="none" strokeLinecap="round" />
          <path d="M1190 162 C 1190 120, 1140 108, 1104 128" stroke={P.roofLight} strokeWidth={3.5} fill="none" strokeLinecap="round" opacity={0.7} />
          <path d="M992 208 L1216 208 L1162 112 Q1104 96 1046 112 Z" fill={shade(P.brass, 0.25)} />
          <path d="M992 208 L1104 208 L1104 100 Q1072 100 1046 112 Z" fill={P.brassLight} />
          <path d="M992 208 L1216 208" stroke={shade(P.brass, 0.45)} strokeWidth={5} />
          <ellipse cx={1104} cy={208} rx={112} ry={9} fill={P.honeyGlow} opacity={night ? 0.95 : 0.6} className={T} />
        </g>

        {/* light cone: flickers on once at load, brighter at night */}
        <g style={{ animation: 'ks-flicker 1.4s var(--ease-out) 0.3s 1 both' }}>
          <path d="M1000 212 L1208 212 L1400 560 L720 560 Z" fill={P.lampCone} opacity={coneOpacity} className={T} />
          <path d="M1046 212 L1162 212 L1260 560 L900 560 Z" fill={P.lampCone} opacity={coneOpacity * 0.6} className={T} />
        </g>
      </svg>
    </div>
  );
}
