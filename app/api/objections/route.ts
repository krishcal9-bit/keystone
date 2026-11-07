import { z } from 'zod';
import { NextResponse } from 'next/server';
import { apiError, readJson, readFixture, isMock } from '@/lib/api';
import { completeText, extractJson } from '@/lib/claude';
import { parcelById } from '@/lib/data';
import { OBJECTION_IDS, objectionsFallback, pitchNumbers, type Objection } from '@/lib/pitchFallback';
import { factsForPrompt } from '@/lib/sb4Facts';

export const maxDuration = 30;

const Input = z.object({
  parcelId: z.string().min(1).max(120),
  keepSpaces: z.number().int().min(0).max(5000).optional(),
});

const Output = z.object({
  objections: z.array(z.object({
    id: z.enum(OBJECTION_IDS),
    question: z.string().min(8).max(300),
    answer: z.string().min(40).max(1200),
  })).length(6),
});

const SYSTEM = `You prepare Habitat for Humanity of Orange County staff for a congregation's board meeting.
Return JSON only: {"objections":[{"id","question","answer"}]} with exactly six items, ids in this order: parking, neighbors, liability, control, cost, timeline.
Each "question" is the objection as a skeptical board member would say it (one sentence). Each "answer" is an honest, specific reply in 60–110 words, grounded only in the engine numbers given and these facts:
${factsForPrompt()}
Habitat model: Habitat develops and builds; homes are sold to qualified lower-income families with an affordable mortgage; the congregation keeps its sanctuary and every existing building and chooses the structure (ground lease, partial sale or partnership); a 45-year deed restriction keeps the homes affordable; ministerial approval means no rezoning or CEQA fight; a Phase I environmental site assessment is required.
Never promise outcomes, never invent numbers or rules, acknowledge real trade-offs, and say the city and counsel confirm legal questions. No Markdown.`;

function respond(objections: Objection[], source: 'fixture' | 'claude' | 'fallback') {
  return NextResponse.json({ objections }, { headers: { 'X-Keystone-Source': source, 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const parsed = await readJson(req, Input);
  if (!parsed.ok) return parsed.res;
  const { parcelId, keepSpaces } = parsed.data;
  const parcel = parcelById(parcelId);
  if (!parcel) return apiError('not_found', 'Unknown parcel.', 404);

  const fallback = objectionsFallback(parcel, keepSpaces);
  if (isMock()) {
    const fx = await readFixture<unknown>('objections.json');
    const ok = Output.safeParse(fx);
    return respond(ok.success ? ok.data.objections : fallback, 'fixture');
  }

  const n = pitchNumbers(parcel, keepSpaces, 'en');
  const text = await completeText({
    purpose: 'objections',
    system: SYSTEM,
    messages: [{ role: 'user', content: `Engine output (JSON):\n${JSON.stringify(n, null, 1)}\n\nReturn the six objections and answers as JSON.` }],
    maxTokens: 1800,
    effort: 'low',
  });
  if (text) {
    try {
      const ok = Output.safeParse(extractJson(text));
      if (ok.success) return respond(ok.data.objections, 'claude');
      console.warn('[api] objections: schema mismatch, using fallback');
    } catch (err) {
      console.warn('[api] objections: bad JSON, using fallback', err instanceof Error ? err.message : err);
    }
  }
  return respond(fallback, 'fallback');
}
