'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import type { Parcel, UnitType } from '@/lib/sb4';
import { defaultKeepSpaces, unitCapacity, buildableArea } from '@/lib/sb4';
import { buildPlanModel, type PlanOptions } from '@/lib/planModel';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { spring, ease, dur } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Pill, SampleDataLabel } from '@/components/ui/Pill';
import { toast } from '@/components/ui/Toast';
import { read, write, storeKeys, type SavedPlan } from '@/lib/store';
import { PlanDiagram2D } from './PlanDiagram2D';
import type { PlanView } from '@/components/three/PlanScene';

const PlanScene = dynamic(() => import('@/components/three/PlanScene').then((m) => m.PlanScene), { ssr: false, loading: () => null });

function webglOk() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

export function PlanStudio({ parcel, initialKeep }: { parcel: Parcel; initialKeep?: number }) {
  const { t } = useT();
  const { theme } = useTheme();
  const night = theme === 'dark';
  const reduced = useReducedMotion();
  const [opts, setOpts] = useState<PlanOptions>(() => ({ unitType: 'townhome', keepSpaces: initialKeep ?? defaultKeepSpaces(parcel), garden: true }));
  const [draft, setDraft] = useState(opts);
  const [showPlan, setShowPlan] = useState(true);
  const [sun, setSun] = useState(14);
  const [view, setView] = useState<PlanView>('threeQuarter');
  const [buildKey, setBuildKey] = useState(1);
  const [building, setBuilding] = useState(true);
  const [fuse, setFuse] = useState(false);
  const [gl, setGl] = useState<boolean | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const model = useMemo(() => buildPlanModel(parcel, opts), [parcel, opts]);
  const draftCap = useMemo(() => unitCapacity(buildableArea(parcel, draft.keepSpaces).acres, parcel, draft.unitType), [parcel, draft]);
  const [fine, setFine] = useState(false);

  useEffect(() => { setGl(webglOk() && !reduced); setFine(window.matchMedia('(hover: hover) and (pointer: fine)').matches); }, [reduced]);

  const generate = useCallback(() => {
    setOpts({ ...draft, targetUnits: draft.targetUnits });
    setShowPlan(true);
    setBuilding(true);
    setBuildKey((k) => k + 1);
  }, [draft]);

  const toggleBefore = (v: 'before' | 'after') => {
    setFuse(true);
    setShowPlan(v === 'after');
    setTimeout(() => setFuse(false), 420);
  };

  const exportPng = async () => {
    const el = canvas.current;
    let url: string | null = null;
    if (el) url = el.toDataURL('image/png');
    else {
      const svg = document.querySelector('[data-testid=plan-2d]') as SVGSVGElement | null;
      if (svg) url = await svgToPng(svg, 1600, 1200);
    }
    if (!url) { toast(t('common.error'), 'error'); return; }
    download(url, `keystone-plan-${parcel.id}.png`);
    toast(t('plan.exported'));
  };

  const exportPdf = async () => {
    try {
      const { buildPlanPdf } = await import('./planPdf');
      const el = canvas.current;
      let png: string | undefined;
      if (el) png = el.toDataURL('image/png');
      else { const svg = document.querySelector('[data-testid=plan-2d]') as SVGSVGElement | null; if (svg) png = await svgToPng(svg, 1600, 1200); }
      const blob = await buildPlanPdf({ model, png, notLegal: t('common.notLegal') });
      download(URL.createObjectURL(blob), `keystone-plan-${parcel.id}.pdf`);
      toast(t('plan.exported'));
    } catch (e) {
      console.warn(e);
      toast(t('common.error'), 'error');
    }
  };

  const savePlan = () => {
    const plans = read<SavedPlan[]>(storeKeys.plans, []).filter((p) => p.parcelId !== parcel.id);
    plans.push({ parcelId: parcel.id, unitType: opts.unitType, targetUnits: model.placed, keepSpaces: opts.keepSpaces, garden: opts.garden, savedAt: new Date().toISOString() });
    write(storeKeys.plans, plans);
    toast(t('plan.saved'));
  };

  const densityOk = model.meetsMinimum;

  return (
    <div className="pt-16 min-h-svh flex flex-col">
      <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10 lg:px-20 pt-6 pb-10 flex-1 flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="text-[13px] text-ink-2 mb-1"><Link href="/sites" className="hover:text-ink">{t('sites.title')}</Link> <span className="mx-1">/</span> <Link href={`/sites/${parcel.id}`} className="hover:text-ink">{parcel.displayName}</Link></nav>
            <div className="flex items-center gap-3"><h1 className="headline-md">{t('plan.title')}</h1><SampleDataLabel /></div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={savePlan}>{t('plan.savePlan')}</Button>
            <Button variant="secondary" size="sm" onClick={exportPng}>{t('plan.exportPng')}</Button>
            <Button variant="secondary" size="sm" onClick={exportPdf}>{t('plan.exportPdf')}</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 flex-1 min-h-0">
          {/* viewport */}
          <div className="panel relative overflow-hidden min-h-[420px] lg:min-h-[640px] bg-paper" data-testid="plan-viewport">
            <div className={`absolute inset-0 transition-[filter] duration-[400ms] ${fuse ? 'blur-[3px]' : 'blur-0'}`} style={{ background: night ? 'linear-gradient(#0E1A2B, #223650 70%, #13201A)' : 'linear-gradient(#DCE8EE, #F6F7F5 60%, #C9D7CC)' }}>
              {gl === true && (
                <PlanScene model={model} showPlan={showPlan} sunHour={sun} night={night} view={view} buildKey={buildKey} onBuildEnd={() => setBuilding(false)} interactive cursorLight={fine} onCanvas={(el) => { canvas.current = el; }} />
              )}
              {gl === false && (
                <div className="absolute inset-0 p-4 flex flex-col">
                  <PlanDiagram2D model={model} night={night} showPlan={showPlan} className="flex-1" />
                  <p className="text-[12px] text-ink-2 mt-2">{t('plan.webgl')}</p>
                </div>
              )}
            </div>
            {/* overlays */}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <Segmented ariaLabel={t('plan.before')} size="sm" value={showPlan ? 'after' : 'before'} onChange={(v) => toggleBefore(v)} options={[{ value: 'before', label: t('plan.before') }, { value: 'after', label: t('plan.after') }]} />
            </div>
            <div className="absolute top-3 right-3">
              <Segmented ariaLabel={t('plan.view')} size="sm" value={view} onChange={setView} options={[{ value: 'aerial', label: t('plan.aerial') }, { value: 'threeQuarter', label: t('plan.threeQuarter') }, { value: 'street', label: t('plan.street') }]} />
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-4 pointer-events-none">
              <div className="pointer-events-auto panel px-3 py-2 flex items-center gap-3 min-w-[260px]">
                <SunIcon hour={sun} />
                <label className="flex-1 flex flex-col">
                  <span className="text-[12px] text-ink-2 flex justify-between"><span>{t('plan.sun')}</span><span className="tabular-nums text-ink">{fmtHour(sun)}</span></span>
                  <input type="range" className="ks-range !h-8" min={6} max={20} step={0.25} value={sun} onChange={(e) => setSun(Number(e.target.value))} style={{ ['--fill' as string]: `${((sun - 6) / 14) * 100}%` }} aria-label={t('plan.sun')} data-testid="sun-slider" />
                </label>
              </div>
              <motion.div layout className="pointer-events-auto panel px-3 py-2 text-right" transition={spring.snappy} data-testid="plan-status">
                <div className="text-[22px] font-semibold tabular-nums leading-7 text-ink"><AnimatedNumber value={model.placed} /> <span className="text-[13px] font-medium text-ink-2">{t('plan.unitsPlaced').toLowerCase()}</span></div>
                <div className={`text-[12px] ${densityOk ? 'text-pine' : 'text-signal-amber'}`}>{densityOk ? t('plan.meets') : t('plan.short', { n: model.shortfall })} · {t('plan.minimum')} {model.minimumUnits}</div>
              </motion.div>
            </div>
          </div>

          {/* controls */}
          <aside className="panel p-4 flex flex-col gap-4" data-testid="plan-controls">
            <div>
              <span className="text-[13px] font-medium text-ink-2 block mb-1.5">{t('plan.unitType')}</span>
              <Segmented ariaLabel={t('plan.unitType')} value={draft.unitType} onChange={(v: UnitType) => setDraft((d) => ({ ...d, unitType: v, targetUnits: undefined }))} options={[{ value: 'townhome', label: t('plan.townhomes') }, { value: 'flat', label: t('plan.flats') }]} className="w-full [&>button]:flex-1" />
            </div>
            <Range label={t('plan.targetUnits')} value={draft.targetUnits ?? draftCap.practicalUnits} min={1} max={Math.max(2, Math.ceil(draftCap.practicalUnits * 1.6))} onChange={(v) => setDraft((d) => ({ ...d, targetUnits: v }))} testId="target-units" />
            <Range label={t('plan.parkingKept')} value={draft.keepSpaces} min={0} max={parcel.parkingSpaces} onChange={(v) => setDraft((d) => ({ ...d, keepSpaces: v }))} suffix={` / ${parcel.parkingSpaces}`} testId="keep-spaces" />
            <Switch checked={draft.garden} onChange={(v) => setDraft((d) => ({ ...d, garden: v }))} label={t('plan.garden')} />
            <Button onClick={generate} loading={building && !reduced && gl === true} data-testid="generate">{buildKey > 1 ? t('plan.regenerate') : t('plan.generate')}</Button>
            <div className="border-t border-line pt-3 grid grid-cols-2 gap-y-3 gap-x-3">
              <Num label={t('site.buildable')} value={model.buildable.acres} digits={2} />
              <Num label={t('plan.minimum')} value={model.minimumUnits} />
              <Num label={t('plan.unitsPlaced')} value={model.placed} accent />
              <Num label={t('site.people')} value={model.people} />
            </div>
            <div className="flex flex-wrap gap-1.5 text-[12px]">
              <Pill tone="neutral">{model.layout.rows} {t('plan.townhomes').toLowerCase() === 'townhomes' ? 'rows' : 'filas'}</Pill>
              <Pill tone="neutral">{model.buildable.keptSpaces} {t('common.spaces')}</Pill>
              {model.layout.green && <Pill tone="pine">{t('plan.green')}</Pill>}
              {model.layout.garden && <Pill tone="brass">{t('plan.garden')}</Pill>}
            </div>
            <p className="text-[12px] text-ink-2 mt-auto">{t('common.notLegal')}</p>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Range({ label, value, min, max, onChange, suffix = '', testId }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; suffix?: string; testId?: string }) {
  return (
    <label className="flex flex-col">
      <span className="text-[13px] font-medium text-ink-2 flex justify-between"><span>{label}</span><span className="tabular-nums text-ink">{value}{suffix}</span></span>
      <input type="range" className="ks-range" min={min} max={max} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ ['--fill' as string]: `${((value - min) / Math.max(1, max - min)) * 100}%` }} aria-label={label} data-testid={testId} />
    </label>
  );
}
function Num({ label, value, digits = 0, accent = false }: { label: string; value: number; digits?: number; accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className={`text-[22px] leading-7 font-semibold tabular-nums ${accent ? 'text-pine' : 'text-ink'}`}><AnimatedNumber value={value} format={{ maximumFractionDigits: digits, minimumFractionDigits: digits }} /></span>
      <span className="text-[12px] text-ink-2">{label}</span>
    </div>
  );
}
function SunIcon({ hour }: { hour: number }) {
  const a = ((hour - 6) / 14) * Math.PI;
  return (
    <svg width="32" height="22" viewBox="0 0 32 22" aria-hidden>
      <path d="M2 20 A14 14 0 0 1 30 20" fill="none" stroke="var(--line)" strokeWidth="1.5" />
      <motion.circle r="3.5" fill="var(--brass)" animate={{ cx: 16 - Math.cos(a) * 14, cy: 20 - Math.sin(a) * 14 }} transition={{ duration: dur.short, ease: ease.out }} />
    </svg>
  );
}
const fmtHour = (h: number) => { const hh = Math.floor(h); const mm = Math.round((h - hh) * 60); const ampm = hh >= 12 ? 'pm' : 'am'; return `${((hh + 11) % 12) + 1}:${mm.toString().padStart(2, '0')} ${ampm}`; };
function download(url: string, name: string) { const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
async function svgToPng(svg: SVGSVGElement, w: number, h: number): Promise<string> {
  const xml = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(url);
  return c.toDataURL('image/png');
}
