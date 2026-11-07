'use client';
/** Pipeline state helpers over lib/store (localStorage). */
import { useCallback, useEffect, useState } from 'react';
import { read, write, storeKeys, STAGES, type PipelineEntry, type Stage } from './store';
import { parcels } from './data';
import { recommendedScenario, checkEligibility } from './sb4';

export const STALLED_DAYS = 21;

export function getPipeline(): PipelineEntry[] { return read<PipelineEntry[]>(storeKeys.pipeline, []); }
export function savePipeline(entries: PipelineEntry[]) { write(storeKeys.pipeline, entries); }
export function isInPipeline(parcelId: string) { return getPipeline().some((e) => e.parcelId === parcelId); }

export function addToPipeline(parcelId: string, opts: { homes?: number; keepSpaces?: number; stage?: Stage } = {}): PipelineEntry {
  const entries = getPipeline();
  const existing = entries.find((e) => e.parcelId === parcelId);
  if (existing) return existing;
  const p = parcels.find((x) => x.id === parcelId);
  const homes = opts.homes ?? (p ? recommendedScenario(p, opts.keepSpaces).homes : 0);
  const entry: PipelineEntry = { parcelId, stage: opts.stage ?? 'identified', notes: '', lastActivity: new Date().toISOString(), keepSpaces: opts.keepSpaces, homes };
  savePipeline([...entries, entry]);
  return entry;
}

/** Seeds 12 eligible sample sites into varied stages on first load. */
export function seedPipelineOnce() {
  if (read<boolean>(storeKeys.seeded, false)) return;
  const eligible = parcels.filter((p) => checkEligibility(p).eligible);
  const picks = [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33].map((i) => eligible[i % eligible.length]);
  const stages: Stage[] = ['identified', 'identified', 'researched', 'researched', 'contacted', 'contacted', 'meeting', 'meeting', 'boardInterested', 'feasibility', 'agreement', 'groundbreaking'];
  const daysAgo = [2, 30, 5, 25, 1, 40, 3, 12, 8, 22, 6, 14];
  const now = Date.now();
  const entries: PipelineEntry[] = picks.map((p, i) => ({
    parcelId: p.id,
    stage: stages[i],
    notes: i === 4 ? 'Pastor replied; wants to see the one-pager before the board meets.' : i === 8 ? 'Board voted 7–2 to explore. Parking is the sticking point.' : '',
    lastActivity: new Date(now - daysAgo[i] * 86_400_000).toISOString(),
    homes: recommendedScenario(p).homes,
  }));
  savePipeline(entries);
  write(storeKeys.seeded, true);
}

export function isStalled(e: PipelineEntry, now = Date.now()) {
  return e.stage !== 'groundbreaking' && now - new Date(e.lastActivity).getTime() > STALLED_DAYS * 86_400_000;
}

export function usePipeline() {
  const [entries, setEntries] = useState<PipelineEntry[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    seedPipelineOnce();
    setEntries(getPipeline());
    setReady(true);
    const onStore = (e: Event) => { if ((e as CustomEvent).detail?.key === storeKeys.pipeline) setEntries(getPipeline()); };
    window.addEventListener('keystone:store', onStore);
    return () => window.removeEventListener('keystone:store', onStore);
  }, []);
  const update = useCallback((fn: (prev: PipelineEntry[]) => PipelineEntry[]) => {
    const next = fn(getPipeline());
    savePipeline(next);
    setEntries(next);
  }, []);
  const setStage = useCallback((parcelId: string, stage: Stage) => update((prev) => prev.map((e) => (e.parcelId === parcelId ? { ...e, stage, lastActivity: new Date().toISOString() } : e))), [update]);
  const setNote = useCallback((parcelId: string, notes: string) => update((prev) => prev.map((e) => (e.parcelId === parcelId ? { ...e, notes, lastActivity: new Date().toISOString() } : e))), [update]);
  const remove = useCallback((parcelId: string) => update((prev) => prev.filter((e) => e.parcelId !== parcelId)), [update]);
  const add = useCallback((parcelId: string, opts?: { homes?: number; keepSpaces?: number; stage?: Stage }) => { addToPipeline(parcelId, opts); setEntries(getPipeline()); }, []);
  const replace = useCallback((next: PipelineEntry[]) => update(() => next), [update]);
  return { entries, ready, setStage, setNote, remove, add, replace, has: (id: string) => entries.some((e) => e.parcelId === id), stages: STAGES };
}
