import { parcels } from './data';
import { checkEligibility, fitScore, recommendedScenario, impact, oneLineReason, type Parcel, type Eligibility, type Fit, type Scenario, type Impact } from './sb4';

export type SiteStats = { parcel: Parcel; eligibility: Eligibility; fit: Fit; scenario: Scenario; impact: Impact; reason: string };

const cache = new Map<string, SiteStats>();

export function siteStats(parcel: Parcel): SiteStats {
  const hit = cache.get(parcel.id);
  if (hit) return hit;
  const scenario = recommendedScenario(parcel);
  const s: SiteStats = { parcel, eligibility: checkEligibility(parcel), fit: fitScore(parcel), scenario, impact: impact(scenario.homes), reason: oneLineReason(parcel) };
  cache.set(parcel.id, s);
  return s;
}

export const allStats = () => parcels.map(siteStats);
export const totals = (list: SiteStats[]) => ({
  sites: list.length,
  eligible: list.filter((s) => s.eligibility.eligible).length,
  homes: list.reduce((a, s) => a + (s.eligibility.eligible ? s.scenario.homes : 0), 0),
  people: list.reduce((a, s) => a + (s.eligibility.eligible ? s.impact.people : 0), 0),
});
