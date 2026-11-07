'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { PageShell } from '@/components/layout/PageShell';
import { AerialBackdrop } from '@/components/scenes/AerialBackdrop';
import { LightTable } from '@/components/scenes/LightTable';
import { Button } from '@/components/ui/Button';
import { Field, Input, Checkbox } from '@/components/ui/Field';
import { Segmented } from '@/components/ui/Segmented';
import { toast } from '@/components/ui/Toast';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { rise, dur, ease } from '@/lib/motion';
import { postJson, type ApiFailure } from '@/lib/streamClient';
import { read, write, storeKeys } from '@/lib/store';
import { metersPerUnitForLot, A, type Parcel } from '@/lib/sb4';
import { bbox, type Pt } from '@/lib/geometry';
import { computeScan, areasByCategory, estimateExistingSpaces, newPolygonId, type ScanCategory, type ScanPolygon, type ScanResponse } from '@/lib/scanMath';
import { Dropzone } from './Dropzone';
import { ScanCanvas, TRACE_TOTAL_MS, BEAM_MS, type ManualState } from './ScanCanvas';
import { ResultsPanel, type ScanSource } from './ResultsPanel';
import { RecentScans, type StoredScan } from './RecentScans';
import { prepareImage, prepareFromUrl, type ScanImage, type ImageError } from './imageUtils';
import { sampleAerials, sampleMetersAcross } from './samples';

type Phase = 'empty' | 'ready' | 'scanning' | 'result';
const DEFAULT_METERS = 160;
const BEAM_DELAY_MS = 300;
const MAX_RECENT = 5;

export function ScanClient({ parcel }: { parcel: Parcel | null }) {
  const { t, lang } = useT();
  const { theme } = useTheme();
  const locale = lang === 'es' ? 'es-ES' : 'en-US';

  const [image, setImage] = useState<ScanImage | null>(null);
  const [sampleId, setSampleId] = useState<1 | 2 | 3 | undefined>();
  const [busyFile, setBusyFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [metersInput, setMetersInput] = useState<number>(DEFAULT_METERS);
  const [useParcelScale, setUseParcelScale] = useState<boolean>(!!parcel);
  const [phase, setPhase] = useState<Phase>('empty');
  const [polygons, setPolygons] = useState<ScanPolygon[]>([]);
  const [source, setSource] = useState<ScanSource>(null);
  const [error, setError] = useState<string | null>(null);
  const [keepSpaces, setKeepSpaces] = useState(0);
  const [manualOn, setManualOn] = useState(false);
  const [manualCat, setManualCat] = useState<ScanCategory>('building');
  const [manualPts, setManualPts] = useState<Pt[]>([]);
  const [run, setRun] = useState(0);
  const [revealKey, setRevealKey] = useState(0);
  const [flying, setFlying] = useState(false);
  const [showNumbers, setShowNumbers] = useState(false);
  const [beam, setBeam] = useState(false);
  const [recent, setRecent] = useState<StoredScan[]>([]);
  const timers = useRef<number[]>([]);
  const abort = useRef<AbortController | null>(null);

  const later = useCallback((fn: () => void, ms: number) => { const id = window.setTimeout(fn, ms); timers.current.push(id); }, []);
  useEffect(() => () => { timers.current.forEach(clearTimeout); abort.current?.abort(); }, []);

  // Recent scans from localStorage (safe reads; refreshed on store events).
  useEffect(() => {
    const load = () => setRecent(read<StoredScan[]>(storeKeys.scans, []).slice(0, MAX_RECENT));
    load();
    window.addEventListener('keystone:store', load);
    return () => window.removeEventListener('keystone:store', load);
  }, []);

  /** Scale from the parcel: metres per normalized unit × the lot polygon's bbox width (assumes the lot fills the image width). */
  const parcelMeters = useMemo(() => {
    if (!parcel) return null;
    const mpu = metersPerUnitForLot(parcel.lotPolygon, parcel.lotAcres);
    return Math.round(mpu * bbox(parcel.lotPolygon).w);
  }, [parcel]);
  const metersAcross = useParcelScale && parcelMeters ? parcelMeters : Math.min(5000, Math.max(10, Number.isFinite(metersInput) ? metersInput : DEFAULT_METERS));
  const aspect = image?.aspect ?? 1;
  const zoning = parcel?.zoning ?? 'institutional';

  const comp = useMemo(() => computeScan(polygons, metersAcross, { aspect, keepSpaces, zoning }), [polygons, metersAcross, aspect, keepSpaces, zoning]);
  // Keep the slider inside the current estimate when polygons change.
  useEffect(() => { if (keepSpaces > comp.existingSpaces) setKeepSpaces(comp.existingSpaces); }, [comp.existingSpaces, keepSpaces]);

  const resetOverlay = () => {
    setPolygons([]); setSource(null); setError(null); setManualOn(false); setManualPts([]); setFlying(false); setShowNumbers(false);
  };

  const loadFile = async (file: File) => {
    setFileError(null); setBusyFile(true);
    try {
      const img = await prepareImage(file);
      setImage(img); setSampleId(undefined); resetOverlay(); setPhase('ready');
    } catch (e) {
      const code = (e as ImageError)?.code;
      setFileError(code === 'tooLarge' ? t('scan.tooLarge') : code === 'heic' ? t('scan.heic') : t('scan.badType'));
    } finally { setBusyFile(false); }
  };

  const loadSample = async (n: 1 | 2 | 3) => {
    const s = sampleAerials[n - 1];
    setFileError(null); setBusyFile(true);
    try {
      const img = await prepareFromUrl(s.src, `aerial-${n}.png`);
      setImage(img); setSampleId(n); setUseParcelScale(false); setMetersInput(sampleMetersAcross(n)); resetOverlay(); setPhase('ready');
      return img;
    } catch { setFileError(t('common.error')); return null; } finally { setBusyFile(false); }
  };

  const reveal = (polys: ScanPolygon[], src: ScanSource, img: ScanImage, metersUsed: number, sample?: 1 | 2 | 3) => {
    const existing = estimateExistingSpaces(areasByCategory(polys, metersUsed, img.aspect).areas.parking);
    const keep = Math.round(existing * A.defaultKeepShare);
    setPolygons(polys); setSource(src); setKeepSpaces(keep); setError(null);
    setPhase('result'); setRun((r) => r + 1); setRevealKey((k) => k + 1);
    setFlying(true); setShowNumbers(false);
    later(() => { setFlying(false); setShowNumbers(true); }, TRACE_TOTAL_MS);
    // Persist (max 5, newest first).
    const c = computeScan(polys, metersUsed, { aspect: img.aspect, keepSpaces: keep, zoning });
    const entry: StoredScan = {
      id: `scan-${Date.now().toString(36)}`, parcelId: parcel?.id, createdAt: new Date().toISOString(), metersAcross: metersUsed,
      polygons: polys, buildableAcres: c.buildableAcres, homes: c.homes, aspect: img.aspect, sampleId: sample, source: src ?? undefined,
    };
    write(storeKeys.scans, [entry, ...read<StoredScan[]>(storeKeys.scans, [])].slice(0, MAX_RECENT));
    toast(t('scan.saved'));
  };

  const failToManual = (msg: string) => {
    setError(msg); setPolygons([]); setSource('manual'); setPhase('result'); setShowNumbers(true); setFlying(false); setManualOn(true);
  };

  const scan = async () => {
    if (!image || phase === 'scanning') return;
    setPhase('scanning'); setError(null); setBeam(false); setManualOn(false); setManualPts([]); setShowNumbers(false); setFlying(false); setPolygons([]);
    const t0 = Date.now();
    const beamTimer = window.setTimeout(() => setBeam(true), BEAM_DELAY_MS);
    timers.current.push(beamTimer);
    abort.current?.abort();
    const ac = new AbortController(); abort.current = ac;
    const metersUsed = metersAcross;
    try {
      const { data, source: src } = await postJson<ScanResponse>('/api/scan', {
        image: image.base64, mediaType: image.mediaType, metersAcross: metersUsed, parcelId: parcel?.id, sampleId,
      }, ac.signal);
      clearTimeout(beamTimer);
      const elapsed = Date.now() - t0;
      // If the beam appeared, let it finish one sweep so the loading state never flashes.
      if (elapsed > BEAM_DELAY_MS) await new Promise((r) => later(() => r(null), Math.max(0, BEAM_DELAY_MS + BEAM_MS - elapsed)));
      setBeam(false);
      if (!data.polygons.length) { failToManual(t('scan.failed')); return; }
      reveal(data.polygons, src === 'fixture' ? 'fixture' : 'claude', image, metersUsed, sampleId);
    } catch (e) {
      clearTimeout(beamTimer); setBeam(false);
      if (ac.signal.aborted) return;
      const err = e as ApiFailure;
      failToManual(err?.code === 'no_model' ? t('scan.noModel') : t('scan.failed'));
    }
  };

  const openRecent = async (s: StoredScan) => {
    if (!s.sampleId) return;
    const img = await loadSample(s.sampleId);
    if (!img) return;
    setPolygons(s.polygons); setSource((s.source as ScanSource) ?? 'fixture'); setKeepSpaces(0);
    setPhase('result'); setRun((r) => r + 1); setRevealKey((k) => k + 1); setFlying(false); setShowNumbers(true);
    const existing = estimateExistingSpaces(areasByCategory(s.polygons, s.metersAcross, img.aspect).areas.parking);
    setKeepSpaces(Math.round(existing * A.defaultKeepShare));
    setMetersInput(s.metersAcross);
  };

  const removeImage = () => { abort.current?.abort(); setImage(null); setSampleId(undefined); resetOverlay(); setPhase('empty'); setBeam(false); };

  const startManual = () => {
    if (!image) return;
    setManualOn(true); setManualPts([]); setError(null);
    if (phase !== 'result') { setPhase('result'); setShowNumbers(true); setSource((s) => s ?? 'manual'); }
  };
  const finishShape = () => {
    if (manualPts.length < 3) return;
    setPolygons((p) => [...p, { id: newPolygonId(manualCat), category: manualCat, points: manualPts, confidence: 1 }]);
    setManualPts([]);
    setSource((s) => (s === 'claude' || s === 'fixture' ? s : 'manual'));
  };
  const manual: ManualState = { active: manualOn, category: manualCat, points: manualPts, onAddPoint: (p) => setManualPts((pts) => [...pts, p]), onFinish: finishShape };

  const catOptions: { value: ScanCategory; label: string }[] = [
    { value: 'building', label: t('scan.buildings') }, { value: 'parking', label: t('scan.parking') }, { value: 'open', label: t('scan.openLand') }, { value: 'trees', label: t('scan.trees') },
  ];

  const planHref = `/plan/${parcel?.id ?? 'oakfield-community-church'}`;

  return (
    <PageShell title={t('scan.title')} lane={t('lane.scan')} subtitle={t('scan.subtitle')} backdrop={<AerialBackdrop night={theme === 'dark'} opacity={0.25} />} titleId="scan-title">
      <div data-testid="scan-page" className="contents" />
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 items-start">
        <div className="lg:col-span-7 flex flex-col gap-5 min-w-0">
          {/* The image sits on a survey sheet over a light table; the sheet is purely decorative. */}
          <div className="relative rounded-[14px] p-7 sm:p-9" data-testid="light-table">
            <LightTable night={theme === 'dark'} />
            <div className="relative">
              {image ? (
                <ScanCanvas
                  image={image} polygons={polygons} onChange={setPolygons} scanning={phase === 'scanning' && beam}
                  revealKey={revealKey} showOverlay={phase === 'result'} flying={flying} run={run} metersAcross={metersAcross} manual={manual} locale={locale}
                />
              ) : (
                <Dropzone onFile={loadFile} error={fileError} busy={busyFile} />
              )}
            </div>
          </div>

          {/* Scale + actions */}
          {image && (
            <motion.div {...rise} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div className="flex flex-col gap-2">
                  <Field label={`${t('scan.scale')} · ${t('scan.metersAcross')}`} hint={useParcelScale && parcel ? t('scan.lotFillsWidth') : t('scan.scaleHelp')}>
                    <Input
                      type="number" inputMode="decimal" min={10} max={5000} step={1}
                      value={useParcelScale && parcelMeters ? parcelMeters : metersInput}
                      disabled={!!(useParcelScale && parcel) || phase === 'scanning'}
                      onChange={(e) => setMetersInput(Number(e.target.value))}
                      aria-label={t('scan.metersAcross')}
                    />
                  </Field>
                  {parcel && <Checkbox label={`${t('scan.useParcel')} (${parcel.displayName})`} checked={useParcelScale} onChange={setUseParcelScale} />}
                </div>
                <div className="flex gap-2 sm:pb-[2px]">
                  <Button variant="ghost" onClick={removeImage} disabled={phase === 'scanning'}>{t('scan.remove')}</Button>
                  <Button variant="primary" size="lg" onClick={scan} disabled={phase === 'scanning' || manualOn} className="min-w-[140px]">
                    {phase === 'scanning' ? t('scan.scanning') : t('scan.scan')}
                  </Button>
                </div>
              </div>

              {/* Error / fallback message */}
              <AnimatePresence initial={false}>
                {error && (
                  <motion.p key="err" {...rise} role="alert" className="text-[15px] leading-[22px] text-signal-red border-l-2 border-signal-red pl-3">
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Manual tracing toolbar */}
              <AnimatePresence initial={false}>
                {manualOn && (
                  <motion.div key="manual" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4, transition: { duration: dur.short * 0.7, ease: ease.out } }} transition={{ duration: dur.medium, ease: ease.out }} className="panel p-3 flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[13px] font-medium text-ink-2">{t('scan.category')}</span>
                      <Segmented value={manualCat} onChange={setManualCat} options={catOptions} ariaLabel={t('scan.category')} size="sm" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="primary" size="sm" onClick={finishShape} disabled={manualPts.length < 3}>{t('scan.finish')}</Button>
                      <Button variant="secondary" size="sm" onClick={() => setManualPts([])} disabled={manualPts.length === 0}>{t('scan.clear')}</Button>
                      <Button variant="ghost" size="sm" onClick={() => { setManualOn(false); setManualPts([]); }}>{t('scan.doneTracing')}</Button>
                      <span className="text-[13px] text-ink-2 tabular-nums ml-auto">{manualPts.length ? t('scan.pointsSoFar', { n: manualPts.length }) : t('scan.pickCategory')}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Samples */}
          <section aria-labelledby="scan-samples-title" className="flex flex-col gap-2">
            <h2 id="scan-samples-title" className="text-[15px] leading-[22px] font-medium text-ink-2">{t('scan.samples')}</h2>
            <div className="grid grid-cols-3 gap-3">
              {sampleAerials.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => loadSample(s.id)}
                  data-testid={`sample-${s.id}`}
                  disabled={busyFile || phase === 'scanning'}
                  aria-pressed={sampleId === s.id}
                  className={`group relative overflow-hidden rounded-[8px] border transition-colors duration-[120ms] min-h-11 ${sampleId === s.id ? 'border-pine' : 'border-line hover:border-ink-2'} disabled:opacity-50`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt={t('scan.sample', { n: s.id })} width={1200} height={900} className="block w-full h-auto aspect-[4/3] object-cover" loading="lazy" />
                  <span className="absolute left-2 bottom-2 rounded-[6px] bg-surface border border-line px-1.5 text-[13px] leading-[18px] text-ink">{t('scan.sample', { n: s.id })}</span>
                </button>
              ))}
            </div>
            <p className="text-[13px] leading-[18px] text-ink-2">{t('scan.sampleHelp')}</p>
          </section>
        </div>

        <aside className="lg:col-span-5 flex flex-col gap-6 min-w-0 lg:sticky lg:top-24">
          <ResultsPanel
            phase={phase} showNumbers={showNumbers} comp={comp} keepSpaces={keepSpaces} onKeep={setKeepSpaces} run={run} source={source}
            planHref={planHref} onRescan={scan} onTrace={startManual} locale={locale} polygonCount={polygons.length} canRescan={!!image && phase !== 'scanning'}
          />
          <RecentScans items={recent} onOpen={openRecent} locale={locale} />
        </aside>
      </div>
    </PageShell>
  );
}
