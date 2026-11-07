/**
 * Lot Scan math: Claude (or the user) supplies normalized polygons by category; this module turns
 * them into areas, an estimate of today's parking spaces, buildable acres and a home count using
 * the SB 4 engine. Deterministic, never negative, never NaN.
 */
import { z } from 'zod';
import { polygonArea, safeNum, type Pt } from './geometry';
import { A, unitCapacity, type Capacity, type Zoning } from './sb4';

export const SCAN_CATEGORIES = ['building', 'parking', 'open', 'trees', 'access'] as const;
export type ScanCategory = (typeof SCAN_CATEGORIES)[number];

export const ScanPointSchema = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) });
export const ScanPolygonSchema = z.object({
  id: z.string().min(1).max(64),
  category: z.enum(SCAN_CATEGORIES),
  points: z.array(ScanPointSchema).min(3).max(40),
  confidence: z.number().min(0).max(1),
  label: z.string().max(80).optional(),
});
export const ScanResponseSchema = z.object({
  polygons: z.array(ScanPolygonSchema).max(40),
  notes: z.string().max(600).optional(),
});
export type ScanPolygon = z.infer<typeof ScanPolygonSchema>;
export type ScanResponse = z.infer<typeof ScanResponseSchema>;

/** Rough land per existing parking space (stall + share of aisle), in m². */
export const M2_PER_EXISTING_SPACE = 32.5;
const SQFT_PER_M2 = 10.7639;

export type ScanAreas = Record<ScanCategory, number>; // m²

export type ScanComputation = {
  areas: ScanAreas;
  /** Number of polygons per category. */
  counts: Record<ScanCategory, number>;
  existingSpaces: number;
  keepSpaces: number;
  grossM2: number;
  buildableM2: number;
  buildableAcres: number;
  capacity: Capacity;
  /** True when townhomes fell short of the SB 4 minimum and stacked flats are shown instead. */
  usedFlats: boolean;
  homes: number;
};

/** Area of one normalized polygon in m² given the image's real width and its pixel aspect (height / width). */
export function polygonAreaM2(points: Pt[], metersAcross: number, aspect = 1): number {
  const m = Math.max(0, safeNum(metersAcross));
  const a = Math.max(0, safeNum(aspect, 1));
  return polygonArea(points) * m * m * a;
}

export function areasByCategory(polygons: ScanPolygon[], metersAcross: number, aspect = 1): { areas: ScanAreas; counts: Record<ScanCategory, number> } {
  const areas = Object.fromEntries(SCAN_CATEGORIES.map((c) => [c, 0])) as ScanAreas;
  const counts = Object.fromEntries(SCAN_CATEGORIES.map((c) => [c, 0])) as Record<ScanCategory, number>;
  for (const p of polygons) {
    if (!p.points || p.points.length < 3) continue;
    areas[p.category] += polygonAreaM2(p.points, metersAcross, aspect);
    counts[p.category] += 1;
  }
  return { areas, counts };
}

export const estimateExistingSpaces = (parkingM2: number) => Math.max(0, Math.floor(safeNum(parkingM2) / M2_PER_EXISTING_SPACE));

export const m2ToAcres = (m2: number) => (Math.max(0, safeNum(m2)) * SQFT_PER_M2) / A.sqftPerAcre;
export const m2ToSqft = (m2: number) => Math.max(0, safeNum(m2)) * SQFT_PER_M2;

/**
 * Buildable = open land + parking − kept spaces × 350 sq ft, minus 10 % setbacks, never below zero.
 * Homes: townhomes when they meet the SB 4 minimum for the buildable acres, otherwise stacked flats.
 */
export function computeScan(polygons: ScanPolygon[], metersAcross: number, opts: { aspect?: number; keepSpaces?: number; zoning?: Zoning } = {}): ScanComputation {
  const aspect = opts.aspect ?? 1;
  const zoning = opts.zoning ?? 'institutional';
  const { areas, counts } = areasByCategory(polygons, metersAcross, aspect);
  const existingSpaces = estimateExistingSpaces(areas.parking);
  const keepSpaces = Math.min(existingSpaces, Math.max(0, Math.round(safeNum(opts.keepSpaces ?? 0))));
  const keptM2 = Math.min(areas.parking, (keepSpaces * A.sqftPerSpace) / SQFT_PER_M2);
  const grossM2 = Math.max(0, areas.open + areas.parking - keptM2);
  const buildableM2 = Math.max(0, grossM2 * (1 - A.setbackPct));
  const buildableAcres = m2ToAcres(buildableM2);
  const town = unitCapacity(buildableAcres, { zoning }, 'townhome');
  const usedFlats = !town.meetsMinimum && town.minimumUnits > 0;
  const capacity = usedFlats ? unitCapacity(buildableAcres, { zoning }, 'flat') : town;
  return {
    areas, counts, existingSpaces, keepSpaces, grossM2, buildableM2, buildableAcres, capacity, usedFlats,
    homes: Math.max(0, safeNum(capacity.practicalUnits)),
  };
}

export const polygonCentroidSafe = (pts: Pt[]): Pt => {
  if (!pts.length) return { x: 0.5, y: 0.5 };
  const s = pts.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / pts.length, y: s.y / pts.length };
};

let counter = 0;
export const newPolygonId = (category: ScanCategory) => `${category}-${Date.now().toString(36)}-${(counter++).toString(36)}`;
