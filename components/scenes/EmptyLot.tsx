'use client';
/**
 * Small illustration for the 404 and error pages: an empty lot with survey stakes and string,
 * a lone street lamp (lit at night), a distant fence and a cypress. Static.
 */
import { useTheme } from '@/lib/theme';
import { palette as P, shade, mix } from '@/lib/illustrationPalette';
import { ContactShadow, Fence } from '@/components/illustrations/primitives';
import { StreetLamp, LampDefs } from '@/components/illustrations/StreetLamp';
import { Tree } from '@/components/illustrations/Tree';

const W = 360;
const H = 220;
const G = 176;

function Stake({ x, y, h = 26, flag = P.brass }: { x: number; y: number; h?: number; flag?: string }) {
  return (
    <g>
      <ContactShadow w={6} h={2} x={x} y={y} />
      <rect x={x - 1.4} y={y - h} width={2.8} height={h} fill={P.trunkLight} />
      <rect x={x} y={y - h} width={1.4} height={h} fill={shade(P.trunkLight, 0.25)} />
      <path d={`M${x + 1.4} ${y - h + 1} h9 l-2.5 3 l2.5 3 h-9 z`} fill={flag} />
    </g>
  );
}

export function EmptyLot({ className = '' }: { className?: string }) {
  const { theme } = useTheme();
  const night = theme === 'dark';
  const dirt = night ? mix(P.dirt, P.nightSkyLow, 0.5) : P.dirt;
  const dirtShade = night ? mix(P.dirtShade, P.nightSkyLow, 0.5) : P.dirtShade;
  const lawn = night ? P.lawnDeep : P.lawnShade;
  const stakes: [number, number][] = [[118, G - 14], [246, G - 18], [262, G + 10], [104, G + 16]];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className={`block max-w-full h-auto ${className}`} aria-hidden>
      <LampDefs />
      {/* ground: lawn verge far back, dirt lot in front */}
      <rect x={0} y={G - 40} width={W} height={40} fill={lawn} className="ks-t" />
      <path d={`M0 ${G - 22} Q ${W / 2} ${G - 44} ${W} ${G - 22} V ${H} H 0 Z`} fill={dirt} className="ks-t" />
      <ellipse cx={W / 2} cy={G + 12} rx={150} ry={22} fill={dirtShade} opacity={0.55} className="ks-t" />
      {/* tyre tracks + pebbles */}
      <path d={`M40 ${G + 30} q60 -14 120 -2 t140 -6`} stroke={dirtShade} strokeWidth={3} fill="none" opacity={0.7} />
      <path d={`M48 ${G + 38} q60 -14 120 -2 t140 -6`} stroke={dirtShade} strokeWidth={3} fill="none" opacity={0.7} />
      {[[70, G + 6], [190, G + 20], [300, G + 2], [150, G + 34]].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={3} ry={1.6} fill={P.stoneDeep} opacity={0.6} />
      ))}
      {/* a few tufts of grass */}
      {[60, 220, 330].map((x) => (
        <path key={x} d={`M${x} ${G + 8} q2 -8 4 0 q2 -9 4 0 q2 -6 3 0`} stroke={lawn} strokeWidth={1.6} fill="none" />
      ))}
      {/* back fence and tree */}
      <Fence x0={250} x1={360} y={G - 30} h={12} color={P.wallShade} />
      <Tree x={24} y={G - 28} kind="cypress" scale={0.9} />
      {/* survey stakes with string */}
      <path d={`M${stakes[0][0]} ${stakes[0][1] - 22} L${stakes[1][0]} ${stakes[1][1] - 22} L${stakes[2][0]} ${stakes[2][1] - 22} L${stakes[3][0]} ${stakes[3][1] - 22} Z`} stroke={P.roofTerracottaLight} strokeWidth={1} fill="none" strokeDasharray="4 3" />
      {stakes.map(([x, y], i) => <Stake key={i} x={x} y={y} flag={i % 2 ? P.roofTerracotta : P.brass} />)}
      {/* the lone lamp */}
      <StreetLamp x={300} y={G + 24} on={night} height={80} flicker index={0} />
    </svg>
  );
}
