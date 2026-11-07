'use client';
import { palette as P, shade } from '@/lib/illustrationPalette';
import { ContactShadow } from './primitives';

type TreeProps = { x?: number; y?: number; scale?: number; kind?: 'oak' | 'palm' | 'jacaranda' | 'cypress'; sway?: boolean; seed?: number; far?: boolean };

/** Trees sit at (x, y) on the ground. sway = subtle 1–2° ambient rotation about the base (CSS). */
export function Tree({ x = 0, y = 0, scale = 1, kind = 'oak', sway = false, seed = 0, far = false }: TreeProps) {
  const dur = 7 + (seed % 4);
  const style = sway ? ({ animation: `ks-sway ${dur}s ease-in-out ${-(seed % 7)}s infinite`, transformOrigin: '0px 0px' } as React.CSSProperties) : undefined;
  const fade = far ? 0.7 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={fade}>
      <ContactShadow w={kind === 'palm' ? 18 : 40} h={6} />
      <g style={style}>
        {kind === 'oak' && (
          <>
            <path d="M-3 0 L-2 -22 L2 -22 L3 0 Z" fill={P.trunk} />
            <path d="M0 -22 L1 0 L3 0 L2 -22 Z" fill={shade(P.trunk, 0.25)} />
            <circle cx={0} cy={-40} r={22} fill={P.tree} />
            <circle cx={-12} cy={-32} r={14} fill={P.tree} />
            <circle cx={13} cy={-33} r={13} fill={P.treeDeep} />
            <circle cx={-6} cy={-47} r={13} fill={P.treeLight} />
            <circle cx={6} cy={-28} r={10} fill={P.treeDeep} opacity={0.8} />
          </>
        )}
        {kind === 'palm' && (
          <>
            <path d="M-2.5 0 Q-1 -30 3 -56 L6 -56 Q1 -30 2.5 0 Z" fill={P.trunk} />
            <path d="M3 -56 Q0 -30 1 0 L2.5 0 Q1 -30 6 -56 Z" fill={shade(P.trunk, 0.25)} />
            {[-70, -40, -10, 20, 50, 80, 110].map((a, i) => (
              <path key={i} d="M0 0 q14 -4 26 6 q-10 -2 -26 -6" transform={`translate(4.5 -56) rotate(${a + 180})`} fill={i % 2 ? P.treeLight : P.tree} />
            ))}
            <circle cx={4.5} cy={-55} r={3} fill={P.trunkLight} />
          </>
        )}
        {kind === 'jacaranda' && (
          <>
            <path d="M-2.5 0 L-2 -24 L2 -24 L2.5 0 Z" fill={P.trunk} />
            <path d="M-2 -24 L-10 -34 M2 -24 L10 -32" stroke={P.trunk} strokeWidth={2} />
            <circle cx={0} cy={-42} r={20} fill={P.jacaranda} />
            <circle cx={-13} cy={-36} r={12} fill={P.jacarandaLight} />
            <circle cx={12} cy={-36} r={12} fill={P.jacarandaDeep} />
            <circle cx={-3} cy={-50} r={11} fill={P.jacarandaLight} />
          </>
        )}
        {kind === 'cypress' && (
          <>
            <path d="M-1.5 0 L-1 -6 L1 -6 L1.5 0 Z" fill={P.trunk} />
            <path d="M0 -70 C-8 -58 -9 -30 -7 -6 L7 -6 C9 -30 8 -58 0 -70 Z" fill={P.treeDeep} />
            <path d="M0 -70 C-6 -58 -6 -30 -4 -6 L0 -6 Z" fill={P.treeLight} opacity={0.7} />
          </>
        )}
      </g>
    </g>
  );
}
