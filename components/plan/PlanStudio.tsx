'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { TransitionLink } from '@/components/ui/TransitionLink';
import { motion, useReducedMotion } from 'motion/react';
import type { Parcel, UnitType } from '@/lib/sb4';
import { defaultKeepSpaces, unitCapacity, buildableArea } from '@/lib/sb4';
import { buildPlanModel, type PlanOptions } from '@/lib/planModel';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { ease, dur } from '@/lib/motion';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Pill, SampleDataLabel } from '@/components/ui/Pill';
import { toast } from '@/components/ui/Toast';
import { read, write, storeKeys, type SavedPlan } from '@/lib/store';
import { PlanDiagram2D } from './PlanDiagram2D';
import { ClosesTheGap } from '@/components/gap/ClosesTheGap';
import type { PlanView } from '@/components/three/PlanScene';

const PlanScene = dynamic(() => import('@/components/three/PlanScene').then((m) => m.PlanScene), { ssr: false, loading: () => null });

import { webglQuality } from '@/lib/webgl';
const webglOk = () => webglQuality() === 'hardware';

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
  const [onScreen, setOnScreen] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setGl(webglOk() && !reduced); setFine(window.matchMedia('(hover: hover) and (pointer: fine)').matches); }, [reduced]);
  // Render frames only while the viewport is on screen and the tab is visible (one WebGL context, no idle rAF off screen)
  useEffect(() => {
    const el = viewportRef.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting && document.visibilityState === 'visible'), { threshold: 0.05 });
    io.observe(el);
    const vis = () => setOnScreen(document.visibilityState === 'visible' && (el.getBoundingClientRect().bottom > 0));
    document.addEventListener('visibilitychange', vis);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', vis); };
  }, []);

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
    <div className="relative pt-16 min-h-svh" data-testid="plan-page">
      {/* the 3D scene fills the page */}
      <div ref={viewportRef} className="absolute inset-x-0 top-16 bottom-0 overflow-hidden vt-site-focus" data-testid="plan-viewport">
        <div className={`absolute inset-0 transition-opacity duration-[400ms] ${fuse ? 'opacity-80' : 'opacity-100'}`} style={{ background: night ? 'linear-gradient(#0E1A2B, #223650 70%, #13201A)' : 'linear-gradient(#DCE8EE, #F6F7F5 60%, #C9D7CC)' }}>
          {gl === true && (
            <PlanScene model={model} showPlan={showPlan} sunHour={sun} night={night} view={view} buildKey={buildKey} onBuildEnd={() => setBuilding(false)} interactive cursorLight={fine} frameloop={onScreen ? 'always' : 'never'} onCanvas={(el) => { canvas.current = el; }} />
          )}
          {gl === false && (
            <div className="absolute inset-0 p-6 lg:pl-[440px] flex flex-col">
              <PlanDiagram2D model={model} night={night} showPlan={showPlan} className="flex-1" />
              <p className="text-[12px] text-ink-2 mt-2">{t('plan.webgl')}</p>
            </div>
          )}
        </div>
      </div>

      {/* floating paper panels */}
      <div className="relative mx-auto w-full max-w-[1440px] px-5 md:px-10 lg:px-20 pt-5 pb-6 min-h-[calc(100svh-64px)] flex flex-col pointer-events-none">
        <div className="flex flex-wrap items-start justify-between gap-3 pointer-events-auto">
          <div className="paper px-4 py-3">
            <nav aria-label="Breadcrumb" className="text-[13px] text-ink-2 mb-0.5"><TransitionLink href="/sites" dir="back" className="hover:text-ink">{t('sites.title')}</TransitionLink> <span className="mx-1">/</span> <TransitionLink href={`/sites/${parcel.id}`} dir="back" className="hover:text-ink">{parcel.displayName}</TransitionLink></nav>
            <div className="flex items-center gap-3"><h1 className="headline-md !text-[32px]">{t('plan.title')}</h1><SampleDataLabel /></div>
            <p className="text-[13px] text-pine font-medium mt-0.5" data-testid="lane-line">{t('lane.plan')}</p>
          </div>
          <div className="flex items-center gap-2 paper p-1.5">
            <Button variant="ghost" size="sm" onClick={savePlan}>{t('plan.savePlan')}</Button>
            <Button variant="ghost" size="sm" onClick={exportPng}>{t('plan.exportPng')}</Button>
            <Button variant="ghost" size="sm" onClick={exportPdf}>{t('plan.exportPdf')}</Button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 pointer-events-auto">
          <Segmented ariaLabel={t('plan.before')} size="sm" value={showPlan ? 'after' : 'before'} onChange={(v) => toggleBefore(v)} options={[{ value: 'before', label: t('plan.before') }, { value: 'after', label: t('plan.after') }]} />
          <Segmented ariaLabel={t('plan.view')} size="sm" value={view} onChange={setView} options={[{ value: 'aerial', label: t('plan.aerial') }, { value: 'threeQuarter', label: t('plan.threeQuarter') }, { value: 'street', label: t('plan.street') }]} />
        </div>

        <div className="mt-auto pt-4 grid grid-cols-1 lg:grid-cols-[360px_1fr_340px] gap-3 items-end">
          {/* controls */}
          <aside className="paper p-4 flex flex-col gap-3 pointer-events-auto" data-testid="plan-controls">
            <div>
              <span className="text-[13px] font-medium text-ink-2 block mb-1.5">{t('plan.unitType')}</span>
              <Segmented ariaLabel={t('plan.unitType')} size="sm" value={draft.unitType} onChange={(v: UnitType) => setDraft((d) => ({ ...d, unitType: v, targetUnits: undefined }))} options={[{ value: 'townhome', label: t('plan.townhomes') }, { value: 'flat', label: t('plan.flats') }]} className="w-full [&>button]:flex-1" />
            </div>
            <Range label={t('plan.targetUnits')} value={draft.targetUnits ?? draftCap.practicalUnits} min={1} max={Math.max(2, Math.ceil(draftCap.practicalUnits * 1.6))} onChange={(v) => setDraft((d) => ({ ...d, targetUnits: v }))} testId="target-units" />
            <Range label={t('plan.parkingKept')} value={draft.keepSpaces} min={0} max={parcel.parkingSpaces} onChange={(v) => setDraft((d) => ({ ...d, keepSpaces: v }))} suffix={` / ${parcel.parkingSpaces}`} testId="keep-spaces" />
            <div className="flex items-center justify-between gap-3">
              <Switch checked={draft.garden} onChange={(v) => setDraft((d) => ({ ...d, garden: v }))} label={t('plan.garden')} />
              <Button size="sm" onClick={generate} loading={building && !reduced && gl === true} data-testid="generate">{buildKey > 1 ? t('plan.regenerate') : t('plan.generate')}</Button>
            </div>
          </aside>

          {/* sun */}
          <div className="paper px-3 py-2 flex items-center gap-3 pointer-events-auto lg:max-w-[320px] lg:justify-self-center">
            <SunIcon hour={sun} />
            <label className="flex-1 flex flex-col">
              <span className="text-[12px] text-ink-2 flex justify-between"><span>{t('plan.sun')}</span><span className="tabular-nums text-ink">{fmtHour(sun)}</span></span>
              <input type="range" className="ks-range !h-8" min={6} max={20} step={0.25} value={sun} onChange={(e) => setSun(Number(e.target.value))} style={{ ['--fill' as string]: `${((sun - 6) / 14) * 100}%` }} aria-label={t('plan.sun')} data-testid="sun-slider" />
            </label>
          </div>

          {/* status */}
          <div className="paper p-4 pointer-events-auto" data-testid="plan-status">
            <div className="text-[26px] font-semibold tabular-nums leading-8 text-ink"><AnimatedNumber value={model.placed} /> <span className="text-[13px] font-medium text-ink-2">{t('plan.unitsPlaced').toLowerCase()}</span></div>
            <div className={`text-[12px] ${densityOk ? 'text-pine' : 'text-signal-amber'}`}>{densityOk ? t('plan.meets') : t('plan.short', { n: model.shortfall })} · {t('plan.minimum')} {model.minimumUnits}</div>
            <div className="mt-2 grid grid-cols-2 gap-y-2 gap-x-3 border-t border-line pt-2">
              <Num label={t('site.buildable')} value={model.buildable.acres} digits={2} />
              <Num label={t('site.people')} value={model.people} />
            </div>
            <div className="flex flex-wrap gap-1.5 text-[12px] mt-2">
              <Pill tone="neutral">{model.buildable.keptSpaces} {t('common.spaces')}</Pill>
              {model.layout.green && <Pill tone="pine">{t('plan.green')}</Pill>}
              {model.layout.garden && <Pill tone="brass">{t('plan.garden')}</Pill>}
            </div>
            <p className="text-[11px] text-ink-2 mt-2">{t('common.notLegal')}</p>
          </div>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[1440px] px-5 md:px-10 lg:px-20 pb-10">
        <ClosesTheGap parcel={parcel} keepSpaces={opts.keepSpaces} homes={model.placed} compact />
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
      <span className={`text-[20px] leading-6 font-semibold tabular-nums ${accent ? 'text-pine' : 'text-ink'}`}><AnimatedNumber value={value} format={{ maximumFractionDigits: digits, minimumFractionDigits: digits }} /></span>
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
