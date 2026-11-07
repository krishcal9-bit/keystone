'use client';
import { Fragment, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Button, ButtonLink, ButtonPair } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { useT } from '@/lib/i18n';
import { A } from '@/lib/sb4';
import type { ScanComputation, ScanCategory } from '@/lib/scanMath';
import { CATEGORY_STYLE } from './categories';

export type ScanSource = 'fixture' | 'claude' | 'manual' | null;

type Props = {
  phase: 'empty' | 'ready' | 'scanning' | 'result';
  showNumbers: boolean;
  comp: ScanComputation;
  keepSpaces: number;
  onKeep: (n: number) => void;
  run: number;
  source: ScanSource;
  planHref: string;
  onRescan: () => void;
  onTrace: () => void;
  locale: string;
  polygonCount: number;
  canRescan: boolean;
};

/** Splits a translated template like "About {homes} homes…" and drops React nodes into the slots. */
function Template({ text, slots }: { text: string; slots: Record<string, ReactNode> }) {
  const parts = text.split(/(\{\w+\})/g);
  return <>{parts.map((p, i) => { const m = p.match(/^\{(\w+)\}$/); return <Fragment key={i}>{m ? slots[m[1]] ?? p : p}</Fragment>; })}</>;
}

const ROWS: { cat: ScanCategory }[] = [{ cat: 'building' }, { cat: 'parking' }, { cat: 'open' }, { cat: 'trees' }];

export function ResultsPanel({ phase, showNumbers, comp, keepSpaces, onKeep, run, source, planHref, onRescan, onTrace, locale, polygonCount, canRescan }: Props) {
  const { t } = useT();
  const idle = phase === 'empty' || phase === 'ready';
  const fillPct = comp.existingSpaces > 0 ? (keepSpaces / comp.existingSpaces) * 100 : 0;
  const sourceLabel = source === 'claude' ? t('scan.sourceClaude') : source === 'fixture' ? t('scan.sourceFixture') : source === 'manual' ? t('scan.sourceManual') : null;

  return (
    <section className="panel p-5 md:p-6 flex flex-col gap-5" aria-labelledby="scan-results-title" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 id="scan-results-title" className="text-title">{t('scan.results')}</h2>
        <div className="flex items-center gap-2 min-h-6">
          {showNumbers && sourceLabel && <Pill tone={source === 'claude' ? 'brass' : source === 'manual' ? 'pine' : 'neutral'} className="whitespace-nowrap">{sourceLabel}</Pill>}
          {showNumbers && polygonCount > 0 && <Pill tone="neutral" className="whitespace-nowrap">{t('scan.shapes', { n: polygonCount })}</Pill>}
        </div>
      </div>

      {/* Headline: reserved height so it never shifts the panel. */}
      <div className="min-h-[88px]">
        {showNumbers && polygonCount === 0 ? (
          <p className="text-[18px] leading-7 text-ink-2">{t('scan.pickCategory')}</p>
        ) : showNumbers ? (
          <motion.p key={`headline-${run}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }} className="font-display text-[26px] leading-[32px] md:text-[30px] md:leading-[36px] font-medium tracking-[-0.01em] [text-wrap:balance]">
            <Template text={t('scan.result')} slots={{
              homes: <AnimatedNumber value={comp.homes} locale={locale} immediate={false} className="text-pine" />,
              spaces: <AnimatedNumber value={keepSpaces} locale={locale} immediate={false} className="text-pine" />,
            }} />
          </motion.p>
        ) : (
          <p className="text-[18px] leading-7 text-ink-2">
            {phase === 'scanning' ? t('scan.scanningHelp') : phase === 'ready' ? t('scan.readyHelp') : t('scan.empty')}
          </p>
        )}
      </div>

      {/* Area rows */}
      <dl className="flex flex-col">
        {ROWS.map(({ cat }) => (
          <div key={cat} className="flex items-baseline justify-between gap-4 py-2.5 border-t border-line text-[15px] leading-[22px]">
            <dt className="flex items-center gap-2 text-ink-2">
              <span className="inline-block w-2.5 h-2.5 rounded-[3px]" style={{ background: CATEGORY_STYLE[cat].fill, opacity: idle ? 0.4 : 1 }} aria-hidden />
              {t(CATEGORY_STYLE[cat].areaKey)}
            </dt>
            <dd className="tabular-nums text-ink">
              {showNumbers ? (
                <motion.span layoutId={`scan-num-${run}-${cat}`} className="inline-block font-medium">
                  <AnimatedNumber value={comp.areas[cat]} locale={locale} immediate={false} />
                </motion.span>
              ) : <span className="text-ink-2">–</span>}
              <span className="text-ink-2"> m²</span>
            </dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 py-3 border-t border-b border-line">
          <dt className="text-[15px] leading-[22px] font-medium">{t('scan.buildable')}</dt>
          <dd className="tabular-nums text-right">
            {showNumbers
              ? <span className="big-number !text-[40px] md:!text-[48px] text-pine" data-testid="scan-buildable" data-value={comp.buildableAcres.toFixed(3)}><AnimatedNumber value={comp.buildableAcres} locale={locale} immediate={false} format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }} /></span>
              : <span className="inline-block text-[24px] leading-[48px] text-ink-2">–</span>}
            <span className="ml-1.5 text-[15px] text-ink-2">{t('common.acres')}</span>
            <div className="text-[13px] leading-[18px] text-ink-2">
              {showNumbers ? <AnimatedNumber value={comp.buildableM2} locale={locale} immediate={false} /> : '–'} m²
            </div>
          </dd>
        </div>
      </dl>
      <p className="text-[13px] leading-[18px] text-ink-2 -mt-2">{t('scan.howItAdds', { sqft: A.sqftPerSpace, pct: Math.round(A.setbackPct * 100) })}</p>

      {/* Keep spaces */}
      <div className={idle ? 'opacity-50' : ''}>
        <div className="flex items-baseline justify-between text-[15px] leading-[22px]">
          <label htmlFor="scan-keep" className="font-medium">{t('scan.keepSpaces')}</label>
          <span className="tabular-nums text-ink-2">
            <AnimatedNumber value={keepSpaces} locale={locale} className="text-ink font-medium" /> / <AnimatedNumber value={comp.existingSpaces} locale={locale} />
          </span>
        </div>
        <input
          id="scan-keep"
          type="range"
          className="ks-range"
          min={0}
          max={Math.max(0, comp.existingSpaces)}
          step={1}
          value={keepSpaces}
          disabled={!showNumbers || comp.existingSpaces === 0}
          onChange={(e) => onKeep(Number(e.target.value))}
          onPointerUp={() => { try { navigator.vibrate?.(8); } catch {} }}
          style={{ ['--fill' as string]: `${fillPct}%` }}
          aria-valuetext={`${keepSpaces} ${t('common.spaces')}`}
        />
        <p className="text-[13px] leading-[18px] text-ink-2 -mt-2">{t('scan.existingSpaces')}: <span className="tabular-nums text-ink">{comp.existingSpaces}</span></p>
      </div>

      {/* SB 4 minimum note */}
      <div className="min-h-[44px] text-[15px] leading-[22px]">
        {showNumbers && comp.capacity.minimumUnits > 0 && (
          comp.usedFlats
            ? <p className="text-signal-amber">{t('scan.flatsFallback', { min: comp.capacity.minimumUnits })}</p>
            : <p className="text-pine">{t('scan.meetsMin', { min: comp.capacity.minimumUnits })}</p>
        )}
        <p className="text-[13px] leading-[18px] text-ink-2 mt-1">{t('common.notLegal')}</p>
      </div>

      <ButtonPair>
        <ButtonLink href={planHref} variant="primary" aria-disabled={!showNumbers || undefined} className={!showNumbers ? 'opacity-50 pointer-events-none' : ''}>{t('scan.openPlan')}</ButtonLink>
        <Button variant="secondary" onClick={onRescan} disabled={!canRescan}>{t('scan.rescan')}</Button>
      </ButtonPair>
      <Button variant="ghost" size="sm" onClick={onTrace} disabled={phase === 'empty' || phase === 'scanning'} className="self-start -mt-2">{t('scan.trace')}</Button>
    </section>
  );
}
