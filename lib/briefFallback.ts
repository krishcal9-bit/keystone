import type { Parcel } from './sb4';
import { checkEligibility, recommendedScenario, fitScore, impact } from './sb4';

/** Rules-based feasibility brief used when Claude is unavailable. Same shape as the live output. */
export function briefFallback(parcel: Parcel, keepSpaces: number): string {
  const e = checkEligibility(parcel);
  const s = recommendedScenario(parcel, keepSpaces);
  const f = fitScore(parcel);
  const im = impact(s.homes);
  const lines: string[] = [];
  lines.push(`## Summary`);
  if (e.eligible) {
    lines.push(`${parcel.displayName} in ${parcel.city} appears to qualify for SB 4 by-right approval: the owner is a ${parcel.ownerType === 'college' ? 'nonprofit college' : 'religious institution'} that has held the land since ${parcel.ownerSince.slice(0, 4)}, and the law is in effect today. Keeping ${s.keepSpaces} of ${parcel.parkingSpaces} parking spaces leaves about ${s.buildable.acres.toFixed(2)} buildable acres, enough for roughly ${s.homes} Habitat homes as ${s.capacity.type === 'townhome' ? 'two-story townhomes' : 'stacked flats'} (${im.people} people, ${im.affordabilityYears.toLocaleString()} affordability-years). Fit score ${f.score}/100.`);
  } else {
    const why = e.reasons.find((r) => !r.pass);
    lines.push(`${parcel.displayName} does not currently qualify for SB 4: ${why?.detail ?? 'a requirement is not met'}. The numbers below are shown for comparison only.`);
  }
  lines.push(``, `## Top 3 risks`);
  const risks: string[] = [];
  if (!s.capacity.meetsMinimum) risks.push(`Density: townhomes alone fall ${s.capacity.shortfall} units short of the ${s.capacity.density}/acre minimum, so part of the site would need stacked flats.`);
  if (e.warnings.length) for (const w of e.warnings.slice(0, 2)) risks.push(`${w.label}: ${w.detail}`);
  if (parcel.nearTransitM > 800) risks.push(`Transit: the nearest stop is about ${(parcel.nearTransitM / 1000).toFixed(1)} km away, which weakens the case for reduced parking.`);
  risks.push(`Parking: Sunday peak demand needs a count before committing to ${s.keepSpaces} kept spaces.`);
  risks.push(`Congregation consensus: a land partnership needs a board vote and clear terms on control and reversion.`);
  for (const r of risks.slice(0, 3)) lines.push(`- ${r}`);
  lines.push(``, `## Next 5 steps`, `1. Order a Phase I environmental site assessment (Phase II if warranted).`, `2. Run a title check to confirm the institution owned the parcel on or before January 1, 2024.`, `3. Ask the board for a vote to explore a partnership (no commitment yet).`, `4. Book a pre-application meeting with the City of ${parcel.city} planning department on SB 4 objective standards.`, `5. Schedule a Habitat OC site visit and parking count on a peak day.`);
  lines.push(``, `## Questions for the congregation`, `- How many parking spaces do you use on your busiest day of the year?`, `- Which parts of the campus must stay exactly as they are?`, `- Are there families in your community who would want to apply for a Habitat home here?`, `- Who on the board should lead this conversation?`);
  lines.push(``, `_Not legal advice. Confirm with the city and counsel._`);
  return lines.join('\n');
}
