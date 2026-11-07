import { describe, it, expect } from 'vitest';
import {
  checkEligibility, minDensity, buildableArea, unitCapacity, fitScore, impact, layoutPlan, areaFromPolygon,
  recommendedScenario, metersPerUnitForLot, toMeters, type Parcel,
} from '@/lib/sb4';
import { parcels } from '@/lib/data';
import { pointInPolygon, rectCorners, rectsOverlap, polygonArea } from '@/lib/geometry';

const base: Parcel = {
  id: 't', displayName: 'Test Church (sample)', ownerType: 'congregation', ownerSince: '1990-01-01', city: 'Santa Ana',
  mapX: 0, mapY: 0, lotAcres: 3, buildingAcres: 0.5, parkingAcres: 1, parkingSpaces: 120, openAcres: 1.5, zoning: 'residential',
  nearSchoolM: 300, nearTransitM: 300, nearGroceryM: 300, slopePct: 1, floodZone: false, hazards: [], congregationLanguage: 'en',
  lotPolygon: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0.7 }, { x: 0, y: 0.7 }],
  buildingRect: { x: 0.05, y: 0.05, w: 0.3, h: 0.25 }, parkingRects: [{ x: 0.4, y: 0.05, w: 0.5, h: 0.3 }], streetSide: 'top',
};
const TODAY = '2026-11-07';

describe('checkEligibility', () => {
  it('passes a long-held congregation inside the window', () => {
    const e = checkEligibility(base, TODAY);
    expect(e.eligible).toBe(true);
    expect(e.reasons.every((r) => r.pass)).toBe(true);
  });
  it('boundary: owned 2023-12-31 passes, 2024-01-02 fails, 2024-01-01 passes', () => {
    expect(checkEligibility({ ...base, ownerSince: '2023-12-31' }, TODAY).eligible).toBe(true);
    expect(checkEligibility({ ...base, ownerSince: '2024-01-01' }, TODAY).eligible).toBe(true);
    const late = checkEligibility({ ...base, ownerSince: '2024-01-02' }, TODAY);
    expect(late.eligible).toBe(false);
    expect(late.reasons.find((r) => r.id === 'ownedSince')?.pass).toBe(false);
  });
  it('boundary: today before 2024-07-02 or on/after 2036-01-01 fails', () => {
    expect(checkEligibility(base, '2024-07-01').eligible).toBe(false);
    expect(checkEligibility(base, '2024-07-02').eligible).toBe(true);
    expect(checkEligibility(base, '2035-12-31').eligible).toBe(true);
    expect(checkEligibility(base, '2036-01-01').eligible).toBe(false);
  });
  it('rejects private, commercial and public owners; accepts colleges', () => {
    for (const o of ['private', 'commercial', 'public'] as const) expect(checkEligibility({ ...base, ownerType: o }, TODAY).eligible).toBe(false);
    expect(checkEligibility({ ...base, ownerType: 'college' }, TODAY).eligible).toBe(true);
  });
  it('flood zones and hazards produce warnings, not silent passes', () => {
    const e = checkEligibility({ ...base, floodZone: true, hazards: ['fire-severity'] }, TODAY);
    expect(e.eligible).toBe(true);
    expect(e.warnings.map((w) => w.id)).toEqual(expect.arrayContaining(['flood', 'hazard-fire-severity']));
  });
});

describe('minDensity', () => {
  it('is 30 for residential zones and 40 otherwise', () => {
    expect(minDensity({ zoning: 'residential' })).toBe(30);
    expect(minDensity({ zoning: 'commercial' })).toBe(40);
    expect(minDensity({ zoning: 'institutional' })).toBe(40);
  });
});

describe('buildableArea', () => {
  it('keeps zero spaces → all parking plus open land, minus setbacks', () => {
    const b = buildableArea(base, 0);
    expect(b.grossAcres).toBeCloseTo(2.5, 5);
    expect(b.acres).toBeCloseTo(2.25, 5);
  });
  it('never goes below zero and clamps kept spaces to the lot', () => {
    const b = buildableArea({ ...base, openAcres: 0, parkingAcres: 0.5, parkingSpaces: 60 }, 10_000);
    expect(b.keptSpaces).toBe(60);
    expect(b.acres).toBeGreaterThanOrEqual(0);
    expect(buildableArea({ ...base, openAcres: 0, parkingAcres: 0 }, -5).acres).toBe(0);
  });
  it('is monotonic: keeping more spaces never increases buildable area', () => {
    let prev = Infinity;
    for (let k = 0; k <= base.parkingSpaces; k += 10) {
      const a = buildableArea(base, k).acres;
      expect(a).toBeLessThanOrEqual(prev + 1e-9);
      prev = a;
    }
  });
});

describe('unitCapacity', () => {
  it('computes the SB 4 minimum from area × density', () => {
    expect(unitCapacity(2, { zoning: 'residential' }, 'townhome').minimumUnits).toBe(60);
    expect(unitCapacity(2, { zoning: 'commercial' }, 'townhome').minimumUnits).toBe(80);
  });
  it('flags townhomes that fall short and suggests stacked flats', () => {
    const c = unitCapacity(2, { zoning: 'residential' }, 'townhome');
    expect(c.practicalUnits).toBeLessThan(c.minimumUnits);
    expect(c.meetsMinimum).toBe(false);
    expect(c.suggestion).toBe('stacked-flats');
    const f = unitCapacity(2, { zoning: 'residential' }, 'flat');
    expect(f.meetsMinimum).toBe(true);
    expect(f.shortfall).toBe(0);
  });
  it('handles zero and non-finite area without NaN', () => {
    const c = unitCapacity(0, base, 'flat');
    expect(c.minimumUnits).toBe(0);
    expect(c.practicalUnits).toBe(0);
    const n = unitCapacity(Number.NaN, base, 'townhome');
    expect(Number.isFinite(n.practicalUnits)).toBe(true);
  });
});

describe('fitScore', () => {
  it('stays within 0–100 and has a breakdown that sums to the score', () => {
    for (const p of parcels) {
      const f = fitScore(p, TODAY);
      expect(f.score).toBeGreaterThanOrEqual(0);
      expect(f.score).toBeLessThanOrEqual(100);
      expect(f.factors.reduce((s, x) => s + x.points, 0)).toBe(f.score);
      expect(f.factors.every((x) => x.note.length > 0)).toBe(true);
    }
  });
  it('is monotonic in buildable acres and transit proximity', () => {
    const small = fitScore({ ...base, openAcres: 0.5 }, TODAY).score;
    const big = fitScore({ ...base, openAcres: 3 }, TODAY).score;
    expect(big).toBeGreaterThanOrEqual(small);
    const far = fitScore({ ...base, nearTransitM: 3000 }, TODAY).score;
    const near = fitScore({ ...base, nearTransitM: 200 }, TODAY).score;
    expect(near).toBeGreaterThanOrEqual(far);
    expect(fitScore({ ...base, ownerType: 'private' }, TODAY).score).toBeLessThan(fitScore(base, TODAY).score);
  });
});

describe('impact', () => {
  it('derives people and affordability-years', () => {
    expect(impact(10)).toEqual({ homes: 10, people: 34, affordabilityYears: 450 });
    expect(impact(0)).toEqual({ homes: 0, people: 0, affordabilityYears: 0 });
    expect(impact(Number.NaN).homes).toBe(0);
  });
});

describe('areaFromPolygon', () => {
  it('computes a unit square at 10 m per unit as 100 m²', () => {
    const a = areaFromPolygon([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], 10);
    expect(a.m2).toBeCloseTo(100, 6);
    expect(a.acres).toBeCloseTo(100 * 10.7639 / 43560, 6);
  });
  it('handles concave polygons', () => {
    const L = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 2 }];
    expect(polygonArea(L)).toBeCloseTo(3, 9);
    expect(areaFromPolygon(L, 1).m2).toBeCloseTo(3, 9);
  });
  it('metersPerUnitForLot reproduces the lot acreage', () => {
    const mpu = metersPerUnitForLot(base.lotPolygon, base.lotAcres);
    expect(areaFromPolygon(base.lotPolygon, mpu).acres).toBeCloseTo(base.lotAcres, 6);
  });
});

describe('layoutPlan', () => {
  const polys = {
    rect: [{ x: 0, y: 0 }, { x: 120, y: 0 }, { x: 120, y: 90 }, { x: 0, y: 90 }],
    L: [{ x: 0, y: 0 }, { x: 140, y: 0 }, { x: 140, y: 60 }, { x: 70, y: 60 }, { x: 70, y: 120 }, { x: 0, y: 120 }],
    trapezoid: [{ x: 10, y: 0 }, { x: 110, y: 0 }, { x: 130, y: 100 }, { x: 0, y: 100 }],
  };
  for (const [name, poly] of Object.entries(polys)) {
    for (const unitType of ['townhome', 'flat'] as const) {
      it(`${name}/${unitType}: units stay inside the polygon and never overlap`, () => {
        const plan = layoutPlan(poly, { unitType, keepSpaces: 24, garden: true });
        expect(plan.units.length).toBeGreaterThan(0);
        const all = [
          ...plan.units.map((u) => u.rect),
          ...(plan.parking?.stalls ?? []),
          ...(plan.garden ? [plan.garden] : []),
        ];
        for (const r of all) for (const c of rectCorners(r)) expect(pointInPolygon(c, poly)).toBe(true);
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(rectsOverlap(all[i], all[j])).toBe(false);
        // yards do not overlap buildings
        for (const y of plan.yards) for (const u of plan.units) expect(rectsOverlap(y, u.rect)).toBe(false);
      });
    }
  }
  it('respects targetUnits and keepSpaces', () => {
    const plan = layoutPlan(polys.rect, { unitType: 'townhome', keepSpaces: 30, targetUnits: 8 });
    expect(plan.units.length).toBe(8);
    expect(plan.parking?.stalls.length).toBe(30);
  });
  it('keeps clear of existing buildings', () => {
    const church = { x: 0, y: 0, w: 50, h: 40 };
    const plan = layoutPlan(polys.rect, { unitType: 'townhome', keepSpaces: 0, keepClear: [church] });
    for (const u of plan.units) expect(rectsOverlap(u.rect, church)).toBe(false);
  });
  it('is deterministic', () => {
    const a = layoutPlan(polys.L, { unitType: 'townhome', keepSpaces: 12 });
    const b = layoutPlan(polys.L, { unitType: 'townhome', keepSpaces: 12 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it('works for every sample parcel without throwing or producing NaN', () => {
    for (const p of parcels) {
      const mpu = metersPerUnitForLot(p.lotPolygon, p.lotAcres);
      const plan = layoutPlan(toMeters(p.lotPolygon, mpu), { unitType: 'townhome', keepSpaces: Math.round(p.parkingSpaces / 2), garden: true });
      expect(Number.isFinite(plan.unitCount)).toBe(true);
    }
  });
});

describe('sample data', () => {
  it('has 60 unique fictional parcels with the required fields', () => {
    expect(parcels.length).toBe(60);
    expect(new Set(parcels.map((p) => p.id)).size).toBe(60);
    for (const p of parcels) {
      expect(p.displayName).toMatch(/\(sample\)/);
      expect(p.lotAcres).toBeGreaterThan(0);
      expect(p.lotPolygon.length).toBeGreaterThanOrEqual(4);
      expect(recommendedScenario(p).homes).toBeGreaterThanOrEqual(0);
    }
  });
  it('includes eligible congregations, colleges and ineligible controls', () => {
    const elig = parcels.filter((p) => checkEligibility(p, TODAY).eligible);
    expect(elig.length).toBeGreaterThan(40);
    expect(parcels.filter((p) => p.ownerType === 'college').length).toBe(2);
    expect(parcels.filter((p) => !checkEligibility(p, TODAY).eligible).length).toBeGreaterThanOrEqual(10);
  });
});
