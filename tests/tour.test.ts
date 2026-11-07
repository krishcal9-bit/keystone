import { describe, it, expect } from 'vitest';
import { TOUR_STEPS, TOUR_TOTAL, onRoute, routePath, readTour, TOUR_EMPTY } from '@/lib/tour';

describe('guided tour steps', () => {
  it('has seven steps in order', () => {
    expect(TOUR_STEPS).toHaveLength(7);
    expect(TOUR_TOTAL).toBe(7);
    expect(TOUR_STEPS.map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it('follows the demo order: finder, detail, scan, plan, pitch', () => {
    const paths = TOUR_STEPS.map((s) => routePath(s.route));
    const firstIndex = (p: string) => paths.indexOf(p);
    expect(firstIndex('/sites')).toBeLessThan(firstIndex('/sites/oakfield-community-church'));
    expect(firstIndex('/sites/oakfield-community-church')).toBeLessThan(firstIndex('/scan'));
    expect(firstIndex('/scan')).toBeLessThan(firstIndex('/plan/oakfield-community-church'));
    expect(firstIndex('/plan/oakfield-community-church')).toBeLessThan(firstIndex('/pitch/oakfield-community-church'));
  });
  it('every route starts with "/" and routes of the same page are adjacent', () => {
    for (const s of TOUR_STEPS) expect(s.route.startsWith('/')).toBe(true);
    const paths = TOUR_STEPS.map((s) => routePath(s.route));
    const seen = new Set<string>();
    for (let i = 0; i < paths.length; i++) {
      if (i > 0 && paths[i] === paths[i - 1]) continue;
      expect(seen.has(paths[i])).toBe(false);
      seen.add(paths[i]);
    }
  });
  it('has no duplicate selectors and every step has copy keys', () => {
    const selectors = TOUR_STEPS.map((s) => s.selector);
    expect(new Set(selectors).size).toBe(selectors.length);
    for (const s of TOUR_STEPS) {
      expect(s.selector.startsWith('[data-testid=')).toBe(true);
      expect(s.title).toBe(`tour.${s.n}.title`);
      expect(s.body).toBe(`tour.${s.n}.body`);
    }
  });
  it('matches pathnames to step routes ignoring query strings', () => {
    expect(onRoute('/scan', '/scan?parcel=oakfield-community-church')).toBe(true);
    expect(onRoute('/sites', '/sites/oakfield-community-church')).toBe(false);
    expect(onRoute(null, '/sites')).toBe(false);
  });
  it('reads an empty state outside the browser', () => {
    expect(readTour()).toEqual(TOUR_EMPTY);
  });
});
