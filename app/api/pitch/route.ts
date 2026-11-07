import { z } from 'zod';
import { apiError, readJson, readFixture, isMock, textStreamResponse, simulateStream } from '@/lib/api';
import { streamText } from '@/lib/claude';
import { parcelById } from '@/lib/data';
import { pitchLetterFallback, pitchNumbers } from '@/lib/pitchFallback';
import { factsForPrompt } from '@/lib/sb4Facts';

export const maxDuration = 30;

const LANG_NAMES = { en: 'English', es: 'Spanish (Latin American, formal usted)', vi: 'Vietnamese', ko: 'Korean (formal, 존댓말)' } as const;

const HOME_TYPE: Record<'en' | 'es' | 'vi' | 'ko', Record<'townhome' | 'flat', string>> = {
  en: { townhome: 'two-story townhomes', flat: 'low-rise stacked flats' },
  es: { townhome: 'casas adosadas de dos pisos', flat: 'departamentos de poca altura' },
  vi: { townhome: 'nhà liền kề hai tầng', flat: 'căn hộ thấp tầng' },
  ko: { townhome: '2층 타운홈', flat: '저층 공동주택' },
};

const Input = z.object({
  parcelId: z.string().min(1).max(120),
  lang: z.enum(['en', 'es', 'vi', 'ko']),
  keepSpaces: z.number().int().min(0).max(5000).optional(),
});

const SYSTEM = `You write letters for the land partnerships team at Habitat for Humanity of Orange County.
Write one respectful, mission-first letter to the leadership of a congregation, inviting a conversation about building Habitat homes on part of their land under California SB 4. Plain text, no Markdown, no subject line, no placeholders.
Rules:
- Write entirely in the requested language, in a warm and formal register appropriate for faith leaders.
- Be specific to this lot: use the congregation's name, city, buildable acres, kept parking spaces, homes and people housed exactly as given. Never invent numbers, names, dates or history.
- No pressure. Make clear nothing is decided today and that legal confirmation belongs to the city and their counsel.
- Explain Habitat's model in one sentence: homes are sold to qualified lower-income families with an affordable mortgage and protected by a 45-year deed restriction.
- The only legal facts you may state about SB 4 are these (do not cite the ids in the letter):
${factsForPrompt()}
- Under 260 words. Four or five short paragraphs separated by blank lines.
- Open with a greeting to the congregation's leaders. End with a sign-off line and then "Land partnerships team, Habitat for Humanity of Orange County" (translated naturally into the letter's language, keeping the organization's English name).`;

export async function POST(req: Request) {
  const parsed = await readJson(req, Input);
  if (!parsed.ok) return parsed.res;
  const { parcelId, lang, keepSpaces } = parsed.data;
  const parcel = parcelById(parcelId);
  if (!parcel) return apiError('not_found', 'Unknown parcel.', 404);

  const fallback = pitchLetterFallback(parcel, lang, keepSpaces);
  if (isMock()) {
    const fx = await readFixture<string>(`pitch.${lang}.md`);
    return textStreamResponse(simulateStream((fx ?? fallback).trim()), { 'X-Keystone-Source': 'fixture' });
  }

  const n = pitchNumbers(parcel, keepSpaces, lang);
  const facts = {
    language: LANG_NAMES[lang],
    congregation: n.name,
    city: n.city,
    faith: parcel.faith ?? 'congregation',
    ownerSince: parcel.ownerSince.slice(0, 4),
    buildableAcres: n.buildableAcres,
    parkingSpaces: n.parkingSpaces,
    keptParkingSpaces: n.keptSpaces,
    homes: n.homes,
    peopleHoused: n.people,
    homeType: HOME_TYPE[lang][n.unitType],
    sanctuaryKept: true,
  };
  const stream = await streamText({
    purpose: `pitch:${lang}`,
    system: SYSTEM,
    messages: [{ role: 'user', content: `Engine output (JSON):\n${JSON.stringify(facts, null, 1)}\n\nWrite the letter in ${LANG_NAMES[lang]}.` }],
    maxTokens: 900,
    effort: 'low',
  });
  if (!stream) return textStreamResponse(simulateStream(fallback), { 'X-Keystone-Source': 'fallback' });
  return textStreamResponse(stream, { 'X-Keystone-Source': 'claude' });
}
