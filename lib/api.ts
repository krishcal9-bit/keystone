/** Helpers shared by every /api route: Zod validation, error envelopes, fixture reads, simulated streaming. */
import { NextResponse } from 'next/server';
import type { ZodType } from 'zod';
import fs from 'node:fs/promises';
import path from 'node:path';
import { isMock } from './claude';

export type ApiError = { error: { code: string; message: string } };

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json<ApiError>({ error: { code, message } }, { status });
}

export async function readJson<T>(req: Request, schema: ZodType<T>): Promise<{ ok: true; data: T } | { ok: false; res: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, res: apiError('bad_json', 'Request body must be JSON.') };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, res: apiError('invalid_input', parsed.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ')) };
  }
  return { ok: true, data: parsed.data };
}

export async function readFixture<T = unknown>(name: string): Promise<T | null> {
  try {
    const file = path.join(process.cwd(), 'fixtures', name);
    const raw = await fs.readFile(file, 'utf8');
    return (name.endsWith('.json') ? JSON.parse(raw) : raw) as T;
  } catch {
    return null;
  }
}

export { isMock };

const encoder = new TextEncoder();

/** Turns an async iterable of text chunks into a text/plain streaming response. */
export function textStreamResponse(chunks: AsyncIterable<string>, headers: Record<string, string> = {}) {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const c of chunks) controller.enqueue(encoder.encode(c));
      } catch (err) {
        console.warn('[api] stream error', err instanceof Error ? err.message : err);
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no', ...headers },
  });
}

/** Streams a finished string a few words at a time so fallbacks and fixtures feel like live output. */
export async function* simulateStream(text: string, wordsPerChunk = 3, delayMs = 18): AsyncIterable<string> {
  const words = text.split(/(\s+)/);
  let buf = '';
  let n = 0;
  for (const w of words) {
    buf += w;
    if (/\S/.test(w)) n++;
    if (n >= wordsPerChunk) {
      yield buf; buf = ''; n = 0;
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  if (buf) yield buf;
}

export const runtimeConfig = { maxDuration: 30 } as const;
