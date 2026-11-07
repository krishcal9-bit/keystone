'use client';
import { palette as P, shade } from '@/lib/illustrationPalette';
import { ContactShadow, T } from './primitives';

type Props = { x?: number; y?: number; scale?: number; color?: string; night?: boolean; flip?: boolean; kind?: 'sedan' | 'wagon' | 'pickup' };

/** Two-tone car on the ground line; headlights on at night. Length ≈ 64. */
export function Car({ x = 0, y = 0, scale = 1, color = P.stone, night = false, flip = false, kind = 'sedan' }: Props) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale}) ${flip ? 'scale(-1 1)' : ''}`}>
      <ContactShadow w={66} h={5} x={32} />
      {kind === 'pickup' ? (
        <>
          <path d="M2 -8 L2 -16 L26 -16 L30 -26 L46 -26 L48 -16 L62 -16 L64 -8 Z" fill={color} />
          <rect x={4} y={-15} width={22} height={6} fill={shade(color, 0.25)} />
          <path d="M32 -24 L44 -24 L45.5 -17 L31 -17 Z" fill={night ? P.windowLitDeep : P.window} className={T} />
        </>
      ) : (
        <>
          <path d={`M2 -8 L2 -14 Q4 -16 10 -16 L18 -16 L26 -27 L46 -27 L${kind === 'wagon' ? 60 : 56} -16 L62 -16 Q64 -14 64 -10 L64 -8 Z`} fill={color} />
          <path d="M20 -17 L27 -25 L35 -25 L35 -17 Z" fill={night ? P.windowLitDeep : P.window} className={T} />
          <path d={`M37 -25 L${kind === 'wagon' ? 58 : 46} -25 L${kind === 'wagon' ? 58 : 52} -17 L37 -17 Z`} fill={night ? P.windowLitDeep : P.windowDeep} className={T} />
          <rect x={4} y={-15} width={60} height={2} fill={shade(color, -0.2)} opacity={0.5} />
        </>
      )}
      <rect x={2} y={-10} width={62} height={2} fill={shade(color, 0.3)} />
      {/* wheels */}
      <circle cx={16} cy={-7} r={6} fill={P.roofDeep} />
      <circle cx={16} cy={-7} r={2.6} fill={P.curb} />
      <circle cx={50} cy={-7} r={6} fill={P.roofDeep} />
      <circle cx={50} cy={-7} r={2.6} fill={P.curb} />
      {/* lights */}
      <rect x={62} y={-14} width={2.5} height={3} rx={0.6} fill={night ? P.honeyGlow : P.wall} className={T} />
      <rect x={1.5} y={-14} width={2.5} height={3} rx={0.6} fill={night ? '#E07A6F' : P.roofTerracotta} className={T} />
      {night && <path d="M64 -13 L96 -2 L96 -6 L64 -14 Z" fill={P.windowLit} opacity={0.22} className={T} />}
    </g>
  );
}
