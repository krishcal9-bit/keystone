'use client';
/**
 * Full-page illustrated aerial neighbourhood behind Site Detail and Lot Scan. A street grid with
 * blocks of varied rooftops (gable ridges with a lit and a shaded half, a few terracotta), centre-dashed
 * streets, tree canopies with offset shadows, a small park and a church lot in the middle block so the
 * page's content sits over "its" neighbourhood. Static; palette colours only; ~45 % opacity with a radial
 * mask (crisp centre, fading edges). Night: dark lawns, lit windows as brass dots, lamp pools.
 * The scene is drawn once into an SVG pattern at a fixed pixel scale and tiled, so a tall page shows
 * more neighbourhood instead of a zoomed-in one, and the detail size is the same on every page.
 */
import { Fragment, useId } from 'react';
import { palette as P, shade, seeded } from '@/lib/illustrationPalette';

export type AerialBackdropProps = {
  night?: boolean;
  opacity?: number;
  className?: string;
  /** Accepted for backwards compatibility; the backdrop now fills its parent. */
  height?: number;
  /** Accepted for backwards compatibility; edges fade via a mask instead of a blur. */
  blur?: number;
};

const W = 1600, H = 1000;
const SCALE = 0.85; // screen px per scene unit
const SW = 44; // street width
const HS = [300, 700]; // horizontal street y
const VS = [180, 560, 1040, 1420]; // vertical street x

type Rect = { x: number; y: number; w: number; h: number };
type House = Rect & { tone: number; gable: boolean; faceUp: boolean };
type Tree = { x: number; y: number; r: number; kind: number };

function blocks(): Rect[] {
  const xs = [0, ...VS.map((x) => x + SW)], xe = [...VS, W];
  const ys = [0, ...HS.map((y) => y + SW)], ye = [...HS, H];
  const out: Rect[] = [];
  for (let r = 0; r < ys.length; r++) for (let c = 0; c < xs.length; c++) out.push({ x: xs[c], y: ys[r], w: xe[c] - xs[c], h: ye[r] - ys[r] });
  return out;
}

const CHURCH: Rect = { x: VS[1] + SW, y: HS[0] + SW, w: VS[2] - VS[1] - SW, h: HS[1] - HS[0] - SW }; // centre block
const PARK: Rect = { x: VS[2] + SW + 40, y: HS[1] + SW + 40, w: VS[3] - VS[2] - SW - 80, h: H - HS[1] - SW - 80 };

function buildScene(seed = 11) {
  const rnd = seeded(seed);
  const houses: House[] = [];
  const trees: Tree[] = [];
  const overlapsHouse = (r: Rect, pad: number) => houses.some((o) => r.x < o.x + o.w + pad && r.x + r.w + pad > o.x && r.y < o.y + o.h + pad && r.y + r.h + pad > o.y);
  const inRect = (x: number, y: number, b: Rect, pad = 0) => x > b.x - pad && x < b.x + b.w + pad && y > b.y - pad && y < b.y + b.h + pad;

  for (const b of blocks()) {
    if (b === CHURCH || (b.x === CHURCH.x && b.y === CHURCH.y)) continue;
    if (b.x < PARK.x + PARK.w && b.x + b.w > PARK.x && b.y < PARK.y + PARK.h && b.y + b.h > PARK.y) continue;
    if (b.w < 120 || b.h < 110) continue;
    // one row of houses facing the street above, one facing the street below
    const rows: { y: (h: number) => number; faceUp: boolean }[] = [];
    if (b.y > 0) rows.push({ y: () => b.y + 30, faceUp: true });
    if (b.y + b.h < H && b.h > 200) rows.push({ y: (h) => b.y + b.h - 30 - h, faceUp: false });
    for (const row of rows) {
      let cx = b.x + 22 + rnd() * 20;
      while (cx < b.x + b.w - 70) {
        const w = 54 + rnd() * 34, h = 42 + rnd() * 22;
        if (cx + w > b.x + b.w - 16) break;
        const r = { x: cx, y: row.y(h) + (rnd() - 0.5) * 8, w, h };
        if (!overlapsHouse(r, 16) && houses.length < 40) {
          houses.push({ ...r, tone: Math.floor(rnd() * 4), gable: rnd() > 0.35, faceUp: row.faceUp });
        }
        cx += w + 26 + rnd() * 30;
      }
    }
  }
  // trees: in yards, along streets and in the park
  for (let i = 0; i < 2000 && trees.length < 36; i++) {
    const r = 9 + rnd() * 11;
    const x = r + rnd() * (W - 2 * r), y = r + rnd() * (H - 2 * r);
    const inPark = inRect(x, y, PARK, -r);
    if (!inPark && (HS.some((sy) => y + r > sy - 6 && y - r < sy + SW + 6) || VS.some((sx) => x + r > sx - 6 && x - r < sx + SW + 6))) continue;
    if (inRect(x, y, CHURCH, 6) && !inPark) continue;
    if (overlapsHouse({ x: x - r, y: y - r, w: 2 * r, h: 2 * r }, 4)) continue;
    if (trees.some((t) => Math.hypot(t.x - x, t.y - y) < t.r + r + 6)) continue;
    trees.push({ x, y, r, kind: Math.floor(rnd() * 5) });
  }
  return { houses, trees };
}

const SCENE = buildScene();
const LAMPS: [number, number][] = [[VS[0] + SW + 6, 120], [VS[1] - 8, 520], [VS[2] + SW + 6, 220], [VS[3] - 8, 880], [420, HS[0] - 8], [900, HS[1] + SW + 8], [1300, HS[0] + SW + 8], [700, HS[1] - 8]];
const CARS: [number, number, boolean][] = [[260, HS[0] + 8, true], [880, HS[0] + 24, true], [1180, HS[1] + 8, true], [VS[1] + 8, 120, false], [VS[2] + 24, 820, false]];

export function AerialBackdrop({ night = false, opacity = 0.45, className = '' }: AerialBackdropProps) {
  const { houses, trees } = SCENE;
  const lawn = night ? P.lawnDeep : P.lawn;
  const lawnShade = night ? shade(P.lawnDeep, 0.22) : P.lawnShade;
  const roofs = [P.roof, P.roofTerracotta, P.wallClayShade, P.stone].map((c) => (night ? shade(c, 0.35) : c));
  const roofsLight = [P.roofLight, P.roofTerracottaLight, P.wallClay, P.stoneLight].map((c) => (night ? shade(c, 0.35) : c));
  const asphalt = night ? P.asphaltDeep : P.asphalt;
  const walk = night ? shade(P.sidewalk, 0.45) : P.sidewalk;
  const mask = 'radial-gradient(ellipse 72% 68% at 50% 48%, #000 38%, transparent 100%)';
  const carTones = [P.wall, P.roof, P.roofTerracotta, P.stone, P.window];
  const tileId = `aerial-tile-${useId().replace(/:/g, '')}`;
  return (
    <div
      className={`absolute inset-0 pointer-events-none select-none ${className}`}
      style={{ opacity, maskImage: mask, WebkitMaskImage: mask }}
      aria-hidden
      data-aerial-backdrop
    >
      <svg width="100%" height="100%" style={{ display: 'block' }}>
        <defs>
        <pattern id={tileId} width={W} height={H} patternUnits="userSpaceOnUse" patternTransform={`scale(${SCALE})`}>
        <rect width={W} height={H} fill={lawn} className="ks-t" />
        {/* mown stripes on lawns: a handful of wide, faint bands */}
        {[60, 240, 420, 600, 780, 960].map((y) => (
          <rect key={y} x={0} y={y} width={W} height={40} fill={lawnShade} opacity={0.22} className="ks-t" />
        ))}

        {/* park: darker lawn, looping path, pond */}
        <rect x={PARK.x} y={PARK.y} width={PARK.w} height={PARK.h} rx={14} fill={lawnShade} className="ks-t" />
        <path d={`M${PARK.x + 24} ${PARK.y + PARK.h / 2} Q${PARK.x + PARK.w / 2} ${PARK.y + 18} ${PARK.x + PARK.w - 24} ${PARK.y + PARK.h / 2} Q${PARK.x + PARK.w / 2} ${PARK.y + PARK.h - 18} ${PARK.x + 24} ${PARK.y + PARK.h / 2}`} fill="none" stroke={walk} strokeWidth={7} />
        <ellipse cx={PARK.x + PARK.w / 2} cy={PARK.y + PARK.h / 2} rx={34} ry={22} fill={night ? P.nightSkyLow : P.ocean} className="ks-t" />
        <ellipse cx={PARK.x + PARK.w / 2 - 8} cy={PARK.y + PARK.h / 2 - 6} rx={16} ry={8} fill={night ? P.nightHorizon : P.sky} opacity={0.7} className="ks-t" />

        {/* church lot: sanctuary with a cross-gable roof, steeple, parking with stalls, lawn */}
        <g>
          <rect x={CHURCH.x + 20} y={CHURCH.y + 20} width={CHURCH.w - 40} height={CHURCH.h - 40} rx={6} fill={lawnShade} opacity={0.6} className="ks-t" />
          <rect x={CHURCH.x + 250} y={CHURCH.y + 60} width={160} height={200} rx={3} fill={asphalt} className="ks-t" />
          <path d={`M${CHURCH.x + 262} ${CHURCH.y + 72} h136 M${CHURCH.x + 262} ${CHURCH.y + 160} h136 M${CHURCH.x + 262} ${CHURCH.y + 248} h136`} stroke={P.paint} strokeWidth={14} strokeDasharray="2 16" opacity={0.5} />
          <rect x={CHURCH.x + 250 - 4} y={CHURCH.y + 260} width={40} height={40} fill={walk} />
          <rect x={CHURCH.x + 66} y={CHURCH.y + 88} width={150} height={100} fill={P.shadow} opacity={0.8} />
          <rect x={CHURCH.x + 60} y={CHURCH.y + 80} width={150} height={50} fill={roofsLight[0]} />
          <rect x={CHURCH.x + 60} y={CHURCH.y + 130} width={150} height={50} fill={roofs[0]} />
          <rect x={CHURCH.x + 110} y={CHURCH.y + 40} width={50} height={140} fill={roofs[0]} />
          <path d={`M${CHURCH.x + 110} ${CHURCH.y + 40} h25 v140 h-25 z`} fill={roofsLight[0]} />
          <rect x={CHURCH.x + 60} y={CHURCH.y + 129} width={150} height={2} fill={shade(P.roof, 0.4)} />
          <rect x={CHURCH.x + 70} y={CHURCH.y + 92} width={18} height={18} fill={night ? P.brassLight : P.wall} />
          <rect x={CHURCH.x + 74} y={CHURCH.y + 96} width={10} height={10} fill={night ? P.windowLit : P.brass} />
          <rect x={CHURCH.x + 125} y={CHURCH.y + 190} width={20} height={70} fill={walk} />
        </g>

        {/* streets: sidewalk, asphalt, centre dashes */}
        {HS.map((y) => (
          <g key={`h${y}`}>
            <rect x={0} y={y - 8} width={W} height={SW + 16} fill={walk} className="ks-t" />
            <rect x={0} y={y} width={W} height={SW} fill={asphalt} className="ks-t" />
            <line x1={0} y1={y + SW / 2} x2={W} y2={y + SW / 2} stroke={P.paint} strokeWidth={2.4} strokeDasharray="30 28" opacity={0.55} />
          </g>
        ))}
        {VS.map((x) => (
          <g key={`v${x}`}>
            <rect x={x - 8} y={0} width={SW + 16} height={H} fill={walk} className="ks-t" />
            <rect x={x} y={0} width={SW} height={H} fill={asphalt} className="ks-t" />
            <line x1={x + SW / 2} y1={0} x2={x + SW / 2} y2={H} stroke={P.paint} strokeWidth={2.4} strokeDasharray="30 28" opacity={0.55} />
          </g>
        ))}

        {/* cars */}
        {CARS.map(([x, y, horiz], i) => (
          <g key={i}>
            <rect x={x + 3} y={y + 3} width={horiz ? 24 : 12} height={horiz ? 12 : 24} rx={3} fill={P.shadow} />
            <rect x={x} y={y} width={horiz ? 24 : 12} height={horiz ? 12 : 24} rx={3} fill={night ? shade(carTones[i], 0.3) : carTones[i]} className="ks-t" />
            <rect x={x + (horiz ? 7 : 2)} y={y + (horiz ? 2 : 7)} width={horiz ? 10 : 8} height={horiz ? 8 : 10} rx={1.5} fill={P.windowDeep} opacity={0.85} />
            {night && <circle cx={horiz ? x + 24 : x + 6} cy={horiz ? y + 6 : y} r={2.4} fill={P.windowLit} />}
          </g>
        ))}

        {/* houses: gable (ridge with light/shade halves) or hip; contact shadow; driveway; a skylight that glows at night.
            No group wrappers: the tile is rasterised once, but the element budget is ~400. */}
        {houses.map((hs, i) => {
          const c = roofs[hs.tone], l = roofsLight[hs.tone];
          const cx = hs.x + hs.w / 2, cy = hs.y + hs.h / 2;
          return (
            <Fragment key={i}>
              <rect x={hs.x + 5} y={hs.y + 6} width={hs.w} height={hs.h} rx={2} fill={P.shadow} opacity={0.8} />
              <rect x={hs.x + 6} y={hs.faceUp ? hs.y - 30 : hs.y + hs.h} width={12} height={30} fill={walk} opacity={0.9} />
              {hs.gable ? (
                <>
                  <rect x={hs.x} y={hs.y} width={hs.w} height={hs.h / 2} fill={l} />
                  <rect x={hs.x} y={hs.y + hs.h / 2} width={hs.w} height={hs.h / 2} fill={c} />
                  <rect x={hs.x} y={hs.y + hs.h / 2 - 0.9} width={hs.w} height={1.8} fill={shade(c, 0.35)} />
                </>
              ) : (
                <>
                  <rect x={hs.x} y={hs.y} width={hs.w} height={hs.h} fill={c} />
                  <path d={`M${hs.x} ${hs.y} L${hs.x + hs.w} ${hs.y} L${cx} ${cy} Z`} fill={l} />
                  <path d={`M${hs.x} ${hs.y} L${hs.x} ${hs.y + hs.h} L${cx} ${cy} Z`} fill={shade(l, 0.12)} />
                </>
              )}
              <rect x={hs.x + hs.w - 13} y={hs.y + 5} width={5} height={5} fill={night ? P.windowLit : P.wallDeep} />
            </Fragment>
          );
        })}

        {/* trees: offset shadow, canopy, top-left highlight */}
        {trees.map((t, i) => {
          const dark = t.kind === 1 ? P.jacaranda : t.kind === 2 ? P.treeDeep : P.tree;
          const light = t.kind === 1 ? P.jacarandaLight : P.treeLight;
          return (
            <Fragment key={i}>
              <circle cx={t.x + 4} cy={t.y + 5} r={t.r} fill={P.shadow} opacity={0.6} />
              <circle cx={t.x} cy={t.y} r={t.r} fill={night ? shade(dark, 0.3) : dark} className="ks-t" />
              <circle cx={t.x - t.r * 0.3} cy={t.y - t.r * 0.3} r={t.r * 0.55} fill={night ? shade(light, 0.35) : light} className="ks-t" />
            </Fragment>
          );
        })}

        {/* street lamps: brass heads, pools of light at night */}
        {LAMPS.map(([x, y], i) => (
          <g key={i}>
            {night && <circle cx={x} cy={y} r={30} fill={P.lampCone} />}
            <circle cx={x} cy={y} r={3.2} fill={night ? P.brassLight : P.stoneDeep} className="ks-t" />
          </g>
        ))}
        </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${tileId})`} />
      </svg>
    </div>
  );
}
