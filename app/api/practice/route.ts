import { z } from 'zod';
import { NextResponse } from 'next/server';
import { apiError, readJson, readFixture, isMock } from '@/lib/api';
import { completeText } from '@/lib/claude';
import { parcelById } from '@/lib/data';
import { pitchNumbers, practiceTurnFallback, practiceFeedbackFallback } from '@/lib/pitchFallback';
import { factsForPrompt } from '@/lib/sb4Facts';

export const maxDuration = 30;

const Turn = z.object({ role: z.enum(['board', 'staff']), text: z.string().min(1).max(2000) });
const Input = z.object({
  parcelId: z.string().min(1).max(120),
  transcript: z.array(Turn).max(12),
  mode: z.enum(['turn', 'feedback']),
  keepSpaces: z.number().int().min(0).max(5000).optional(),
});
const Output = z.object({ text: z.string().min(20).max(2400) });

type Fixture = { turns: string[]; feedback: string };

const BOARD_SYSTEM = `You are role-playing a long-serving board member of a congregation that owns the land described below. You are skeptical but fair: you love your community, protect its parking, its neighbors and its land, and you ask hard questions without being hostile. You are talking with a Habitat for Humanity of Orange County staff member who wants to discuss building Habitat homes on part of the campus under California SB 4.
Rules: stay in character; one short paragraph (50–90 words); respond to what the staff member just said, then press on a new or unresolved concern (parking, neighbors, liability, losing control of the land, cost, timeline); end with a question. If the transcript is empty, open the meeting with your first objection. Never give legal rulings. Plain text, no Markdown, no stage directions.
Facts you may rely on (as a layperson):
${factsForPrompt()}`;

const FEEDBACK_SYSTEM = `You coach Habitat for Humanity of Orange County staff after a practice board meeting. Read the transcript and write specific feedback in 120–180 words with two short headed lists in plain text: "What landed" (2–3 bullets quoting or paraphrasing what the staff member said well) and "What to tighten" (2–3 bullets with concrete rewording or a fact to add). Judge against these facts and the Habitat model (Habitat builds and sells to qualified families with an affordable mortgage; the congregation keeps the sanctuary and chooses the structure; 45-year deed restriction; ministerial approval; Phase I ESA required):
${factsForPrompt()}
Flag any claim the staff member made that goes beyond these facts. End with one encouraging sentence. No Markdown symbols other than "-" bullets.`;

function respond(text: string, source: 'fixture' | 'claude' | 'fallback') {
  return NextResponse.json({ text }, { headers: { 'X-Keystone-Source': source, 'Cache-Control': 'no-store' } });
}

export async function POST(req: Request) {
  const parsed = await readJson(req, Input);
  if (!parsed.ok) return parsed.res;
  const { parcelId, transcript, mode, keepSpaces } = parsed.data;
  const parcel = parcelById(parcelId);
  if (!parcel) return apiError('not_found', 'Unknown parcel.', 404);

  const boardTurns = transcript.filter((t) => t.role === 'board').length;
  const staffAnswers = transcript.filter((t) => t.role === 'staff').map((t) => t.text);
  const fallback = mode === 'turn' ? practiceTurnFallback(boardTurns) : practiceFeedbackFallback(staffAnswers);

  if (isMock()) {
    const fx = await readFixture<Fixture>('practice.json');
    if (fx) {
      const text = mode === 'turn' ? fx.turns[Math.min(boardTurns, fx.turns.length - 1)] : fx.feedback;
      return respond(text ?? fallback, 'fixture');
    }
    return respond(fallback, 'fixture');
  }

  const n = pitchNumbers(parcel, keepSpaces, 'en');
  const site = `Site (engine output, JSON):\n${JSON.stringify(n, null, 1)}`;
  const history = transcript.length
    ? transcript.map((t) => `${t.role === 'board' ? 'BOARD MEMBER' : 'HABITAT STAFF'}: ${t.text}`).join('\n\n')
    : '(no conversation yet)';

  const text = await completeText({
    purpose: `practice:${mode}`,
    system: mode === 'turn' ? BOARD_SYSTEM : FEEDBACK_SYSTEM,
    messages: [{
      role: 'user',
      content: mode === 'turn'
        ? `${site}\n\nTranscript so far:\n${history}\n\n${transcript.length ? 'Reply as the board member.' : 'Open the meeting with your first objection.'}`
        : `${site}\n\nFull transcript:\n${history}\n\nWrite the feedback.`,
    }],
    maxTokens: mode === 'turn' ? 400 : 700,
    effort: 'low',
  });
  if (text) {
    const ok = Output.safeParse({ text: text.trim() });
    if (ok.success) return respond(ok.data.text, 'claude');
    console.warn('[api] practice: output out of bounds, using fallback');
  }
  return respond(fallback, 'fallback');
}
