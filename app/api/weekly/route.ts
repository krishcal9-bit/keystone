import { z } from 'zod';
import { apiError, readJson, readFixture, isMock, textStreamResponse, simulateStream } from '@/lib/api';
import { streamText } from '@/lib/claude';
import { STAGES } from '@/lib/store';
import { STALLED_DAYS } from '@/lib/pipeline';
import { weeklyFallback, weeklyRows, MOVED_DAYS } from '@/lib/weeklyFallback';

export const maxDuration = 30;

const Entry = z.object({
  parcelId: z.string().min(1).max(120),
  stage: z.enum(STAGES as [string, ...string[]]),
  notes: z.string().max(2000).default(''),
  lastActivity: z.string().min(4).max(40),
  keepSpaces: z.number().int().min(0).max(5000).optional(),
  homes: z.number().min(0).max(100_000).optional(),
});
const Input = z.object({ entries: z.array(Entry).max(200) });

const SYSTEM = `You are Keystone, a planning assistant for Habitat for Humanity of Orange County staff. Write the Monday pipeline brief in Markdown with exactly these sections: "## What moved" (bullets: sites with activity in the last ${MOVED_DAYS} days, what stage they are in, homes), "## What’s stalled" (bullets: sites with no activity in more than ${STALLED_DAYS} days, how many days, homes waiting), "## Three next actions" (a numbered list of exactly three concrete actions, each naming the site and why it is the best use of this week).
Use only the data you are given. Never invent sites, numbers, dates or legal rules. If a section has nothing, say so in one plain sentence. Plain, warm, specific; under 260 words; no preamble, no sign-off.`;

export async function POST(req: Request) {
  const parsed = await readJson(req, Input);
  if (!parsed.ok) return parsed.res;
  const entries = parsed.data.entries.map((e) => ({ ...e, stage: e.stage as (typeof STAGES)[number] }));
  const rows = weeklyRows(entries);
  if (entries.length && !rows.length) return apiError('invalid_input', 'No entries matched a known parcel.');

  const fallback = weeklyFallback(entries);
  if (isMock()) {
    const fx = await readFixture<string>('weekly.md');
    return textStreamResponse(simulateStream(fx ?? fallback), { 'X-Keystone-Source': 'fixture' });
  }
  if (!rows.length) return textStreamResponse(simulateStream(fallback), { 'X-Keystone-Source': 'fallback' });

  const stream = await streamText({
    purpose: 'weekly',
    system: SYSTEM,
    messages: [{ role: 'user', content: `Pipeline rows (JSON, ${rows.length} sites):\n${JSON.stringify(rows, null, 1)}\n\nWrite the brief.` }],
    maxTokens: 700,
    effort: 'low',
  });
  if (!stream) return textStreamResponse(simulateStream(fallback), { 'X-Keystone-Source': 'fallback' });
  return textStreamResponse(stream, { 'X-Keystone-Source': 'claude' });
}
