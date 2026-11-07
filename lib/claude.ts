/**
 * Server-only Claude client. Model: claude-sonnet-5-5. Never set temperature.
 * Every caller must have a rules-based or fixture fallback so the app works without a key.
 */
import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

export const MODEL = 'claude-sonnet-5-5';
export const TIMEOUT_MS = 25_000;

let client: Anthropic | null | undefined;

export function apiKey(): string | undefined {
  return process.env.APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || undefined;
}

export function isMock(): boolean {
  return process.env.MOCK_CLAUDE === '1';
}

export function getClient(): Anthropic | null {
  if (isMock()) return null;
  if (client !== undefined) return client;
  const key = apiKey();
  client = key ? new Anthropic({ apiKey: key, timeout: TIMEOUT_MS, maxRetries: 0 }) : null;
  return client;
}

export function logUsage(purpose: string, usage?: { input_tokens?: number; output_tokens?: number } | null, extra = '') {
  const inTok = usage?.input_tokens ?? 0;
  const outTok = usage?.output_tokens ?? 0;
  console.log(`[claude] ${purpose} · in ${inTok} · out ${outTok}${extra ? ' · ' + extra : ''}`);
}

type CallOpts = {
  purpose: string;
  system: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
  effort?: 'low' | 'medium' | 'high';
};

/** One attempt + one retry, each bounded by TIMEOUT_MS. Returns null when no client or both attempts fail. */
export async function completeText(opts: CallOpts): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await c.messages.create({
        model: MODEL,
        max_tokens: opts.maxTokens ?? 2048,
        system: opts.system,
        messages: opts.messages,
        output_config: { effort: opts.effort ?? 'low' },
      }, { timeout: TIMEOUT_MS });
      logUsage(opts.purpose, res.usage, attempt ? 'retry' : '');
      if (res.stop_reason === 'refusal') return null;
      return res.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('');
    } catch (err) {
      console.warn(`[claude] ${opts.purpose} attempt ${attempt + 1} failed:`, err instanceof Error ? err.message : err);
    }
  }
  return null;
}

/** Streams text deltas. Resolves to null if the stream could not start (caller then streams a fallback). */
export async function streamText(opts: CallOpts): Promise<AsyncIterable<string> | null> {
  const c = getClient();
  if (!c) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const stream = c.messages.stream({
        model: MODEL,
        max_tokens: opts.maxTokens ?? 2048,
        system: opts.system,
        messages: opts.messages,
        output_config: { effort: opts.effort ?? 'low' },
      }, { timeout: TIMEOUT_MS });
      const purpose = opts.purpose;
      // Wait for the first event so we can fall back if the request itself fails.
      const iterator = stream[Symbol.asyncIterator]();
      const first = await iterator.next();
      if (first.done) return null;
      const gen = async function* () {
        let ev: IteratorResult<Anthropic.MessageStreamEvent> = first;
        try {
          while (!ev.done) {
            const e = ev.value;
            if (e.type === 'content_block_delta' && e.delta.type === 'text_delta') yield e.delta.text;
            ev = await iterator.next();
          }
          const final = await stream.finalMessage();
          logUsage(purpose, final.usage, 'stream');
        } catch (err) {
          console.warn(`[claude] ${purpose} stream interrupted:`, err instanceof Error ? err.message : err);
        }
      };
      return gen();
    } catch (err) {
      console.warn(`[claude] ${opts.purpose} stream attempt ${attempt + 1} failed:`, err instanceof Error ? err.message : err);
    }
  }
  return null;
}

/** Extracts the first JSON object/array from a model response. */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = Math.min(...['{', '['].map((ch) => { const i = body.indexOf(ch); return i < 0 ? Infinity : i; }));
  if (!Number.isFinite(start)) throw new Error('no json');
  const end = Math.max(body.lastIndexOf('}'), body.lastIndexOf(']'));
  return JSON.parse(body.slice(start, end + 1));
}
