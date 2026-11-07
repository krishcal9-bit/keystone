/** Static illustrated details for the OC map: Saddleback ridgeline and rooftop clusters per city. */
import { ll, CITY_LABELS } from './ocGeo';
import { seeded } from '@/lib/illustrationPalette';

const r2 = (v: number) => Math.round(v * 100) / 100;
const pts = (list: [number, number][]) => list.map(([lon, lat]) => ll(lon, lat));
const path = (p: { x: number; y: number }[], close = false) => p.map((q, i) => `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`).join(' ') + (close ? ' Z' : '');

/** Santa Ana Mountains: a far ridge (lighter) and a nearer ridge (darker), drawn as silhouettes inside the county. */
export const RIDGE_FAR = path([
  ...pts([[-117.8, 33.955], [-117.74, 33.9], [-117.7, 33.84], [-117.66, 33.78], [-117.63, 33.72], [-117.6, 33.66], [-117.57, 33.6], [-117.56, 33.54], [-117.58, 33.48], [-117.62, 33.43]]),
  ...pts([[-117.42, 33.43], [-117.42, 33.955]]),
], true);
export const RIDGE_NEAR = path([
  ...pts([[-117.84, 33.955], [-117.79, 33.92], [-117.75, 33.87], [-117.72, 33.82], [-117.69, 33.77], [-117.665, 33.72], [-117.64, 33.68], [-117.62, 33.63], [-117.6, 33.57], [-117.6, 33.51], [-117.63, 33.46], [-117.66, 33.42]]),
  ...pts([[-117.42, 33.42], [-117.42, 33.955]]),
], true);
/** Saddleback's twin peaks (Modjeska and Santiago) as a small notch in the near ridge. */
export const SADDLEBACK = path(pts([[-117.69, 33.77], [-117.675, 33.74], [-117.665, 33.755], [-117.65, 33.725], [-117.63, 33.72]]));

export type Rooftop = { x: number; y: number; w: number; h: number; tone: number; flip: boolean };
export type TreeDot = { x: number; y: number; r: number; jacaranda: boolean };
export type Cluster = { city: string; roofs: Rooftop[]; trees: TreeDot[] };

/** Deterministic tiny rooftops and tree dots around each major city label. */
export function cityClusters(): Cluster[] {
  return CITY_LABELS.filter((c) => c.size === 'lg').map((c, ci) => {
    const o = ll(c.lon, c.lat);
    const rnd = seeded(101 + ci * 17);
    const roofs: Rooftop[] = [];
    const trees: TreeDot[] = [];
    const n = 9 + Math.floor(rnd() * 5);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, d = 16 + rnd() * 30;
      const x = o.x + Math.cos(a) * d * 1.4, y = o.y + 8 + Math.sin(a) * d * 0.8;
      if (Math.abs(y - o.y) < 9 && Math.abs(x - o.x) < 34) continue; // keep the label clear
      roofs.push({ x: r2(x), y: r2(y), w: r2(6 + rnd() * 4), h: r2(4 + rnd() * 2), tone: Math.floor(rnd() * 3), flip: rnd() > 0.5 });
    }
    for (let i = 0; i < 5; i++) {
      const a = rnd() * Math.PI * 2, d = 20 + rnd() * 34;
      trees.push({ x: r2(o.x + Math.cos(a) * d * 1.5), y: r2(o.y + 8 + Math.sin(a) * d * 0.8), r: r2(1.6 + rnd() * 1.4), jacaranda: rnd() > 0.7 });
    }
    return { city: c.name, roofs, trees };
  });
}
