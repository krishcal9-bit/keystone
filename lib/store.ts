/**
 * Local-first state. Everything a user changes lives in localStorage under versioned keys.
 * Production path (see README): OC Assessor parcel data + county GIS + Postgres.
 */
export const STORE_VERSION = 1;
const PREFIX = `keystone:v${STORE_VERSION}:`;

export type Stage =
  | 'identified' | 'researched' | 'contacted' | 'meeting'
  | 'boardInterested' | 'feasibility' | 'agreement' | 'groundbreaking';

export const STAGES: Stage[] = [
  'identified', 'researched', 'contacted', 'meeting',
  'boardInterested', 'feasibility', 'agreement', 'groundbreaking',
];

export type PipelineEntry = {
  parcelId: string;
  stage: Stage;
  notes: string;
  lastActivity: string; // ISO date
  keepSpaces?: number;
  homes?: number;
};

export type SavedPlan = {
  parcelId: string;
  unitType: 'townhome' | 'flat';
  targetUnits: number;
  keepSpaces: number;
  garden: boolean;
  savedAt: string;
};

export type ScanResult = {
  id: string;
  parcelId?: string;
  createdAt: string;
  metersAcross: number;
  polygons: unknown;
};

export type PracticeTranscript = {
  parcelId: string;
  createdAt: string;
  turns: { role: 'board' | 'staff'; text: string }[];
  feedback?: string;
};

export type Snapshot = {
  version: number;
  exportedAt: string;
  pipeline: PipelineEntry[];
  plans: SavedPlan[];
  scans: ScanResult[];
  transcripts: PracticeTranscript[];
};

const isBrowser = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('keystone:store', { detail: { key } }));
  } catch {}
}

export function readFlag(key: string): boolean {
  return read<boolean>(key, false);
}

export const storeKeys = {
  pipeline: 'pipeline',
  plans: 'plans',
  scans: 'scans',
  transcripts: 'transcripts',
  seeded: 'pipeline-seeded',
  mapIntroSeen: 'map-intro-seen',
  introSeen: 'intro-seen',
} as const;

export function exportSnapshot(): Snapshot {
  return {
    version: STORE_VERSION,
    exportedAt: new Date().toISOString(),
    pipeline: read<PipelineEntry[]>(storeKeys.pipeline, []),
    plans: read<SavedPlan[]>(storeKeys.plans, []),
    scans: read<ScanResult[]>(storeKeys.scans, []),
    transcripts: read<PracticeTranscript[]>(storeKeys.transcripts, []),
  };
}

export function importSnapshot(raw: unknown): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as Partial<Snapshot>;
  if (typeof s.version !== 'number' || !Array.isArray(s.pipeline)) return false;
  write(storeKeys.pipeline, s.pipeline);
  if (Array.isArray(s.plans)) write(storeKeys.plans, s.plans);
  if (Array.isArray(s.scans)) write(storeKeys.scans, s.scans);
  if (Array.isArray(s.transcripts)) write(storeKeys.transcripts, s.transcripts);
  write(storeKeys.seeded, true);
  return true;
}
