import type { PipelineEntry, Stage } from './store';
import { STAGES } from './store';
import { parcelById } from './data';
import { STALLED_DAYS } from './pipeline';

const DAY = 86_400_000;
export const MOVED_DAYS = 7;

const STAGE_LABEL: Record<Stage, string> = {
  identified: 'Identified', researched: 'Researched', contacted: 'Contacted', meeting: 'Meeting set',
  boardInterested: 'Board interested', feasibility: 'Feasibility', agreement: 'Agreement', groundbreaking: 'Groundbreaking',
};

const NEXT_ACTION: Record<Stage, string> = {
  identified: 'pull the title record and confirm ownership on or before January 1, 2024',
  researched: 'send the first letter to the congregation leadership',
  contacted: 'ask for a 30-minute meeting and bring the one-pager',
  meeting: 'walk the lot together and count parking on a peak day',
  boardInterested: 'answer the board’s parking and control questions in writing',
  feasibility: 'order the Phase I environmental site assessment',
  agreement: 'book the pre-application meeting with the city on SB 4 objective standards',
  groundbreaking: 'schedule the volunteer build days',
};

export type WeeklyRow = {
  parcelId: string; name: string; city: string; stage: Stage; stageLabel: string; homes: number;
  daysSinceActivity: number; moved: boolean; stalled: boolean; notes: string;
};

const safeInt = (n: unknown) => (typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0);

/** Normalises pipeline entries into rows the brief (Claude or rules) can reason about. Unknown parcels are dropped. */
export function weeklyRows(entries: PipelineEntry[], now = Date.now()): WeeklyRow[] {
  const rows: WeeklyRow[] = [];
  for (const e of entries) {
    const p = parcelById(e.parcelId);
    if (!p) continue;
    const t = new Date(e.lastActivity).getTime();
    const days = Number.isFinite(t) ? Math.max(0, Math.floor((now - t) / DAY)) : 999;
    rows.push({
      parcelId: e.parcelId, name: p.displayName, city: p.city, stage: e.stage, stageLabel: STAGE_LABEL[e.stage] ?? e.stage,
      homes: safeInt(e.homes), daysSinceActivity: days, moved: days <= MOVED_DAYS,
      stalled: e.stage !== 'groundbreaking' && days > STALLED_DAYS, notes: (e.notes ?? '').slice(0, 300),
    });
  }
  return rows;
}

const ago = (d: number) => (d === 0 ? 'today' : d === 1 ? 'yesterday' : `${d} days ago`);
const stageRank = (s: Stage) => STAGES.indexOf(s);

/** Rules-based weekly brief, same shape as the live Claude output. */
export function weeklyFallback(entries: PipelineEntry[], now = Date.now()): string {
  const rows = weeklyRows(entries, now);
  const lines: string[] = [];
  const homes = rows.reduce((a, r) => a + r.homes, 0);
  const moved = rows.filter((r) => r.moved).sort((a, b) => a.daysSinceActivity - b.daysSinceActivity);
  const stalled = rows.filter((r) => r.stalled).sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);

  lines.push('## What moved');
  if (!rows.length) lines.push('The pipeline is empty. Add sites from the site finder to start tracking them.');
  else if (!moved.length) lines.push(`No site had activity in the last ${MOVED_DAYS} days. ${rows.length} sites are tracked, ${homes} potential homes in all.`);
  else for (const r of moved) lines.push(`- ${r.name} (${r.city}) is in ${r.stageLabel}, last touched ${ago(r.daysSinceActivity)}: ${r.homes} homes.${r.notes ? ` Note: ${r.notes}` : ''}`);

  lines.push('', '## What’s stalled');
  if (!stalled.length) lines.push(`Nothing has gone quiet for more than ${STALLED_DAYS} days.`);
  else for (const r of stalled) lines.push(`- ${r.name} (${r.city}) has had no activity in ${r.daysSinceActivity} days at ${r.stageLabel}: ${r.homes} homes waiting.`);

  lines.push('', '## Three next actions');
  const actions: string[] = [];
  // 1. the furthest-along site that is not at groundbreaking, 2. the biggest stalled site, 3. the biggest early-stage site.
  const furthest = [...rows].filter((r) => r.stage !== 'groundbreaking').sort((a, b) => stageRank(b.stage) - stageRank(a.stage) || b.homes - a.homes)[0];
  const biggestStalled = [...stalled].sort((a, b) => b.homes - a.homes)[0];
  const biggestEarly = [...rows].filter((r) => stageRank(r.stage) <= 1).sort((a, b) => b.homes - a.homes)[0];
  const used = new Set<string>();
  for (const r of [furthest, biggestStalled, biggestEarly]) {
    if (!r || used.has(r.parcelId)) continue;
    used.add(r.parcelId);
    actions.push(`${r.name}: ${NEXT_ACTION[r.stage]} (${r.homes} homes, ${r.stageLabel}).`);
  }
  for (const r of [...rows].sort((a, b) => b.homes - a.homes)) {
    if (actions.length >= 3) break;
    if (used.has(r.parcelId)) continue;
    used.add(r.parcelId);
    actions.push(`${r.name}: ${NEXT_ACTION[r.stage]} (${r.homes} homes, ${r.stageLabel}).`);
  }
  if (!actions.length) actions.push('Open the site finder, filter to eligible sites near transit, and add the top three to the pipeline.', 'Draft the first outreach letter in the Pitch Kit.', 'Set a weekly 20-minute review of this page.');
  actions.slice(0, 3).forEach((a, i) => lines.push(`${i + 1}. ${a}`));
  return lines.join('\n');
}
