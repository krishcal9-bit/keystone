'use client';
import { motion, useReducedMotion } from 'motion/react';
import assumptions from '@/data/assumptions.json';
import { useT } from '@/lib/i18n';
import { ease, dur } from '@/lib/motion';

/** Two timelines side by side: today's typical path (~4 years, brief) vs the SB 4 path (illustrative). */
export function TimeToKeys() {
  const { t } = useT();
  const reduced = useReducedMotion();
  const G = assumptions.gap;
  const today = G.typicalMonthsLandToKeys.value, sb4 = G.sb4MonthsLandToKeys.value;
  const phases = (total: number, split: number[]) => {
    const keys = ['find', 'entitle', 'permits', 'build'] as const;
    return keys.map((k, i) => ({ key: k, label: t(`time.phase.${k}`), months: Math.round(total * split[i]) }));
  };
  const rows = [
    { label: t('time.today'), total: today, phases: phases(today, [0.35, 0.3, 0.1, 0.25]), note: t('gap.source') },
    { label: t('time.sb4'), total: sb4, phases: phases(sb4, [0.15, 0.1, 0.15, 0.6]), note: t('time.sb4Note') },
  ];
  const colors = { find: 'var(--brass)', entitle: '#8FA39A', permits: '#3C4A52', build: 'var(--pine)' } as const;
  return (
    <section id="time" className="panel p-4 scroll-mt-24" data-testid="time-to-keys" aria-labelledby="time-title">
      <h2 id="time-title" className="text-[15px] font-semibold">{t('time.title')}</h2>
      <p className="text-[13px] text-ink-2">{t('time.help')}</p>
      <div className="mt-3 flex flex-col gap-3">
        {rows.map((r, ri) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between text-[13px]"><span className="font-medium text-ink">{r.label}</span><span className="tabular-nums text-ink-2">{r.total} {t('time.months')}</span></div>
            <div className="mt-1 h-5 flex rounded-[6px] overflow-hidden" style={{ width: `${(r.total / today) * 100}%` }}>
              {r.phases.map((p, i) => (
                <motion.div key={p.key} className="h-full border-r border-surface last:border-r-0 relative" style={{ background: colors[p.key], flexBasis: `${(p.months / r.total) * 100}%` }}
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: reduced ? 0 : 0.2 + ri * 0.4 + i * 0.12, duration: dur.long, ease: ease.out }} title={`${p.label}: ${p.months} ${t('time.months')}`} />
              ))}
            </div>
            <p className="text-[11px] text-ink-2 mt-1">{r.note}</p>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2">
        {(['find', 'entitle', 'permits', 'build'] as const).map((k) => <span key={k} className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-[2px]" style={{ background: colors[k] }} />{t(`time.phase.${k}`)}</span>)}
        <span className="ml-auto text-pine font-medium">{t('time.saved', { n: today - sb4 })}</span>
      </div>
    </section>
  );
}
