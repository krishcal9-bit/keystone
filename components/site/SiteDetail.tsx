'use client';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import type { Parcel } from '@/lib/sb4';
import { checkEligibility, recommendedScenario, fitScore, impact, defaultKeepSpaces, insetFor, type Reason } from '@/lib/sb4';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { spring, ease, dur } from '@/lib/motion';
import { AerialLot } from '@/components/illustrations/AerialLot';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Pill, SampleDataLabel } from '@/components/ui/Pill';
import { Markdown } from '@/components/ui/Markdown';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { streamPost } from '@/lib/streamClient';
import { addToPipeline, isInPipeline } from '@/lib/pipeline';
import { ownerLabel } from '@/lib/sb4';
import { AerialBackdrop } from '@/components/scenes/AerialBackdrop';

export function SiteDetail({ parcel }: { parcel: Parcel }) {
  const { t } = useT();
  const { theme } = useTheme();
  const night = theme === 'dark';
  const reduced = useReducedMotion();
  const [keep, setKeep] = useState(defaultKeepSpaces(parcel));
  const [pressing, setPressing] = useState(false);
  const [delta, setDelta] = useState<{ n: number; id: number } | null>(null);
  const prevHomes = useRef<number | null>(null);
  const elig = useMemo(() => checkEligibility(parcel), [parcel]);
  const fit = useMemo(() => fitScore(parcel), [parcel]);
  const scenario = useMemo(() => recommendedScenario(parcel, keep), [parcel, keep]);
  const im = impact(scenario.homes);
  const buildablePoly = useMemo(() => insetFor(parcel), [parcel]);
  const [inPipe, setInPipe] = useState(false);
  useEffect(() => { setInPipe(isInPipeline(parcel.id)); }, [parcel.id]);

  useEffect(() => {
    if (prevHomes.current !== null && scenario.homes > prevHomes.current) {
      setDelta({ n: scenario.homes - prevHomes.current, id: Date.now() });
      try { navigator.vibrate?.(8); } catch {}
    } else if (prevHomes.current !== null && scenario.homes !== prevHomes.current) {
      try { navigator.vibrate?.(8); } catch {}
    }
    prevHomes.current = scenario.homes;
  }, [scenario.homes]);

  // stalls shown = kept count scaled to the diagram's stall count
  const keptStalls = Math.round((keep / Math.max(1, parcel.parkingSpaces)) * 100000) / 100000;

  const addPipe = () => {
    addToPipeline(parcel.id, { homes: scenario.homes, keepSpaces: keep });
    setInPipe(true);
    toast(t('site.addedPipeline'));
  };

  return (
    <div className="relative min-h-svh pt-16">
      <div className="absolute inset-x-0 bottom-0 h-[42svh] pointer-events-none overflow-hidden" aria-hidden><AerialBackdrop night={night} /></div>
      <div className="relative mx-auto max-w-[1440px] px-5 md:px-10 lg:px-20 pt-6 pb-20">
        <nav aria-label="Breadcrumb" className="text-[13px] text-ink-2 mb-3"><Link href="/sites" className="hover:text-ink">{t('sites.title')}</Link> <span className="mx-1">/</span> <span>{parcel.city}</span></nav>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.medium, ease: ease.out }} className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div className="max-w-[760px]">
            <div className="flex items-center gap-3 flex-wrap"><h1 className="headline-md">{parcel.displayName}</h1><SampleDataLabel /></div>
            <p className="text-ink-2 mt-1">{ownerLabel(parcel.ownerType)}{parcel.faith ? ` · ${parcel.faith}` : ''} · {parcel.city} · {parcel.lotAcres.toFixed(1)} {t('common.acres')} · {parcel.parkingSpaces} {t('common.spaces')}</p>
          </div>
          <div className="flex items-center gap-2">
            {elig.eligible ? <Pill tone="pine">{t('common.eligible')}</Pill> : <Pill tone="red">{t('common.notEligible')}</Pill>}
            <Pill tone="neutral">{t('sites.fit')} {fit.score}</Pill>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* left: diagram + slider + actions */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <motion.div className="panel p-3 overflow-hidden" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: dur.long, ease: ease.out, delay: 0.1 }}>
              <div className="flex items-center justify-between px-1 pb-2">
                <h2 className="text-[15px] font-semibold">{t('site.diagram')}</h2>
                <div className="flex items-center gap-3 text-[12px] text-ink-2">
                  <LegendDot color="#3C4A52" label={t('site.sanctuary')} /><LegendDot color="#4A4F52" label={t('site.keptStalls')} /><LegendDot color="var(--pine)" label={t('site.buildableArea')} />
                </div>
              </div>
              <div className="rounded-[10px] overflow-hidden border border-line" data-testid="site-diagram">
                <AerialLot parcel={parcel} night={night} id={`site-${parcel.id}`} showBuildable={elig.eligible ? buildablePoly : undefined} keptStalls={undefined} ambient seed={2} keptShare={keptStalls} />
              </div>
            </motion.div>

            <div className="panel p-4" data-testid="keep-parking">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="text-[15px] font-semibold">{t('site.keepParking')}</h2>
                  <p className="text-[13px] text-ink-2">{t('site.keepParkingHelp')}</p>
                </div>
                <div className="text-right">
                  <div className="text-[24px] font-semibold tabular-nums leading-7"><AnimatedNumber value={keep} /> <span className="text-[13px] font-medium text-ink-2">/ {parcel.parkingSpaces} {t('common.spaces')}</span></div>
                </div>
              </div>
              <input
                type="range" className="ks-range mt-1" min={0} max={parcel.parkingSpaces} step={1} value={keep}
                onChange={(e) => setKeep(Number(e.target.value))}
                onPointerDown={() => setPressing(true)} onPointerUp={() => setPressing(false)} onPointerCancel={() => setPressing(false)}
                style={{ ['--fill' as string]: `${(keep / Math.max(1, parcel.parkingSpaces)) * 100}%`, ['--thumb' as string]: pressing ? '24px' : '20px' }}
                aria-label={t('site.keepParking')} aria-valuetext={`${keep} ${t('common.spaces')}`} data-testid="keep-slider"
              />
              <div className="flex items-center justify-between text-[13px] text-ink-2 tabular-nums"><span>0</span><span>{parcel.parkingSpaces}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ButtonLink href={`/plan/${parcel.id}?keep=${keep}`} variant="primary">{t('site.openPlan')}</ButtonLink>
              <ButtonLink href={`/scan?parcel=${parcel.id}`} variant="secondary">{t('site.scan')}</ButtonLink>
              <ButtonLink href={`/pitch/${parcel.id}`} variant="secondary">{t('site.pitch')}</ButtonLink>
              <Button variant="secondary" onClick={addPipe} disabled={inPipe} data-testid="add-pipeline">{inPipe ? t('site.inPipeline') : t('site.addPipeline')}</Button>
            </div>
          </div>

          {/* right: eligibility, numbers, fit, brief */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <EligibilityCard reasons={elig.reasons} warnings={elig.warnings} eligible={elig.eligible} />

            <div className="panel p-4 relative" data-testid="numbers">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Num label={t('site.buildable')} value={scenario.buildable.acres} digits={2} />
                <Num label={t('site.minUnits')} value={scenario.capacity.minimumUnits} />
                <Num label={t('site.practical')} value={scenario.homes} accent testId="homes" />
                <Num label={t('site.people')} value={im.people} />
              </div>
              <p className={`mt-3 text-[13px] ${scenario.capacity.meetsMinimum ? 'text-pine' : 'text-signal-amber'}`}>
                {scenario.capacity.type === 'flat' ? `${t('plan.flats')} · ` : `${t('plan.townhomes')} · `}{scenario.capacity.meetsMinimum ? t('site.densityMet') : t('site.densityShort')}
              </p>
              <AnimatePresence>
                {delta && (
                  <motion.span key={delta.id} initial={{ opacity: 0, scale: 0.9, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={spring.snappy}
                    onAnimationComplete={() => setTimeout(() => setDelta((d) => (d?.id === delta.id ? null : d)), 1400)}
                    className="absolute top-3 right-3 inline-flex items-center h-7 px-2.5 rounded-full bg-pine text-[#F6F7F5] text-[13px] font-semibold tabular-nums" data-testid="delta-pill">
                    +{delta.n} {t('common.homes')}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div className="panel p-4">
              <h2 className="text-[15px] font-semibold mb-2">{t('site.fitBreakdown')} <span className="text-ink-2 font-medium tabular-nums">· {fit.score}/100</span></h2>
              <ul className="flex flex-col gap-2">
                {fit.factors.map((f, i) => (
                  <li key={f.id} className="grid grid-cols-[110px_1fr_40px] items-center gap-3 text-[13px]">
                    <span className="text-ink-2 truncate" title={f.note}>{f.label}</span>
                    <span className="h-1.5 rounded-full bg-line overflow-hidden"><motion.span className="block h-full bg-pine rounded-full origin-left" initial={{ scaleX: 0 }} animate={{ scaleX: f.points / f.max }} transition={{ delay: reduced ? 0 : 0.3 + i * 0.05, duration: dur.long, ease: ease.out }} /></span>
                    <span className="text-right tabular-nums text-ink">{f.points}/{f.max}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Brief parcelId={parcel.id} keepSpaces={keep} />
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-[2px]" style={{ background: color }} />{label}</span>;
}

function Num({ label, value, digits = 0, accent = false, testId }: { label: string; value: number; digits?: number; accent?: boolean; testId?: string }) {
  return (
    <div className="flex flex-col">
      <span className={`text-[28px] leading-8 font-semibold tabular-nums ${accent ? 'text-pine' : 'text-ink'}`} data-testid={testId}><AnimatedNumber value={value} format={{ maximumFractionDigits: digits, minimumFractionDigits: digits }} /></span>
      <span className="text-[13px] text-ink-2">{label}</span>
    </div>
  );
}

function EligibilityCard({ reasons, warnings, eligible }: { reasons: Reason[]; warnings: { id: string; label: string; detail: string }[]; eligible: boolean }) {
  const { t } = useT();
  const [why, setWhy] = useState(false);
  const reduced = useReducedMotion();
  return (
    <div className="panel p-4" data-testid="eligibility">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold">{t('site.eligibility')}</h2>
        <button className="h-9 px-2 text-[13px] font-medium text-pine hover:bg-pine-soft rounded-[6px]" aria-expanded={why} onClick={() => setWhy((w) => !w)}>{t('site.why')}</button>
      </div>
      <ul className="mt-2 flex flex-col gap-2">
        {reasons.map((r, i) => (
          <motion.li key={r.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduced ? 0 : 0.25 + i * 0.12, duration: dur.short, ease: ease.out }} className="flex gap-2.5 items-start text-[14px]">
            <Check pass={r.pass} delay={reduced ? 0 : 0.3 + i * 0.12} />
            <span>
              <span className={`font-medium ${r.pass ? 'text-ink' : 'text-signal-red'}`}>{r.label}</span>
              <AnimatePresence initial={false}>
                {why && (
                  <motion.span key="d" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: dur.short, ease: ease.out }} className="block overflow-hidden text-[13px] text-ink-2 leading-5">
                    {r.detail} <span className="text-ink-2/80">({r.provision})</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.li>
        ))}
        {warnings.map((w, i) => (
          <motion.li key={w.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduced ? 0 : 0.6 + i * 0.1, duration: dur.short, ease: ease.out }} className="flex gap-2.5 items-start text-[14px]">
            <span className="mt-[3px] w-4 h-4 rounded-full border-2 border-signal-amber shrink-0 flex items-center justify-center text-[10px] font-bold text-signal-amber" aria-hidden>!</span>
            <span><span className="font-medium text-signal-amber">{w.label}</span><span className="block text-[13px] text-ink-2 leading-5">{w.detail}</span></span>
          </motion.li>
        ))}
      </ul>
      <p className="mt-3 text-[12px] text-ink-2 border-t border-line pt-2">{t('common.notLegal')}</p>
      {!eligible && <span className="sr-only">{t('common.notEligible')}</span>}
    </div>
  );
}

function Check({ pass, delay }: { pass: boolean; delay: number }) {
  return (
    <span className={`mt-[3px] w-4 h-4 rounded-full shrink-0 flex items-center justify-center ${pass ? 'bg-pine' : 'bg-signal-red'}`} aria-hidden>
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        {pass
          ? <motion.path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="#F6F7F5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay, duration: dur.medium, ease: ease.out }} />
          : <motion.path d="M3 3l6 6M9 3l-6 6" stroke="#F6F7F5" strokeWidth="1.8" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay, duration: dur.medium, ease: ease.out }} />}
      </svg>
    </span>
  );
}

function Brief({ parcelId, keepSpaces }: { parcelId: string; keepSpaces: number }) {
  const { t } = useT();
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'streaming' | 'done' | 'error'>('idle');
  const [source, setSource] = useState('');
  const abort = useRef<AbortController | null>(null);
  const started = useRef(false);

  const run = useCallback(async (keep: number) => {
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    setText(''); setState('loading'); setSource('');
    try {
      const res = await streamPost('/api/brief', { parcelId, keepSpaces: keep }, (_c, full) => { setState('streaming'); setText(full); }, ac.signal);
      setSource(res.source);
      setState('done');
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setState('error');
    }
  }, [parcelId]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const id = setTimeout(() => run(keepSpaces), 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div layout className="panel p-4" data-testid="brief" transition={spring.smooth}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">{t('site.brief')}</h2>
          <p className="text-[13px] text-ink-2">{t('site.briefHelp')}</p>
        </div>
        <Button variant="secondary" size="sm" loading={state === 'loading'} onClick={() => run(keepSpaces)} data-testid="brief-button">{state === 'idle' || state === 'error' ? t('site.generateBrief') : t('plan.regenerate')}</Button>
      </div>
      <motion.div layout="position" className="mt-3">
        {state === 'loading' && <Skeleton lines={5} />}
        {state === 'error' && <p className="text-[14px] text-signal-red">{t('common.error')}</p>}
        {(state === 'streaming' || state === 'done') && <Markdown text={text} />}
        {state === 'done' && source === 'fallback' && <p className="mt-2 text-[12px] text-ink-2">{t('common.fallbackNote')}</p>}
      </motion.div>
    </motion.div>
  );
}
