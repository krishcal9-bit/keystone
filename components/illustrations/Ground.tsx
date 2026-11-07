import { palette as P } from '@/lib/illustrationPalette';

/** Street band: lawn strip, sidewalk, curb, asphalt with dashed centre line. y is the sidewalk top edge. */
export function Street({ w, y, streetH = 90, sidewalkH = 16, lawnH = 10, night = false }: { w: number; y: number; streetH?: number; sidewalkH?: number; lawnH?: number; night?: boolean }) {
  const dashes: number[] = [];
  for (let x = 20; x < w; x += 70) dashes.push(x);
  return (
    <g>
      <rect x={0} y={y - lawnH} width={w} height={lawnH} fill={night ? P.lawnDeep : P.lawn} className="ks-t" />
      <rect x={0} y={y} width={w} height={sidewalkH} fill={night ? P.sidewalkShade : P.sidewalk} className="ks-t" />
      {Array.from({ length: Math.ceil(w / 60) }).map((_, i) => (
        <line key={i} x1={i * 60} y1={y} x2={i * 60} y2={y + sidewalkH} stroke={P.sidewalkShade} strokeWidth={1} opacity={0.7} />
      ))}
      <rect x={0} y={y + sidewalkH} width={w} height={4} fill={P.curb} />
      <rect x={0} y={y + sidewalkH + 3} width={w} height={2} fill={P.shadow} opacity={0.6} />
      <rect x={0} y={y + sidewalkH + 4} width={w} height={streetH} fill={night ? P.asphaltDeep : P.asphalt} className="ks-t" />
      {dashes.map((x) => (
        <rect key={x} x={x} y={y + sidewalkH + 4 + streetH / 2 - 1.5} width={34} height={3} fill={P.paint} opacity={0.75} />
      ))}
      <rect x={0} y={y + sidewalkH + 4 + streetH - 6} width={w} height={6} fill={P.asphaltLight} opacity={0.4} />
    </g>
  );
}

/** Distant hills with atmospheric perspective (lighter, less saturated). */
export function Hills({ w, y, night = false, id }: { w: number; y: number; night?: boolean; id: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-hill-far`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={night ? '#2E4256' : '#C7D6D1'} />
          <stop offset="1" stopColor={night ? '#2A3B4D' : '#D7E2DE'} />
        </linearGradient>
      </defs>
      <path d={`M0 ${y} C ${w * 0.15} ${y - 60}, ${w * 0.3} ${y - 20}, ${w * 0.45} ${y - 50} S ${w * 0.75} ${y - 10}, ${w} ${y - 40} V ${y + 40} H 0 Z`} fill={`url(#${id}-hill-far)`} className="ks-t" />
      <path d={`M0 ${y + 10} C ${w * 0.2} ${y - 30}, ${w * 0.4} ${y + 5}, ${w * 0.6} ${y - 24} S ${w * 0.85} ${y + 8}, ${w} ${y - 8} V ${y + 50} H 0 Z`} fill={night ? '#34495E' : '#B7CBC3'} opacity={0.9} className="ks-t" />
    </g>
  );
}
