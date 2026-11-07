'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { useT } from '@/lib/i18n';
import { usePipeline, isStalled } from '@/lib/pipeline';
import { STAGES, exportSnapshot, importSnapshot, type Stage } from '@/lib/store';
import { parcelById } from '@/lib/data';
import { spring, dur, ease } from '@/lib/motion';
import { PageShell } from '@/components/layout/PageShell';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import { SkylineBand } from '@/components/scenes/SkylineBand';
import { StageBar, stageColor } from './StageBar';
import { PipelineRow } from './PipelineRow';
import { WeeklyBrief } from './WeeklyBrief';

const emptyByStage = () => Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;

export function PipelineView() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const { entries, ready, setStage, setNote, remove } = usePipeline();
  const [now, setNow] = useState(() => Date.now());
  const [intro, setIntro] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  // First-load stagger only: once the first rows have risen, later rows just glide.
  useEffect(() => {
    if (!ready) return;
    setNow(Date.now());
    const id = setTimeout(() => setIntro(false), 700);
    return () => clearTimeout(id);
  }, [ready]);

  const rows = useMemo(() => entries.map((e) => ({ entry: e, parcel: parcelById(e.parcelId) })).filter((r) => r.parcel), [entries]);
  const stats = useMemo(() => {
    const homesByStage = emptyByStage();
    const countByStage = emptyByStage();
    let homes = 0, stalled = 0;
    for (const { entry } of rows) {
      const h = Number.isFinite(entry.homes) ? (entry.homes as number) : 0;
      homes += h; homesByStage[entry.stage] += h; countByStage[entry.stage] += 1;
      if (isStalled(entry, now)) stalled++;
    }
    return { homes, stalled, homesByStage, countByStage, sites: rows.length };
  }, [rows, now]);

  const onStage = (id: string, s: Stage) => { setStage(id, s); setNow(Date.now()); };
  const onNote = (id: string, notes: string) => { setNote(id, notes); setNow(Date.now()); };
  const onRemove = (id: string) => { remove(id); toast(t('pipe.removed')); };

  const doExport = () => {
    const snap = exportSnapshot();
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `keystone-pipeline-${snap.exportedAt.slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(t('pipe.exported'));
  };
  const doImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const ok = importSnapshot(JSON.parse(await file.text()));
      if (!ok) throw new Error('bad snapshot');
      setNow(Date.now());
      toast(t('pipe.imported'));
    } catch {
      toast(t('pipe.importFailed'), 'error');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  let introCounter = 0;
  const tr = reduced ? { duration: 0 } : spring.snappy;

  return (
    <PageShell
      title={t('pipe.title')}
      lane={t('lane.pipeline')} subtitle={t('pipe.subtitle')}
      backdrop={<SkylineBand />}
      actions={(
        <>
          <Button variant="secondary" onClick={doExport} disabled={!ready || rows.length === 0}>{t('common.export')}</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>{t('common.import')}</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => doImport(e.target.files?.[0])} />
        </>
      )}
    >
      {/* Totals */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: dur.medium, ease: ease.out }} className="panel px-5 py-5 md:px-7 md:py-6" aria-label={t('pipe.title')}>
        <dl className="grid grid-cols-3 gap-4 md:gap-8 divide-x divide-line [&>div]:pl-4 md:[&>div]:pl-8 [&>div:first-child]:pl-0">
          <div>
            <dt className="text-[13px] leading-[18px] text-ink-2">{t('pipe.sitesTracked')}</dt>
            <dd className="big-number text-[36px] md:text-[56px] mt-1 text-ink"><AnimatedNumber value={ready ? stats.sites : 0} immediate={false} /></dd>
          </div>
          <div>
            <dt className="text-[13px] leading-[18px] text-ink-2">{t('pipe.homesUnlocked')}</dt>
            <dd className="big-number text-[36px] md:text-[56px] mt-1 text-pine"><AnimatedNumber value={ready ? stats.homes : 0} immediate={false} /></dd>
          </div>
          <div>
            <dt className="text-[13px] leading-[18px] text-ink-2">{t('pipe.stalled')}</dt>
            <dd className={`big-number text-[36px] md:text-[56px] mt-1 ${stats.stalled ? 'text-signal-amber' : 'text-ink'}`}><AnimatedNumber value={ready ? stats.stalled : 0} immediate={false} /><span className="block font-sans text-[13px] leading-[18px] text-ink-2 mt-1 hidden md:block" style={{ fontVariationSettings: 'normal', letterSpacing: 0 }}>{t('pipe.stalledHelp')}</span></dd>
          </div>
        </dl>
        <div className="mt-6 md:mt-8">
          <StageBar homesByStage={stats.homesByStage} countByStage={stats.countByStage} />
        </div>
      </motion.section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(320px,4fr)] lg:items-start">
        {/* Table grouped by stage */}
        <section className="order-2 lg:order-1 min-w-0" aria-label={t('pipe.stage')}>
          {!ready ? (
            <div className="flex flex-col gap-3" aria-busy>
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="panel p-8 text-center">
              <p className="text-[16px] leading-6 text-ink-2 max-w-[36ch] mx-auto">{t('pipe.emptyAll')}</p>
              <ButtonLink href="/sites" className="mt-5">{t('pipe.findSites')}</ButtonLink>
            </div>
          ) : (
            <LayoutGroup id="pipeline-rows">
              {/* column headings (desktop) */}
              <div className="hidden md:grid grid-cols-[minmax(0,1.8fr)_56px_168px_132px_minmax(0,1.2fr)_44px] gap-x-4 px-1 pb-2 text-[13px] leading-[18px] text-ink-2">
                <span>{t('pipe.site')}</span><span className="text-right pr-1">{t('pipe.homes')}</span><span>{t('pipe.stage')}</span><span>{t('pipe.lastActivity')}</span><span>{t('pipe.notes')}</span><span />
              </div>
              <div className="flex flex-col gap-6">
                {STAGES.map((stage, si) => {
                  const group = rows.filter((r) => r.entry.stage === stage);
                  return (
                    <motion.section key={stage} layout transition={tr} aria-labelledby={`stage-${stage}`}>
                      <motion.div layout="position" className="flex items-center gap-3 pb-2 border-b border-line">
                        <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ backgroundColor: stageColor(si) }} aria-hidden />
                        <h2 id={`stage-${stage}`} className="font-sans text-[15px] leading-[22px] font-semibold tracking-normal text-ink">{t(`stage.${stage}` as 'stage.identified')}</h2>
                        <span className="text-[13px] leading-[18px] text-ink-2 tabular-nums"><AnimatedNumber value={group.length} /></span>
                      </motion.div>
                      <ul className="px-1">
                        <AnimatePresence initial={intro} mode="popLayout">
                          {group.length === 0 ? (
                            <motion.li key="empty" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: dur.micro } }} transition={{ duration: dur.short, ease: ease.out }} className="py-3 text-[13px] leading-[18px] text-ink-2">
                              {t('pipe.empty')}
                            </motion.li>
                          ) : group.map(({ entry, parcel }) => (
                            <PipelineRow
                              key={entry.parcelId}
                              entry={entry}
                              parcel={parcel!}
                              introIndex={intro ? introCounter++ : null}
                              now={now}
                              onStage={onStage}
                              onNote={onNote}
                              onRemove={onRemove}
                            />
                          ))}
                        </AnimatePresence>
                      </ul>
                    </motion.section>
                  );
                })}
              </div>
            </LayoutGroup>
          )}
        </section>

        <aside className="order-1 lg:order-2 lg:sticky lg:top-24">
          <WeeklyBrief entries={entries} />
        </aside>
      </div>
    </PageShell>
  );
}
