'use client';
/**
 * Top-down (aerial) illustrated lot: lawn, building footprint with a shaded roof ridge, parking with
 * painted stalls, trees with soft shadows and the street along the street side. Shared by the Site Detail
 * diagram, the Lot Scan samples and the landing "Measure any lot" scene.
 */
import { palette as P, shade, seeded } from '@/lib/illustrationPalette';
import type { Parcel } from '@/lib/sb4';
import type { Pt, Rect } from '@/lib/geometry';
import { pointInPolygon, rectsOverlap } from '@/lib/geometry';
import { stallsFor } from '@/lib/stalls';

export type AerialLotProps = {
  parcel: Pick<Parcel, 'lotPolygon' | 'buildingRect' | 'parkingRects' | 'streetSide' | 'id'>;
  size?: number; // rendered width in px of the unit frame
  night?: boolean;
  keptStalls?: number; // how many stalls to draw as "kept" (filled); others fade when buildable
  keptShare?: number; // 0–1 share of stalls kept (alternative to keptStalls)
  showBuildable?: Pt[]; // polygon (normalized) washed in pine
  children?: React.ReactNode;
  id?: string;
  ambient?: boolean;
  seed?: number;
  /** Fill for the ground around the lot; pass 'none' to let a scene behind show through. */
  groundFill?: string;
};

export const polyToPath = (pts: Pt[], s: number, ox = 0, oy = 0) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${(ox + p.x * s).toFixed(1)} ${(oy + p.y * s).toFixed(1)}`).join(' ') + ' Z';

export { stallsFor };

export type AerialTree = { x: number; y: number; r: number; kind: number };

/** Deterministic tree scatter in the open land (normalized lot frame). Shared with the Lot Scan fixtures. */
export function treesFor(parcel: AerialLotProps['parcel'], seed = 3): AerialTree[] {
  const poly = parcel.lotPolygon;
  const bx = Math.max(...poly.map((p) => p.x)), by = Math.max(...poly.map((p) => p.y));
  const rnd = seeded(seed + parcel.id.length);
  const trees: AerialTree[] = [];
  const blocked = [parcel.buildingRect, ...parcel.parkingRects];
  for (let i = 0; i < 60 && trees.length < 9; i++) {
    const p = { x: rnd() * bx, y: rnd() * by };
    const r = 0.03 + rnd() * 0.03;
    const box = { x: p.x - r, y: p.y - r, w: r * 2, h: r * 2 };
    if (!pointInPolygon(p, poly)) continue;
    if (blocked.some((b) => rectsOverlap(box, { x: b.x - 0.01, y: b.y - 0.01, w: b.w + 0.02, h: b.h + 0.02 }))) continue;
    if (trees.some((t) => Math.hypot(t.x - p.x, t.y - p.y) < t.r + r + 0.01)) continue;
    trees.push({ x: p.x, y: p.y, r, kind: Math.floor(rnd() * 3) });
  }
  return trees;
}

export function AerialLot({ parcel, size = 400, night = false, keptStalls, keptShare, showBuildable, children, id = 'aerial', ambient = false, seed = 3, groundFill }: AerialLotProps) {
  const s = size;
  const poly = parcel.lotPolygon;
  const bx = Math.max(...poly.map((p) => p.x)), by = Math.max(...poly.map((p) => p.y));
  const h = by * s;
  const trees = treesFor(parcel, seed);
  const b = parcel.buildingRect;
  const clip = `${id}-clip`;
  const lawn = night ? P.lawnDeep : P.lawn;
  const streetSide = parcel.streetSide;
  const streetRect: Rect = streetSide === 'top' ? { x: -0.2, y: -0.16, w: bx + 0.4, h: 0.14 }
    : streetSide === 'bottom' ? { x: -0.2, y: by + 0.02, w: bx + 0.4, h: 0.14 }
    : streetSide === 'left' ? { x: -0.16, y: -0.2, w: 0.14, h: by + 0.4 } : { x: bx + 0.02, y: -0.2, w: 0.14, h: by + 0.4 };
  const allStalls = parcel.parkingRects.flatMap((r) => stallsFor(r, s));
  const kept = keptStalls ?? (keptShare != null ? Math.round(keptShare * allStalls.length) : allStalls.length);
  const keptList = allStalls.slice(0, kept);
  const keptBoxes = keptList.length ? [keptList.reduce((acc, r) => {
    const x0 = Math.min(acc.x, r.x), y0 = Math.min(acc.y, r.y);
    const x1 = Math.max(acc.x + acc.w, r.x + r.w), y1 = Math.max(acc.y + acc.h, r.y + r.h);
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }, { ...keptList[0] })] : [];

  return (
    <svg viewBox={`${-0.2 * s} ${-0.2 * s} ${(bx + 0.4) * s} ${(by + 0.4) * s}`} width="100%" style={{ display: 'block', aspectRatio: `${bx + 0.4} / ${by + 0.4}` }} role="img" aria-label="Aerial view of the lot">
      <defs>
        <clipPath id={clip}><path d={polyToPath(poly, s)} /></clipPath>
        <pattern id={`${id}-grass`} width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill={lawn} className="ks-t" />
          <circle cx="4" cy="5" r="1.4" fill={night ? P.lawnShade : P.lawnShade} opacity="0.45" />
          <circle cx="10" cy="11" r="1.2" fill={P.lawnDeep} opacity="0.3" />
        </pattern>
      </defs>
      {/* surrounding ground + street */}
      <rect x={-0.2 * s} y={-0.2 * s} width={(bx + 0.4) * s} height={(by + 0.4) * s} fill={groundFill ?? (night ? '#243a30' : '#C9D7CC')} className="ks-t" />
      <rect x={streetRect.x * s} y={streetRect.y * s} width={streetRect.w * s} height={streetRect.h * s} fill={night ? P.asphaltDeep : P.asphalt} className="ks-t" />
      {streetSide === 'top' || streetSide === 'bottom' ? (
        <>
          <rect x={streetRect.x * s} y={(streetRect.y + (streetSide === 'top' ? streetRect.h : 0) - 0.012) * s} width={streetRect.w * s} height={0.012 * s} fill={P.sidewalk} />
          {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={(-0.2 + i * 0.11) * s} y={(streetRect.y + streetRect.h / 2 - 0.003) * s} width={0.06 * s} height={0.006 * s} fill={P.paint} opacity={0.7} />)}
        </>
      ) : (
        <rect x={(streetRect.x + (streetSide === 'left' ? streetRect.w : 0) - 0.012) * s} y={streetRect.y * s} width={0.012 * s} height={streetRect.h * s} fill={P.sidewalk} />
      )}
      {/* lot shadow + lawn */}
      <path d={polyToPath(poly, s, 3, 4)} fill={P.shadow} opacity={0.5} />
      <path d={polyToPath(poly, s)} fill={`url(#${id}-grass)`} />
      <g clipPath={`url(#${clip})`}>
        {/* paths from street to building */}
        <rect x={(b.x + b.w / 2 - 0.02) * s} y={streetSide === 'top' ? 0 : (b.y + b.h) * s} width={0.04 * s} height={streetSide === 'top' ? b.y * s : (by - b.y - b.h) * s} fill={P.sidewalk} opacity={0.9} />
        {/* parking lots */}
        {parcel.parkingRects.map((r, i) => (
          <g key={i}>
            <rect x={r.x * s} y={r.y * s} width={r.w * s} height={r.h * s} rx={3} fill={night ? P.asphaltDeep : P.asphalt} className="ks-t" />
            <rect x={r.x * s} y={r.y * s} width={r.w * s} height={2} fill={P.asphaltLight} opacity={0.5} />
          </g>
        ))}
        {allStalls.map((st, i) => (
          <g key={i} data-stall data-kept={i < kept ? 'true' : 'false'}>
            <rect x={st.x} y={st.y} width={st.w} height={st.h} fill="none" stroke={P.paint} strokeWidth={0.9} opacity={i < kept ? 0.8 : 0.22} style={{ transition: 'opacity 320ms var(--ease-out)' }} />
            {i < kept && i % 3 === 0 && <rect x={st.x + st.w * 0.15} y={st.y + st.h * 0.1} width={st.w * 0.7} height={st.h * 0.8} rx={st.w * 0.25} fill={[P.stone, P.wall, P.roofLight, P.stoneDeep][i % 4]} opacity={0.9} />}
          </g>
        ))}
        {/* buildable wash */}
        {showBuildable && (
          <g data-buildable>
            <mask id={`${id}-bmask`}>
              <path d={polyToPath(showBuildable, s)} fill="white" />
              <rect x={(b.x - 0.015) * s} y={(b.y - 0.015) * s} width={(b.w + 0.03) * s} height={(b.h + 0.03) * s} fill="black" />
              {keptBoxes.map((k, i) => <rect key={i} x={k.x - 2} y={k.y - 2} width={k.w + 4} height={k.h + 4} fill="black" />)}
            </mask>
            <path d={polyToPath(showBuildable, s)} fill={P.pine} opacity={0.2} mask={`url(#${id}-bmask)`} className="ks-t" />
            <path d={polyToPath(showBuildable, s)} fill="none" stroke={P.pine} strokeWidth={1.5} strokeDasharray="6 4" opacity={0.9} />
          </g>
        )}
        {/* building: shadow, walls, roof planes */}
        <rect x={(b.x + 0.012) * s} y={(b.y + 0.016) * s} width={b.w * s} height={b.h * s} rx={2} fill={P.shadow} opacity={0.7} />
        <rect x={b.x * s} y={b.y * s} width={b.w * s} height={b.h * s} rx={1.5} fill={P.wallShade} />
        <path d={`M${b.x * s} ${b.y * s} L${(b.x + b.w) * s} ${b.y * s} L${(b.x + b.w / 2) * s} ${(b.y + b.h / 2) * s} Z`} fill={P.roofLight} />
        <path d={`M${b.x * s} ${b.y * s} L${b.x * s} ${(b.y + b.h) * s} L${(b.x + b.w / 2) * s} ${(b.y + b.h / 2) * s} Z`} fill={P.roof} />
        <path d={`M${(b.x + b.w) * s} ${b.y * s} L${(b.x + b.w) * s} ${(b.y + b.h) * s} L${(b.x + b.w / 2) * s} ${(b.y + b.h / 2) * s} Z`} fill={shade(P.roof, 0.18)} />
        <path d={`M${b.x * s} ${(b.y + b.h) * s} L${(b.x + b.w) * s} ${(b.y + b.h) * s} L${(b.x + b.w / 2) * s} ${(b.y + b.h / 2) * s} Z`} fill={P.roofDeep} />
        {/* steeple cap */}
        <rect x={(b.x + b.w - 0.06) * s} y={(b.y + 0.02) * s} width={0.04 * s} height={0.04 * s} fill={P.wall} />
        <rect x={(b.x + b.w - 0.052) * s} y={(b.y + 0.028) * s} width={0.024 * s} height={0.024 * s} fill={P.brass} />
        {/* trees */}
        {trees.map((t, i) => (
          <g key={i} style={ambient ? { animation: `ks-sway ${8 + (i % 3)}s ease-in-out ${-i}s infinite`, transformOrigin: `${t.x * s}px ${t.y * s}px` } : undefined}>
            <circle cx={(t.x + 0.012) * s} cy={(t.y + 0.014) * s} r={t.r * s} fill={P.shadow} opacity={0.6} />
            <circle cx={t.x * s} cy={t.y * s} r={t.r * s} fill={t.kind === 1 ? P.jacaranda : P.tree} />
            <circle cx={(t.x - t.r * 0.3) * s} cy={(t.y - t.r * 0.3) * s} r={t.r * 0.55 * s} fill={t.kind === 1 ? P.jacarandaLight : P.treeLight} />
          </g>
        ))}
        {children}
      </g>
      {/* lot outline */}
      <path d={polyToPath(poly, s)} fill="none" stroke={night ? P.wall : '#182420'} strokeWidth={1.2} opacity={0.55} data-lot-outline />
    </svg>
  );
}
