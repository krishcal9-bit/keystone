import { z } from 'zod';
import type Anthropic from '@anthropic-ai/sdk';
import { readJson, readFixture, isMock, textStreamResponse, simulateStream } from '@/lib/api';
import { streamText } from '@/lib/claude';
import { factsForPrompt, NOT_LEGAL } from '@/lib/sb4Facts';
import { askFallback } from '@/lib/askFallback';

export const maxDuration = 30;

const Turn = z.object({ role: z.enum(['user', 'assistant']), text: z.string().min(1).max(2000) });
const Input = z.object({ question: z.string().trim().min(1).max(600), history: z.array(Turn).max(8).optional() });

const SYSTEM = `You are Keystone, answering questions from Habitat for Humanity of Orange County staff and congregation leaders about California SB 4 and Habitat partnerships.
You may state ONLY the facts below, each tagged with an id. Habitat basics: Habitat OC builds and sells homes to qualified lower-income families who contribute sweat equity and pay an affordable mortgage; it partners with landowners such as congregations and does not take land by pressure; in Orange County land cost, not families or volunteers, is the limit.

FACTS
${factsForPrompt()}

RULES
- Answer in 150 words or fewer, plain language, no headings, no preamble. Do not write fact ids inside the prose; they go only on the final FACTS line.
- Use only the facts above. If the question needs a rule you do not have, say exactly: "I don't have a fact for that; confirm with the city and counsel." and do not guess.
- Never invent numbers, dates, procedures, exceptions or legal rules. Do not generalise beyond the facts.
- When the question touches eligibility, qualification, legal requirements or what is allowed, add the line "${NOT_LEGAL}" and cite N1.
- End with one final line in this exact form, listing every fact id you used: FACTS: F1, F6`;

const toMessages = (history: z.infer<typeof Turn>[] | undefined, question: string): Anthropic.MessageParam[] => {
  const msgs: Anthropic.MessageParam[] = [];
  for (const h of history ?? []) {
    const last = msgs[msgs.length - 1];
    if (last && last.role === h.role) last.content = `${last.content}\n\n${h.text}`;
    else msgs.push({ role: h.role, content: h.text });
  }
  if (msgs.length && msgs[0].role !== 'user') msgs.shift();
  const last = msgs[msgs.length - 1];
  if (last && last.role === 'user') last.content = `${last.content}\n\n${question}`;
  else msgs.push({ role: 'user', content: question });
  return msgs;
};

export async function POST(req: Request) {
  const parsed = await readJson(req, Input);
  if (!parsed.ok) return parsed.res;
  const { question, history } = parsed.data;

  const fallback = askFallback(question);
  if (isMock()) {
    const fx = await readFixture<string>('ask.md');
    return textStreamResponse(simulateStream(fx ?? fallback), { 'X-Keystone-Source': 'fixture' });
  }
  const stream = await streamText({ purpose: 'ask', system: SYSTEM, messages: toMessages(history, question), maxTokens: 400, effort: 'low' });
  if (!stream) return textStreamResponse(simulateStream(fallback), { 'X-Keystone-Source': 'fallback' });
  return textStreamResponse(stream, { 'X-Keystone-Source': 'claude' });
}
