'use client';
/**
 * "Edit assumptions": a calm side panel (slides in from the right, ease.drawer, 320 ms) with the three inputs that
 * drive the comparison. Changes apply live and persist in this browser; "Reset to defaults" clears them.
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useT, type DictKey } from '@/lib/i18n';
import { ease, dur } from '@/lib/motion';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { SOURCES, type ComparisonInputs, type useComparison } from '@/lib/comparison';

type Cmp = ReturnType<typeof useComparison>;
const FIELDS: { key: keyof ComparisonInputs; label: DictKey; testId: string; step: number; min: number; source: string; prefix?: string }[] = [
  { key: 'cityOffersPerYear', label: 'cmp.in.cityOffers', testId: 'input-cityOffers', step: 1, min: 0.1, source: SOURCES.cityOffers },
  { key: 'manualVetDays', label: 'cmp.in.vetDays', testId: 'input-vetDays', step: 0.5, min: 0.1, source: SOURCES.vetDays },
  { key: 'marketLandPerAcre', label: 'cmp.in.landPerAcre', testId: 'input-landPerAcre', step: 100000, min: 0, source: SOURCES.landPerAcre, prefix: '$' },
];

export function AssumptionsPanel({ open, onClose, cmp }: { open: boolean; onClose: () => void; cmp: Cmp }) {
  const { t } = useT();
  const reduced = useReducedMotion();
  const aside = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const f = setTimeout(() => aside.current?.querySelector('input')?.focus(), reduced ? 0 : 340);
    return () => { clearTimeout(f); window.removeEventListener('keydown', onKey); };
  }, [open, onClose, reduced]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" role="presentation">
          <motion.div className="absolute inset-0" style={{ background: 'var(--scrim)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: dur.short } }} transition={{ duration: dur.medium, ease: ease.out }} onClick={onClose} aria-hidden />
          <motion.aside
            ref={aside}
            role="dialog"
            aria-modal="true"
            aria-label={t('cmp.panelTitle')}
            data-testid="assumptions-panel"
            className="absolute right-0 top-0 h-full w-full max-w-[400px] bg-surface border-l border-line flex flex-col"
            initial={reduced ? { opacity: 0 } : { x: '100%' }}
            animate={reduced ? { opacity: 1 } : { x: 0 }}
            exit={reduced ? { opacity: 0, transition: { duration: 0.1 } } : { x: '100%', transition: { duration: 0.22, ease: ease.drawer } }}
            transition={{ duration: 0.32, ease: ease.drawer }}
          >
            <div className="flex items-start justify-between gap-4 px-6 pt-6">
              <div>
                <h2 className="text-[20px] leading-7 font-semibold text-ink">{t('cmp.panelTitle')}</h2>
                <p className="mt-1 text-[14px] leading-5 text-ink-2" style={{ textWrap: 'pretty' }}>{t('cmp.panelBody')}</p>
              </div>
              <button type="button" onClick={onClose} aria-label={t('common.close')} className="shrink-0 w-11 h-11 -mr-3 -mt-2 rounded-full text-ink-2 hover:bg-pine-soft hover:text-ink transition-colors duration-[120ms] flex items-center justify-center pressable">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M3 3l10 10M13 3L3 13" /></svg>
              </button>
            </div>
            <div className="px-6 pt-6 flex flex-col gap-5 overflow-y-auto">
              {FIELDS.map((f) => (
                <Field key={f.key} label={t(f.label)} hint={`${t('cmp.tag.estimate')}: ${f.source.replace(/^estimate:\s*/i, '')}`}>
                  <span className="relative block">
                    {f.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-ink-2 pointer-events-none" aria-hidden>{f.prefix}</span>}
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={f.min}
                      step={f.step}
                      value={cmp.inputs[f.key]}
                      data-testid={f.testId}
                      className={f.prefix ? 'pl-7' : ''}
                      onChange={(e) => { const v = e.target.valueAsNumber; if (Number.isFinite(v)) cmp.set(f.key, v); }}
                    />
                  </span>
                </Field>
              ))}
            </div>
            <div className="mt-auto px-6 py-5 border-t border-line flex items-center justify-between gap-4">
              <button type="button" onClick={cmp.reset} disabled={!cmp.dirty} className="h-11 px-1 text-[15px] font-medium text-pine disabled:text-ink-2 disabled:opacity-60 pressable" data-testid="reset-assumptions">{t('cmp.reset')}</button>
              <Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
