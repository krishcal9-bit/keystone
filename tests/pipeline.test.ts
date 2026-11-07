import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import type { PipelineEntry } from '@/lib/store';
import { parcels } from '@/lib/data';
import { SB4_FACTS } from '@/lib/sb4Facts';

// Tiny in-memory localStorage + window shim so lib/store believes it is in a browser.
const mem = new Map<string, string>();
const storage = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => { mem.set(k, String(v)); },
  removeItem: (k: string) => { mem.delete(k); },
  clear: () => mem.clear(),
  key: (i: number) => Array.from(mem.keys())[i] ?? null,
  get length() { return mem.size; },
};
vi.stubGlobal('localStorage', storage);
vi.stubGlobal('window', { dispatchEvent: () => true, addEventListener: () => {}, removeEventListener: () => {} });
vi.stubGlobal('CustomEvent', class { type: string; detail: unknown; constructor(type: string, init?: { detail?: unknown }) { this.type = type; this.detail = init?.detail; } });
afterAll(() => vi.unstubAllGlobals());

const { isStalled, addToPipeline, getPipeline, STALLED_DAYS, seedPipelineOnce } = await import('@/lib/pipeline');
const { weeklyFallback, weeklyRows } = await import('@/lib/weeklyFallback');
const { askFallback, rankFacts } = await import('@/lib/askFallback');

const DAY = 86_400_000;
const NOW = Date.parse('2026-11-07T12:00:00Z');
const entry = (over: Partial<PipelineEntry>): PipelineEntry => ({ parcelId: parcels[0].id, stage: 'contacted', notes: '', lastActivity: new Date(NOW - 5 * DAY).toISOString(), homes: 40, ...over });

describe('isStalled', () => {
  it('is 21 days', () => expect(STALLED_DAYS).toBe(21));
  it('is not stalled at 20 days', () => expect(isStalled(entry({ lastActivity: new Date(NOW - 20 * DAY).toISOString() }), NOW)).toBe(false));
  it('is stalled at 22 days', () => expect(isStalled(entry({ lastActivity: new Date(NOW - 22 * DAY).toISOString() }), NOW)).toBe(true));
  it('is not stalled at exactly 21 days (strictly greater)', () => expect(isStalled(entry({ lastActivity: new Date(NOW - 21 * DAY).toISOString() }), NOW)).toBe(false));
  it('groundbreaking is never stalled', () => expect(isStalled(entry({ stage: 'groundbreaking', lastActivity: new Date(NOW - 400 * DAY).toISOString() }), NOW)).toBe(false));
});

describe('addToPipeline', () => {
  beforeEach(() => mem.clear());
  it('adds once and returns the existing entry on repeat', () => {
    const id = parcels[0].id;
    const a = addToPipeline(id, { homes: 12 });
    const b = addToPipeline(id, { homes: 99, stage: 'agreement' });
    expect(getPipeline()).toHaveLength(1);
    expect(b).toEqual(a);
    expect(b.homes).toBe(12);
    expect(b.stage).toBe('identified');
  });
  it('computes homes from the engine when none are given', () => {
    const e = addToPipeline(parcels[0].id);
    expect(Number.isFinite(e.homes)).toBe(true);
    expect(e.homes!).toBeGreaterThan(0);
  });
  it('seeds 12 sites exactly once', () => {
    seedPipelineOnce();
    expect(getPipeline()).toHaveLength(12);
    seedPipelineOnce();
    expect(getPipeline()).toHaveLength(12);
    const ids = new Set(getPipeline().map((e) => e.parcelId));
    expect(ids.size).toBe(12);
  });
});

describe('weeklyFallback', () => {
  const entries: PipelineEntry[] = [
    entry({ parcelId: parcels[0].id, stage: 'contacted', lastActivity: new Date(NOW - 1 * DAY).toISOString(), homes: 107, notes: 'Pastor replied.' }),
    entry({ parcelId: parcels[1].id, stage: 'identified', lastActivity: new Date(NOW - 30 * DAY).toISOString(), homes: 52 }),
    entry({ parcelId: parcels[2].id, stage: 'groundbreaking', lastActivity: new Date(NOW - 60 * DAY).toISOString(), homes: 20 }),
    entry({ parcelId: 'not-a-parcel', stage: 'identified', homes: 5 }),
  ];
  it('drops unknown parcels and flags moved/stalled', () => {
    const rows = weeklyRows(entries, NOW);
    expect(rows).toHaveLength(3);
    expect(rows[0].moved).toBe(true);
    expect(rows[1].stalled).toBe(true);
    expect(rows[2].stalled).toBe(false);
  });
  it('writes the three sections with no NaN/undefined', () => {
    const out = weeklyFallback(entries, NOW);
    expect(out).toContain('## What moved');
    expect(out).toContain('## What’s stalled');
    expect(out).toContain('## Three next actions');
    expect(out).not.toMatch(/NaN|undefined|null/);
    expect(out.match(/^\d\. /gm)?.length).toBe(3);
  });
  it('handles an empty pipeline and missing homes', () => {
    const out = weeklyFallback([], NOW);
    expect(out).not.toMatch(/NaN|undefined/);
    const out2 = weeklyFallback([entry({ homes: undefined, lastActivity: 'garbage' })], NOW);
    expect(out2).not.toMatch(/NaN|undefined/);
  });
});

describe('askFallback', () => {
  const ids = new Set<string>(SB4_FACTS.map((f) => f.id));
  const factsLine = (s: string) => /FACTS: ([A-Z]\d+(?:, [A-Z]\d+)*)$/.exec(s.trim());
  it('answers the density question from F6', () => {
    const out = askFallback('How many homes per acre does SB 4 require?');
    const m = factsLine(out);
    expect(m).not.toBeNull();
    expect(m![1].split(', ')).toContain('F6');
    expect(out).toContain('30 units per acre');
  });
  it('ranks CEQA question onto F3', () => expect(rankFacts('Do we need CEQA review?')[0].id).toBe('F3'));
  it('adds the not-legal-advice line for eligibility questions', () => {
    const out = askFallback('Does our church qualify if we bought the land in 2022?');
    expect(out).toContain('Not legal advice');
    expect(factsLine(out)![1].split(', ')).toContain('N1');
  });
  it('refuses when nothing matches, still with a FACTS line', () => {
    const out = askFallback('zzzz qqqq');
    expect(out).toContain('I don’t have a fact for that');
    expect(factsLine(out)).not.toBeNull();
  });
  it('only cites known ids and never NaN/undefined', () => {
    for (const q of ['staff units?', 'deed restriction length', 'height limit', 'Phase I', 'San Diego acres', 'Habitat mortgage']) {
      const out = askFallback(q);
      expect(out).not.toMatch(/NaN|undefined/);
      for (const id of factsLine(out)![1].split(', ')) expect(ids.has(id)).toBe(true);
    }
  });
});
