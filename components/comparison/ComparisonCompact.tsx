'use client';
/**
 * Three compact comparison rows for the Judge Guide: waiting value, multiplier pill, Keystone value, each with
 * its "i" popover, plus the "Edit assumptions" side panel. Same data as the landing scene, no illustration.
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { useT } from '@/lib/i18n';
import { spring } from '@/lib/motion';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { useComparison, fmtNum, fmtUsd, type Figure } from '@/lib/comparison';
import { InfoButton } from './InfoButton';
import { AssumptionsPanel } from './AssumptionsPanel';

export function ComparisonCompact({ className = '' }: { className?: string }) {
  const { t, lang } = useT();
  const locale = lang === 'es' ? 'es-US' : 'en-US';
  const cmp = useComparison();
  const [editing, setEditing] = useState(false);
  const unit = (f: Figure) => (f.unit === 'days' ? t('cmp.unit.days') : f.unit === 'minutes' ? t('cmp.unit.min') : f.label === 'cmp.row1.waitingLabel' ? t('cmp.unit.perYear') : '');
  const pillText = (id: string, v: number) => (id === 'sitesInView' ? t('cmp.row1.mult', { n: fmtNum(v, locale) }) : id === 'timeToVet' ? t('cmp.row2.mult', { n: fmtNum(v, locale) }) : t('cmp.row3.mult', { money: fmtUsd(-v, locale) }));
  return (
    <div className={className} data-testid="comparison-compact">
      <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto_1fr] gap-x-4 sm:gap-x-6 text-[13px] leading-[18px] font-semibold pb-2 border-b border-line">
        <span className="text-ink-2">{t('cmp.colWaiting')}</span>
        <span className="hidden sm:block" />
        <span className="text-pine sm:text-right">{t('cmp.colKeystone')}</span>
      </div>
      {cmp.rows.map((row, i) => {
        const title = t(row.title);
        const text = pillText(row.id, row.multiplier.value);
        return (
          <div key={row.id} data-testid="cmp-row" data-row={row.id} className="grid grid-cols-2 sm:grid-cols-[1fr_auto_1fr] gap-x-4 sm:gap-x-6 gap-y-1 items-center py-4 border-b border-line">
            <span className="col-span-2 sm:col-span-3 text-[13px] leading-[18px] font-medium text-ink">{title}</span>
            <div className="text-ink-2 min-w-0">
              <div className="flex items-center gap-2">
                <Num figure={row.waiting} locale={locale} />
                {unit(row.waiting) && <span className="text-[14px] font-medium">{unit(row.waiting)}</span>}
                <InfoButton figure={row.waiting} title={`${title} · ${t('cmp.colWaiting')}`} />
              </div>
              <p className="text-[13px] leading-[18px] mt-1" style={{ textWrap: 'pretty' }}>{t(row.waiting.label)}</p>
            </div>
            <div className="col-span-2 sm:col-span-1 order-last sm:order-none flex justify-center">
              <motion.span key={text} data-testid="cmp-multiplier" data-value={row.multiplier.value}
                className="inline-flex items-center h-8 px-3 rounded-full text-[14px] font-semibold text-ink whitespace-nowrap"
                style={{ background: 'color-mix(in srgb, var(--brass) 18%, var(--surface))' }}
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={spring.snappy}>
                {text}
                <InfoButton figure={row.multiplier} title={`${title} · ${t(row.multiplier.label)}`} className="ml-1" />
              </motion.span>
            </div>
            <div className="text-pine min-w-0 sm:text-right">
              <div className="flex items-center gap-2 sm:justify-end">
                <span data-testid={i === 0 ? 'cmp-eligible' : undefined} data-value={i === 0 ? row.keystone.value : undefined} className="inline-flex items-baseline gap-1.5">
                  <Num figure={row.keystone} locale={locale} />
                  {unit(row.keystone) && <span className="text-[14px] font-medium">{unit(row.keystone)}</span>}
                </span>
                <InfoButton figure={row.keystone} title={`${title} · ${t('cmp.colKeystone')}`} />
              </div>
              <p className="text-[13px] leading-[18px] mt-1 text-ink-2" style={{ textWrap: 'pretty' }}>{t(row.keystone.label)}</p>
            </div>
          </div>
        );
      })}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[13px] leading-[18px] text-ink-2">
        <span style={{ textWrap: 'pretty' }}>{t('cmp.note')} {t('cmp.randSource')}</span>
        <button type="button" onClick={() => setEditing(true)} data-testid="edit-assumptions" className="h-11 -my-2 px-1 font-medium text-pine underline-offset-4 hover:underline pressable">{t('cmp.edit')}</button>
      </div>
      <AssumptionsPanel open={editing} onClose={() => setEditing(false)} cmp={cmp} />
    </div>
  );
}

function Num({ figure, locale }: { figure: Figure; locale: string }) {
  return (
    <span className="big-number" style={{ fontSize: 'clamp(32px, 3.2vw, 44px)' }}>
      <AnimatedNumber value={figure.value} immediate={false} locale={locale} prefix={figure.unit === 'money' ? '$' : ''} format={{ maximumFractionDigits: figure.unit === 'minutes' || figure.unit === 'days' ? 1 : 0 }} />
    </span>
  );
}
