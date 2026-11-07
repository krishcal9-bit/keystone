import { palette as P, shade } from '@/lib/illustrationPalette';
import { ContactShadow } from './primitives';

type PersonProps = { x?: number; y?: number; scale?: number; seed?: number; child?: boolean; walking?: boolean; flip?: boolean; carrying?: boolean };

/** Warm, rounded figure with skin, hair and clothing. Height ≈ 44 (child ≈ 28). */
export function Person({ x = 0, y = 0, scale = 1, seed = 0, child = false, walking = false, flip = false, carrying = false }: PersonProps) {
  const skin = P.skin[seed % P.skin.length];
  const hair = P.hair[(seed * 7 + 3) % P.hair.length];
  const shirt = P.shirt[(seed * 3 + 1) % P.shirt.length];
  const pants = P.pants[(seed * 5 + 2) % P.pants.length];
  const h = child ? 0.64 : 1;
  const legStyle = walking ? ({ animation: `ks-walk 0.9s ease-in-out ${-(seed % 3) * 0.3}s infinite alternate`, transformOrigin: '0px -18px' } as React.CSSProperties) : undefined;
  const hairStyle = (seed * 11) % 4;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale * h}) ${flip ? 'scale(-1 1)' : ''}`}>
      <ContactShadow w={14} h={3} />
      {/* legs */}
      <g style={legStyle}>
        <rect x={-5} y={-18} width={4.2} height={18} rx={2} fill={pants} />
      </g>
      <g style={legStyle ? { ...legStyle, animationDirection: 'alternate-reverse' } : undefined}>
        <rect x={0.8} y={-18} width={4.2} height={18} rx={2} fill={shade(pants, 0.2)} />
      </g>
      {/* body */}
      <rect x={-7} y={-36} width={14} height={20} rx={5} fill={shirt} />
      <rect x={1} y={-36} width={6} height={20} rx={4} fill={shade(shirt, 0.18)} />
      {/* arms */}
      <rect x={-10.5} y={-34} width={4} height={15} rx={2} fill={shirt} />
      <rect x={6.5} y={-34} width={4} height={15} rx={2} fill={shade(shirt, 0.18)} />
      <circle cx={-8.5} cy={-19} r={2.2} fill={skin} />
      <circle cx={8.5} cy={-19} r={2.2} fill={shade(skin, 0.1)} />
      {carrying && <rect x={-14} y={-28} width={10} height={9} rx={1.2} fill={P.dirt} />}
      {/* head */}
      <circle cx={0} cy={-43} r={7} fill={skin} />
      <path d="M-7 -43 a7 7 0 0 1 14 0 v2 a7 7 0 0 1 -14 0 z" fill={shade(skin, 0.12)} opacity={0.5} />
      {/* hair variants */}
      {hairStyle === 0 && <path d="M-7 -44 a7 7 0 0 1 14 0 v-1 a7 7 0 0 0 -14 0 z M-7 -44 q0 -8 7 -8 q7 0 7 8 z" fill={hair} />}
      {hairStyle === 1 && <path d="M-7.5 -44 q1 -10 7.5 -10 q7 0 7.5 10 l-1 3 q-2 -6 -6.5 -6 q-4.5 0 -6.5 6 z" fill={hair} />}
      {hairStyle === 2 && <path d="M-7.5 -43 q0 -11 7.5 -11 q8 0 7.5 11 l-1.5 8 l-1 -8 q-1 -5 -5 -5 q-4 0 -5 5 l-1 8 z" fill={hair} />}
      {hairStyle === 3 && <circle cx={0} cy={-47} r={7.5} fill={hair} />}
      {hairStyle === 3 && <circle cx={0} cy={-43} r={7} fill={skin} />}
    </g>
  );
}
