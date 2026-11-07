'use client';
/**
 * Pipeline backdrop: a static illustrated band across the top ~260 px of the page showing one home at
 * each build stage, left to right: an empty lot with survey stakes, a poured foundation, framing, a roofed
 * shell, and a finished house with lit windows at night. Street lamps and trees between. ~12 % opacity,
 * fading out toward the bottom. No motion.
 */
import { useTheme } from '@/lib/theme';
import { palette as P, shade } from '@/lib/illustrationPalette';
import { Tree } from '@/components/illustrations/Tree';
import { StreetLamp, LampDefs } from '@/components/illustrations/StreetLamp';

const W = 1440;
const H = 260;
const G = 226; // ground line
const HW = 150; // house width
const HH = 80; // wall height
const RISE = 46; // roof rise

function Lot({ x, night }: { x: number; night: boolean }) {
  return (
    <g>
      <ellipse cx={x + HW / 2} cy={G + 2} rx={HW / 2 + 10} ry={5} fill={P.shadow} opacity={0.6} />
      <rect x={x - 6} y={G - 6} width={HW + 12} height={6} fill={night ? shade(P.dirt, 0.4) : P.dirt} />
      <rect x={x - 6} y={G - 8} width={HW + 12} height={2} fill={P.dirtShade} />
      {[0, HW / 2, HW].map((dx) => (
        <g key={dx}>
          <rect x={x + dx - 1.5} y={G - 32} width={3} height={26} fill={P.trunkLight} />
          <rect x={x + dx - 4} y={G - 34} width={8} height={4} fill={P.roofTerracottaLight} />
        </g>
      ))}
      <line x1={x} y1={G - 30} x2={x + HW} y2={G - 30} stroke={P.roofTerracottaLight} strokeWidth={1.2} />
      {/* for-sale style sign */}
      <rect x={x + HW + 20} y={G - 44} width={3} height={44} fill={P.trunk} />
      <rect x={x + HW + 8} y={G - 58} width={28} height={18} rx={2} fill={P.wall} />
      <rect x={x + HW + 12} y={G - 52} width={18} height={2} fill={P.pine} />
      <rect x={x + HW + 12} y={G - 47} width={12} height={2} fill={P.wallDeep} />
    </g>
  );
}

function Foundation({ x, night }: { x: number; night: boolean }) {
  const slab = night ? shade(P.sidewalk, 0.4) : P.sidewalk;
  return (
    <g>
      <ellipse cx={x + HW / 2} cy={G + 2} rx={HW / 2 + 10} ry={5} fill={P.shadow} opacity={0.6} />
      <rect x={x - 4} y={G - 14} width={HW + 8} height={14} fill={slab} />
      <rect x={x - 4} y={G - 14} width={HW + 8} height={3} fill={night ? shade(P.sidewalk, 0.2) : P.wall} />
      <rect x={x + HW - 24} y={G - 14} width={28} height={14} fill={shade(slab, 0.22)} />
      {[10, 36, 62, 88, 114, 136].map((dx) => <rect key={dx} x={x + dx} y={G - 34} width={2} height={20} fill={P.roofTerracotta} />)}
      <rect x={x - 30} y={G - 8} width={14} height={8} fill={night ? shade(P.dirt, 0.4) : P.dirt} />
      <path d={`M${x - 36} ${G} q8 -20 20 0 z`} fill={P.dirtShade} />
    </g>
  );
}

function Framing({ x, night }: { x: number; night: boolean }) {
  const wood = night ? shade(P.wallClay, 0.35) : P.wallClay;
  const woodShade = night ? shade(P.wallClayShade, 0.35) : P.wallClayShade;
  return (
    <g>
      <ellipse cx={x + HW / 2} cy={G + 2} rx={HW / 2 + 10} ry={5} fill={P.shadow} opacity={0.6} />
      <rect x={x - 4} y={G - 10} width={HW + 8} height={10} fill={night ? shade(P.sidewalk, 0.4) : P.sidewalk} />
      {/* studs */}
      {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={x + 4 + i * ((HW - 8) / 8) - 1.5} y={G - 10 - HH} width={3} height={HH} fill={i > 5 ? woodShade : wood} />)}
      <rect x={x} y={G - 10 - HH} width={HW} height={4} fill={wood} />
      <rect x={x} y={G - 14} width={HW} height={4} fill={woodShade} />
      {/* rafters */}
      {[0, 1, 2, 3, 4].map((i) => {
        const px = x + (HW / 2 - 4) * (i / 4);
        return <line key={i} x1={px} y1={G - 10 - HH} x2={x + HW / 2} y2={G - 10 - HH - RISE} stroke={wood} strokeWidth={3} />;
      })}
      {[0, 1, 2, 3, 4].map((i) => {
        const px = x + HW / 2 + 4 + (HW / 2 - 4) * (i / 4);
        return <line key={i} x1={px} y1={G - 10 - HH} x2={x + HW / 2} y2={G - 10 - HH - RISE} stroke={woodShade} strokeWidth={3} />;
      })}
      <line x1={x + HW / 2} y1={G - 10 - HH - RISE} x2={x + HW / 2} y2={G - 10 - HH} stroke={woodShade} strokeWidth={3} />
      {/* lumber pile */}
      <rect x={x + HW + 14} y={G - 10} width={40} height={10} fill={wood} />
      <rect x={x + HW + 18} y={G - 18} width={32} height={8} fill={woodShade} />
    </g>
  );
}

function Roofed({ x, night }: { x: number; night: boolean }) {
  const wrap = night ? shade(P.wallSage, 0.4) : P.wallSage;
  const wrapShade = night ? shade(P.wallSageShade, 0.4) : P.wallSageShade;
  const roof = night ? shade(P.roof, 0.3) : P.roof;
  return (
    <g>
      <ellipse cx={x + HW / 2} cy={G + 2} rx={HW / 2 + 10} ry={5} fill={P.shadow} opacity={0.6} />
      <rect x={x} y={G - HH} width={HW} height={HH} fill={wrap} />
      <rect x={x + HW * 0.68} y={G - HH} width={HW * 0.32} height={HH} fill={wrapShade} />
      {/* openings, unglazed */}
      <rect x={x + 18} y={G - HH + 18} width={22} height={26} fill={shade(wrapShade, 0.35)} />
      <rect x={x + 64} y={G - HH + 18} width={22} height={26} fill={shade(wrapShade, 0.35)} />
      <rect x={x + 108} y={G - 40} width={22} height={40} fill={shade(wrapShade, 0.45)} />
      <path d={`M${x - 10} ${G - HH} L${x + HW / 2} ${G - HH - RISE} L${x + HW + 10} ${G - HH} Z`} fill={roof} />
      <path d={`M${x - 10} ${G - HH} L${x + HW / 2} ${G - HH - RISE} L${x + HW / 2} ${G - HH} Z`} fill={night ? shade(P.roofLight, 0.3) : P.roofLight} />
      <rect x={x - 10} y={G - HH - 2} width={HW + 20} height={4} fill={shade(roof, 0.3)} />
      {/* ladder */}
      <line x1={x + HW + 24} y1={G} x2={x + HW + 6} y2={G - HH - 10} stroke={P.trunkLight} strokeWidth={3} />
      <line x1={x + HW + 34} y1={G} x2={x + HW + 16} y2={G - HH - 10} stroke={P.trunkLight} strokeWidth={3} />
    </g>
  );
}

function Finished({ x, night }: { x: number; night: boolean }) {
  const wall = night ? shade(P.wall, 0.45) : P.wall;
  const wallShade = night ? shade(P.wallShade, 0.45) : P.wallShade;
  const roof = night ? shade(P.roofTerracotta, 0.3) : P.roofTerracotta;
  const glass = night ? P.windowLit : P.window;
  return (
    <g>
      <ellipse cx={x + HW / 2} cy={G + 2} rx={HW / 2 + 14} ry={5} fill={P.shadow} opacity={0.6} />
      <rect x={x} y={G - HH} width={HW} height={HH} fill={wall} />
      <rect x={x + HW * 0.68} y={G - HH} width={HW * 0.32} height={HH} fill={wallShade} />
      {[18, 64].map((dx) => (
        <g key={dx}>
          <rect x={x + dx} y={G - HH + 18} width={22} height={26} fill={glass} />
          <rect x={x + dx + 10} y={G - HH + 18} width={2} height={26} fill={wall} />
          <rect x={x + dx - 2} y={G - HH + 44} width={26} height={3} fill={wallShade} />
        </g>
      ))}
      <rect x={x + 108} y={G - 40} width={22} height={40} rx={1} fill={P.pine} />
      <circle cx={x + 126} cy={G - 20} r={1.6} fill={P.brass} />
      <rect x={x + 104} y={G - 2} width={30} height={2} fill={wallShade} />
      {night && <circle cx={x + 119} cy={G - 50} r={5} fill={P.lampCone} />}
      <circle cx={x + 119} cy={G - 50} r={1.8} fill={night ? P.windowLit : P.brass} />
      <path d={`M${x - 10} ${G - HH} L${x + HW / 2} ${G - HH - RISE} L${x + HW + 10} ${G - HH} Z`} fill={roof} />
      <path d={`M${x - 10} ${G - HH} L${x + HW / 2} ${G - HH - RISE} L${x + HW / 2} ${G - HH} Z`} fill={night ? shade(P.roofTerracottaLight, 0.3) : P.roofTerracottaLight} />
      <rect x={x - 10} y={G - HH - 2} width={HW + 20} height={4} fill={shade(roof, 0.3)} />
      <rect x={x + 100} y={G - HH - RISE + 6} width={12} height={22} fill={wallShade} />
      {/* path, mailbox, bush */}
      <rect x={x + 112} y={G} width={14} height={6} fill={P.sidewalk} />
      <rect x={x + HW + 20} y={G - 20} width={2} height={20} fill={P.trunk} />
      <rect x={x + HW + 16} y={G - 26} width={10} height={6} rx={2} fill={P.roof} />
      <circle cx={x + 8} cy={G - 6} r={9} fill={P.tree} />
      <circle cx={x + 4} cy={G - 10} r={5} fill={P.treeLight} />
    </g>
  );
}

export function SkylineBand({ opacity = 0.12 }: { opacity?: number }) {
  const { theme } = useTheme();
  const night = theme === 'dark';
  const ground = night ? shade(P.lawnDeep, 0.3) : P.lawnShade;
  return (
    <div
      className="absolute inset-x-0 top-0 h-[260px] pointer-events-none select-none"
      style={{
        opacity,
        maskImage: 'linear-gradient(to bottom, #000 50%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, #000 50%, transparent 100%)',
      }}
      aria-hidden
      data-backdrop="skyline"
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMax slice" className="block">
        <LampDefs />
        {/* ground: lawn strip with a kerb */}
        <rect x={0} y={G} width={W} height={H - G} fill={ground} />
        <rect x={0} y={G + 14} width={W} height={4} fill={night ? P.sidewalkShade : P.curb} />
        <rect x={0} y={G + 18} width={W} height={H - G - 18} fill={night ? P.asphaltDeep : P.asphalt} />
        <line x1={0} y1={G + 40} x2={W} y2={G + 40} stroke={P.paint} strokeWidth={2} strokeDasharray="24 20" opacity={0.5} />

        {/* the five stages */}
        <Tree x={40} y={G} kind="cypress" scale={0.9} />
        <Lot x={90} night={night} />
        <StreetLamp x={300} y={G + 2} on={night} height={70} />
        <Foundation x={340} night={night} />
        <Tree x={560} y={G} kind="oak" scale={0.9} />
        <Framing x={610} night={night} />
        <StreetLamp x={840} y={G + 2} on={night} height={70} />
        <Roofed x={880} night={night} />
        <Tree x={1090} y={G} kind="jacaranda" scale={0.9} />
        <Finished x={1130} night={night} />
        <StreetLamp x={1340} y={G + 2} on={night} height={70} />
        <Tree x={1400} y={G} kind="palm" scale={1} />
      </svg>
    </div>
  );
}
