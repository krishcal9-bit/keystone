/** Builds everything Plan Studio (3D + 2D) needs from a parcel and options, in metres, centred at the origin. */
import type { Parcel, UnitType, Layout } from './sb4';
import { layoutPlan, metersPerUnitForLot, toMeters, rectToMeters, buildableArea, unitCapacity, impact, type Capacity, type Buildable } from './sb4';
import { bbox, polygonCentroid, type Pt, type Rect } from './geometry';
import { stallsFor, unionRect } from './stalls';

export type PlanOptions = { unitType: UnitType; targetUnits?: number; keepSpaces: number; garden: boolean };
export type PlanModel = {
  parcel: Parcel;
  opts: PlanOptions;
  mpu: number;
  polygon: Pt[]; // metres, centred
  bounds: Rect;
  building: Rect;
  parking: Rect[];
  allStalls: Rect[];
  keptStalls: Rect[];
  keptBox: Rect | null;
  layout: Layout;
  buildable: Buildable;
  capacity: Capacity;
  minimumUnits: number;
  placed: number;
  meetsMinimum: boolean;
  shortfall: number;
  people: number;
  streetSide: Parcel['streetSide'];
  streetRect: Rect;
};

const shift = (r: Rect, dx: number, dy: number): Rect => ({ x: r.x + dx, y: r.y + dy, w: r.w, h: r.h });
const grow = (r: Rect, d: number): Rect => ({ x: r.x - d, y: r.y - d, w: r.w + 2 * d, h: r.h + 2 * d });

export function buildPlanModel(parcel: Parcel, opts: PlanOptions): PlanModel {
  const mpu = metersPerUnitForLot(parcel.lotPolygon, parcel.lotAcres);
  const raw = toMeters(parcel.lotPolygon, mpu);
  const c = polygonCentroid(raw);
  const polygon = raw.map((p) => ({ x: p.x - c.x, y: p.y - c.y }));
  const bounds = bbox(polygon);
  const building = shift(rectToMeters(parcel.buildingRect, mpu), -c.x, -c.y);
  const parking = parcel.parkingRects.map((r) => shift(rectToMeters(r, mpu), -c.x, -c.y));
  const allStalls = parcel.parkingRects.flatMap((r) => stallsFor(r, mpu)).map((r) => shift(r, -c.x, -c.y));
  const keep = Math.max(0, Math.min(parcel.parkingSpaces, Math.round(opts.keepSpaces)));
  const keptCount = Math.round((keep / Math.max(1, parcel.parkingSpaces)) * allStalls.length);
  const keptStalls = allStalls.slice(0, keptCount);
  const keptBox = unionRect(keptStalls);
  const buildable = buildableArea(parcel, keep);
  const capacity = unitCapacity(buildable.acres, parcel, opts.unitType);
  const target = opts.targetUnits ?? capacity.practicalUnits;
  const keepClear: Rect[] = [grow(building, 4)];
  if (keptBox) keepClear.push(grow(keptBox, 2.5));
  const streetSide = parcel.streetSide;
  const layout = layoutPlan(polygon, {
    unitType: opts.unitType,
    targetUnits: Math.max(0, target),
    keepSpaces: 0,
    garden: opts.garden,
    keepClear,
    parkingEdge: streetSide === 'bottom' ? 'bottom' : 'top',
  });
  const placed = layout.unitCount;
  const minimumUnits = capacity.minimumUnits;
  const m = 14;
  const streetRect: Rect = streetSide === 'top' ? { x: bounds.x - 30, y: bounds.y - m - 3, w: bounds.w + 60, h: m }
    : streetSide === 'bottom' ? { x: bounds.x - 30, y: bounds.y + bounds.h + 3, w: bounds.w + 60, h: m }
    : streetSide === 'left' ? { x: bounds.x - m - 3, y: bounds.y - 30, w: m, h: bounds.h + 60 }
    : { x: bounds.x + bounds.w + 3, y: bounds.y - 30, w: m, h: bounds.h + 60 };
  return {
    parcel, opts, mpu, polygon, bounds, building, parking, allStalls, keptStalls, keptBox, layout, buildable, capacity,
    minimumUnits, placed, meetsMinimum: placed >= minimumUnits, shortfall: Math.max(0, minimumUnits - placed), people: impact(placed).people,
    streetSide, streetRect,
  };
}

/** Deterministic pseudo-random in [0,1) from a string + index, for colour variation. */
export const hashUnit = (s: string, i: number) => {
  let h = 2166136261 ^ i;
  for (let k = 0; k < s.length; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
};
