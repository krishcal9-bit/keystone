'use client';
/**
 * Hero strip for the Judge Guide: a church lot seen from the street. The sanctuary on the left, its
 * parking lot in the middle, open land on the right with survey stakes and a brass keystone pin
 * marking where the homes go. Night-aware (lamps on, windows lit). Static apart from one cloud.
 */
import { useId } from 'react';
import { useTheme } from '@/lib/theme';
import { palette as P, shade, mix } from '@/lib/illustrationPalette';
import { ContactShadow, Fence } from '@/components/illustrations/primitives';
import { Sky } from '@/components/illustrations/Sky';
import { Hills, Street } from '@/components/illustrations/Ground';
import { Church } from '@/components/illustrations/Church';
import { Tree } from '@/components/illustrations/Tree';
import { Car } from '@/components/illustrations/Car';
import { StreetLamp, LampDefs } from '@/components/illustrations/StreetLamp';

const W = 960;
const H = 220;
const G = 170; // ground line

function Stake({ x, y, h = 22, flag = P.roofTerracotta }: { x: number; y: number; h?: number; flag?: string }) {
  return (
    <g>
      <ContactShadow w={6} h={2} x={x} y={y} />
      <rect x={x - 1.3} y={y - h} width={2.6} height={h} fill={P.trunkLight} />
      <rect x={x} y={y - h} width={1.3} height={h} fill={shade(P.trunkLight, 0.25)} />
      <path d={`M${x + 1.3} ${y - h + 1} h8 l-2.2 2.6 l2.2 2.6 h-8 z`} fill={flag} />
    </g>
  );
}

/** Brass map pin with a keystone (trapezoid) head. Its tip touches the ground. */
function KeystonePin({ x, y, night }: { x: number; y: number; night: boolean }) {
  const face = P.brassLight;
  const side = P.brass;
  const deep = shade(P.brass, 0.3);
  return (
    <g>
      <ContactShadow w={22} h={5} x={x} y={y} opacity={0.9} />
      {night && <ellipse cx={x} cy={y - 34} rx={26} ry={30} fill={P.honeyGlow} opacity={0.16} className="ks-t" />}
      {/* needle */}
      <path d={`M${x} ${y} L${x - 3} ${y - 18} L${x + 3} ${y - 18} Z`} fill={deep} />
      {/* keystone head: light left face, shaded right face */}
      <path d={`M${x - 14} ${y - 20} L${x - 10} ${y - 46} L${x} ${y - 46} L${x} ${y - 20} Z`} fill={face} />
      <path d={`M${x} ${y - 20} L${x} ${y - 46} L${x + 10} ${y - 46} L${x + 14} ${y - 20} Z`} fill={side} />
      <path d={`M${x - 14} ${y - 20} L${x + 14} ${y - 20} L${x + 12} ${y - 17} L${x - 12} ${y - 17} Z`} fill={deep} />
      {/* key notch */}
      <circle cx={x} cy={y - 36} r={3.2} fill={deep} />
      <rect x={x - 1.2} y={y - 34} width={2.4} height={8} fill={deep} />
      {/* highlight */}
      <path d={`M${x - 11} ${y - 44} L${x - 8} ${y - 44} L${x - 11.5} ${y - 24}`} stroke={P.honeyGlow} strokeWidth={1.2} fill="none" opacity={0.7} />
    </g>
  );
}

export function LaneHero({ className = '' }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  const { theme } = useTheme();
  const night = theme === 'dark';
  const lawn = night ? P.lawnDeep : P.lawn;
  const lawnShade = night ? shade(P.lawnDeep, 0.15) : P.lawnShade;
  const dirt = night ? mix(P.dirt, P.nightSkyLow, 0.5) : P.dirt;
  const dirtShade = night ? mix(P.dirtShade, P.nightSkyLow, 0.5) : P.dirtShade;
  const asphalt = night ? P.asphaltDeep : P.asphalt;
  // parking lot (trapezoid, seen slightly from above) and open land to its right
  const lot = { x0: 300, x1: 560, top: G - 34, bottom: G + 4 };
  const stakes: [number, number][] = [[640, G - 24], [860, G - 28], [890, G + 2], [620, G + 6]];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className={`block overflow-hidden ${className}`} aria-hidden>
      <LampDefs />
      <Sky w={W} h={H} night={night} id={`${id}-sky`} />
      <Hills w={W} y={G - 60} night={night} id={id} />
      {/* ground plane: lawn, then the lot's dirt apron */}
      <rect x={0} y={G - 44} width={W} height={60} fill={lawn} className="ks-t" />
      <rect x={0} y={G - 44} width={W} height={6} fill={lawnShade} opacity={0.5} className="ks-t" />
      <path d={`M590 ${G - 30} Q 760 ${G - 46} ${W} ${G - 30} V ${G + 16} H 590 Z`} fill={dirt} className="ks-t" />
      <ellipse cx={760} cy={G - 4} rx={120} ry={14} fill={dirtShade} opacity={0.5} className="ks-t" />
      {/* back fence and far trees */}
      <Fence x0={0} x1={96} y={G - 40} h={11} color={P.wallShade} />
      <Fence x0={600} x1={W} y={G - 40} h={11} color={P.wallShade} />
      <Tree x={40} y={G - 36} kind="jacaranda" scale={0.85} far />
      <Tree x={930} y={G - 36} kind="oak" scale={0.9} far />
      <Tree x={700} y={G - 38} kind="cypress" scale={0.75} far />
      {/* parking lot: asphalt, stall stripes, two cars */}
      <path d={`M${lot.x0 + 12} ${lot.top} H${lot.x1 - 12} L${lot.x1} ${lot.bottom} H${lot.x0} Z`} fill={asphalt} className="ks-t" />
      <path d={`M${lot.x0} ${lot.bottom} H${lot.x1} V${lot.bottom + 3} H${lot.x0} Z`} fill={P.shadow} opacity={0.5} />
      {Array.from({ length: 8 }).map((_, i) => {
        const x = lot.x0 + 30 + i * 28;
        return <path key={i} d={`M${x} ${lot.top + 4} L${x - 3} ${lot.bottom - 6}`} stroke={P.paint} strokeWidth={1.6} opacity={0.75} />;
      })}
      <Car x={lot.x0 + 36} y={lot.bottom - 7} scale={0.6} color={P.stone} night={night} />
      <Car x={lot.x0 + 150} y={lot.bottom - 7} scale={0.6} color={P.roofTerracotta} night={night} kind="wagon" />
      {/* the sanctuary */}
      <Church x={90} y={G} scale={0.92} night={night} tower="steeple" />
      {/* survey string + stakes + the pin */}
      <path d={`M${stakes[0][0]} ${stakes[0][1] - 18} L${stakes[1][0]} ${stakes[1][1] - 18} L${stakes[2][0]} ${stakes[2][1] - 18} L${stakes[3][0]} ${stakes[3][1] - 18} Z`} stroke={P.roofTerracottaLight} strokeWidth={1} fill="none" strokeDasharray="4 3" />
      {stakes.map(([x, y], i) => <Stake key={i} x={x} y={y} flag={i % 2 ? P.brass : P.roofTerracotta} />)}
      <KeystonePin x={760} y={G - 6} night={night} />
      {/* street with lamps */}
      <Street w={W} y={G + 16} streetH={26} sidewalkH={12} lawnH={0} night={night} />
      <StreetLamp x={280} y={G + 28} on={night} height={64} index={0} flicker />
      <StreetLamp x={590} y={G + 28} on={night} height={64} index={1} />
      <StreetLamp x={905} y={G + 28} on={night} height={64} index={2} />
    </svg>
  );
}
