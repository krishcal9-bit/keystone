'use client';
import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useT } from '@/lib/i18n';
import { SB4_FACTS, SB4_SOURCES } from '@/lib/sb4Facts';
import { spring, dur, ease } from '@/lib/motion';

export function factLabel(t: ReturnType<typeof useT>['t'], id: string) {
  if (id.startsWith('F')) return t('ask.factSb4', { id });
  if (id.startsWith('H')) return t('ask.factHabitat', { id });
  return t('ask.factNote', { id });
}

export function AboutSb4({ open, onToggle, highlight }: { open: boolean; onToggle: () => void; highlight: string | null }) {
  const { t } = useT();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open || !highlight) return;
    const el = ref.current?.querySelector<HTMLElement>(`[data-fact="${highlight}"]`);
    el?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
  }, [open, highlight, reduced]);
  const tr = reduced ? { duration: 0 } : spring.smooth;
  return (
    <motion.section layout transition={tr} className="panel overflow-hidden" aria-labelledby="about-sb4">
      <motion.button
        layout="position"
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="about-sb4-body"
        className="w-full min-h-14 px-5 flex items-center justify-between gap-4 text-left hover:bg-pine-soft transition-colors duration-[120ms] rounded-[14px]"
      >
        <span>
          <span id="about-sb4" className="block text-[16px] leading-6 font-semibold text-ink">{t('sb4.title')}</span>
          <span className="block text-[13px] leading-[18px] text-ink-2">{t('sb4.facts')}</span>
        </span>
        <motion.svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-ink-2" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: dur.short, ease: ease.out }}>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </motion.button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            id="about-sb4-body"
            ref={ref}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: dur.short, ease: ease.out, delay: 0.08 } }}
            exit={{ opacity: 0, transition: { duration: dur.micro } }}
            className="px-5 pb-5 border-t border-line"
          >
            <p className="text-[15px] leading-[22px] text-ink-2 pt-4">{t('sb4.intro')}</p>
            <h3 className="font-sans text-[13px] font-semibold tracking-normal text-ink-2 mt-5 mb-2">{t('sb4.facts')}</h3>
            <ol className="flex flex-col">
              {SB4_FACTS.map((f) => (
                <li key={f.id} data-fact={f.id} className={`grid grid-cols-[44px_minmax(0,1fr)] gap-2 py-2 rounded-[8px] -mx-2 px-2 transition-colors duration-[300ms] ${highlight === f.id ? 'bg-pine-soft' : ''}`}>
                  <span className="text-[13px] leading-[22px] font-semibold tabular-nums text-pine">{f.id}</span>
                  <span className="text-[15px] leading-[22px] text-ink">{f.text}</span>
                </li>
              ))}
            </ol>
            <h3 className="font-sans text-[13px] font-semibold tracking-normal text-ink-2 mt-5 mb-2">{t('sb4.sources')}</h3>
            <ul className="flex flex-col">
              {SB4_SOURCES.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center min-h-11 text-[15px] text-pine underline decoration-line underline-offset-4 hover:decoration-pine transition-colors duration-[120ms]">{s.label}</a>
                </li>
              ))}
            </ul>
            <p className="text-[13px] leading-[18px] text-ink-2 mt-3">{t('common.notLegal')}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
