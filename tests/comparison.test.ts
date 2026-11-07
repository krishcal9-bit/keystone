import { describe, it, expect, beforeEach } from 'vitest';
import { allStats, totals } from '@/lib/siteStats';
import { computeRows, DEFAULT_INPUTS, eligibleCount, measuredVetMinutes, median, readOverrides, writeOverrides, sanitize, vetTimer } from '@/lib/comparison';

/** Minimal in-memory Storage so lib/store and the vet timer run under node. */
function memStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; },
    clear: () => m.clear(), getItem: (k) => m.get(k) ?? null, key: (i) => [...m.keys()][i] ?? null,
    removeItem: (k) => { m.delete(k); }, setItem: (k, v) => { m.set(k, String(v)); },
  };
}
beforeEach(() => {
  const g = globalThis as Record<string, unknown>;
  g.localStorage = memStorage();
  g.sessionStorage = memStorage();
  g.window = g.window ?? { dispatchEvent: () => true, addEventListener: () => {}, removeEventListener: () => {} };
});

const vet = { minutes: 3, measured: false };

describe('comparison rows', () => {
  it('row 1 Keystone value is the live eligible count from the engine', () => {
    const live = totals(allStats()).eligible;
    const rows = computeRows(DEFAULT_INPUTS, eligibleCount(), vet);
    expect(rows[0].keystone.value).toBe(live);
    expect(live).toBeGreaterThan(0);
  });
  it('multipliers are finite and positive, and every figure carries a label, formula and source', () => {
    const rows = computeRows(DEFAULT_INPUTS, eligibleCount(), vet);
    for (const r of rows) {
      expect(Number.isFinite(r.multiplier.value)).toBe(true);
      for (const f of [r.waiting, r.keystone, r.multiplier]) {
        expect(f.label).toBeTruthy(); expect(f.formula).toBeTruthy(); expect(f.source).toBeTruthy(); expect(f.inputs.length).toBeGreaterThan(0);
      }
    }
    expect(rows[0].multiplier.value).toBe(eligibleCount() / DEFAULT_INPUTS.cityOffersPerYear);
    expect(rows[1].multiplier.value).toBe((DEFAULT_INPUTS.manualVetDays * 8 * 60) / 3);
    expect(rows[2].waiting.value).toBe(100000);
    expect(rows[2].keystone.value).toBe(0);
    expect(rows[2].multiplier.value).toBe(-100000);
  });
  it('overrides change the multipliers', () => {
    const base = computeRows(DEFAULT_INPUTS, 48, vet);
    const doubled = computeRows({ ...DEFAULT_INPUTS, cityOffersPerYear: 2 }, 48, vet);
    expect(doubled[0].multiplier.value).toBe(base[0].multiplier.value / 2);
    const quick = computeRows({ ...DEFAULT_INPUTS, manualVetDays: 1 }, 48, vet);
    expect(quick[1].multiplier.value).toBe(160);
    const cheap = computeRows({ ...DEFAULT_INPUTS, marketLandPerAcre: 1500000 }, 48, vet);
    expect(cheap[2].multiplier.value).toBe(-50000);
    writeOverrides({ cityOffersPerYear: 4 });
    expect(readOverrides().cityOffersPerYear).toBe(4);
    expect(computeRows({ ...DEFAULT_INPUTS, ...readOverrides() }, 48, vet)[0].multiplier.value).toBe(12);
  });
  it('sanitizes bad inputs so nothing divides by zero', () => {
    const rows = computeRows({ cityOffersPerYear: 0, manualVetDays: NaN, marketLandPerAcre: -5 }, 48, { minutes: 0, measured: false });
    for (const r of rows) expect(Number.isFinite(r.multiplier.value)).toBe(true);
    expect(sanitize({ cityOffersPerYear: 0 }).cityOffersPerYear).toBeGreaterThan(0);
  });
});

describe('vet timer', () => {
  it('measuredVetMinutes is the median of the recorded timings, rounded to 0.5, never below 0.5', () => {
    expect(measuredVetMinutes([])).toBeNull();
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(measuredVetMinutes([2 * 60000, 10 * 60000, 3.3 * 60000])).toBe(3.5);
    expect(measuredVetMinutes([5000])).toBe(0.5);
  });
  it('startVet/endVet records a duration and keeps the last five', () => {
    expect(vetTimer.endVet('none')).toBeNull();
    for (let i = 0; i < 7; i++) { vetTimer.startVet(`p${i}`); const ms = vetTimer.endVet(`p${i}`); expect(ms).not.toBeNull(); expect(ms!).toBeGreaterThanOrEqual(0); }
    const raw = JSON.parse(localStorage.getItem('keystone:v1:vet-times') ?? '[]') as number[];
    expect(raw).toHaveLength(5);
    expect(vetTimer.measuredVetMinutes()).toBe(0.5);
  });
});
