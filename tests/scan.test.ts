import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { computeScan, areasByCategory, polygonAreaM2, estimateExistingSpaces, ScanResponseSchema, type ScanPolygon } from '@/lib/scanMath';
import { A, unitCapacity } from '@/lib/sb4';

const sq = (x: number, y: number, w: number, h: number) => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }];
const poly = (id: string, category: ScanPolygon['category'], points: ScanPolygon['points'], confidence = 0.9): ScanPolygon => ({ id, category, points, confidence });

describe('scanMath areas', () => {
  it('a full-frame square at 100 m across is 10,000 m²', () => {
    expect(polygonAreaM2(sq(0, 0, 1, 1), 100)).toBeCloseTo(10_000, 6);
    // a 4:3 image is taller in metres than it is wide by the aspect
    expect(polygonAreaM2(sq(0, 0, 1, 1), 100, 0.75)).toBeCloseTo(7_500, 6);
  });
  it('sums by category and counts polygons', () => {
    const { areas, counts } = areasByCategory([
      poly('b', 'building', sq(0, 0, 0.5, 0.5)), poly('p', 'parking', sq(0.5, 0, 0.5, 0.5)), poly('p2', 'parking', sq(0, 0.5, 0.5, 0.5)),
    ], 100);
    expect(areas.building).toBeCloseTo(2_500);
    expect(areas.parking).toBeCloseTo(5_000);
    expect(counts.parking).toBe(2);
    expect(areas.open).toBe(0);
  });
  it('estimates existing spaces from parking area', () => {
    expect(estimateExistingSpaces(0)).toBe(0);
    expect(estimateExistingSpaces(3250)).toBe(100);
    expect(estimateExistingSpaces(-5)).toBe(0);
  });
});

describe('computeScan', () => {
  it('zero polygons gives zeros, never NaN', () => {
    const c = computeScan([], 160);
    expect(c.buildableAcres).toBe(0);
    expect(c.homes).toBe(0);
    expect(c.existingSpaces).toBe(0);
    expect(Object.values(c.areas).every((v) => Number.isFinite(v) && v === 0)).toBe(true);
  });
  it('zero or invalid scale gives zeros, never NaN', () => {
    for (const scale of [0, -10, NaN, Infinity]) {
      const c = computeScan([poly('o', 'open', sq(0, 0, 1, 1))], scale);
      expect(Number.isFinite(c.buildableAcres)).toBe(true);
      expect(c.buildableAcres).toBe(0);
      expect(c.homes).toBe(0);
    }
  });
  it('buildable = (open + parking − kept × 350 sq ft) × 0.9 and never negative', () => {
    const polys = [poly('o', 'open', sq(0, 0, 0.5, 1)), poly('p', 'parking', sq(0.5, 0, 0.5, 1))];
    const c0 = computeScan(polys, 100, { keepSpaces: 0 });
    expect(c0.grossM2).toBeCloseTo(10_000);
    expect(c0.buildableM2).toBeCloseTo(9_000);
    const keep = 50;
    const c = computeScan(polys, 100, { keepSpaces: keep });
    const keptM2 = (keep * A.sqftPerSpace) / 10.7639;
    expect(c.buildableM2).toBeCloseTo((10_000 - keptM2) * (1 - A.setbackPct), 3);
    // keeping every space is clamped to the parking area; buildable never drops below the open land share
    const all = computeScan(polys, 100, { keepSpaces: 10_000 });
    expect(all.keepSpaces).toBe(all.existingSpaces);
    expect(all.buildableM2).toBeGreaterThanOrEqual(0);
    const tiny = computeScan([poly('p', 'parking', sq(0, 0, 0.1, 0.1))], 20, { keepSpaces: 3 });
    expect(tiny.buildableM2).toBeGreaterThanOrEqual(0);
  });
  it('uses the engine: townhomes when they meet the SB 4 minimum, else stacked flats', () => {
    const c = computeScan([poly('o', 'open', sq(0, 0, 1, 1))], 200, { zoning: 'institutional' });
    const town = unitCapacity(c.buildableAcres, { zoning: 'institutional' }, 'townhome');
    if (town.meetsMinimum) {
      expect(c.usedFlats).toBe(false);
      expect(c.homes).toBe(town.practicalUnits);
    } else {
      expect(c.usedFlats).toBe(true);
      expect(c.capacity.type).toBe('flat');
      expect(c.homes).toBe(unitCapacity(c.buildableAcres, { zoning: 'institutional' }, 'flat').practicalUnits);
    }
    expect(c.capacity.density).toBe(40);
    expect(computeScan([poly('o', 'open', sq(0, 0, 1, 1))], 200, { zoning: 'residential' }).capacity.density).toBe(30);
  });
});

describe('scan fixtures', () => {
  for (const n of [1, 2, 3]) {
    it(`fixtures/scan-${n}.json parses and validates`, () => {
      const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'fixtures', `scan-${n}.json`), 'utf8'));
      const parsed = ScanResponseSchema.safeParse(raw);
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      const cats = new Set(parsed.data.polygons.map((p) => p.category));
      expect(cats.has('building')).toBe(true);
      expect(cats.has('parking')).toBe(true);
      expect(cats.has('open')).toBe(true);
      expect(parsed.data.polygons.length).toBeLessThanOrEqual(12);
      const c = computeScan(parsed.data.polygons, 200, { aspect: 0.75 });
      expect(c.buildableAcres).toBeGreaterThan(0);
      expect(c.homes).toBeGreaterThan(0);
    });
  }
});
