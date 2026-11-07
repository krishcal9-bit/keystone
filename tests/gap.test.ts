import { describe, it, expect } from 'vitest';
import { gapModel, CHALLENGE_ILLUSTRATIVE, familyCapacity } from '@/lib/gap';
import { parcels } from '@/lib/data';

describe('gap model', () => {
  it('closes more of the gap with Keystone than today for every parcel', () => {
    for (const p of parcels) {
      const g = gapModel(p, Math.round(p.parkingSpaces / 2));
      expect(g.keystone.total).toBeLessThan(g.today.total);
      expect(g.gapKeystone).toBeLessThanOrEqual(g.gapToday);
      expect(Number.isFinite(g.gapToday)).toBe(true);
    }
  });
  it('handles zero homes and zero acres without NaN', () => {
    const p = { ...parcels[0], openAcres: 0, parkingAcres: 0, parkingSpaces: 0 };
    const g = gapModel(p, 0, 0);
    expect(g.homes).toBe(1);
    expect(Number.isFinite(g.landMarketPerHome)).toBe(true);
  });
  it('illustrative challenge bar ends with a smaller gap', () => {
    const closes = CHALLENGE_ILLUSTRATIVE.family + CHALLENGE_ILLUSTRATIVE.other;
    expect(CHALLENGE_ILLUSTRATIVE.keystone.total - closes).toBeLessThan(CHALLENGE_ILLUSTRATIVE.today.total - closes);
    expect(familyCapacity().price).toBeGreaterThan(0);
  });
});
