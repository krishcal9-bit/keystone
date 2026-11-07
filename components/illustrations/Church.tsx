import { palette as P, shade } from '@/lib/illustrationPalette';
import { Window, Door, Facade, GableRoof, ContactShadow, Bush } from './primitives';

type Props = { x?: number; y?: number; scale?: number; night?: boolean; tower?: 'steeple' | 'bell' };

/** Sanctuary with a pitched roof, steeple or bell tower, arched windows and double doors. Width ≈ 150. */
export function Church({ x = 0, y = 0, scale = 1, night = false, tower = 'steeple' }: Props) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ContactShadow w={200} h={10} x={80} />
      {/* nave */}
      <Facade x={0} y={-70} w={120} h={70} color={P.wall} depth={28} skew={0.5} />
      <GableRoof x={0} y={-70} w={120} rise={34} depth={28} skew={0.5} color={P.roof} overhang={6} />
      {/* tower */}
      <g>
        <rect x={124} y={-96} width={26} height={96} fill={P.wallShade} />
        <rect x={150} y={-96} width={10} height={96} fill={P.wallDeep} />
        <rect x={124} y={-3} width={36} height={3} fill={P.shadow} opacity={0.5} />
        {tower === 'steeple' ? (
          <>
            <path d="M120 -96 L137 -140 L154 -96 Z" fill={P.roofLight} />
            <path d="M137 -140 L154 -96 L164 -100 L142 -140 Z" fill={P.roof} />
            <rect x={136} y={-150} width={2} height={10} fill={P.brass} />
            <rect x={133} y={-147} width={8} height={2} fill={P.brass} />
          </>
        ) : (
          <>
            <rect x={120} y={-104} width={40} height={8} fill={P.roof} />
            <rect x={126} y={-122} width={24} height={18} fill={P.wall} />
            <path d="M130 -118 a6 6 0 0 1 12 0 v12 h-12 z" fill={P.roofDeep} />
            <path d="M133 -114 a3 3 0 0 1 6 0 v5 h-6 z" fill={P.brass} />
            <path d="M122 -122 L138 -132 L154 -122 Z" fill={P.roofLight} />
          </>
        )}
        <Window x={132} y={-80} w={10} h={22} night={night} arch mullions={false} />
        <Window x={132} y={-48} w={10} h={14} night={night} arch mullions={false} />
      </g>
      {/* windows + doors */}
      <Window x={12} y={-56} w={14} h={30} night={night} arch mullions={false} />
      <Window x={34} y={-56} w={14} h={30} night={night} arch mullions={false} delay={80} />
      <Window x={88} y={-56} w={14} h={30} night={night} arch mullions={false} delay={160} />
      <Door x={54} y={-38} w={22} h={38} color={P.trunk} night={night} arch mat={false} />
      <rect x={64.4} y={-34} width={1.2} height={34} fill={shade(P.trunk, 0.35)} />
      {/* rose window */}
      <circle cx={60} cy={-84} r={7} fill={P.wallDeep} />
      <circle cx={60} cy={-84} r={5.5} fill={night ? P.windowLit : P.window} className="ks-t" />
      <circle cx={60} cy={-84} r={1.5} fill={P.wallDeep} />
      <path d="M50 -4 h40 v4 h-40 z" fill={P.stoneLight} />
      <Bush x={-8} r={6} />
      <Bush x={170} r={6} />
    </g>
  );
}
