'use client';
/**
 * Pitch Kit backdrop: a warm desk seen from a chair. Wood desk edge, a brass-shaded lamp, two sheets of
 * paper, a mug and a pen. Rendered blurred (6px) at ~35% along the bottom of the page. The lamp's light
 * cone flickers on once at load (ks-flicker from globals.css) and glows stronger at night. This is the
 * only ambient motion on the page.
 */
import { palette as P, shade } from '@/lib/illustrationPalette';

const T = 'ks-t';

export function DeskBackdrop({ night = false }: { night?: boolean }) {
  const wall = night ? P.nightHorizon : P.wallWarm;
  const wallLow = night ? shade(P.nightHorizon, 0.25) : P.wallWarmShade;
  const deskTop = night ? shade(P.trunkLight, 0.35) : P.trunkLight;
  const deskEdge = night ? shade(P.trunk, 0.3) : P.trunk;
  const deskFront = night ? shade(P.trunk, 0.5) : shade(P.trunk, 0.18);
  const coneOpacity = night ? 1 : 0.55;
  const poolOpacity = night ? 0.55 : 0.28;

  return (
    <div
      className="absolute inset-x-0 bottom-0 h-[46%] min-h-[260px]"
      style={{ filter: 'blur(6px)', opacity: 0.35, maskImage: 'linear-gradient(to bottom, transparent, #000 35%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 35%)' }}
      aria-hidden
      data-backdrop="desk"
    >
      <svg viewBox="0 0 1440 460" width="100%" height="100%" preserveAspectRatio="xMidYMax slice" style={{ display: 'block' }}>
        {/* wall + baseboard */}
        <rect x="0" y="0" width="1440" height="300" fill={wall} className={T} />
        <rect x="0" y="280" width="1440" height="20" fill={wallLow} className={T} />

        {/* lamp light pool on the wall and desk (behind objects) */}
        <ellipse cx="1120" cy="300" rx="300" ry="120" fill={P.honeyGlow} opacity={poolOpacity * 0.5} className={T} />

        {/* desk: top surface, front edge, front face, highlight */}
        <rect x="0" y="300" width="1440" height="74" fill={deskTop} className={T} />
        <rect x="0" y="300" width="1440" height="3" fill={night ? shade(P.trunkLight, 0.1) : '#A08462'} opacity="0.8" className={T} />
        <rect x="0" y="374" width="1440" height="10" fill={deskEdge} className={T} />
        <rect x="0" y="384" width="1440" height="76" fill={deskFront} className={T} />
        {/* wood grain */}
        {[318, 334, 352, 366].map((y, i) => (
          <path key={y} d={`M0 ${y} C 300 ${y - 3 + i}, 700 ${y + 3 - i}, 1440 ${y - 2}`} stroke={deskEdge} strokeWidth="1.2" opacity="0.25" fill="none" className={T} />
        ))}

        {/* light pool on the desk */}
        <ellipse cx="1120" cy="336" rx="260" ry="26" fill={P.honeyGlow} opacity={poolOpacity} className={T} />

        {/* papers */}
        <g transform="translate(560 262) rotate(-7)">
          <rect x="6" y="8" width="250" height="170" fill={P.shadow} />
          <rect x="0" y="0" width="250" height="170" fill={P.wall} className={T} />
          <rect x="0" y="0" width="250" height="170" fill={P.wallShade} opacity="0.35" className={T} />
          {[26, 44, 62, 80, 98, 116].map((y, i) => <rect key={y} x="24" y={y} width={i === 5 ? 110 : 200 - (i % 2) * 24} height="4" fill={P.wallDeep} opacity="0.75" />)}
          <path d="M150 140 C 162 128, 176 136, 170 146 C 164 156, 186 150, 198 142" stroke={P.brass} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
        <g transform="translate(720 286) rotate(4)">
          <rect x="5" y="7" width="230" height="150" fill={P.shadow} />
          <rect x="0" y="0" width="230" height="150" fill={P.wallWarm} className={T} />
          {[22, 40, 58, 76, 94].map((y, i) => <rect key={y} x="22" y={y} width={186 - (i % 3) * 20} height="4" fill={P.wallDeep} opacity="0.7" />)}
        </g>

        {/* pen */}
        <g transform="translate(900 352) rotate(-12)">
          <rect x="4" y="5" width="150" height="9" rx="4" fill={P.shadow} />
          <rect x="0" y="0" width="150" height="9" rx="4" fill={P.roof} />
          <rect x="0" y="0" width="150" height="3.5" rx="2" fill={P.roofLight} />
          <rect x="104" y="-2" width="28" height="4" rx="2" fill={P.brass} />
          <path d="M150 1 L162 4.5 L150 8 Z" fill={P.brassLight} />
        </g>

        {/* mug */}
        <g transform="translate(360 240)">
          <ellipse cx="38" cy="100" rx="46" ry="9" fill={P.shadow} />
          <rect x="0" y="8" width="76" height="90" rx="10" fill={P.wallSage} className={T} />
          <rect x="44" y="8" width="32" height="90" rx="10" fill={P.wallSageShade} opacity="0.85" className={T} />
          <path d="M76 30 C 104 28, 104 76, 76 74" stroke={P.wallSage} strokeWidth="11" fill="none" strokeLinecap="round" className={T} />
          <path d="M76 30 C 104 28, 104 76, 76 74" stroke={P.wallSageShade} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.6" />
          <ellipse cx="38" cy="10" rx="38" ry="9" fill={P.wallSageShade} className={T} />
          <ellipse cx="38" cy="11" rx="31" ry="6.5" fill={shade(P.trunk, 0.35)} />
          <ellipse cx="30" cy="9.5" rx="12" ry="2.5" fill={P.trunkLight} opacity="0.5" />
        </g>

        {/* lamp: base, stem, arm, shade, bulb */}
        <g>
          <ellipse cx="1180" cy="330" rx="56" ry="11" fill={P.shadow} />
          <ellipse cx="1180" cy="324" rx="48" ry="10" fill={P.roofDeep} />
          <ellipse cx="1180" cy="320" rx="48" ry="10" fill={P.roof} />
          <rect x="1175" y="150" width="10" height="170" fill={P.roof} />
          <rect x="1175" y="150" width="4" height="170" fill={P.roofLight} />
          <path d="M1180 152 C 1180 118, 1140 110, 1112 128" stroke={P.roof} strokeWidth="9" fill="none" strokeLinecap="round" />
          <path d="M1180 152 C 1180 118, 1140 110, 1112 128" stroke={P.roofLight} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
          {/* shade: light left face, deep right face, brass rim */}
          <path d="M1018 196 L1206 196 L1160 118 Q1112 104 1064 118 Z" fill={shade(P.brass, 0.25)} />
          <path d="M1018 196 L1112 196 L1112 108 Q1086 108 1064 118 Z" fill={P.brassLight} />
          <path d="M1018 196 L1206 196" stroke={shade(P.brass, 0.4)} strokeWidth="4" />
          <ellipse cx="1112" cy="196" rx="94" ry="8" fill={P.honeyGlow} opacity={night ? 0.95 : 0.6} className={T} />
        </g>

        {/* light cone: flickers on once at load */}
        <g style={{ animation: 'ks-flicker 1.4s var(--ease-out) 0.3s 1 both' }}>
          <path d="M1024 198 L1200 198 L1400 336 L820 336 Z" fill={P.lampCone} opacity={coneOpacity} className={T} />
          <path d="M1060 198 L1164 198 L1270 336 L950 336 Z" fill={P.lampCone} opacity={coneOpacity * 0.6} className={T} />
        </g>
      </svg>
    </div>
  );
}
