import { palette as P } from '@/lib/illustrationPalette';

type Props = { w: number; h: number; night?: boolean; dusk?: boolean; id: string; clouds?: boolean; stars?: boolean };

/**
 * Sky backdrop. Day: pale blue to page paper. Dusk: warm horizon. Night: navy to ink with a moon and a few stars.
 * Theme switches crossfade the two gradients over 600 ms (opacity), never a flat inversion.
 */
export function Sky({ w, h, night = false, dusk = false, id, clouds = true, stars = true }: Props) {
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-day`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dusk ? P.skyDuskHigh : P.sky} />
          <stop offset="0.7" stopColor={dusk ? P.skyDusk : P.skyLow} />
          <stop offset="1" stopColor={P.skyLow} />
        </linearGradient>
        <linearGradient id={`${id}-night`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={P.nightSkyHigh} />
          <stop offset="0.75" stopColor={P.nightSkyLow} />
          <stop offset="1" stopColor={P.nightHorizon} />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill={`url(#${id}-day)`} />
      <rect width={w} height={h} fill={`url(#${id}-night)`} className="ks-t" style={{ opacity: night ? 1 : 0 }} />
      {/* moon + stars (scenery only) */}
      <g className="ks-t" style={{ opacity: night && stars ? 1 : 0 }} aria-hidden>
        <circle cx={w * 0.78} cy={h * 0.16} r={h * 0.045} fill={P.moon} />
        <circle cx={w * 0.78 + h * 0.018} cy={h * 0.16 - h * 0.012} r={h * 0.038} fill={P.nightSkyHigh} opacity={0.92} />
        {[[0.08, 0.12], [0.2, 0.3], [0.33, 0.08], [0.47, 0.22], [0.6, 0.1], [0.9, 0.3], [0.86, 0.06], [0.14, 0.44], [0.7, 0.36], [0.4, 0.4]].map(([sx, sy], i) => (
          <circle key={i} cx={w * sx} cy={h * sy} r={i % 3 === 0 ? 1.4 : 0.9} fill={P.star} opacity={0.5 + (i % 4) * 0.12} />
        ))}
      </g>
      {/* clouds (one drifts slowly) */}
      {clouds && (
        <g className="ks-t" style={{ opacity: night ? 0.12 : 0.9 }}>
          <g className="ks-drift" style={{ animationDuration: '46s' }}>
            <Cloud x={w * 0.18} y={h * 0.22} s={1} />
          </g>
          <Cloud x={w * 0.62} y={h * 0.14} s={0.7} />
          <Cloud x={w * 0.88} y={h * 0.3} s={0.55} />
        </g>
      )}
    </g>
  );
}

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={46} ry={12} fill="#FFFFFF" opacity={0.85} />
      <circle cx={-14} cy={-8} r={14} fill="#FFFFFF" opacity={0.9} />
      <circle cx={10} cy={-10} r={17} fill="#FFFFFF" opacity={0.9} />
      <circle cx={28} cy={-3} r={11} fill="#FFFFFF" opacity={0.85} />
      <ellipse cx={4} cy={6} rx={40} ry={6} fill={P.skyDuskHigh} opacity={0.35} />
    </g>
  );
}
