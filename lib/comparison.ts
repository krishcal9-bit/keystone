'use client';
/**
 * "Searching vs. waiting": the headline comparison between waiting for a city to offer land and searching
 * with Keystone. Three rows, each value carrying its label, formula, inputs and source so a popover can show
 * exactly how it is calculated. Inputs default to data/assumptions.json (comparison) and can be overridden by
 * the user (localStorage, via lib/store). The eligible-parcel count is always the live engine count.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import assumptions from '@/data/assumptions.json';
import { allStats, totals } from './siteStats';
import { read, write } from './store';
import type { DictKey } from './i18n/en';

const C = assumptions.comparison;

export type ComparisonInputs = { cityOffersPerYear: number; manualVetDays: number; marketLandPerAcre: number };
export const DEFAULT_INPUTS: ComparisonInputs = {
  cityOffersPerYear: C.cityOffersPerYear.value,
  manualVetDays: C.manualVetDays.value,
  marketLandPerAcre: C.marketLandPerAcre.value,
};
export const SB4_HOMES_PER_ACRE = C.sb4HomesPerAcre.value;
export const DEFAULT_VET_MINUTES = C.defaultVetMinutes.value;
export const RAND = C.rand;
export const SOURCES = {
  cityOffers: C.cityOffersPerYear.source,
  vetDays: C.manualVetDays.source,
  landPerAcre: C.marketLandPerAcre.source,
  homesPerAcre: C.sb4HomesPerAcre.source,
  defaultVet: C.defaultVetMinutes.source,
  liveCount: 'Live count from the Keystone engine (lib/sb4.ts) over the sample parcels',
  measuredVet: 'Measured in this browser: median of your last Site Detail timings',
  partnerLand: assumptions.gap.partnerLandPerHome.note,
} as const;

/** How a figure was obtained; the UI shows this next to every number. */
export type FigureTag = 'estimate' | 'live' | 'measured' | 'sb4' | 'default' | 'derived';
export type Figure = {
  value: number;
  /** Dictionary key for the one-line label shown under the number. */
  label: DictKey;
  /** Dictionary key for the formula sentence; `vars` fills its placeholders. */
  formula: DictKey;
  vars: Record<string, string | number>;
  inputs: { label: DictKey; value: string }[];
  source: string;
  tag: FigureTag;
  unit: 'count' | 'days' | 'minutes' | 'money' | 'factor';
};
export type RowId = 'sitesInView' | 'timeToVet' | 'landCostPerHome';
export type Row = { id: RowId; title: DictKey; waiting: Figure; keystone: Figure; multiplier: Figure & { text: DictKey } };

export const STORE_KEY = 'comparison-assumptions';
export const VET_TIMES_KEY = 'vet-times';
const VET_START_PREFIX = 'keystone:v1:vet-start:';
const KEEP_VET_TIMES = 5;

const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
/** Clamp user inputs so every multiplier stays finite and positive. */
export function sanitize(i: Partial<ComparisonInputs>): ComparisonInputs {
  return {
    cityOffersPerYear: Math.min(1000, Math.max(0.1, num(i.cityOffersPerYear, DEFAULT_INPUTS.cityOffersPerYear))),
    manualVetDays: Math.min(365, Math.max(0.1, num(i.manualVetDays, DEFAULT_INPUTS.manualVetDays))),
    marketLandPerAcre: Math.min(1e9, Math.max(0, num(i.marketLandPerAcre, DEFAULT_INPUTS.marketLandPerAcre))),
  };
}

export function readOverrides(): Partial<ComparisonInputs> {
  const raw = read<Partial<ComparisonInputs>>(STORE_KEY, {});
  return raw && typeof raw === 'object' ? raw : {};
}
export function writeOverrides(o: Partial<ComparisonInputs>) {
  write(STORE_KEY, o);
}

export const fmtUsd = (n: number, locale = 'en-US') => new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
export const fmtNum = (n: number, locale = 'en-US', digits = 1) => new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(n);
/** Multipliers read as whole numbers once they pass 10; under that one decimal keeps "2.5×" honest. */
export const roundFactor = (x: number) => (x >= 10 ? Math.round(x) : Math.round(x * 10) / 10);

/** Live eligible-parcel count from the engine: the single source for row 1. */
export const eligibleCount = () => totals(allStats()).eligible;

/** The three rows from the inputs, the live eligible count and the vetting minutes (measured or default). */
export function computeRows(inputs: ComparisonInputs, eligible: number, vet: { minutes: number; measured: boolean }): Row[] {
  const i = sanitize(inputs);
  const minutes = Math.max(0.5, num(vet.minutes, DEFAULT_VET_MINUTES));
  const staffMinutesPerDay = 8 * 60;
  const manualMinutes = i.manualVetDays * staffMinutesPerDay;
  const landPerHome = Math.round(i.marketLandPerAcre / SB4_HOMES_PER_ACRE);
  const offersMult = roundFactor(eligible / i.cityOffersPerYear);
  const speedMult = roundFactor(manualMinutes / minutes);
  const sitesWaiting: Figure = {
    value: i.cityOffersPerYear, label: 'cmp.row1.waitingLabel', formula: 'cmp.row1.waitingFormula', vars: {},
    inputs: [{ label: 'cmp.in.cityOffers', value: fmtNum(i.cityOffersPerYear) }], source: SOURCES.cityOffers, tag: 'estimate', unit: 'count',
  };
  const sitesKeystone: Figure = {
    value: eligible, label: 'cmp.row1.keystoneLabel', formula: 'cmp.row1.keystoneFormula', vars: { n: eligible },
    inputs: [{ label: 'cmp.in.eligible', value: String(eligible) }], source: SOURCES.liveCount, tag: 'live', unit: 'count',
  };
  const vetWaiting: Figure = {
    value: i.manualVetDays, label: 'cmp.row2.waitingLabel', formula: 'cmp.row2.waitingFormula', vars: {},
    inputs: [{ label: 'cmp.in.vetDays', value: fmtNum(i.manualVetDays) }], source: SOURCES.vetDays, tag: 'estimate', unit: 'days',
  };
  const vetKeystone: Figure = {
    value: minutes, label: vet.measured ? 'cmp.row2.keystoneLabelMeasured' : 'cmp.row2.keystoneLabel',
    formula: vet.measured ? 'cmp.row2.keystoneFormulaMeasured' : 'cmp.row2.keystoneFormula', vars: { n: fmtNum(minutes) },
    inputs: [{ label: 'cmp.in.vetMinutes', value: fmtNum(minutes) }], source: vet.measured ? SOURCES.measuredVet : SOURCES.defaultVet,
    tag: vet.measured ? 'measured' : 'default', unit: 'minutes',
  };
  const landMarket: Figure = {
    value: landPerHome, label: 'cmp.row3.waitingLabel', formula: 'cmp.row3.waitingFormula',
    vars: { acre: fmtUsd(i.marketLandPerAcre), homes: SB4_HOMES_PER_ACRE, result: fmtUsd(landPerHome) },
    inputs: [{ label: 'cmp.in.landPerAcre', value: fmtUsd(i.marketLandPerAcre) }, { label: 'cmp.in.homesPerAcre', value: String(SB4_HOMES_PER_ACRE) }],
    source: `${SOURCES.landPerAcre}; ${SOURCES.homesPerAcre}`, tag: 'estimate', unit: 'money',
  };
  const landKeystone: Figure = {
    value: 0, label: 'cmp.row3.keystoneLabel', formula: 'cmp.row3.keystoneFormula', vars: {},
    inputs: [{ label: 'cmp.in.partnerLand', value: fmtUsd(0) }], source: SOURCES.partnerLand, tag: 'sb4', unit: 'money',
  };
  return [
    {
      id: 'sitesInView', title: 'cmp.row1.title', waiting: sitesWaiting, keystone: sitesKeystone,
      multiplier: {
        value: offersMult, text: 'cmp.row1.mult', label: 'cmp.row1.multLabel', formula: 'cmp.row1.multFormula',
        vars: { eligible, offers: fmtNum(i.cityOffersPerYear), result: fmtNum(offersMult) }, inputs: [...sitesKeystone.inputs, ...sitesWaiting.inputs],
        source: `${SOURCES.liveCount}; ${SOURCES.cityOffers}`, tag: 'derived', unit: 'factor',
      },
    },
    {
      id: 'timeToVet', title: 'cmp.row2.title', waiting: vetWaiting, keystone: vetKeystone,
      multiplier: {
        value: speedMult, text: 'cmp.row2.mult', label: 'cmp.row2.multLabel', formula: 'cmp.row2.multFormula',
        vars: { days: fmtNum(i.manualVetDays), manual: fmtNum(manualMinutes, 'en-US', 0), minutes: fmtNum(minutes), result: fmtNum(speedMult) },
        inputs: [...vetWaiting.inputs, { label: 'cmp.in.staffDay', value: '8 h' }, ...vetKeystone.inputs],
        source: `${SOURCES.vetDays}; ${vetKeystone.source}`, tag: 'derived', unit: 'factor',
      },
    },
    {
      id: 'landCostPerHome', title: 'cmp.row3.title', waiting: landMarket, keystone: landKeystone,
      multiplier: {
        value: -landPerHome, text: 'cmp.row3.mult', label: 'cmp.row3.multLabel', formula: 'cmp.row3.multFormula',
        vars: { market: fmtUsd(landPerHome), result: fmtUsd(landPerHome) }, inputs: [...landMarket.inputs, ...landKeystone.inputs],
        source: `${landMarket.source}; ${SOURCES.partnerLand}`, tag: 'derived', unit: 'money',
      },
    },
  ];
}

/* ------------------------------------------------------------------ vet timer */
const hasSession = () => typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';

/** Median of a list, or null when empty. */
export function median(list: number[]): number | null {
  const s = list.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Median of the recorded Site Detail timings in minutes, rounded to 0.5 (never below 0.5), or null when none. */
export function measuredVetMinutes(list: number[] = read<number[]>(VET_TIMES_KEY, [])): number | null {
  const m = median(Array.isArray(list) ? list : []);
  if (m == null) return null;
  return Math.max(0.5, Math.round((m / 60000) * 2) / 2);
}

export const vetTimer = {
  /** Site Detail opened: remember when (per parcel, this tab only). */
  startVet(parcelId: string) {
    if (!hasSession()) return;
    try { sessionStorage.setItem(VET_START_PREFIX + parcelId, String(Date.now())); } catch {}
  },
  /** Brief ready: record the duration (ms) and keep the last five. Returns the duration, or null when nothing was started. */
  endVet(parcelId: string): number | null {
    if (!hasSession()) return null;
    let start: number | null = null;
    try {
      const raw = sessionStorage.getItem(VET_START_PREFIX + parcelId);
      if (raw) { start = Number(raw); sessionStorage.removeItem(VET_START_PREFIX + parcelId); }
    } catch {}
    if (start == null || !Number.isFinite(start)) return null;
    const ms = Math.max(0, Date.now() - start);
    const list = read<number[]>(VET_TIMES_KEY, []);
    write(VET_TIMES_KEY, [...(Array.isArray(list) ? list : []), ms].slice(-KEEP_VET_TIMES));
    return ms;
  },
  measuredVetMinutes: () => measuredVetMinutes(),
};

/* ------------------------------------------------------------------ hook */
export function useComparison() {
  const [overrides, setOverrides] = useState<Partial<ComparisonInputs>>({});
  const [measured, setMeasured] = useState<number | null>(null);
  // Read after mount so server and first client render agree.
  useEffect(() => {
    const sync = () => { setOverrides(readOverrides()); setMeasured(measuredVetMinutes()); };
    sync();
    const onStore = (e: Event) => {
      const key = (e as CustomEvent<{ key: string }>).detail?.key;
      if (key === STORE_KEY || key === VET_TIMES_KEY) sync();
    };
    window.addEventListener('keystone:store', onStore);
    return () => window.removeEventListener('keystone:store', onStore);
  }, []);
  const eligible = useMemo(eligibleCount, []);
  const inputs = useMemo(() => sanitize({ ...DEFAULT_INPUTS, ...overrides }), [overrides]);
  const vet = useMemo(() => ({ minutes: measured ?? DEFAULT_VET_MINUTES, measured: measured != null }), [measured]);
  const rows = useMemo(() => computeRows(inputs, eligible, vet), [inputs, eligible, vet]);
  const set = useCallback(<K extends keyof ComparisonInputs>(k: K, v: number) => {
    const next = { ...readOverrides(), [k]: v };
    setOverrides(next);
    writeOverrides(next);
  }, []);
  const reset = useCallback(() => { setOverrides({}); writeOverrides({}); }, []);
  const dirty = Object.keys(overrides).some((k) => overrides[k as keyof ComparisonInputs] !== DEFAULT_INPUTS[k as keyof ComparisonInputs]);
  return { inputs, defaults: DEFAULT_INPUTS, overrides, set, reset, dirty, rows, eligible, vet };
}
