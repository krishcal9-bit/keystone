import { z } from 'zod';
import { apiError, readJson, readFixture, isMock, textStreamResponse, simulateStream } from '@/lib/api';
import { streamText } from '@/lib/claude';
import { parcelById } from '@/lib/data';
import { checkEligibility, recommendedScenario, fitScore, impact } from '@/lib/sb4';
import { briefFallback } from '@/lib/briefFallback';
import { factsForPrompt, NOT_LEGAL } from '@/lib/sb4Facts';

export const maxDuration = 30;

const Input = z.object({ parcelId: z.string().min(1).max(120), keepSpaces: z.number().int().min(0).max(5000) });

const SYSTEM = `You are Keystone, a planning assistant for Habitat for Humanity of Orange County staff.
Write a short feasibility brief in Markdown with exactly these sections: "## Summary" (one plain-language paragraph), "## Top 3 risks" (3 bullets), "## Next 5 steps" (numbered: Phase I ESA, title check, board vote, city pre-application meeting, Habitat site visit, adapted to this site), "## Questions for the congregation" (3–4 bullets).
Use only the engine numbers you are given. Never invent numbers or legal rules. The only SB 4 facts you may state:
${factsForPrompt()}
End with the line: "_${NOT_LEGAL}_". Keep it under 320 words. No preamble.`;

export async function POST(req: Request) {
  const parsed = await readJson(req, Input);
  if (!parsed.ok) return parsed.res;
  const { parcelId, keepSpaces } = parsed.data;
  const parcel = parcelById(parcelId);
  if (!parcel) return apiError('not_found', 'Unknown parcel.', 404);

  const fallback = briefFallback(parcel, keepSpaces);
  if (isMock()) {
    const fx = await readFixture<string>('brief.md');
    return textStreamResponse(simulateStream(fx ?? fallback), { 'X-Keystone-Source': 'fixture' });
  }

  const e = checkEligibility(parcel);
  const s = recommendedScenario(parcel, keepSpaces);
  const f = fitScore(parcel);
  const im = impact(s.homes);
  const facts = {
    site: parcel.displayName, city: parcel.city, ownerType: parcel.ownerType, ownerSince: parcel.ownerSince, zoning: parcel.zoning,
    eligible: e.eligible, reasons: e.reasons.map((r) => `${r.pass ? 'PASS' : 'FAIL'} ${r.label}: ${r.detail}`), warnings: e.warnings.map((w) => `${w.label}: ${w.detail}`),
    lotAcres: parcel.lotAcres, parkingSpaces: parcel.parkingSpaces, keepSpaces: s.keepSpaces, buildableAcres: +s.buildable.acres.toFixed(2),
    minimumDensity: s.capacity.density, sb4MinimumUnits: s.capacity.minimumUnits, practicalHomes: s.homes, unitType: s.capacity.type, meetsMinimum: s.capacity.meetsMinimum, shortfall: s.capacity.shortfall,
    peopleHoused: im.people, affordabilityYears: im.affordabilityYears, fitScore: f.score, fitFactors: f.factors.map((x) => `${x.label} ${x.points}/${x.max}: ${x.note}`),
    distances: { transitM: parcel.nearTransitM, schoolM: parcel.nearSchoolM, groceryM: parcel.nearGroceryM }, slopePct: parcel.slopePct, floodZone: parcel.floodZone, hazards: parcel.hazards,
    congregationLanguage: parcel.congregationLanguage,
  };
  const stream = await streamText({
    purpose: 'brief',
    system: SYSTEM,
    messages: [{ role: 'user', content: `Engine output (JSON):\n${JSON.stringify(facts, null, 1)}\n\nWrite the brief.` }],
    maxTokens: 900,
    effort: 'low',
  });
  if (!stream) return textStreamResponse(simulateStream(fallback), { 'X-Keystone-Source': 'fallback' });
  return textStreamResponse(stream, { 'X-Keystone-Source': 'claude' });
}
