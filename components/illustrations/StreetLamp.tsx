'use client';
import { palette as P } from '@/lib/illustrationPalette';
import { ContactShadow, T } from './primitives';

type Props = { x?: number; y?: number; scale?: number; on?: boolean; index?: number; flicker?: boolean; height?: number };

/**
 * Dark pine pole with a brass head. When `on`, the head glows and a soft cone pools on the ground.
 * Lamps switch with an 80 ms stagger by index; the first one flickers briefly.
 */
export function StreetLamp({ x = 0, y = 0, scale = 1, on = false, index = 0, flicker = false, height = 70 }: Props) {
  const delay = index * 80;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} data-lamp data-on={on ? 'true' : 'false'}>
      <ContactShadow w={14} h={3.5} />
      {/* light cone */}
      <g className={T} style={{ opacity: on ? 1 : 0, transitionDelay: `${delay}ms`, animation: on && flicker ? 'ks-flicker 420ms steps(1) 1' : undefined }}>
        <path d={`M-4 ${-height + 4} L-54 0 L54 0 L4 ${-height + 4} Z`} fill="url(#ks-lamp-cone)" />
        <ellipse cx={0} cy={0} rx={54} ry={9} fill={P.windowLit} opacity={0.22} />
      </g>
      {/* pole */}
      <rect x={-2} y={-height} width={4} height={height} rx={1} fill={P.pine} />
      <rect x={0.5} y={-height} width={1.5} height={height} fill={P.pineLight} opacity={0.6} />
      <rect x={-3.5} y={-6} width={7} height={6} rx={1} fill={P.pine} />
      {/* arm + head */}
      <path d={`M0 ${-height} q0 -8 8 -8 h4`} stroke={P.pine} strokeWidth={3} fill="none" strokeLinecap="round" />
      <path d={`M6 ${-height - 10} h10 l-2 6 h-6 z`} fill={P.brass} />
      <path d={`M11 ${-height - 10} h5 l-2 6 h-3 z`} fill={P.brassLight} opacity={0.7} />
      <rect x={7.5} y={-height - 4} width={7} height={2.4} rx={1} fill={on ? P.honeyGlow : P.wallDeep} className={T} style={{ transitionDelay: `${delay}ms` }} />
      <circle cx={11} cy={-height - 3} r={7} fill={P.windowLit} className={T} style={{ opacity: on ? 0.35 : 0, transitionDelay: `${delay}ms` }} />
    </g>
  );
}

/** Shared gradient defs for lamp cones; render once per SVG. */
export function LampDefs() {
  return (
    <defs>
      <linearGradient id="ks-lamp-cone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={P.windowLit} stopOpacity="0.32" />
        <stop offset="1" stopColor={P.windowLit} stopOpacity="0.02" />
      </linearGradient>
    </defs>
  );
}
