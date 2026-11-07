'use client';
/**
 * Soft, blurred illustrated aerial neighbourhood strip along the bottom of an inner page
 * (Site Detail and Lot Scan). Top-down rooftops of varied houses, streets, tree canopies and a park,
 * drawn only with palette colours. Night variant: darker lawns, roof-lights as small brass dots.
 * No motion. Rendered at ~35 % opacity with an 8 px blur so content stays legible over it.
 */
import { palette as P, shade, seeded } from '@/lib/illustrationPalette';

export type AerialBackdropProps = {
  night?: boolean;
  /** Height of the strip in px (it hugs the bottom edge). */
  height?: number;
  opacity?: number;
  blur?: number;
  className?: string;
};

const W = 1600, H = 420;

type House = { x: number; y: number; w: number; h: number; tone: number; rot: number; gable: boolean };
type Tree = { x: number; y: number; r: number; kind: number };

function buildScene(seed = 7) {
  const rnd = seeded(seed);
  const houses: House[] = [];
  const trees: Tree[] = [];
  const park = { x: 980, y: 150, w: 300, h: 190 };
  // two streets: one horizontal through the middle, one vertical
  const streets = [{ x: 0, y: 196, w: W, h: 44 }, { x: 640, y: 0, w: 40, h: H }];
  const blocked = (r: { x: number; y: number; w: number; h: number }) =>
    [park, ...streets].some((b) => r.x < b.x + b.w + 10 && r.x + r.w + 10 > b.x && r.y < b.y + b.h + 10 && r.y + r.h + 10 > b.y);
  for (let i = 0; i < 900 && houses.length < 46; i++) {
    const w = 46 + rnd() * 34, h = 40 + rnd() * 26;
    const x = rnd() * (W - w), y = rnd() * (H - h);
    const r = { x, y, w, h };
    if (blocked(r)) continue;
    if (houses.some((o) => r.x < o.x + o.w + 18 && r.x + r.w + 18 > o.x && r.y < o.y + o.h + 18 && r.y + r.h + 18 > o.y)) continue;
    houses.push({ x, y, w, h, tone: Math.floor(rnd() * 4), rot: (rnd() - 0.5) * 6, gable: rnd() > 0.5 });
  }
  for (let i = 0; i < 1200 && trees.length < 90; i++) {
    const r = 7 + rnd() * 12;
    const x = r + rnd() * (W - 2 * r), y = r + rnd() * (H - 2 * r);
    const box = { x: x - r, y: y - r, w: 2 * r, h: 2 * r };
    const inPark = x > park.x && x < park.x + park.w && y > park.y && y < park.y + park.h;
    if (!inPark && streets.some((b) => box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y)) continue;
    if (houses.some((o) => box.x < o.x + o.w + 3 && box.x + box.w + 3 > o.x && box.y < o.y + o.h + 3 && box.y + box.h + 3 > o.y)) continue;
    if (trees.some((t) => Math.hypot(t.x - x, t.y - y) < t.r + r + 2)) continue;
    trees.push({ x, y, r, kind: Math.floor(rnd() * 4) });
  }
  return { houses, trees, park, streets };
}

const SCENE = buildScene();

export function AerialBackdrop({ night = false, height = 420, opacity = 0.35, blur = 8, className = '' }: AerialBackdropProps) {
  const { houses, trees, park, streets } = SCENE;
  const lawn = night ? P.lawnDeep : P.lawn;
  const lawnShade = night ? shade(P.lawnDeep, 0.25) : P.lawnShade;
  const roofs = [P.roof, P.roofTerracotta, P.wallClayShade, P.stone];
  const roofsLight = [P.roofLight, P.roofTerracottaLight, P.wallClay, P.stoneLight];
  const asphalt = night ? P.asphaltDeep : P.asphalt;
  return (
    <div
      className={`absolute inset-x-0 bottom-0 pointer-events-none select-none ${className}`}
      style={{ height, opacity, filter: `blur(${blur}px)`, maskImage: 'linear-gradient(to bottom, transparent, black 30%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 30%)' }}
      aria-hidden
      data-aerial-backdrop
    >
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMax slice" style={{ display: 'block' }}>
        <rect width={W} height={H} fill={lawn} className="ks-t" />
        {/* lawn texture */}
        {Array.from({ length: 60 }).map((_, i) => (
          <circle key={i} cx={(i * 173) % W} cy={(i * 97) % H} r={1.6} fill={lawnShade} opacity={0.5} className="ks-t" />
        ))}
        {/* park */}
        <rect x={park.x} y={park.y} width={park.w} height={park.h} rx={10} fill={night ? shade(P.lawnDeep, 0.1) : P.lawnShade} className="ks-t" />
        <path d={`M${park.x + 20} ${park.y + park.h / 2} Q${park.x + park.w / 2} ${park.y + 20} ${park.x + park.w - 20} ${park.y + park.h / 2} Q${park.x + park.w / 2} ${park.y + park.h - 20} ${park.x + 20} ${park.y + park.h / 2}`} fill="none" stroke={P.sidewalk} strokeWidth={6} opacity={0.9} />
        <circle cx={park.x + park.w / 2} cy={park.y + park.h / 2} r={16} fill={P.ocean} />
        {/* streets with sidewalks, centrelines and cars */}
        {streets.map((s, i) => (
          <g key={i}>
            <rect x={s.x - 6} y={s.y - 6} width={s.w + 12} height={s.h + 12} fill={P.sidewalk} opacity={0.85} />
            <rect x={s.x} y={s.y} width={s.w} height={s.h} fill={asphalt} className="ks-t" />
            {s.w > s.h
              ? Array.from({ length: 28 }).map((_, k) => <rect key={k} x={s.x + k * 58 + 8} y={s.y + s.h / 2 - 1.2} width={30} height={2.4} fill={P.paint} opacity={0.6} />)
              : Array.from({ length: 8 }).map((_, k) => <rect key={k} x={s.x + s.w / 2 - 1.2} y={s.y + k * 58 + 8} width={2.4} height={30} fill={P.paint} opacity={0.6} />)}
          </g>
        ))}
        {[180, 460, 820, 1180, 1420].map((x, i) => (
          <g key={i}>
            <rect x={x + 3} y={(i % 2 ? 203 : 221) + 3} width={22} height={11} rx={3} fill={P.shadow} />
            <rect x={x} y={i % 2 ? 203 : 221} width={22} height={11} rx={3} fill={[P.wall, P.roof, P.roofTerracotta, P.stone, P.window][i]} className="ks-t" />
            <rect x={x + 6} y={(i % 2 ? 203 : 221) + 2} width={10} height={7} rx={1.5} fill={P.windowDeep} opacity={0.8} />
            {night && <circle cx={i % 2 ? x : x + 22} cy={(i % 2 ? 203 : 221) + 5.5} r={2.4} fill={P.windowLit} />}
          </g>
        ))}
        {/* houses: hip or gable roofs, each with a contact shadow and a driveway toward the nearest street */}
        {houses.map((hs, i) => {
          const c = roofs[hs.tone], l = roofsLight[hs.tone];
          const cx = hs.x + hs.w / 2, cy = hs.y + hs.h / 2;
          const towardsTop = hs.y > 240;
          return (
            <g key={i} transform={`rotate(${hs.rot} ${cx} ${cy})`}>
              <rect x={hs.x + 5} y={hs.y + 6} width={hs.w} height={hs.h} rx={2} fill={P.shadow} opacity={0.75} />
              <rect x={hs.x - 4} y={towardsTop ? hs.y - 22 : hs.y + hs.h} width={10} height={22} fill={P.sidewalk} opacity={0.8} />
              {hs.gable ? (
                <>
                  <rect x={hs.x} y={hs.y} width={hs.w} height={hs.h / 2} fill={l} />
                  <rect x={hs.x} y={hs.y + hs.h / 2} width={hs.w} height={hs.h / 2} fill={c} />
                  <rect x={hs.x} y={hs.y + hs.h / 2 - 0.8} width={hs.w} height={1.6} fill={shade(c, 0.35)} />
                </>
              ) : (
                <>
                  <rect x={hs.x} y={hs.y} width={hs.w} height={hs.h} fill={c} />
                  <path d={`M${hs.x} ${hs.y} L${hs.x + hs.w} ${hs.y} L${cx} ${cy} Z`} fill={l} />
                  <path d={`M${hs.x} ${hs.y} L${hs.x} ${hs.y + hs.h} L${cx} ${cy} Z`} fill={shade(l, 0.12)} />
                  <path d={`M${hs.x} ${hs.y + hs.h} L${hs.x + hs.w} ${hs.y + hs.h} L${cx} ${cy} Z`} fill={shade(c, 0.3)} />
                </>
              )}
              <rect x={hs.x + hs.w - 12} y={hs.y + 5} width={5} height={5} fill={P.wallDeep} />
              {night && <circle cx={hs.x + 4} cy={towardsTop ? hs.y + 3 : hs.y + hs.h - 3} r={2.2} fill={P.windowLit} />}
            </g>
          );
        })}
        {trees.map((t, i) => {
          const dark = t.kind === 1 ? P.jacaranda : t.kind === 2 ? P.treeDeep : P.tree;
          const light = t.kind === 1 ? P.jacarandaLight : P.treeLight;
          return (
            <g key={i}>
              <circle cx={t.x + 3} cy={t.y + 4} r={t.r} fill={P.shadow} opacity={0.55} />
              <circle cx={t.x} cy={t.y} r={t.r} fill={night ? shade(dark, 0.25) : dark} className="ks-t" />
              <circle cx={t.x - t.r * 0.3} cy={t.y - t.r * 0.3} r={t.r * 0.55} fill={night ? shade(light, 0.3) : light} className="ks-t" />
            </g>
          );
        })}
        {/* street lamps: brass dots with a faint pool of light at night */}
        {[120, 420, 760, 1060, 1380].map((x, i) => (
          <g key={i}>
            {night && <circle cx={x} cy={248} r={26} fill={P.lampCone} />}
            <circle cx={x} cy={248} r={3} fill={night ? P.brassLight : P.stoneDeep} className="ks-t" />
          </g>
        ))}
      </svg>
    </div>
  );
}
