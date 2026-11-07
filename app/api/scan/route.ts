import type Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiError, readJson, readFixture, isMock } from '@/lib/api';
import { getClient, extractJson, logUsage, MODEL, TIMEOUT_MS } from '@/lib/claude';
import { ScanResponseSchema, type ScanResponse } from '@/lib/scanMath';

export const maxDuration = 30;

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const Input = z.object({
  image: z.string().min(16).refine((s) => s.length * 0.75 <= MAX_IMAGE_BYTES, 'Image must be 8 MB or smaller.'),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  metersAcross: z.number().min(10).max(5000),
  parcelId: z.string().min(1).max(120).optional(),
  sampleId: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

const SYSTEM = `You outline land use in an aerial (satellite-style) image of a single lot for a housing planner.
Return ONLY one JSON object, no prose, no Markdown fences, exactly this shape:
{"polygons":[{"id":"string","category":"building|parking|open|trees|access","points":[{"x":0..1,"y":0..1}],"confidence":0..1,"label":"short optional label"}],"notes":"optional one sentence"}
Rules:
- Coordinates are normalized to the image: (0,0) is the top-left corner, (1,1) the bottom-right.
- Categories: "building" = any roof or structure; "parking" = paved lots, drive aisles and stalls (not public streets); "open" = lawn, dirt, landscaped or unused land inside the lot; "trees" = tree canopies (one polygon per tree or cluster); "access" = driveways, entry paths and curb cuts connecting the lot to the street.
- Trace simplified polygons with 4 to 12 points each; at most 12 polygons in total; ignore public streets and anything outside the main lot.
- Do not overlap "open" polygons with buildings or parking.
- confidence is your certainty for that polygon (0 to 1).`;

const json = (body: ScanResponse, source: string) =>
  NextResponse.json(body, { headers: { 'X-Keystone-Source': source, 'Cache-Control': 'no-store' } });

export async function POST(req: Request) {
  const parsed = await readJson(req, Input);
  if (!parsed.ok) return parsed.res;
  const { image, mediaType, metersAcross, sampleId } = parsed.data;

  const client = getClient();
  if (isMock() || !client) {
    if (sampleId || isMock()) {
      const fx = await readFixture<unknown>(`scan-${sampleId ?? 1}.json`);
      const ok = ScanResponseSchema.safeParse(fx);
      if (ok.success) return json(ok.data, 'fixture');
    }
    return apiError('no_model', 'No vision model is configured. Trace the lot manually.', 503);
  }

  const userText = `The image is about ${Math.round(metersAcross)} meters across. Outline the lot as JSON.`;
  const messages: Anthropic.MessageParam[] = [{
    role: 'user',
    content: [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
      { type: 'text', text: userText },
    ],
  }];

  let lastText = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 2000,
        system: SYSTEM,
        messages: attempt === 0 ? messages : [
          ...messages,
          { role: 'assistant', content: lastText || '{}' },
          { role: 'user', content: 'That JSON was invalid or did not match the schema. Reply again with only the JSON object described in the instructions.' },
        ],
        output_config: { effort: 'low' },
      }, { timeout: TIMEOUT_MS });
      logUsage('scan', res.usage, attempt ? 'retry' : '');
      if (res.stop_reason === 'refusal') break;
      lastText = res.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('');
      let raw: unknown;
      try { raw = extractJson(lastText); } catch { continue; }
      const ok = ScanResponseSchema.safeParse(normalize(raw));
      if (ok.success) return json(ok.data, 'claude');
      console.warn('[scan] schema mismatch:', ok.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    } catch (err) {
      console.warn(`[claude] scan attempt ${attempt + 1} failed:`, err instanceof Error ? err.message : err);
    }
  }
  return apiError('extraction_failed', 'Extraction did not return usable polygons. Trace the lot manually.', 502);
}

/** Tolerant clean-up before validation: clamp coordinates, fill ids, drop tiny or malformed polygons. */
function normalize(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const o = raw as { polygons?: unknown; notes?: unknown };
  if (!Array.isArray(o.polygons)) return raw;
  const clamp01 = (v: unknown) => Math.min(1, Math.max(0, Number(v)));
  const polygons = o.polygons
    .map((p, i) => {
      if (!p || typeof p !== 'object') return null;
      const q = p as Record<string, unknown>;
      const pts = Array.isArray(q.points) ? q.points.map((pt) => (pt && typeof pt === 'object' ? { x: clamp01((pt as Record<string, unknown>).x), y: clamp01((pt as Record<string, unknown>).y) } : null)).filter((pt): pt is { x: number; y: number } => !!pt && Number.isFinite(pt.x) && Number.isFinite(pt.y)) : [];
      const confidence = Number.isFinite(Number(q.confidence)) ? clamp01(q.confidence) : 0.5;
      return { id: typeof q.id === 'string' && q.id ? q.id.slice(0, 64) : `${String(q.category)}-${i + 1}`, category: q.category, points: pts.slice(0, 40), confidence, label: typeof q.label === 'string' ? q.label.slice(0, 80) : undefined };
    })
    .filter((p) => p && p.points.length >= 3)
    .slice(0, 40);
  return { polygons, notes: typeof o.notes === 'string' ? o.notes.slice(0, 600) : undefined };
}
