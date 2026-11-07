/** Stylized Orange County geography in a 1000×1000 map frame (x east, y south). */
const LON0 = -118.12, LON1 = -117.45, LAT0 = 33.95, LAT1 = 33.38;
export const ll = (lon: number, lat: number) => ({ x: ((lon - LON0) / (LON1 - LON0)) * 1000, y: ((LAT0 - lat) / (LAT0 - LAT1)) * 1000 });
const P = (pts: [number, number][]) => pts.map(([lon, lat]) => ll(lon, lat));
const toPath = (pts: { x: number; y: number }[], close = false) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + (close ? ' Z' : '');
const toCurve = (pts: { x: number; y: number }[]) => {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1], p1 = pts[i];
    const cx = (p0.x + p1.x) / 2, cy = (p0.y + p1.y) / 2;
    d += ` Q${p0.x.toFixed(1)} ${p0.y.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` T${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
};

/** Coast from Seal Beach (NW) to the San Diego line (SE). */
export const COAST = P([
  [-118.12, 33.75], [-118.08, 33.73], [-118.05, 33.705], [-118.02, 33.68], [-118.0, 33.655], [-117.97, 33.63], [-117.93, 33.605], [-117.9, 33.6],
  [-117.87, 33.59], [-117.83, 33.565], [-117.79, 33.54], [-117.76, 33.52], [-117.73, 33.49], [-117.7, 33.46], [-117.67, 33.44], [-117.64, 33.425],
  [-117.61, 33.41], [-117.585, 33.385], [-117.57, 33.37],
]);
/** Inland border from the SD line back round to Seal Beach (clockwise continuation). */
export const INLAND = P([
  [-117.57, 33.37], [-117.52, 33.4], [-117.5, 33.45], [-117.45, 33.52], [-117.44, 33.6], [-117.47, 33.68], [-117.52, 33.76], [-117.57, 33.83],
  [-117.62, 33.88], [-117.66, 33.93], [-117.7, 33.955], [-117.8, 33.955], [-117.92, 33.95], [-117.99, 33.93], [-118.03, 33.88], [-118.06, 33.83], [-118.09, 33.79], [-118.12, 33.75],
]);
export const COUNTY_PATH = toPath([...COAST, ...INLAND.slice(1)], true);
export const COAST_PATH = toCurve(COAST);

export const FREEWAYS: { id: string; major: boolean; d: string }[] = [
  { id: 'I-5', major: true, d: toCurve(P([[-118.0, 33.875], [-117.95, 33.845], [-117.91, 33.82], [-117.88, 33.78], [-117.86, 33.75], [-117.82, 33.73], [-117.78, 33.705], [-117.74, 33.66], [-117.71, 33.62], [-117.67, 33.58], [-117.64, 33.53], [-117.62, 33.47], [-117.61, 33.43], [-117.58, 33.39]])) },
  { id: 'I-405', major: true, d: toCurve(P([[-118.1, 33.775], [-118.04, 33.75], [-117.99, 33.72], [-117.95, 33.70], [-117.9, 33.67], [-117.86, 33.655], [-117.82, 33.66], [-117.78, 33.67], [-117.74, 33.655], [-117.71, 33.62]])) },
  { id: 'SR-55', major: false, d: toCurve(P([[-117.905, 33.63], [-117.88, 33.665], [-117.85, 33.71], [-117.835, 33.75], [-117.83, 33.8], [-117.8, 33.84]])) },
  { id: 'SR-57', major: false, d: toCurve(P([[-117.86, 33.78], [-117.875, 33.82], [-117.885, 33.86], [-117.89, 33.9], [-117.89, 33.94]])) },
  { id: 'SR-91', major: false, d: toCurve(P([[-118.07, 33.87], [-117.98, 33.86], [-117.9, 33.855], [-117.82, 33.86], [-117.74, 33.875], [-117.67, 33.885]])) },
  { id: 'SR-22', major: false, d: toCurve(P([[-118.09, 33.77], [-118.02, 33.77], [-117.95, 33.775], [-117.88, 33.78], [-117.84, 33.785]])) },
  { id: 'SR-73', major: false, d: toCurve(P([[-117.905, 33.66], [-117.86, 33.63], [-117.8, 33.6], [-117.73, 33.575], [-117.7, 33.57]])) },
  { id: 'SR-241', major: false, d: toCurve(P([[-117.73, 33.68], [-117.7, 33.74], [-117.69, 33.8], [-117.72, 33.85]])) },
  { id: 'I-605', major: false, d: toCurve(P([[-118.1, 33.77], [-118.09, 33.82], [-118.08, 33.86]])) },
];

export const CITY_LABELS: { name: string; lon: number; lat: number; size?: 'lg' | 'sm' }[] = [
  { name: 'Fullerton', lon: -117.925, lat: 33.875, size: 'lg' }, { name: 'Brea', lon: -117.9, lat: 33.92, size: 'sm' }, { name: 'Yorba Linda', lon: -117.8, lat: 33.895, size: 'sm' },
  { name: 'Anaheim', lon: -117.91, lat: 33.835, size: 'lg' }, { name: 'Orange', lon: -117.85, lat: 33.79, size: 'lg' }, { name: 'Garden Grove', lon: -117.945, lat: 33.775, size: 'lg' },
  { name: 'Westminster', lon: -118.0, lat: 33.75, size: 'lg' }, { name: 'Santa Ana', lon: -117.87, lat: 33.745, size: 'lg' }, { name: 'Tustin', lon: -117.82, lat: 33.74, size: 'lg' },
  { name: 'Huntington Beach', lon: -118.005, lat: 33.675, size: 'lg' }, { name: 'Costa Mesa', lon: -117.905, lat: 33.645, size: 'lg' }, { name: 'Irvine', lon: -117.8, lat: 33.68, size: 'lg' },
  { name: 'Newport Beach', lon: -117.92, lat: 33.617, size: 'sm' }, { name: 'Laguna Beach', lon: -117.78, lat: 33.55, size: 'sm' }, { name: 'Mission Viejo', lon: -117.66, lat: 33.61, size: 'sm' },
  { name: 'San Clemente', lon: -117.61, lat: 33.44, size: 'sm' }, { name: 'Seal Beach', lon: -118.09, lat: 33.74, size: 'sm' }, { name: 'Dana Point', lon: -117.7, lat: 33.475, size: 'sm' },
  { name: 'Lake Forest', lon: -117.69, lat: 33.65, size: 'sm' }, { name: 'Placentia', lon: -117.86, lat: 33.875, size: 'sm' },
];

/** Santa Ana Mountains and foothills as soft terrain washes (map coords). */
export const TERRAIN = [
  { d: toPath(P([[-117.7, 33.95], [-117.6, 33.9], [-117.5, 33.78], [-117.45, 33.68], [-117.46, 33.55], [-117.55, 33.45], [-117.6, 33.5], [-117.63, 33.62], [-117.66, 33.74], [-117.7, 33.85]]), true), opacity: 0.5 },
  { d: toPath(P([[-117.66, 33.95], [-117.58, 33.86], [-117.52, 33.72], [-117.47, 33.6], [-117.5, 33.5], [-117.56, 33.55], [-117.58, 33.68], [-117.62, 33.8], [-117.63, 33.9]]), true), opacity: 0.6 },
  { d: toPath(P([[-117.85, 33.95], [-117.78, 33.92], [-117.75, 33.88], [-117.82, 33.9]]), true), opacity: 0.35 },
  { d: toPath(P([[-117.78, 33.63], [-117.72, 33.6], [-117.7, 33.54], [-117.76, 33.56]]), true), opacity: 0.35 },
];

export const MAP_SIZE = 1000;
